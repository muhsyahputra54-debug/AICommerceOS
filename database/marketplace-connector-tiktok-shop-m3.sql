-- AICommerceOS
-- Marketplace Connector M3 — Product Catalog Read-Only Sync
--
-- Permanent schema migration.
-- This migration intentionally COMMITs.
--
-- Scope:
-- - store read-only external catalog products and SKUs
-- - expose only safe product metadata to authenticated organization members
-- - keep seller access token and shop_cipher server-only
-- - preserve internal Product/Variant and order/inventory authority
-- - no marketplace write-back

begin;

create table if not exists public.marketplace_catalog_products (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  marketplace_account_id uuid not null,
  authorized_shop_id uuid not null,

  provider text not null,

  external_product_id text not null,
  title text not null,
  external_status text not null,

  external_create_time timestamptz,
  external_update_time timestamptz,

  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint marketplace_catalog_products_account_organization_fkey
    foreign key (marketplace_account_id, organization_id)
    references public.marketplace_accounts(id, organization_id)
    on delete cascade,

  constraint marketplace_catalog_products_shop_fkey
    foreign key (authorized_shop_id)
    references public.marketplace_authorized_shops(id)
    on delete cascade,

  constraint marketplace_catalog_products_provider_not_blank
    check (length(btrim(provider)) > 0),

  constraint marketplace_catalog_products_external_id_not_blank
    check (length(btrim(external_product_id)) > 0),

  constraint marketplace_catalog_products_title_not_blank
    check (length(btrim(title)) > 0),

  constraint marketplace_catalog_products_status_not_blank
    check (length(btrim(external_status)) > 0)
);

create unique index if not exists
  marketplace_catalog_products_shop_external_uidx
  on public.marketplace_catalog_products (
    authorized_shop_id,
    external_product_id
  );

create index if not exists
  marketplace_catalog_products_account_seen_idx
  on public.marketplace_catalog_products (
    marketplace_account_id,
    last_seen_at desc
  );


create table if not exists public.marketplace_catalog_skus (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  catalog_product_id uuid not null
    references public.marketplace_catalog_products(id)
    on delete cascade,

  external_sku_id text not null,
  seller_sku text,

  currency text,
  sale_price numeric,
  tax_exclusive_price numeric,

  inventory jsonb not null default '[]'::jsonb,

  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint marketplace_catalog_skus_external_id_not_blank
    check (length(btrim(external_sku_id)) > 0),

  constraint marketplace_catalog_skus_inventory_array
    check (jsonb_typeof(inventory) = 'array'),

  constraint marketplace_catalog_skus_sale_price_non_negative
    check (sale_price is null or sale_price >= 0),

  constraint marketplace_catalog_skus_tax_price_non_negative
    check (
      tax_exclusive_price is null
      or tax_exclusive_price >= 0
    )
);

create unique index if not exists
  marketplace_catalog_skus_product_external_uidx
  on public.marketplace_catalog_skus (
    catalog_product_id,
    external_sku_id
  );

create index if not exists
  marketplace_catalog_skus_org_product_idx
  on public.marketplace_catalog_skus (
    organization_id,
    catalog_product_id
  );


alter table public.marketplace_catalog_products
  enable row level security;

alter table public.marketplace_catalog_skus
  enable row level security;

revoke all on table public.marketplace_catalog_products
  from public, anon, authenticated, service_role;

revoke all on table public.marketplace_catalog_skus
  from public, anon, authenticated, service_role;


