-- AICommerceOS
-- Marketplace Connector M7 — Controlled External Order -> Internal Order Bridge
--
-- Permanent schema migration.
-- This migration intentionally COMMITs.
--
-- Core authority:
-- - internal orders are created only through public.create_order(...)
-- - bridge does NOT insert directly into public.orders or public.order_items
-- - internal order starts in pending state
-- - no stock deduction happens in this bridge
-- - later status transitions remain owned by public.update_order_status(...)
--
-- Privacy:
-- - marketplace recipient PII is still not persisted
-- - operator must select an existing AICommerceOS customer explicitly
--
-- Mapping:
-- - prefer one exact Variant mapping by marketplace_listings.external_sku = seller_sku
-- - otherwise use one exact Product mapping by external_listing_id = external_product_id
-- - ambiguous or missing mappings block the bridge

begin;


create or replace function public.get_marketplace_external_order_bridge_readiness(
  p_marketplace_account_id uuid
)
returns table (
  external_order_row_id uuid,
  external_order_id text,
  total_items bigint,
  mapped_items bigint,
  unmapped_items bigint,
  ambiguous_items bigint,
  linked_internal_order_id uuid,
  ready boolean
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with scoped_orders as (
    select
      o.id,
      o.organization_id,
      o.marketplace_account_id,
      o.external_order_id
    from public.marketplace_external_orders o
    where o.marketplace_account_id = p_marketplace_account_id
      and exists (
        select 1
        from public.organization_members m
        where m.organization_id = o.organization_id
          and m.user_id = auth.uid()
      )
  ),
  item_mapping as (
    select
      o.id as external_order_row_id,
      i.id as external_item_id,

      (
        select count(*)
        from public.marketplace_listings l
        where l.organization_id = o.organization_id
          and l.marketplace_account_id = o.marketplace_account_id
          and l.target_type = 'variant'
          and l.variant_id is not null
          and l.listing_status = 'active'
          and l.sync_enabled = true
          and i.seller_sku is not null
          and l.external_sku is not null
          and lower(btrim(l.external_sku)) =
              lower(btrim(i.seller_sku))
      ) as variant_match_count,

      (
        select count(*)
        from public.marketplace_listings l
        where l.organization_id = o.organization_id
          and l.marketplace_account_id = o.marketplace_account_id
          and l.target_type = 'product'
          and l.product_id is not null
          and l.listing_status = 'active'
          and l.sync_enabled = true
          and i.external_product_id is not null
          and l.external_listing_id is not null
          and btrim(l.external_listing_id) =
              btrim(i.external_product_id)
      ) as product_match_count

    from scoped_orders o
    join public.marketplace_external_order_items i
      on i.external_order_id = o.id
     and i.organization_id = o.organization_id
  ),
  aggregate_mapping as (
    select
      o.id as external_order_row_id,
      count(m.external_item_id)::bigint as total_items,

      count(m.external_item_id) filter (
        where
          m.variant_match_count = 1
          or (
            m.variant_match_count = 0
            and m.product_match_count = 1
          )
      )::bigint as mapped_items,

      count(m.external_item_id) filter (
        where
          m.variant_match_count = 0
          and m.product_match_count = 0
      )::bigint as unmapped_items,

      count(m.external_item_id) filter (
        where
          m.variant_match_count > 1
          or (
            m.variant_match_count = 0
            and m.product_match_count > 1
          )
      )::bigint as ambiguous_items

    from scoped_orders o
    left join item_mapping m
      on m.external_order_row_id = o.id
    group by o.id
  )
  select
    o.id,
    o.external_order_id,
    coalesce(a.total_items, 0)::bigint,
    coalesce(a.mapped_items, 0)::bigint,
    coalesce(a.unmapped_items, 0)::bigint,
    coalesce(a.ambiguous_items, 0)::bigint,

    (
      select l.order_id
      from public.marketplace_order_links l
      where l.organization_id = o.organization_id
        and l.marketplace_account_id =
            o.marketplace_account_id
        and l.external_order_id = o.external_order_id
      order by l.created_at desc
      limit 1
    ) as linked_internal_order_id,

    (
      coalesce(a.total_items, 0) > 0
      and coalesce(a.mapped_items, 0) =
          coalesce(a.total_items, 0)
      and coalesce(a.unmapped_items, 0) = 0
      and coalesce(a.ambiguous_items, 0) = 0
      and not exists (
        select 1
        from public.marketplace_order_links l
        where l.organization_id = o.organization_id
          and l.marketplace_account_id =
              o.marketplace_account_id
          and l.external_order_id = o.external_order_id
      )
    ) as ready

  from scoped_orders o
  left join aggregate_mapping a
    on a.external_order_row_id = o.id
  order by o.id;
$$;


create or replace function public.bridge_marketplace_external_order(
  p_external_order_row_id uuid,
  p_customer_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_external_order public.marketplace_external_orders%rowtype;
  v_item public.marketplace_external_order_items%rowtype;

  v_existing_order_id uuid;
  v_internal_order_id uuid;

  v_variant_match_count integer;
  v_product_match_count integer;

  v_product_id uuid;
  v_variant_id uuid;

  v_items jsonb := '[]'::jsonb;
  v_item_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select o.*
  into v_external_order
  from public.marketplace_external_orders o
  where o.id = p_external_order_row_id
  for update;

  if v_external_order.id is null then
    raise exception 'External marketplace order not found';
  end if;

  if not public.is_organization_member(
    v_external_order.organization_id
  ) then
    raise exception 'User is not a member of this organization'
      using errcode = '42501';
  end if;

  if v_external_order.is_sample_order then
    raise exception 'Sample marketplace orders cannot be bridged';
  end if;

  if not exists (
    select 1
    from public.customers c
    where c.id = p_customer_id
      and c.organization_id =
          v_external_order.organization_id
  ) then
    raise exception 'Customer not found in this organization';
  end if;

  select l.order_id
  into v_existing_order_id
  from public.marketplace_order_links l
  where l.organization_id =
        v_external_order.organization_id
    and l.marketplace_account_id =
        v_external_order.marketplace_account_id
    and l.external_order_id =
        v_external_order.external_order_id
  order by l.created_at desc
  limit 1;

  if v_existing_order_id is not null then
    return v_existing_order_id;
  end if;

  for v_item in
    select i.*
    from public.marketplace_external_order_items i
    where i.external_order_id = v_external_order.id
      and i.organization_id =
          v_external_order.organization_id
    order by i.created_at, i.id
  loop
    v_item_count := v_item_count + 1;

    v_product_id := null;
    v_variant_id := null;

    select
      count(*)::integer
    into v_variant_match_count
    from public.marketplace_listings l
    where l.organization_id =
          v_external_order.organization_id
      and l.marketplace_account_id =
          v_external_order.marketplace_account_id
      and l.target_type = 'variant'
      and l.variant_id is not null
      and l.listing_status = 'active'
      and l.sync_enabled = true
      and v_item.seller_sku is not null
      and l.external_sku is not null
      and lower(btrim(l.external_sku)) =
          lower(btrim(v_item.seller_sku));

    if v_variant_match_count > 1 then
      raise exception
        'Ambiguous variant mapping for external line item %',
        v_item.external_line_item_id;
    end if;

    if v_variant_match_count = 1 then
      select
        pv.product_id,
        l.variant_id
      into
        v_product_id,
        v_variant_id
      from public.marketplace_listings l
      join public.product_variants pv
        on pv.id = l.variant_id
       and pv.organization_id = l.organization_id
      where l.organization_id =
            v_external_order.organization_id
        and l.marketplace_account_id =
            v_external_order.marketplace_account_id
        and l.target_type = 'variant'
        and l.variant_id is not null
        and l.listing_status = 'active'
        and l.sync_enabled = true
        and v_item.seller_sku is not null
        and l.external_sku is not null
        and lower(btrim(l.external_sku)) =
            lower(btrim(v_item.seller_sku))
      limit 1;

    else
      select
        count(*)::integer
      into v_product_match_count
      from public.marketplace_listings l
      where l.organization_id =
            v_external_order.organization_id
        and l.marketplace_account_id =
            v_external_order.marketplace_account_id
        and l.target_type = 'product'
        and l.product_id is not null
        and l.listing_status = 'active'
        and l.sync_enabled = true
        and v_item.external_product_id is not null
        and l.external_listing_id is not null
        and btrim(l.external_listing_id) =
            btrim(v_item.external_product_id);

      if v_product_match_count > 1 then
        raise exception
          'Ambiguous product mapping for external line item %',
          v_item.external_line_item_id;
      end if;

      if v_product_match_count = 1 then
        select l.product_id
        into v_product_id
        from public.marketplace_listings l
        where l.organization_id =
              v_external_order.organization_id
          and l.marketplace_account_id =
              v_external_order.marketplace_account_id
          and l.target_type = 'product'
          and l.product_id is not null
          and l.listing_status = 'active'
          and l.sync_enabled = true
          and v_item.external_product_id is not null
          and l.external_listing_id is not null
          and btrim(l.external_listing_id) =
              btrim(v_item.external_product_id)
        limit 1;
      end if;
    end if;

    if v_product_id is null then
      raise exception
        'No active marketplace listing mapping for external line item %',
        v_item.external_line_item_id;
    end if;

    v_items :=
      v_items ||
      jsonb_build_array(
        jsonb_strip_nulls(
          jsonb_build_object(
            'product_id', v_product_id,
            'variant_id', v_variant_id,
            'quantity', v_item.quantity
          )
        )
      );
  end loop;

  if v_item_count = 0 then
    raise exception 'External marketplace order has no line items';
  end if;

  -- Existing commerce authority. This function validates tenant/customer/items,
  -- snapshots internal server-side price/cost, and creates a pending order.
  v_internal_order_id :=
    public.create_order(
      v_external_order.organization_id,
      p_customer_id,
      v_items
    );

  insert into public.marketplace_order_links (
    organization_id,
    marketplace_account_id,
    order_id,
    external_order_id,
    external_status,
    last_synced_at,
    metadata
  )
  values (
    v_external_order.organization_id,
    v_external_order.marketplace_account_id,
    v_internal_order_id,
    v_external_order.external_order_id,
    v_external_order.external_status,
    now(),
    jsonb_build_object(
      'source', 'controlled_external_order_bridge',
      'external_order_row_id', v_external_order.id,
      'external_payment_currency',
        v_external_order.payment_currency,
      'external_payment_total',
        v_external_order.payment_total_amount,
      'bridged_by', auth.uid()
    )
  );

  insert into public.marketplace_sync_logs (
    organization_id,
    marketplace_account_id,
    direction,
    entity_type,
    operation,
    status,
    entity_id,
    external_id,
    message,
    metadata
  )
  values (
    v_external_order.organization_id,
    v_external_order.marketplace_account_id,
    'inbound',
    'order',
    'controlled_order_bridge',
    'success',
    v_internal_order_id,
    v_external_order.external_order_id,
    'External marketplace order bridged to a pending internal order.',
    jsonb_build_object(
      'customer_id', p_customer_id,
      'external_order_row_id', v_external_order.id,
      'item_count', v_item_count
    )
  );

  return v_internal_order_id;
end;
$$;


revoke all on function public.get_marketplace_external_order_bridge_readiness(
  uuid
) from public, anon;

grant execute on function public.get_marketplace_external_order_bridge_readiness(
  uuid
) to authenticated;


revoke all on function public.bridge_marketplace_external_order(
  uuid,
  uuid
) from public, anon;

grant execute on function public.bridge_marketplace_external_order(
  uuid,
  uuid
) to authenticated;

commit;


-- Read-only verification
select
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'bridge_marketplace_external_order',
    'get_marketplace_external_order_bridge_readiness'
  )
order by routine_name;
