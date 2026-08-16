-- AICommerceOS
-- Marketplace Connector M4 — Read-Only External Order Import
--
-- Permanent schema migration.
-- This migration intentionally COMMITs.
--
-- Security / privacy boundaries:
-- - stores only operational order data needed for commerce workflows
-- - does NOT persist recipient name/address/phone/email
-- - seller access token and shop_cipher remain server-only/encrypted
-- - imported orders are separate from public.orders
-- - no internal order creation, status mutation, stock mutation, or marketplace write-back

begin;

create table if not exists public.marketplace_external_orders (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  marketplace_account_id uuid not null,
  authorized_shop_id uuid not null,

  provider text not null,

  external_order_id text not null,
  external_status text not null,

  payment_currency text,
  payment_subtotal numeric,
  payment_shipping_fee numeric,
  payment_original_shipping_fee numeric,
  payment_seller_discount numeric,
  payment_platform_discount numeric,
  payment_total_amount numeric,

  fulfillment_type text,
  delivery_option_name text,
  is_sample_order boolean not null default false,

  external_create_time timestamptz,
  external_update_time timestamptz,

  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint marketplace_external_orders_account_organization_fkey
    foreign key (marketplace_account_id, organization_id)
    references public.marketplace_accounts(id, organization_id)
    on delete cascade,

  constraint marketplace_external_orders_shop_fkey
    foreign key (authorized_shop_id)
    references public.marketplace_authorized_shops(id)
    on delete cascade,

  constraint marketplace_external_orders_provider_not_blank
    check (length(btrim(provider)) > 0),

  constraint marketplace_external_orders_external_id_not_blank
    check (length(btrim(external_order_id)) > 0),

  constraint marketplace_external_orders_status_not_blank
    check (length(btrim(external_status)) > 0),

  constraint marketplace_external_orders_payment_non_negative
    check (
      (payment_subtotal is null or payment_subtotal >= 0)
      and (payment_shipping_fee is null or payment_shipping_fee >= 0)
      and (
        payment_original_shipping_fee is null
        or payment_original_shipping_fee >= 0
      )
      and (
        payment_seller_discount is null
        or payment_seller_discount >= 0
      )
      and (
        payment_platform_discount is null
        or payment_platform_discount >= 0
      )
      and (
        payment_total_amount is null
        or payment_total_amount >= 0
      )
    )
);

create unique index if not exists
  marketplace_external_orders_shop_external_uidx
  on public.marketplace_external_orders (
    authorized_shop_id,
    external_order_id
  );

create index if not exists
  marketplace_external_orders_account_update_idx
  on public.marketplace_external_orders (
    marketplace_account_id,
    external_update_time desc nulls last,
    last_seen_at desc
  );


create table if not exists public.marketplace_external_order_items (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  external_order_id uuid not null
    references public.marketplace_external_orders(id)
    on delete cascade,

  external_line_item_id text not null,
  external_product_id text,
  product_name text,
  external_sku_id text,
  sku_name text,
  seller_sku text,

  quantity integer not null default 1,

  original_price numeric,
  sale_price numeric,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint marketplace_external_order_items_line_id_not_blank
    check (length(btrim(external_line_item_id)) > 0),

  constraint marketplace_external_order_items_quantity_positive
    check (quantity > 0),

  constraint marketplace_external_order_items_price_non_negative
    check (
      (original_price is null or original_price >= 0)
      and (sale_price is null or sale_price >= 0)
    )
);

create unique index if not exists
  marketplace_external_order_items_order_line_uidx
  on public.marketplace_external_order_items (
    external_order_id,
    external_line_item_id
  );

create index if not exists
  marketplace_external_order_items_org_order_idx
  on public.marketplace_external_order_items (
    organization_id,
    external_order_id
  );


alter table public.marketplace_external_orders
  enable row level security;

alter table public.marketplace_external_order_items
  enable row level security;

revoke all on table public.marketplace_external_orders
  from public, anon, authenticated, service_role;

revoke all on table public.marketplace_external_order_items
  from public, anon, authenticated, service_role;


