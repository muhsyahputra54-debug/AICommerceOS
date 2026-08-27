-- Phase 18.2 - SG5-E1B publishing destination provisioning contract
--
-- PURPOSE
--   Establish a fail-closed database contract for publishing destination
--   lifecycle metadata before any provider-specific OAuth or publish adapter exists.
--
-- TRUST BOUNDARY
--   - Provider-discovered destination identity is provisioned only by service_role.
--   - Revocation is service_role-only.
--   - Owner/admin may select only an already-provisioned active destination.
--   - User-facing callers cannot create arbitrary provider identities or capabilities.
--
-- SAFETY BOUNDARY
--   - NO provider credentials.
--   - NO OAuth flow.
--   - NO external HTTP/provider call.
--   - NO controlled-publication execution RPC.
--   - NO autonomous publishing.
--   - NO runtime route is switched by this migration source.
--
-- IMPORTANT
--   SOURCE ONLY IN SG5-E1B.
--   DO NOT APPLY TO SUPABASE WITHOUT A SEPARATE EXPLICIT
--   PHASE 18.2 DATABASE AUTHORIZATION GATE.

begin;

do $guard$
begin
  if to_regclass(
    'public.publishing_channel_destinations'
  ) is null then
    raise exception
      'Phase 18.2 requires public.publishing_channel_destinations';
  end if;

  if to_regclass(
    'public.organization_members'
  ) is null then
    raise exception
      'Phase 18.2 requires public.organization_members';
  end if;

  if to_regprocedure(
    'public.provision_publishing_channel_destination(uuid,text,text,text,text,text[])'
  ) is not null then
    raise exception
      'Phase 18.2 provision RPC already exists';
  end if;

  if to_regprocedure(
    'public.revoke_publishing_channel_destination(uuid,uuid)'
  ) is not null then
    raise exception
      'Phase 18.2 revoke RPC already exists';
  end if;

  if to_regprocedure(
    'public.select_publishing_channel_destination(uuid,uuid)'
  ) is not null then
    raise exception
      'Phase 18.2 select RPC already exists';
  end if;
end
$guard$;


-- ============================================================
-- 1. SERVICE-ROLE PROVISION / IDEMPOTENT REFRESH
-- ============================================================

create function
public.provision_publishing_channel_destination(
  p_organization_id uuid,
  p_provider text,
  p_destination_type text,
  p_external_destination_id text,
  p_display_name text,
  p_capabilities text[]
)
returns setof
  public.publishing_channel_destinations
language plpgsql
security definer
set search_path =
  public,
  pg_temp
as $function$

declare
  v_provider text;
  v_external_destination_id text;
  v_display_name text;
  v_destination
    public.publishing_channel_destinations%rowtype;

begin
  if coalesce(
    auth.role(),
    ''
  ) <> 'service_role'
  then
    raise exception
      'service role required';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  v_provider :=
    lower(
      btrim(
        coalesce(
          p_provider,
          ''
        )
      )
    );

  if
    length(v_provider) = 0
    or length(v_provider) > 100
    or v_provider !~
      '^[a-z0-9][a-z0-9._-]{0,99}$'
  then
    raise exception
      'invalid publishing provider';
  end if;

  if coalesce(
    p_destination_type,
    ''
  ) not in (
    'account',
    'page',
    'channel'
  ) then
    raise exception
      'invalid publishing destination type';
  end if;

  v_external_destination_id :=
    btrim(
      coalesce(
        p_external_destination_id,
        ''
      )
    );

  if
    length(v_external_destination_id) = 0
    or length(v_external_destination_id) > 255
  then
    raise exception
      'invalid external publishing destination id';
  end if;

  v_display_name :=
    btrim(
      coalesce(
        p_display_name,
        ''
      )
    );

  if
    length(v_display_name) = 0
    or length(v_display_name) > 200
  then
    raise exception
      'invalid publishing destination name';
  end if;

  if
    p_capabilities is null
    or cardinality(p_capabilities) > 3
    or not (
      p_capabilities <@
        array[
          'publish_text',
          'publish_image',
          'publish_video'
        ]::text[]
    )
    or cardinality(p_capabilities) <>
      (
        case
          when 'publish_text' =
            any(p_capabilities)
          then 1
          else 0
        end
        +
        case
          when 'publish_image' =
            any(p_capabilities)
          then 1
          else 0
        end
        +
        case
          when 'publish_video' =
            any(p_capabilities)
          then 1
          else 0
        end
      )
  then
    raise exception
      'invalid publishing destination capabilities';
  end if;

  insert into
    public.publishing_channel_destinations (
      organization_id,
      provider,
      destination_type,
      external_destination_id,
      display_name,
      status,
      capabilities,
      is_selected
    )
  values (
    p_organization_id,
    v_provider,
    p_destination_type,
    v_external_destination_id,
    v_display_name,
    'active',
    p_capabilities,
    false
  )
  on conflict (
    organization_id,
    provider,
    external_destination_id
  )
  do update
  set
    destination_type =
      excluded.destination_type,
    display_name =
      excluded.display_name,
    status =
      'active',
    capabilities =
      excluded.capabilities,
    updated_at =
      now()
  returning *
  into
    v_destination;

  return next
    v_destination;

  return;
