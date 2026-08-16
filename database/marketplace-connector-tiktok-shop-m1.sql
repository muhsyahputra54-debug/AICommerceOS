-- AICommerceOS
-- Marketplace Connector M1 — Tokopedia & Shop / TikTok Shop seller OAuth foundation
--
-- Permanent schema migration.
-- This migration intentionally COMMITs.
--
-- Security:
-- - no marketplace access/refresh token is exposed to authenticated browsers
-- - OAuth state is stored as a SHA-256 hash, single-use, and expires
-- - encrypted token envelopes are written only through service-role RPC
-- - safe connection status is exposed through a membership-checked RPC
-- - existing orders/order_items/stock authority is untouched

begin;

create table if not exists public.marketplace_oauth_states (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  marketplace_account_id uuid not null,

  provider text not null,
  state_hash text not null unique,

  initiated_by uuid not null
    references auth.users(id) on delete cascade,

  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),

  constraint marketplace_oauth_states_account_organization_fkey
    foreign key (marketplace_account_id, organization_id)
    references public.marketplace_accounts(id, organization_id)
    on delete cascade,

  constraint marketplace_oauth_states_provider_not_blank
    check (length(btrim(provider)) > 0),

  constraint marketplace_oauth_states_state_hash_not_blank
    check (length(btrim(state_hash)) > 0),

  constraint marketplace_oauth_states_expiry_check
    check (expires_at > created_at)
);

create index if not exists marketplace_oauth_states_expiry_idx
  on public.marketplace_oauth_states (expires_at)
  where used_at is null;


