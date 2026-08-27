-- Phase 18.1 - SG5-B2B1 controlled publication channel-target integration
--
-- PURPOSE
--   Prepare ai_controlled_publications for a second, explicit target:
--   public.publishing_channel_destinations.
--
-- ZERO-DOWNTIME / LEGACY SAFETY
--   - Existing SG4 contract_version=1 rows remain
--     target_resource='marketplace_authorized_shop'.
--   - Existing SG4 proposal RPC remains available and keeps its signature.
--   - Existing SG4 rows are NOT reinterpreted or made executable.
--   - target_id becomes polymorphic only after typed generated foreign keys
--     preserve referential integrity for both legacy shops and channel destinations.
--   - external_shop_id is intentionally retained as the physical snapshot
--     column for backward compatibility; v2 treats it semantically as the
--     external destination id.
--   - New channel proposals use contract_version=2 and
--     target_resource='publishing_channel_destination'.
--
-- SAFETY BOUNDARY
--   - NO provider credentials.
--   - NO OAuth.
--   - NO provider adapter.
--   - NO external HTTP.
--   - NO controlled-publication execution RPC.
--   - NO autonomous publishing.
--
-- IMPORTANT
--   DO NOT APPLY TO SUPABASE UNTIL A SEPARATE EXPLICIT
--   SG5 DATABASE AUTHORIZATION GATE HAS PASSED.

begin;

do $guard$
begin
  if to_regclass(
    'public.ai_controlled_publications'
  ) is null then
    raise exception
      'Phase 18.1 requires public.ai_controlled_publications';
  end if;

  if to_regclass(
    'public.marketplace_authorized_shops'
  ) is null then
    raise exception
      'Phase 18.1 requires public.marketplace_authorized_shops';
  end if;

  if to_regclass(
    'public.publishing_channel_destinations'
  ) is null then
    raise exception
      'Phase 18.1 requires public.publishing_channel_destinations';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    where
      c.conrelid =
        'public.ai_controlled_publications'::regclass
      and c.conname =
        'ai_controlled_publications_target_id_fkey'
      and c.contype =
        'f'
  ) then
    raise exception
      'expected SG4 target_id foreign key is missing';
  end if;
end
$guard$;


-- ============================================================
-- 1. ADD V2 DESTINATION SNAPSHOT TYPE
-- ============================================================

alter table
  public.ai_controlled_publications
add column
  destination_type text;

alter table
  public.ai_controlled_publications
add column
  legacy_authorized_shop_id uuid
  generated always as (
    case
      when contract_version = 1
       and target_resource =
         'marketplace_authorized_shop'
      then target_id
      else null
    end
  ) stored;

alter table
  public.ai_controlled_publications
add column
  publishing_destination_id uuid
  generated always as (
    case
      when contract_version = 2
       and target_resource =
         'publishing_channel_destination'
      then target_id
      else null
    end
  ) stored;

alter table
  public.ai_controlled_publications
add constraint
  ai_controlled_publications_legacy_authorized_shop_fkey
foreign key (
  legacy_authorized_shop_id
)
references
  public.marketplace_authorized_shops(id)
on delete restrict;

alter table
  public.ai_controlled_publications
add constraint
  ai_controlled_publications_publishing_destination_fkey
foreign key (
  publishing_destination_id
)
references
  public.publishing_channel_destinations(id)
on delete restrict;


-- ============================================================
-- 2. RETIRE SINGLE-TARGET FK AFTER TYPED FKs ARE ACTIVE
-- ============================================================

alter table
  public.ai_controlled_publications
drop constraint
  ai_controlled_publications_target_id_fkey;


-- ============================================================
-- 3. EXPAND CONTRACT / TARGET CHECKS
-- ============================================================

alter table
  public.ai_controlled_publications
drop constraint
  ai_controlled_publications_contract_version_check;

alter table
  public.ai_controlled_publications
add constraint
  ai_controlled_publications_contract_version_check
check (
  contract_version in (
    1,
    2
  )
);