end;

$function$;


-- ============================================================
-- 2. SERVICE-ROLE REVOCATION
-- ============================================================

create function
public.revoke_publishing_channel_destination(
  p_organization_id uuid,
  p_publishing_destination_id uuid
)
returns setof
  public.publishing_channel_destinations
language plpgsql
security definer
set search_path =
  public,
  pg_temp
as $function$

declare
  v_destination
    public.publishing_channel_destinations%rowtype;

begin
  if coalesce(
    auth.role(),
    ''
  ) <> 'service_role'
  then
    raise exception
      'service role required';
  end if;

  if
    p_organization_id is null
    or p_publishing_destination_id is null
  then
    raise exception
      'organization and publishing destination are required';
  end if;

  update
    public.publishing_channel_destinations
  set
    status =
      'revoked',
    is_selected =
      false,
    updated_at =
      now()
  where
    id =
      p_publishing_destination_id
    and organization_id =
      p_organization_id
  returning *
  into
    v_destination;

  if not found then
    raise exception
      'publishing destination not found';
  end if;

  return next
    v_destination;

  return;
end;

$function$;


-- ============================================================
-- 3. OWNER/ADMIN SELECTION OF EXISTING ACTIVE DESTINATION
-- ============================================================

create function
public.select_publishing_channel_destination(
  p_organization_id uuid,
  p_publishing_destination_id uuid
)
returns setof
  public.publishing_channel_destinations
language plpgsql
security definer
set search_path =
  public,
  pg_temp
as $function$

declare
  v_user_id uuid;
  v_role text;
  v_provider text;
  v_destination
    public.publishing_channel_destinations%rowtype;

begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'authentication required';
  end if;

  if
    p_organization_id is null
    or p_publishing_destination_id is null
  then
    raise exception
      'organization and publishing destination are required';
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
      'publishing destination selection requires owner or admin';
  end if;

  select
    d.provider
  into
    v_provider
  from
    public.publishing_channel_destinations d
  where
    d.id =
      p_publishing_destination_id
    and d.organization_id =
      p_organization_id
    and d.status =
      'active'
  limit 1;

  if not found then
    raise exception
      'active publishing destination not found';
  end if;

  -- Lock the provider row-set first, in deterministic id order.
  -- This avoids two concurrent selections pre-locking different
  -- target rows and then deadlocking while locking the full set.
  perform
    1
  from
    public.publishing_channel_destinations d
  where
    d.organization_id =
      p_organization_id
    and d.provider =
      v_provider
  order by
    d.id
  for update;

  -- Re-read the target after the provider row-set is locked so
  -- concurrent revocation/status changes fail closed.
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
    and d.provider =
      v_provider
    and d.status =
      'active'
  for update;

  if not found then
    raise exception
      'publishing destination changed before selection';
  end if;

  update
    public.publishing_channel_destinations
  set
    is_selected =
      false,
    updated_at =
      now()
  where
    organization_id =
      p_organization_id
    and provider =
      v_destination.provider
    and is_selected
    and id <>
      p_publishing_destination_id;

  update
    public.publishing_channel_destinations
  set
    is_selected =
      true,
    updated_at =
      now()
  where
    id =
      p_publishing_destination_id
    and organization_id =
      p_organization_id
  returning *
  into
    v_destination;

  if not found then
    raise exception
      'publishing destination selection failed';
  end if;

  return next
    v_destination;

  return;
end;

$function$;


-- ============================================================
-- 4. PRIVILEGES
-- ============================================================

revoke all
on function
  public.provision_publishing_channel_destination(
    uuid,
    text,
    text,
    text,
    text,
    text[]
  )
from
  public,
  anon,
  authenticated,
  service_role;

grant execute
on function
  public.provision_publishing_channel_destination(
    uuid,
    text,
    text,
    text,
    text,
    text[]
  )
to service_role;


revoke all
on function
  public.revoke_publishing_channel_destination(
    uuid,
    uuid
  )
from
  public,
  anon,
  authenticated,
  service_role;

grant execute
on function
  public.revoke_publishing_channel_destination(
    uuid,
    uuid
  )
to service_role;


revoke all
on function
  public.select_publishing_channel_destination(
    uuid,
    uuid
  )
from
  public,
  anon,
  authenticated,
  service_role;

grant execute
on function
  public.select_publishing_channel_destination(
    uuid,
    uuid
  )
to authenticated;


comment on function
  public.provision_publishing_channel_destination(
    uuid,
    text,
    text,
    text,
    text,
    text[]
  )
is
  'Service-role-only idempotent provisioning of verified publishing destination metadata. Stores no credentials and performs no provider call.';

comment on function
  public.revoke_publishing_channel_destination(
    uuid,
    uuid
  )
is
  'Service-role-only revocation of publishing destination metadata. Performs no provider call.';

comment on function
  public.select_publishing_channel_destination(
    uuid,
    uuid
  )
is
  'Owner/admin selection of an already-provisioned active publishing destination. Cannot create or modify provider identity or capabilities.';

commit;