create or replace function public.get_marketplace_order_sync_context(
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


create or replace function public.upsert_marketplace_external_order_page(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_authorized_shop_id uuid,
  p_user_id uuid,
  p_provider text,
  p_orders jsonb,
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
  v_order jsonb;
  v_item jsonb;
  v_external_order_row_id uuid;
  v_external_order_id text;
  v_external_status text;
  v_count integer := 0;
begin
  if jsonb_typeof(p_orders) <> 'array' then
    raise exception 'p_orders must be a json array';
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

  for v_order in
    select value
    from jsonb_array_elements(p_orders)
  loop
    v_external_order_id :=
      btrim(coalesce(v_order->>'external_order_id', ''));

    v_external_status :=
      btrim(coalesce(v_order->>'status', 'UNKNOWN'));

    if length(v_external_order_id) = 0 then
      raise exception 'external order payload is incomplete';
    end if;

    insert into public.marketplace_external_orders (
      organization_id,
      marketplace_account_id,
      authorized_shop_id,
      provider,
      external_order_id,
      external_status,
      payment_currency,
      payment_subtotal,
      payment_shipping_fee,
      payment_original_shipping_fee,
      payment_seller_discount,
      payment_platform_discount,
      payment_total_amount,
      fulfillment_type,
      delivery_option_name,
      is_sample_order,
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
      v_external_order_id,
      coalesce(nullif(v_external_status, ''), 'UNKNOWN'),
      nullif(btrim(coalesce(v_order#>>'{payment,currency}', '')), ''),
      case
        when coalesce(v_order#>>'{payment,sub_total}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,sub_total}')::numeric
        else null
      end,
      case
        when coalesce(v_order#>>'{payment,shipping_fee}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,shipping_fee}')::numeric
        else null
      end,
      case
        when coalesce(v_order#>>'{payment,original_shipping_fee}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,original_shipping_fee}')::numeric
        else null
      end,
      case
        when coalesce(v_order#>>'{payment,seller_discount}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,seller_discount}')::numeric
        else null
      end,
      case
        when coalesce(v_order#>>'{payment,platform_discount}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,platform_discount}')::numeric
        else null
      end,
      case
        when coalesce(v_order#>>'{payment,total_amount}', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_order#>>'{payment,total_amount}')::numeric
        else null
      end,
      nullif(btrim(coalesce(v_order->>'fulfillment_type', '')), ''),
      nullif(btrim(coalesce(v_order->>'delivery_option_name', '')), ''),
      coalesce((v_order->>'is_sample_order')::boolean, false),
      case
        when (v_order->>'create_time') ~ '^[0-9]+$'
          then to_timestamp((v_order->>'create_time')::double precision)
        else null
      end,
      case
        when (v_order->>'update_time') ~ '^[0-9]+$'
          then to_timestamp((v_order->>'update_time')::double precision)
        else null
      end,
      now(),
      now()
    )
    on conflict (authorized_shop_id, external_order_id)
    do update set
      provider = excluded.provider,
      external_status = excluded.external_status,
      payment_currency = excluded.payment_currency,
      payment_subtotal = excluded.payment_subtotal,
      payment_shipping_fee = excluded.payment_shipping_fee,
      payment_original_shipping_fee =
        excluded.payment_original_shipping_fee,
      payment_seller_discount = excluded.payment_seller_discount,
      payment_platform_discount =
        excluded.payment_platform_discount,
      payment_total_amount = excluded.payment_total_amount,
      fulfillment_type = excluded.fulfillment_type,
      delivery_option_name = excluded.delivery_option_name,
      is_sample_order = excluded.is_sample_order,
      external_create_time = excluded.external_create_time,
      external_update_time = excluded.external_update_time,
      last_seen_at = now(),
      updated_at = now()
    returning id into v_external_order_row_id;

    delete from public.marketplace_external_order_items
    where external_order_id = v_external_order_row_id
      and organization_id = p_organization_id;

    for v_item in
      select value
      from jsonb_array_elements(
        coalesce(v_order->'line_items', '[]'::jsonb)
      )
    loop
      if length(
        btrim(coalesce(v_item->>'external_line_item_id', ''))
      ) = 0 then
        continue;
      end if;

      insert into public.marketplace_external_order_items (
        organization_id,
        external_order_id,
        external_line_item_id,
        external_product_id,
        product_name,
        external_sku_id,
        sku_name,
        seller_sku,
        quantity,
        original_price,
        sale_price,
        updated_at
      )
      values (
        p_organization_id,
        v_external_order_row_id,
        btrim(v_item->>'external_line_item_id'),
        nullif(btrim(coalesce(v_item->>'external_product_id', '')), ''),
        nullif(btrim(coalesce(v_item->>'product_name', '')), ''),
        nullif(btrim(coalesce(v_item->>'external_sku_id', '')), ''),
        nullif(btrim(coalesce(v_item->>'sku_name', '')), ''),
        nullif(btrim(coalesce(v_item->>'seller_sku', '')), ''),
        greatest(
          coalesce((v_item->>'quantity')::integer, 1),
          1
        ),
        case
          when coalesce(v_item->>'original_price', '') ~ '^[0-9]+(\.[0-9]+)?$'
            then (v_item->>'original_price')::numeric
          else null
        end,
        case
          when coalesce(v_item->>'sale_price', '') ~ '^[0-9]+(\.[0-9]+)?$'
            then (v_item->>'sale_price')::numeric
          else null
        end,
        now()
      );
    end loop;

    v_count := v_count + 1;
  end loop;

  update public.marketplace_accounts
  set
    last_synced_at = now(),
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'external_order_last_page_count', v_count,
        'external_order_total_count',
          greatest(coalesce(p_total_count, v_count), 0),
        'external_order_has_more', coalesce(p_has_more, false)
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
    'order',
    'external_order_page_sync',
    'success',
    format('Synced %s external marketplace order(s).', v_count),
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


create or replace function public.get_marketplace_external_orders(
  p_marketplace_account_id uuid,
  p_limit integer default 200
)
returns table (
  id uuid,
  external_order_id text,
  external_status text,
  payment_currency text,
  payment_subtotal numeric,
  payment_total_amount numeric,
  item_count bigint,
  external_create_time timestamptz,
  external_update_time timestamptz,
  last_seen_at timestamptz,
  linked_internal_order_id uuid
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    o.id,
    o.external_order_id,
    o.external_status,
    o.payment_currency,
    o.payment_subtotal,
    o.payment_total_amount,
    count(i.id)::bigint as item_count,
    o.external_create_time,
    o.external_update_time,
    o.last_seen_at,
    (
      select l.order_id
      from public.marketplace_order_links l
      where l.marketplace_account_id =
              o.marketplace_account_id
        and l.organization_id = o.organization_id
        and l.external_order_id = o.external_order_id
      order by l.created_at desc
      limit 1
    ) as linked_internal_order_id
  from public.marketplace_external_orders o
  left join public.marketplace_external_order_items i
    on i.external_order_id = o.id
   and i.organization_id = o.organization_id
  where o.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = o.organization_id
        and m.user_id = auth.uid()
    )
  group by
    o.id,
    o.external_order_id,
    o.external_status,
    o.payment_currency,
    o.payment_subtotal,
    o.payment_total_amount,
    o.external_create_time,
    o.external_update_time,
    o.last_seen_at,
    o.marketplace_account_id,
    o.organization_id
  order by
    o.external_update_time desc nulls last,
    o.last_seen_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$$;


revoke all on function public.get_marketplace_order_sync_context(
  uuid, uuid, uuid
) from public, anon, authenticated;

grant execute on function public.get_marketplace_order_sync_context(
  uuid, uuid, uuid
) to service_role;


revoke all on function public.upsert_marketplace_external_order_page(
  uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean
) from public, anon, authenticated;

grant execute on function public.upsert_marketplace_external_order_page(
  uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean
) to service_role;


revoke all on function public.get_marketplace_external_orders(
  uuid, integer
) from public, anon;

grant execute on function public.get_marketplace_external_orders(
  uuid, integer
) to authenticated;

commit;


-- Read-only verification
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'marketplace_external_orders',
    'marketplace_external_order_items'
  )
order by table_name;

select
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'get_marketplace_order_sync_context',
    'upsert_marketplace_external_order_page',
    'get_marketplace_external_orders'
  )
order by routine_name;