alter table
  public.ai_controlled_publications
drop constraint
  ai_controlled_publications_target_resource_check;

alter table
  public.ai_controlled_publications
add constraint
  ai_controlled_publications_target_resource_check
check (
  target_resource in (
    'marketplace_authorized_shop',
    'publishing_channel_destination'
  )
);

alter table
  public.ai_controlled_publications
add constraint
  ai_controlled_publications_contract_target_check
check (
  (
    contract_version = 1
    and target_resource =
      'marketplace_authorized_shop'
    and destination_type
      is null
    and legacy_authorized_shop_id =
      target_id
    and publishing_destination_id
      is null
  )
  or
  (
    contract_version = 2
    and target_resource =
      'publishing_channel_destination'
    and destination_type in (
      'account',
      'page',
      'channel'
    )
    and publishing_destination_id =
      target_id
    and legacy_authorized_shop_id
      is null
  )
);


-- ============================================================
-- 4. NEW CHANNEL PROPOSAL RPC
-- ============================================================

create or replace function
public.propose_ai_controlled_publication_channel(
  p_organization_id uuid,
  p_publishing_destination_id uuid,
  p_proposed_content text,
  p_idempotency_key text
)
returns setof
  public.ai_controlled_publications
language plpgsql
security definer
set search_path =
  public,
  pg_temp
as $function$

declare
  v_user_id uuid;
  v_role text;

  v_destination
    public.publishing_channel_destinations%rowtype;

  v_content text;
  v_idempotency_key text;

  v_existing
    public.ai_controlled_publications%rowtype;

  v_inserted
    public.ai_controlled_publications%rowtype;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'Organization is required';
  end if;

  if p_publishing_destination_id is null then
    raise exception
      'Publishing destination is required';
  end if;

  select
    m.role
  into
    v_role
  from
    public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if coalesce(
    v_role,
    ''
  ) not in (
    'owner',
    'admin'
  ) then
    raise exception
      'Controlled publication requires owner or admin';
  end if;

  v_content :=
    btrim(
      replace(
        replace(
          coalesce(
            p_proposed_content,
            ''
          ),
          E'\r\n',
          E'\n'
        ),
        E'\r',
        E'\n'
      )
    );

  if length(
    v_content
  ) = 0 then
    raise exception
      'Publication content is required';
  end if;

  if length(
    v_content
  ) > 5000 then
    raise exception
      'Publication content is too long';
  end if;

  v_idempotency_key :=
    btrim(
      coalesce(
        p_idempotency_key,
        ''
      )
    );

  if length(
    v_idempotency_key
  ) < 8
  or length(
    v_idempotency_key
  ) > 128
  or v_idempotency_key !~
    '^[A-Za-z0-9._:-]+$'
  then
    raise exception
      'Invalid controlled publication idempotency key';
  end if;

  select
    d.*
  into
    v_destination
  from
    public.publishing_channel_destinations d
  where
    d.id =
      p_publishing_destination_id
    and d.organization_id =
      p_organization_id
    and d.status =
      'active'
    and d.is_selected
    and 'publish_text' =
      any(
        d.capabilities
      )
  limit 1;

  if not found then
    raise exception
      'Compatible selected publishing destination not found';
  end if;

  if length(
    btrim(
      coalesce(
        v_destination.provider,
        ''
      )
    )
  ) = 0
  or length(
    btrim(
      coalesce(
        v_destination.external_destination_id,
        ''
      )
    )
  ) = 0
  or length(
    btrim(
      coalesce(
        v_destination.display_name,
        ''
      )
    )
  ) = 0
  then
    raise exception
      'Publishing destination identity is incomplete';
  end if;

  select
    p.*
  into
    v_existing
  from
    public.ai_controlled_publications p
  where
    p.organization_id =
      p_organization_id
    and p.idempotency_key =
      v_idempotency_key
  limit 1;

  if found then
    if
      v_existing.contract_version <>
        2
      or v_existing.action_type <>
        'content.publish_text'
      or v_existing.target_resource <>
        'publishing_channel_destination'
      or v_existing.target_id <>
        p_publishing_destination_id
      or v_existing.mutation_field <>
        'content'
      or v_existing.expected_value
        is not null
      or v_existing.proposed_value <>
        v_content
    then
      raise exception
        'Controlled publication idempotency key conflict';
    end if;

    return next
      v_existing;

    return;
  end if;

  insert into
    public.ai_controlled_publications (
      organization_id,
      contract_version,
      action_type,
      target_resource,
      target_id,
      mutation_field,
      expected_value,
      proposed_value,
      provider,
      external_shop_id,
      destination_name,
      destination_type,
      requested_by_user_id,
      idempotency_key,
      status
    )
  values (
    p_organization_id,
    2,
    'content.publish_text',
    'publishing_channel_destination',
    p_publishing_destination_id,
    'content',
    null,
    v_content,
    lower(
      btrim(
        v_destination.provider
      )
    ),
    btrim(
      v_destination.external_destination_id
    ),
    btrim(
      v_destination.display_name
    ),
    v_destination.destination_type,
    v_user_id,
    v_idempotency_key,
    'proposed'
  )
  on conflict (
    organization_id,
    idempotency_key
  )
  do nothing
  returning *
  into
    v_inserted;

  if not found then
    select
      p.*
    into
      v_existing
    from
      public.ai_controlled_publications p
    where
      p.organization_id =
        p_organization_id
      and p.idempotency_key =
        v_idempotency_key
    limit 1;

    if not found then
      raise exception
        'Controlled publication idempotency resolution failed';
    end if;

    if
      v_existing.contract_version <>
        2
      or v_existing.action_type <>
        'content.publish_text'
      or v_existing.target_resource <>
        'publishing_channel_destination'
      or v_existing.target_id <>
        p_publishing_destination_id
      or v_existing.mutation_field <>
        'content'
      or v_existing.expected_value
        is not null
      or v_existing.proposed_value <>
        v_content
    then
      raise exception
        'Controlled publication idempotency key conflict';
    end if;

    return next
      v_existing;

    return;
  end if;

  return next
    v_inserted;

  return;
