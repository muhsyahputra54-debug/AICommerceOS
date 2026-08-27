-- ============================================================
-- LAKUVO / AICommerceOS
-- PHASE 17.7 - CONTROLLED PUBLICATION FOUNDATION
--
-- SOURCE MIGRATION ONLY.
-- DO NOT APPLY TO SUPABASE IN SG4-B1.
--
-- Lifecycle:
--   structured proposal -> explicit human confirmation
--
-- SG4 deliberately has NO external publish executor.
-- SG5 Channel Automation owns provider-specific execution.
-- ============================================================

begin;


-- ============================================================
-- 1. FAIL-CLOSED DEPENDENCY GUARD
-- ============================================================

do $guard$
begin
  if to_regclass(
    'public.organizations'
  ) is null then
    raise exception
      'Phase 17.7 requires public.organizations';
  end if;

  if to_regclass(
    'public.organization_members'
  ) is null then
    raise exception
      'Phase 17.7 requires public.organization_members';
  end if;

  if to_regclass(
    'public.marketplace_authorized_shops'
  ) is null then
    raise exception
      'Phase 17.7 requires public.marketplace_authorized_shops';
  end if;

  if to_regclass(
    'public.ai_controlled_publications'
  ) is not null then
    raise exception
      'public.ai_controlled_publications already exists; inspect live schema before applying Phase 17.7';
  end if;
end;
$guard$;


-- ============================================================
-- 2. CONTROLLED PUBLICATION TABLE
-- ============================================================

create table public.ai_controlled_publications (
  id uuid primary key
    default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  contract_version smallint not null
    default 1,

  action_type text not null
    default 'content.publish_text',

  target_resource text not null
    default 'marketplace_authorized_shop',

  target_id uuid not null
    references public.marketplace_authorized_shops(id)
    on delete restrict,

  mutation_field text not null
    default 'content',

  expected_value text,
  proposed_value text not null,

  provider text not null,
  external_shop_id text not null,
  destination_name text not null,

  requested_by_user_id uuid not null
    references auth.users(id)
    on delete restrict,

  confirmed_by_user_id uuid
    references auth.users(id)
    on delete set null,

  idempotency_key text not null,

  status text not null
    default 'proposed',

  created_at timestamptz not null
    default now(),

  confirmed_at timestamptz,
  finalized_at timestamptz,
  error_message text,

  constraint ai_controlled_publications_contract_version_check
    check (
      contract_version = 1
    ),

  constraint ai_controlled_publications_action_type_check
    check (
      action_type =
        'content.publish_text'
    ),

  constraint ai_controlled_publications_target_resource_check
    check (
      target_resource =
        'marketplace_authorized_shop'
    ),

  constraint ai_controlled_publications_mutation_field_check
    check (
      mutation_field =
        'content'
    ),

  constraint ai_controlled_publications_expected_value_check
    check (
      expected_value is null
    ),

  constraint ai_controlled_publications_proposed_value_check
    check (
      length(
        btrim(
          proposed_value
        )
      ) between 1 and 5000
    ),

  constraint ai_controlled_publications_provider_check
    check (
      provider =
        lower(
          btrim(
            provider
          )
        )
      and length(provider) > 0
    ),

  constraint ai_controlled_publications_external_shop_id_check
    check (
      length(
        btrim(
          external_shop_id
        )
      ) > 0
    ),

  constraint ai_controlled_publications_destination_name_check
    check (
      length(
        btrim(
          destination_name
        )
      ) > 0
    ),

  constraint ai_controlled_publications_idempotency_key_check
    check (
      idempotency_key =
        btrim(
          idempotency_key
        )
      and length(
        idempotency_key
      ) between 8 and 128
      and idempotency_key ~
        '^[A-Za-z0-9._:-]+$'
    ),

  constraint ai_controlled_publications_status_check
    check (
      status in (
        'proposed',
        'confirmed',
        'stale'
      )
    ),

  constraint ai_controlled_publications_lifecycle_check
    check (
      (
        status = 'proposed'
        and confirmed_by_user_id is null
        and confirmed_at is null
        and finalized_at is null
        and error_message is null
      )
      or
      (
        status = 'confirmed'
        and confirmed_by_user_id is not null
        and confirmed_at is not null
        and finalized_at is null
        and error_message is null
      )
      or
      (
        status = 'stale'
        and finalized_at is not null
      )
    )
);


create unique index
  ai_controlled_publications_org_idempotency_uidx
on public.ai_controlled_publications (
  organization_id,
  idempotency_key
);


create index
  ai_controlled_publications_org_status_created_idx
on public.ai_controlled_publications (
  organization_id,
  status,
  created_at desc
);


create index
  ai_controlled_publications_org_target_idx
on public.ai_controlled_publications (
  organization_id,
  target_id
);


comment on table
  public.ai_controlled_publications
is
  'SG4 controlled publication proposals. Stores user-reviewed publication intent and destination snapshot. Does not publish externally.';


-- ============================================================
-- 3. DIRECT TABLE ACCESS CLOSED
-- ============================================================

alter table
  public.ai_controlled_publications
  enable row level security;


revoke all
on table public.ai_controlled_publications
from public, anon, authenticated, service_role;


-- ============================================================
-- 4. PROPOSAL RPC
-- ============================================================

create or replace function
public.propose_ai_controlled_publication(
  p_organization_id uuid,
  p_authorized_shop_id uuid,
  p_proposed_content text,
  p_idempotency_key text
)
returns setof
  public.ai_controlled_publications
language plpgsql
security definer
set search_path = public, pg_temp
as $function$