create table if not exists public.marketplace_connections (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  marketplace_account_id uuid not null unique,

  provider text not null,
  open_id text,

  access_token_ciphertext text not null,
  refresh_token_ciphertext text not null,

  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,

  granted_scopes text[] not null default '{}'::text[],
  user_type integer,

  status text not null default 'active',

  connected_by uuid
    references auth.users(id) on delete set null,

  connected_at timestamptz not null default now(),
  last_refreshed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint marketplace_connections_account_organization_fkey
    foreign key (marketplace_account_id, organization_id)
    references public.marketplace_accounts(id, organization_id)
    on delete cascade,

  constraint marketplace_connections_provider_not_blank
    check (length(btrim(provider)) > 0),

  constraint marketplace_connections_access_token_not_blank
    check (length(btrim(access_token_ciphertext)) > 0),

  constraint marketplace_connections_refresh_token_not_blank
    check (length(btrim(refresh_token_ciphertext)) > 0),

  constraint marketplace_connections_status_check
    check (status in ('active', 'expired', 'revoked', 'error')),

  constraint marketplace_connections_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists marketplace_connections_org_status_idx
  on public.marketplace_connections (organization_id, status);


alter table public.marketplace_oauth_states enable row level security;
alter table public.marketplace_connections enable row level security;

revoke all on table public.marketplace_oauth_states
  from public, anon, authenticated, service_role;

revoke all on table public.marketplace_connections
  from public, anon, authenticated, service_role;


create or replace function public.create_marketplace_oauth_state(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_user_id uuid,
  p_provider text,
  p_state_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if p_organization_id is null
     or p_marketplace_account_id is null
     or p_user_id is null then
    raise exception 'organization, account, and user are required';
  end if;

  if length(btrim(coalesce(p_provider, ''))) = 0 then
    raise exception 'provider is required';
  end if;

  if length(btrim(coalesce(p_state_hash, ''))) < 32 then
    raise exception 'invalid oauth state hash';
  end if;

  if p_expires_at <= now()
     or p_expires_at > now() + interval '30 minutes' then
    raise exception 'invalid oauth state expiry';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception 'user is not an organization member';
  end if;

  if not exists (
    select 1
    from public.marketplace_accounts a
    where a.id = p_marketplace_account_id
      and a.organization_id = p_organization_id
  ) then
    raise exception 'marketplace account not found';
  end if;

  delete from public.marketplace_oauth_states
  where expires_at < now() - interval '1 day';

  insert into public.marketplace_oauth_states (
    organization_id,
    marketplace_account_id,
    provider,
    state_hash,
    initiated_by,
    expires_at
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    lower(btrim(p_provider)),
    btrim(p_state_hash),
    p_user_id,
    p_expires_at
  )
  returning id into v_id;

  return v_id;
end;
$$;


create or replace function public.consume_marketplace_oauth_state(
  p_state_hash text,
  p_provider text
)
returns table (
  organization_id uuid,
  marketplace_account_id uuid,
  initiated_by uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with candidate as (
    select s.id
    from public.marketplace_oauth_states s
    where s.state_hash = btrim(p_state_hash)
      and s.provider = lower(btrim(p_provider))
      and s.used_at is null
      and s.expires_at > now()
    order by s.created_at desc
    limit 1
    for update
  )
  update public.marketplace_oauth_states s
  set used_at = now()
  from candidate c
  where s.id = c.id
  returning
    s.organization_id,
    s.marketplace_account_id,
    s.initiated_by;
end;
$$;


create or replace function public.upsert_marketplace_connection(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_connected_by uuid,
  p_provider text,
  p_open_id text,
  p_access_token_ciphertext text,
  p_refresh_token_ciphertext text,
  p_access_token_expires_at timestamptz,
  p_refresh_token_expires_at timestamptz,
  p_granted_scopes text[],
  p_user_type integer,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_connection_id uuid;
begin
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_connected_by
  ) then
    raise exception 'user is not an organization member';
  end if;

  if not exists (
    select 1
    from public.marketplace_accounts a
    where a.id = p_marketplace_account_id
      and a.organization_id = p_organization_id
  ) then
    raise exception 'marketplace account not found';
  end if;

  if length(btrim(coalesce(p_access_token_ciphertext, ''))) = 0
     or length(btrim(coalesce(p_refresh_token_ciphertext, ''))) = 0 then
    raise exception 'encrypted marketplace tokens are required';
  end if;

  insert into public.marketplace_connections (
    organization_id,
    marketplace_account_id,
    provider,
    open_id,
    access_token_ciphertext,
    refresh_token_ciphertext,
    access_token_expires_at,
    refresh_token_expires_at,
    granted_scopes,
    user_type,
    status,
    connected_by,
    connected_at,
    last_refreshed_at,
    metadata,
    updated_at
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    lower(btrim(p_provider)),
    nullif(btrim(coalesce(p_open_id, '')), ''),
    p_access_token_ciphertext,
    p_refresh_token_ciphertext,
    p_access_token_expires_at,
    p_refresh_token_expires_at,
    coalesce(p_granted_scopes, '{}'::text[]),
    p_user_type,
    'active',
    p_connected_by,
    now(),
    null,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (marketplace_account_id)
  do update set
    provider = excluded.provider,
    open_id = excluded.open_id,
    access_token_ciphertext = excluded.access_token_ciphertext,
    refresh_token_ciphertext = excluded.refresh_token_ciphertext,
    access_token_expires_at = excluded.access_token_expires_at,
    refresh_token_expires_at = excluded.refresh_token_expires_at,
    granted_scopes = excluded.granted_scopes,
    user_type = excluded.user_type,
    status = 'active',
    connected_by = excluded.connected_by,
    connected_at = now(),
    metadata = excluded.metadata,
    updated_at = now()
  returning id into v_connection_id;

  update public.marketplace_accounts
  set
    status = 'active',
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'connector', 'tiktok_shop',
        'connection_status', 'connected'
      ),
    updated_at = now()
  where id = p_marketplace_account_id
    and organization_id = p_organization_id;

  return v_connection_id;
end;
$$;


create or replace function public.get_marketplace_connection_status(
  p_marketplace_account_id uuid
)
returns table (
  provider text,
  status text,
  connected_at timestamptz,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  granted_scopes text[],
  updated_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    c.provider,
    c.status,
    c.connected_at,
    c.access_token_expires_at,
    c.refresh_token_expires_at,
    c.granted_scopes,
    c.updated_at
  from public.marketplace_connections c
  where c.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = c.organization_id
        and m.user_id = auth.uid()
    )
  limit 1;
$$;


revoke all on function public.create_marketplace_oauth_state(
  uuid, uuid, uuid, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.create_marketplace_oauth_state(
  uuid, uuid, uuid, text, text, timestamptz
) to service_role;


revoke all on function public.consume_marketplace_oauth_state(
  text, text
) from public, anon, authenticated;

grant execute on function public.consume_marketplace_oauth_state(
  text, text
) to service_role;


revoke all on function public.upsert_marketplace_connection(
  uuid, uuid, uuid, text, text, text, text,
  timestamptz, timestamptz, text[], integer, jsonb
) from public, anon, authenticated;

grant execute on function public.upsert_marketplace_connection(
  uuid, uuid, uuid, text, text, text, text,
  timestamptz, timestamptz, text[], integer, jsonb
) to service_role;


revoke all on function public.get_marketplace_connection_status(
  uuid
) from public, anon;

grant execute on function public.get_marketplace_connection_status(
  uuid
) to authenticated;

commit;


-- Read-only verification
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'marketplace_connections',
    'marketplace_oauth_states'
  )
order by table_name;

select
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'create_marketplace_oauth_state',
    'consume_marketplace_oauth_state',
    'upsert_marketplace_connection',
    'get_marketplace_connection_status'
  )
order by routine_name;
