-- AICommerceOS
-- Marketplace Connector M2 — Authorized Shops
--
-- Permanent schema migration.
-- This migration intentionally COMMITs.
--
-- Scope:
-- - persist authorized shops without exposing shop_cipher to browsers
-- - let authenticated organization members read safe shop metadata
-- - let authenticated members select one authorized shop for an account
-- - let server/service-role sync the official Get Authorized Shops response
-- - expose encrypted connection material only through a service-role RPC
-- - preserve existing order/order_items/inventory authority

begin;

create table if not exists public.marketplace_authorized_shops (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  marketplace_account_id uuid not null,

  provider text not null,

  external_shop_id text not null,
  shop_code text,
  name text not null,
  region text,
  seller_type text,

  shop_cipher_ciphertext text not null,

  status text not null default 'active',
  is_selected boolean not null default false,

  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint marketplace_authorized_shops_account_organization_fkey
    foreign key (marketplace_account_id, organization_id)
    references public.marketplace_accounts(id, organization_id)
    on delete cascade,

  constraint marketplace_authorized_shops_provider_not_blank
    check (length(btrim(provider)) > 0),

  constraint marketplace_authorized_shops_external_id_not_blank
    check (length(btrim(external_shop_id)) > 0),

  constraint marketplace_authorized_shops_name_not_blank
    check (length(btrim(name)) > 0),

  constraint marketplace_authorized_shops_cipher_not_blank
    check (length(btrim(shop_cipher_ciphertext)) > 0),

  constraint marketplace_authorized_shops_status_check
    check (status in ('active', 'inactive'))
);

create unique index if not exists
  marketplace_authorized_shops_account_external_shop_uidx
  on public.marketplace_authorized_shops (
    marketplace_account_id,
    external_shop_id
  );

create unique index if not exists
  marketplace_authorized_shops_one_selected_per_account_uidx
  on public.marketplace_authorized_shops (
    marketplace_account_id
  )
  where is_selected;

create index if not exists
  marketplace_authorized_shops_org_account_idx
  on public.marketplace_authorized_shops (
    organization_id,
    marketplace_account_id,
    status
  );


alter table public.marketplace_authorized_shops
  enable row level security;

revoke all on table public.marketplace_authorized_shops
  from public, anon, authenticated, service_role;


create or replace function public.get_marketplace_connection_secret(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_user_id uuid
)
returns table (
  provider text,
  status text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  granted_scopes text[]
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    c.provider,
    c.status,
    c.access_token_ciphertext,
    c.refresh_token_ciphertext,
    c.access_token_expires_at,
    c.refresh_token_expires_at,
    c.granted_scopes
  from public.marketplace_connections c
  where c.organization_id = p_organization_id
    and c.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = c.organization_id
        and m.user_id = p_user_id
    )
  limit 1;
$$;


create or replace function public.sync_marketplace_authorized_shops(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_user_id uuid,
  p_provider text,
  p_shops jsonb,
  p_request_id text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_shop jsonb;
  v_external_shop_id text;
  v_name text;
  v_ciphertext text;
  v_count integer := 0;
begin
  if jsonb_typeof(p_shops) <> 'array' then
    raise exception 'p_shops must be a json array';
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

  update public.marketplace_authorized_shops
  set
    status = 'inactive',
    is_selected = false,
    updated_at = now()
  where organization_id = p_organization_id
    and marketplace_account_id = p_marketplace_account_id;

  for v_shop in
    select value
    from jsonb_array_elements(p_shops)
  loop
    v_external_shop_id :=
      btrim(coalesce(v_shop->>'external_shop_id', ''));

    v_name :=
      btrim(coalesce(v_shop->>'name', ''));

    v_ciphertext :=
      btrim(coalesce(v_shop->>'shop_cipher_ciphertext', ''));

    if length(v_external_shop_id) = 0
       or length(v_name) = 0
       or length(v_ciphertext) = 0 then
      raise exception 'authorized shop payload is incomplete';
    end if;

    insert into public.marketplace_authorized_shops (
      organization_id,
      marketplace_account_id,
      provider,
      external_shop_id,
      shop_code,
      name,
      region,
      seller_type,
      shop_cipher_ciphertext,
      status,
      last_seen_at,
      updated_at
    )
    values (
      p_organization_id,
      p_marketplace_account_id,
      lower(btrim(p_provider)),
      v_external_shop_id,
      nullif(btrim(coalesce(v_shop->>'shop_code', '')), ''),
      v_name,
      nullif(btrim(coalesce(v_shop->>'region', '')), ''),
      nullif(btrim(coalesce(v_shop->>'seller_type', '')), ''),
      v_ciphertext,
      'active',
      now(),
      now()
    )
    on conflict (marketplace_account_id, external_shop_id)
    do update set
      provider = excluded.provider,
      shop_code = excluded.shop_code,
      name = excluded.name,
      region = excluded.region,
      seller_type = excluded.seller_type,
      shop_cipher_ciphertext = excluded.shop_cipher_ciphertext,
      status = 'active',
      last_seen_at = now(),
      updated_at = now();

    v_count := v_count + 1;
  end loop;

  update public.marketplace_accounts
  set
    last_synced_at = now(),
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'connector', 'tiktok_shop',
        'authorized_shop_count', v_count
      ),
    updated_at = now()
  where id = p_marketplace_account_id
    and organization_id = p_organization_id;

  insert into public.marketplace_sync_logs (
    organization_id,
    marketplace_account_id,
    direction,
    entity_type,
    operation,
    status,
    message,
    metadata
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    'inbound',
    'account',
    'authorized_shops_sync',
    'success',
    format('Synced %s authorized shop(s).', v_count),
    jsonb_build_object(
      'provider', lower(btrim(p_provider)),
      'request_id', nullif(btrim(coalesce(p_request_id, '')), ''),
      'shop_count', v_count
    )
  );

  return v_count;