create or replace function public.get_marketplace_product_sync_context(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_user_id uuid
)
returns table (
  provider text,
  connection_status text,
  access_token_ciphertext text,
  access_token_expires_at timestamptz,
  granted_scopes text[],
  authorized_shop_id uuid,
  external_shop_id text,
  shop_cipher_ciphertext text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    c.provider,
    c.status,
    c.access_token_ciphertext,
    c.access_token_expires_at,
    c.granted_scopes,
    s.id,
    s.external_shop_id,
    s.shop_cipher_ciphertext
  from public.marketplace_connections c
  join public.marketplace_authorized_shops s
    on s.marketplace_account_id = c.marketplace_account_id
   and s.organization_id = c.organization_id
   and s.is_selected = true
   and s.status = 'active'
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


create or replace function public.upsert_marketplace_catalog_page(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_authorized_shop_id uuid,
  p_user_id uuid,
  p_provider text,
  p_products jsonb,
  p_request_id text,
  p_total_count integer,
  p_has_more boolean
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product jsonb;
  v_sku jsonb;
  v_catalog_product_id uuid;
  v_external_product_id text;
  v_title text;
  v_external_status text;
  v_count integer := 0;
begin
  if jsonb_typeof(p_products) <> 'array' then
    raise exception 'p_products must be a json array';
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
    from public.marketplace_authorized_shops s
    where s.id = p_authorized_shop_id
      and s.organization_id = p_organization_id
      and s.marketplace_account_id = p_marketplace_account_id
      and s.is_selected = true
      and s.status = 'active'
  ) then
    raise exception 'selected authorized shop not found';
  end if;

  for v_product in
    select value
    from jsonb_array_elements(p_products)
  loop
    v_external_product_id :=
      btrim(coalesce(v_product->>'external_product_id', ''));

    v_title :=
      btrim(coalesce(v_product->>'title', ''));

    v_external_status :=
      btrim(coalesce(v_product->>'status', 'UNKNOWN'));

    if length(v_external_product_id) = 0
       or length(v_title) = 0 then
      raise exception 'catalog product payload is incomplete';
    end if;

    insert into public.marketplace_catalog_products (
      organization_id,
      marketplace_account_id,
      authorized_shop_id,
      provider,
      external_product_id,
      title,
      external_status,
      external_create_time,
      external_update_time,
      last_seen_at,
      updated_at
    )
    values (
      p_organization_id,
      p_marketplace_account_id,
      p_authorized_shop_id,
      lower(btrim(p_provider)),
      v_external_product_id,
      v_title,
      coalesce(nullif(v_external_status, ''), 'UNKNOWN'),
      case
        when (v_product->>'create_time') ~ '^[0-9]+$'
          then to_timestamp((v_product->>'create_time')::double precision)
        else null
      end,
      case
        when (v_product->>'update_time') ~ '^[0-9]+$'
          then to_timestamp((v_product->>'update_time')::double precision)
        else null
      end,
      now(),
      now()
    )
    on conflict (authorized_shop_id, external_product_id)
    do update set
      provider = excluded.provider,
      title = excluded.title,
      external_status = excluded.external_status,
      external_create_time = excluded.external_create_time,
      external_update_time = excluded.external_update_time,
      last_seen_at = now(),
      updated_at = now()
    returning id into v_catalog_product_id;

    for v_sku in
      select value
      from jsonb_array_elements(
        coalesce(v_product->'skus', '[]'::jsonb)
      )
    loop
      if length(
        btrim(coalesce(v_sku->>'external_sku_id', ''))
      ) = 0 then
        continue;
      end if;

      insert into public.marketplace_catalog_skus (
        organization_id,
        catalog_product_id,
        external_sku_id,
        seller_sku,
        currency,
        sale_price,
        tax_exclusive_price,
        inventory,
        last_seen_at,
        updated_at
      )
      values (
        p_organization_id,
        v_catalog_product_id,
        btrim(v_sku->>'external_sku_id'),
        nullif(btrim(coalesce(v_sku->>'seller_sku', '')), ''),
        nullif(btrim(coalesce(v_sku->>'currency', '')), ''),
        case
          when coalesce(v_sku->>'sale_price', '') ~ '^[0-9]+(\.[0-9]+)?$'
            then (v_sku->>'sale_price')::numeric
          else null
        end,
        case
          when coalesce(v_sku->>'tax_exclusive_price', '') ~ '^[0-9]+(\.[0-9]+)?$'
            then (v_sku->>'tax_exclusive_price')::numeric
          else null
        end,
        case
          when jsonb_typeof(v_sku->'inventory') = 'array'
            then v_sku->'inventory'
          else '[]'::jsonb
        end,
        now(),
        now()
      )
      on conflict (catalog_product_id, external_sku_id)
      do update set
        seller_sku = excluded.seller_sku,
        currency = excluded.currency,
        sale_price = excluded.sale_price,
        tax_exclusive_price = excluded.tax_exclusive_price,
        inventory = excluded.inventory,
        last_seen_at = now(),
        updated_at = now();
    end loop;

    v_count := v_count + 1;
  end loop;

  update public.marketplace_accounts
  set
    last_synced_at = now(),
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'catalog_last_page_count', v_count,
        'catalog_total_count', greatest(coalesce(p_total_count, v_count), 0),
        'catalog_has_more', coalesce(p_has_more, false)
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
    'product',
    'catalog_page_sync',
    'success',
    format('Synced %s marketplace product(s).', v_count),
    jsonb_build_object(
      'provider', lower(btrim(p_provider)),
      'request_id', nullif(btrim(coalesce(p_request_id, '')), ''),
      'page_count', v_count,
      'total_count', greatest(coalesce(p_total_count, v_count), 0),
      'has_more', coalesce(p_has_more, false)
    )
  );

  return v_count;
end;
$$;


create or replace function public.get_marketplace_catalog_products(
  p_marketplace_account_id uuid,
  p_limit integer default 200
)
returns table (
  id uuid,
  external_product_id text,
  title text,
  external_status text,
  sku_count bigint,
  seller_skus text[],
  last_seen_at timestamptz,
  external_update_time timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.external_product_id,
    p.title,
    p.external_status,
    count(s.id)::bigint as sku_count,
    coalesce(
      array_agg(s.seller_sku order by s.seller_sku)
        filter (where s.seller_sku is not null),
      '{}'::text[]
    ) as seller_skus,
    p.last_seen_at,
    p.external_update_time
  from public.marketplace_catalog_products p
  left join public.marketplace_catalog_skus s
    on s.catalog_product_id = p.id
   and s.organization_id = p.organization_id
  where p.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = p.organization_id
        and m.user_id = auth.uid()
    )
  group by
    p.id,
    p.external_product_id,
    p.title,
    p.external_status,
    p.last_seen_at,
    p.external_update_time
  order by
    p.last_seen_at desc,
    p.title asc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$$;


revoke all on function public.get_marketplace_product_sync_context(
  uuid, uuid, uuid
) from public, anon, authenticated;

grant execute on function public.get_marketplace_product_sync_context(
  uuid, uuid, uuid
) to service_role;


revoke all on function public.upsert_marketplace_catalog_page(
  uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean
) from public, anon, authenticated;

grant execute on function public.upsert_marketplace_catalog_page(
  uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean
) to service_role;


revoke all on function public.get_marketplace_catalog_products(
  uuid, integer
) from public, anon;

grant execute on function public.get_marketplace_catalog_products(
  uuid, integer
) to authenticated;

commit;


-- Read-only verification
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'marketplace_catalog_products',
    'marketplace_catalog_skus'
  )
order by table_name;

select
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'get_marketplace_product_sync_context',
    'upsert_marketplace_catalog_page',
    'get_marketplace_catalog_products'
  )
order by routine_name;
