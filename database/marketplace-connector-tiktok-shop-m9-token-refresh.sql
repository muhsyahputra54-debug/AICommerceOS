-- AICommerceOS
-- Marketplace Connector M9.3 — Automatic Token Refresh
--
-- Permanent schema migration.
-- This migration intentionally COMMITs.
--
-- Security:
-- - token ciphertext remains server-side only
-- - refresh RPCs are executable only by service_role
-- - caller-supplied user_id must still be an organization member
-- - refresh persistence uses optimistic comparison against the previous
--   refresh-token ciphertext so a slower request cannot overwrite a newer
--   credential set
-- - connected_at / connected_by are not changed by token refresh

begin;


create or replace function public.get_marketplace_connection_refresh_context(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_user_id uuid
)
returns table (
  provider text,
  status text,
  open_id text,
  user_type integer,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  access_token_expires_at timestamp with time zone,
  refresh_token_expires_at timestamp with time zone,
  granted_scopes text[]
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    c.provider,
    c.status,
    c.open_id,
    c.user_type,
    c.access_token_ciphertext,
    c.refresh_token_ciphertext,
    c.access_token_expires_at,
    c.refresh_token_expires_at,
    c.granted_scopes
  from public.marketplace_connections c
  where c.organization_id = p_organization_id
    and c.marketplace_account_id =
        p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = c.organization_id
        and m.user_id = p_user_id
    )
  limit 1;
$$;


create or replace function public.apply_marketplace_connection_token_refresh(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_user_id uuid,
  p_expected_refresh_token_ciphertext text,
  p_access_token_ciphertext text,
  p_refresh_token_ciphertext text,
  p_access_token_expires_at timestamp with time zone,
  p_refresh_token_expires_at timestamp with time zone,
  p_open_id text,
  p_user_type integer,
  p_granted_scopes text[],
  p_request_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_connection public.marketplace_connections%rowtype;
begin
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception
      'user is not an organization member'
      using errcode = '42501';
  end if;

  select c.*
  into v_connection
  from public.marketplace_connections c
  where c.organization_id = p_organization_id
    and c.marketplace_account_id =
        p_marketplace_account_id
  for update;

  if not found then
    raise exception 'marketplace connection not found';
  end if;

  if v_connection.provider <> 'tiktok_shop' then
    raise exception
      'marketplace connection is not tiktok_shop';
  end if;

  if v_connection.status <> 'active' then
    raise exception
      'marketplace connection is not active';
  end if;

  if length(
       btrim(
         coalesce(
           p_expected_refresh_token_ciphertext,
           ''
         )
       )
     ) = 0 then
    raise exception
      'expected refresh-token ciphertext is required';
  end if;

  -- Optimistic concurrency guard. A different request already persisted a
  -- newer refresh token, so this request must reload instead of overwriting it.
  if v_connection.refresh_token_ciphertext <>
     p_expected_refresh_token_ciphertext then
    return false;
  end if;

  if length(
       btrim(coalesce(p_access_token_ciphertext, ''))
     ) = 0
     or length(
       btrim(coalesce(p_refresh_token_ciphertext, ''))
     ) = 0 then
    raise exception
      'encrypted marketplace tokens are required';
  end if;

  if p_access_token_expires_at is null
     or p_access_token_expires_at <= now() then
    raise exception
      'refreshed access token expiry must be in the future';
  end if;

  if p_refresh_token_expires_at is null
     or p_refresh_token_expires_at <= now() then
    raise exception
      'refreshed refresh token expiry must be in the future';
  end if;

  if length(btrim(coalesce(p_open_id, ''))) = 0 then
    raise exception
      'refreshed seller open_id is required';
  end if;

  if p_user_type is distinct from 0 then
    raise exception
      'refreshed authorization is not a seller authorization';
  end if;

  if v_connection.open_id is not null
     and v_connection.open_id <> p_open_id then
    raise exception
      'refreshed seller identity does not match connection';
  end if;

  if v_connection.user_type is not null
     and v_connection.user_type <> p_user_type then
    raise exception
      'refreshed seller user type does not match connection';
  end if;

  update public.marketplace_connections
  set
    access_token_ciphertext =
      p_access_token_ciphertext,
    refresh_token_ciphertext =
      p_refresh_token_ciphertext,
    access_token_expires_at =
      p_access_token_expires_at,
    refresh_token_expires_at =
      p_refresh_token_expires_at,
    open_id =
      coalesce(open_id, p_open_id),
    user_type =
      coalesce(user_type, p_user_type),
    granted_scopes =
      coalesce(
        p_granted_scopes,
        granted_scopes,
        '{}'::text[]
      ),
    status = 'active',
    last_refreshed_at = now(),
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'last_token_refresh',
        jsonb_strip_nulls(
          jsonb_build_object(
            'request_id',
            nullif(btrim(coalesce(p_request_id, '')), ''),
            'refreshed_at',
            now()
          )
        )
      ),
    updated_at = now()
  where id = v_connection.id;

  return true;
end;
$$;


revoke all on function
  public.get_marketplace_connection_refresh_context(
    uuid,
    uuid,
    uuid
  )
from public, anon, authenticated;

grant execute on function
  public.get_marketplace_connection_refresh_context(
    uuid,
    uuid,
    uuid
  )
to service_role;


revoke all on function
  public.apply_marketplace_connection_token_refresh(
    uuid,
    uuid,
    uuid,
    text,
    text,
    text,
    timestamp with time zone,
    timestamp with time zone,
    text,
    integer,
    text[],
    text
  )
from public, anon, authenticated;

grant execute on function
  public.apply_marketplace_connection_token_refresh(
    uuid,
    uuid,
    uuid,
    text,
    text,
    text,
    timestamp with time zone,
    timestamp with time zone,
    text,
    integer,
    text[],
    text
  )
to service_role;


commit;


-- Read-only verification
select
  r.routine_name,
  r.security_type,
  has_function_privilege(
    'service_role',
    p.oid,
    'EXECUTE'
  ) as service_role_execute,
  has_function_privilege(
    'authenticated',
    p.oid,
    'EXECUTE'
  ) as authenticated_execute
from information_schema.routines r
join pg_proc p
  on p.proname = r.routine_name
join pg_namespace n
  on n.oid = p.pronamespace
 and n.nspname = r.routine_schema
where r.routine_schema = 'public'
  and r.routine_name in (
    'apply_marketplace_connection_token_refresh',
    'get_marketplace_connection_refresh_context'
  )
order by r.routine_name;