end;
$$;


create or replace function public.get_marketplace_authorized_shops(
  p_marketplace_account_id uuid
)
returns table (
  id uuid,
  external_shop_id text,
  shop_code text,
  name text,
  region text,
  seller_type text,
  status text,
  is_selected boolean,
  last_seen_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    s.id,
    s.external_shop_id,
    s.shop_code,
    s.name,
    s.region,
    s.seller_type,
    s.status,
    s.is_selected,
    s.last_seen_at,
    s.created_at,
    s.updated_at
  from public.marketplace_authorized_shops s
  where s.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = s.organization_id
        and m.user_id = auth.uid()
    )
  order by
    s.is_selected desc,
    s.status asc,
    s.name asc;
$$;


create or replace function public.select_marketplace_authorized_shop(
  p_marketplace_account_id uuid,
  p_authorized_shop_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organization_id uuid;
  v_external_shop_id text;
  v_name text;
  v_region text;
begin
  select
    s.organization_id,
    s.external_shop_id,
    s.name,
    s.region
  into
    v_organization_id,
    v_external_shop_id,
    v_name,
    v_region
  from public.marketplace_authorized_shops s
  where s.id = p_authorized_shop_id
    and s.marketplace_account_id = p_marketplace_account_id
    and s.status = 'active'
  limit 1;

  if v_organization_id is null then
    raise exception 'authorized shop not found';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = v_organization_id
      and m.user_id = auth.uid()
  ) then
    raise exception 'user is not an organization member';
  end if;

  update public.marketplace_authorized_shops
  set
    is_selected = false,
    updated_at = now()
  where marketplace_account_id = p_marketplace_account_id
    and organization_id = v_organization_id
    and is_selected;

  update public.marketplace_authorized_shops
  set
    is_selected = true,
    updated_at = now()
  where id = p_authorized_shop_id
    and marketplace_account_id = p_marketplace_account_id
    and organization_id = v_organization_id;

  update public.marketplace_accounts
  set
    external_shop_id = v_external_shop_id,
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'selected_shop_name', v_name,
        'selected_shop_region', v_region
      ),
    updated_at = now()
  where id = p_marketplace_account_id
    and organization_id = v_organization_id;

  return v_external_shop_id;
end;
$$;


revoke all on function public.get_marketplace_connection_secret(
  uuid, uuid, uuid
) from public, anon, authenticated;

grant execute on function public.get_marketplace_connection_secret(
  uuid, uuid, uuid
) to service_role;


revoke all on function public.sync_marketplace_authorized_shops(
  uuid, uuid, uuid, text, jsonb, text
) from public, anon, authenticated;

grant execute on function public.sync_marketplace_authorized_shops(
  uuid, uuid, uuid, text, jsonb, text
) to service_role;


revoke all on function public.get_marketplace_authorized_shops(
  uuid
) from public, anon;

grant execute on function public.get_marketplace_authorized_shops(
  uuid
) to authenticated;


revoke all on function public.select_marketplace_authorized_shop(
  uuid, uuid
) from public, anon;

grant execute on function public.select_marketplace_authorized_shop(
  uuid, uuid
) to authenticated;

commit;


-- Read-only verification
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'marketplace_authorized_shops';

select
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'get_marketplace_connection_secret',
    'sync_marketplace_authorized_shops',
    'get_marketplace_authorized_shops',
    'select_marketplace_authorized_shop'
  )
order by routine_name;