declare
  v_user_id uuid;
  v_role text;

  v_shop
    public.marketplace_authorized_shops%rowtype;

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

  if p_authorized_shop_id is null then
    raise exception
      'Authorized shop is required';
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
    '^[A-Za-z0-9._:-]+$' then
    raise exception
      'Invalid controlled publication idempotency key';
  end if;

  select
    s.*
  into
    v_shop
  from
    public.marketplace_authorized_shops s
  where
    s.id =
      p_authorized_shop_id
    and s.organization_id =
      p_organization_id
    and s.status =
      'active'
    and s.is_selected
  limit 1;

  if not found then
    raise exception
      'Authorized selected shop not found';
  end if;

  if length(
    btrim(
      coalesce(
        v_shop.provider,
        ''
      )
    )
  ) = 0
  or length(
    btrim(
      coalesce(
        v_shop.external_shop_id,
        ''
      )
    )
  ) = 0
  or length(
    btrim(
      coalesce(
        v_shop.name,
        ''
      )
    )
  ) = 0 then
    raise exception
      'Authorized shop identity is incomplete';
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
      v_existing.action_type <>
        'content.publish_text'
      or v_existing.target_resource <>
        'marketplace_authorized_shop'
      or v_existing.target_id <>
        p_authorized_shop_id
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
      requested_by_user_id,
      idempotency_key,
      status
    )
  values (
    p_organization_id,
    1,
    'content.publish_text',
    'marketplace_authorized_shop',
    p_authorized_shop_id,
    'content',
    null,
    v_content,
    lower(
      btrim(
        v_shop.provider
      )
    ),
    btrim(
      v_shop.external_shop_id
    ),
    btrim(
      v_shop.name
    ),
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
      v_existing.action_type <>
        'content.publish_text'
      or v_existing.target_resource <>
        'marketplace_authorized_shop'
      or v_existing.target_id <>
        p_authorized_shop_id
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
-- 5. SINGLE READ RPC
-- ============================================================

create or replace function
public.get_ai_controlled_publication(
  p_organization_id uuid,
  p_publication_id uuid
)
returns setof
  public.ai_controlled_publications
language plpgsql
security definer
set search_path = public, pg_temp
as $function$

declare
  v_user_id uuid;
  v_role text;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
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

  return query
  select
    p.*
  from
    public.ai_controlled_publications p
  where
    p.organization_id =
      p_organization_id
    and p.id =
      p_publication_id
  limit 1;
end;

$function$;


-- ============================================================
-- 6. LIST READ RPC
-- ============================================================

create or replace function
public.get_ai_controlled_publications(
  p_organization_id uuid,
  p_limit integer default 20,
  p_offset integer default 0,
  p_status text default null
)
returns setof
  public.ai_controlled_publications
language plpgsql
security definer
set search_path = public, pg_temp
as $function$

declare
  v_user_id uuid;
  v_role text;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_limit < 1
  or p_limit > 100 then
    raise exception
      'Invalid controlled publication limit';
  end if;

  if p_offset < 0 then
    raise exception
      'Invalid controlled publication offset';
  end if;

  if p_status is not null
  and p_status not in (
    'proposed',
    'confirmed',
    'stale'
  ) then
    raise exception
      'Invalid controlled publication status';
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

  return query
  select
    p.*
  from
    public.ai_controlled_publications p
  where
    p.organization_id =
      p_organization_id
    and (
      p_status is null
      or p.status =
        p_status
    )
  order by
    p.created_at desc,
    p.id desc
  limit
    p_limit
  offset
    p_offset;
end;

$function$;


-- ============================================================
-- 7. EXPLICIT HUMAN CONFIRMATION RPC
-- ============================================================

create or replace function
public.confirm_ai_controlled_publication(
  p_publication_id uuid
)
returns setof
  public.ai_controlled_publications
language plpgsql
security definer
set search_path = public, pg_temp
as $function$

declare
  v_user_id uuid;
  v_role text;

  v_publication
    public.ai_controlled_publications%rowtype;

  v_shop
    public.marketplace_authorized_shops%rowtype;

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
    v_user_id then
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
    'confirmed' then
    return next
      v_publication;

    return;
  end if;

  if v_publication.status <>
    'proposed' then
    raise exception
      'Controlled publication is not confirmable';
  end if;

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

  if
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
      v_publication.external_shop_id
  then
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
-- 8. RPC PRIVILEGES
-- ============================================================

revoke all
on function public.propose_ai_controlled_publication(
  uuid,
  uuid,
  text,
  text
)
from public, anon, authenticated, service_role;


grant execute
on function public.propose_ai_controlled_publication(
  uuid,
  uuid,
  text,
  text
)
to authenticated;


revoke all
on function public.get_ai_controlled_publication(
  uuid,
  uuid
)
from public, anon, authenticated, service_role;


grant execute
on function public.get_ai_controlled_publication(
  uuid,
  uuid
)
to authenticated;


revoke all
on function public.get_ai_controlled_publications(
  uuid,
  integer,
  integer,
  text
)
from public, anon, authenticated, service_role;


grant execute
on function public.get_ai_controlled_publications(
  uuid,
  integer,
  integer,
  text
)
to authenticated;


revoke all
on function public.confirm_ai_controlled_publication(
  uuid
)
from public, anon, authenticated, service_role;


grant execute
on function public.confirm_ai_controlled_publication(
  uuid
)
to authenticated;


comment on function
public.propose_ai_controlled_publication(
  uuid,
  uuid,
  text,
  text
)
is
  'Creates or idempotently replays a content.publish_text proposal for the currently selected authorized marketplace shop. Does not publish externally.';


comment on function
public.confirm_ai_controlled_publication(
  uuid
)
is
  'Explicit same-requester owner/admin confirmation for a controlled publication. Revalidates destination identity. Does not publish externally.';


commit;