end;

$function$;


-- ============================================================
-- 5. CONFIRM RPC â€” LEGACY + CHANNEL TARGET, NO EXECUTION
-- ============================================================

create or replace function
public.confirm_ai_controlled_publication(
  p_publication_id uuid
)
returns setof
  public.ai_controlled_publications
language plpgsql
security definer
set search_path =
  public,
  pg_temp
as $function$

declare
  v_user_id uuid;
  v_role text;

  v_publication
    public.ai_controlled_publications%rowtype;

  v_shop
    public.marketplace_authorized_shops%rowtype;

  v_destination
    public.publishing_channel_destinations%rowtype;

  v_stale boolean :=
    false;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  select
    p.*
  into
    v_publication
  from
    public.ai_controlled_publications p
  where
    p.id =
      p_publication_id
  for update;

  if not found then
    raise exception
      'Controlled publication not found';
  end if;

  if v_publication.requested_by_user_id <>
    v_user_id
  then
    raise exception
      'Controlled publication requester mismatch';
  end if;

  select
    m.role
  into
    v_role
  from
    public.organization_members m
  where
    m.organization_id =
      v_publication.organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if coalesce(
    v_role,
    ''
  ) not in (
    'owner',
    'admin'
  ) then
    raise exception
      'Controlled publication requires owner or admin';
  end if;

  if v_publication.status =
    'confirmed'
  then
    return next
      v_publication;

    return;
  end if;

  if v_publication.status <>
    'proposed'
  then
    raise exception
      'Controlled publication is not confirmable';
  end if;

  if
    v_publication.contract_version =
      1
    and v_publication.target_resource =
      'marketplace_authorized_shop'
  then
    select
      s.*
    into
      v_shop
    from
      public.marketplace_authorized_shops s
    where
      s.id =
        v_publication.target_id
      and s.organization_id =
        v_publication.organization_id
    limit 1;

    v_stale :=
      not found
      or v_shop.status <>
        'active'
      or not v_shop.is_selected
      or lower(
        btrim(
          coalesce(
            v_shop.provider,
            ''
          )
        )
      ) <>
        v_publication.provider
      or btrim(
        coalesce(
          v_shop.external_shop_id,
          ''
        )
      ) <>
        v_publication.external_shop_id;

  elsif
    v_publication.contract_version =
      2
    and v_publication.target_resource =
      'publishing_channel_destination'
  then
    select
      d.*
    into
      v_destination
    from
      public.publishing_channel_destinations d
    where
      d.id =
        v_publication.target_id
      and d.organization_id =
        v_publication.organization_id
    limit 1;

    v_stale :=
      not found
      or v_destination.status <>
        'active'
      or not v_destination.is_selected
      or not (
        'publish_text' =
          any(
            v_destination.capabilities
          )
      )
      or lower(
        btrim(
          coalesce(
            v_destination.provider,
            ''
          )
        )
      ) <>
        v_publication.provider
      or btrim(
        coalesce(
          v_destination.external_destination_id,
          ''
        )
      ) <>
        v_publication.external_shop_id
      or v_destination.destination_type
        is distinct from
        v_publication.destination_type;

  else
    v_stale :=
      true;
  end if;

  if v_stale then
    update
      public.ai_controlled_publications
    set
      status =
        'stale',

      finalized_at =
        now(),

      error_message =
        'Publication destination changed before confirmation'
    where
      id =
        v_publication.id
    returning *
    into
      v_publication;

    return next
      v_publication;

    return;
  end if;

  update
    public.ai_controlled_publications
  set
    status =
      'confirmed',

    confirmed_by_user_id =
      v_user_id,

    confirmed_at =
      now(),

    error_message =
      null
  where
    id =
      v_publication.id
  returning *
  into
    v_publication;

  return next
    v_publication;

  return;
end;

$function$;


-- ============================================================
-- 6. PRIVILEGES
-- ============================================================

revoke all
on function
  public.propose_ai_controlled_publication_channel(
    uuid,
    uuid,
    text,
    text
  )
from
  public,
  anon,
  authenticated,
  service_role;

grant execute
on function
  public.propose_ai_controlled_publication_channel(
    uuid,
    uuid,
    text,
    text
  )
to authenticated;

revoke all
on function
  public.confirm_ai_controlled_publication(
    uuid
  )
from
  public,
  anon,
  authenticated,
  service_role;

grant execute
on function
  public.confirm_ai_controlled_publication(
    uuid
  )
to authenticated;


comment on function
  public.propose_ai_controlled_publication_channel(
    uuid,
    uuid,
    text,
    text
  )
is
  'Creates or idempotently replays a contract v2 content.publish_text proposal for a selected active publish_text-capable publishing channel destination. Does not publish externally.';

comment on function
  public.confirm_ai_controlled_publication(
    uuid
  )
is
  'Explicit same-requester owner/admin confirmation for SG4 legacy or SG5 channel-target controlled publications. Revalidates the corresponding destination identity and capability. Does not publish externally.';

comment on column
  public.ai_controlled_publications.external_shop_id
is
  'Backward-compatible physical snapshot column. SG4 contract v1 stores external shop id; SG5 contract v2 stores external publishing destination id.';

comment on column
  public.ai_controlled_publications.destination_type
is
  'NULL for SG4 contract v1 marketplace shop proposals. For SG5 contract v2, one of account/page/channel.';

comment on column
  public.ai_controlled_publications.legacy_authorized_shop_id
is
  'Generated typed FK for SG4 contract v1 rows. Preserves marketplace_authorized_shops referential integrity after target_id becomes polymorphic.';

comment on column
  public.ai_controlled_publications.publishing_destination_id
is
  'Generated typed FK for SG5 contract v2 rows. Preserves publishing_channel_destinations referential integrity while target_id remains the generic target snapshot.';

commit;