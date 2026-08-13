-- AICommerceOS
-- Phase 5.8 Integration
-- Product Variant -> Order -> Inventory -> Performance
--
-- Applied and verified against the active Supabase database.
--
-- Integration model:
-- - base product: order_items.product_id + variant_id NULL
-- - variant: parent product_id + variant_id
-- - price/cost are server-side snapshots
-- - base stock uses products.stock
-- - variant stock uses product_variants.stock
-- - completed variant sales aggregate into parent product performance
-- - Phase 5.7 SECURITY DEFINER boundary is preserved

begin;

alter table public.order_items
add column variant_id uuid null;

alter table public.order_items
add constraint order_items_variant_id_fkey
foreign key (variant_id)
references public.product_variants(id)
on delete restrict;

create index order_items_variant_id_idx
on public.order_items (variant_id)
where variant_id is not null;


create or replace function public.create_order(
  p_organization_id uuid,
  p_customer_id uuid,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_order_id uuid;
  v_total numeric := 0;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_price numeric;
  v_cost_price numeric;
begin

  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(p_organization_id) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.customers
    where id = p_customer_id
      and organization_id = p_organization_id
  ) then
    raise exception
      'Customer not found in this organization'
      using errcode = 'P0001';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception
      'Order must contain at least one item'
      using errcode = 'P0001';
  end if;

  insert into public.orders (
    organization_id,
    customer_id,
    status,
    total,
    completed_at
  )
  values (
    p_organization_id,
    p_customer_id,
    'pending',
    0,
    null
  )
  returning id into v_order_id;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop

    if jsonb_typeof(v_item) <> 'object' then
      raise exception
        'Invalid order item payload'
        using errcode = 'P0001';
    end if;

    v_product_id := null;
    v_variant_id := null;
    v_quantity := null;
    v_price := null;
    v_cost_price := null;

    begin
      v_product_id :=
        nullif(v_item ->> 'product_id', '')::uuid;

      v_variant_id :=
        nullif(v_item ->> 'variant_id', '')::uuid;

      v_quantity :=
        (v_item ->> 'quantity')::integer;
    exception
      when invalid_text_representation then
        raise exception
          'Invalid product_id, variant_id, or quantity'
          using errcode = 'P0001';
    end;

    if v_product_id is null then
      raise exception
        'product_id is required'
        using errcode = 'P0001';
    end if;

    if v_quantity is null
       or v_quantity <= 0 then
      raise exception
        'Quantity must be greater than zero'
        using errcode = 'P0001';
    end if;

    if v_variant_id is null then

      select
        p.price,
        p.cost_price
      into
        v_price,
        v_cost_price
      from public.products p
      where p.id = v_product_id
        and p.organization_id = p_organization_id
        and p.status = 'active';

      if not found then
        raise exception
          'Active product not found in this organization'
          using errcode = 'P0001';
      end if;

    else

      select
        pv.price,
        pv.cost_price
      into
        v_price,
        v_cost_price
      from public.product_variants pv
      join public.products p
        on p.id = pv.product_id
       and p.organization_id = pv.organization_id
      where pv.id = v_variant_id
        and pv.product_id = v_product_id
        and pv.organization_id = p_organization_id
        and pv.status = 'active'
        and p.status = 'active';

      if not found then
        raise exception
          'Active product variant not found for this product and organization'
          using errcode = 'P0001';
      end if;

    end if;

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      price,
      cost_price_snapshot
    )
    values (
      v_order_id,
      v_product_id,
      v_variant_id,
      v_quantity,
      v_price,
      v_cost_price
    );

    v_total :=
      v_total + (v_price * v_quantity);

  end loop;

  update public.orders
  set total = v_total
  where id = v_order_id
    and organization_id = p_organization_id;

  return v_order_id;

end;
$function$;


create or replace function public.update_order_status(
  p_organization_id uuid,
  p_order_id uuid,
  p_new_status text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_current_status text;
  v_item record;
  v_remaining_stock integer;
begin

  if auth.uid() is null then
    raise exception
      'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(p_organization_id) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;

  if p_new_status not in (
    'processing',
    'completed',
    'cancelled'
  ) then
    raise exception
      'Invalid target order status'
      using errcode = 'P0001';
  end if;

  select status
  into v_current_status
  from public.orders
  where id = p_order_id
    and organization_id = p_organization_id
  for update;

  if not found then
    raise exception
      'Order not found in this organization'
      using errcode = 'P0001';
  end if;

  if v_current_status in ('completed', 'cancelled') then
    raise exception
      'Order is already in a terminal status'
      using errcode = 'P0001';
  end if;


  if v_current_status = 'pending'
     and p_new_status = 'processing' then

    perform set_config(
      'app.inventory_movement_type',
      'order_deduction',
      true
    );

    perform set_config(
      'app.inventory_reference_type',
      'order',
      true
    );

    perform set_config(
      'app.inventory_reference_id',
      p_order_id::text,
      true
    );

    perform set_config(
      'app.inventory_note',
      'Stock deducted when order entered processing',
      true
    );

    for v_item in
      select
        targets.target_type,
        targets.target_id,
        targets.quantity
      from (
        select
          'product'::text as target_type,
          oi.product_id as target_id,
          sum(oi.quantity)::integer as quantity
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.variant_id is null
        group by oi.product_id

        union all

        select
          'variant'::text,
          oi.variant_id,
          sum(oi.quantity)::integer
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.variant_id is not null
        group by oi.variant_id
      ) targets
      order by
        targets.target_type,
        targets.target_id
    loop

      if v_item.target_type = 'product' then

        update public.products
        set stock = stock - v_item.quantity
        where id = v_item.target_id
          and organization_id = p_organization_id
          and stock >= v_item.quantity
        returning stock into v_remaining_stock;

        if not found then
          raise exception
            'Insufficient stock or product unavailable for product %',
            v_item.target_id
            using errcode = 'P0001';
        end if;

      elsif v_item.target_type = 'variant' then

        update public.product_variants
        set stock = stock - v_item.quantity
        where id = v_item.target_id
          and organization_id = p_organization_id
          and stock >= v_item.quantity
        returning stock into v_remaining_stock;

        if not found then
          raise exception
            'Insufficient stock or variant unavailable for variant %',
            v_item.target_id
            using errcode = 'P0001';
        end if;

      end if;

    end loop;


  elsif v_current_status = 'pending'
        and p_new_status = 'cancelled' then

    null;


  elsif v_current_status = 'processing'
        and p_new_status = 'completed' then

    null;


  elsif v_current_status = 'processing'
        and p_new_status = 'cancelled' then

    perform set_config(
      'app.inventory_movement_type',
      'order_restore',
      true
    );

    perform set_config(
      'app.inventory_reference_type',
      'order',
      true
    );

    perform set_config(
      'app.inventory_reference_id',
      p_order_id::text,
      true
    );

    perform set_config(
      'app.inventory_note',
      'Stock restored when processing order was cancelled',
      true
    );

    for v_item in
      select
        targets.target_type,
        targets.target_id,
        targets.quantity
      from (
        select
          'product'::text as target_type,
          oi.product_id as target_id,
          sum(oi.quantity)::integer as quantity
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.variant_id is null
        group by oi.product_id

        union all

        select
          'variant'::text,
          oi.variant_id,
          sum(oi.quantity)::integer
        from public.order_items oi
        where oi.order_id = p_order_id
          and oi.variant_id is not null
        group by oi.variant_id
      ) targets
      order by
        targets.target_type,
        targets.target_id
    loop

      if v_item.target_type = 'product' then

        update public.products
        set stock = stock + v_item.quantity
        where id = v_item.target_id
          and organization_id = p_organization_id
        returning stock into v_remaining_stock;

        if not found then
          raise exception
            'Product integrity error for product %',
            v_item.target_id
            using errcode = 'P0001';
        end if;

      elsif v_item.target_type = 'variant' then

        update public.product_variants
        set stock = stock + v_item.quantity
        where id = v_item.target_id
          and organization_id = p_organization_id
        returning stock into v_remaining_stock;

        if not found then
          raise exception
            'Variant integrity error for variant %',
            v_item.target_id
            using errcode = 'P0001';
        end if;

      end if;

    end loop;

  else

    raise exception
      'Invalid order status transition: % -> %',
      v_current_status,
      p_new_status
      using errcode = 'P0001';

  end if;


  perform set_config(
    'app.inventory_movement_type',
    '',
    true
  );

  perform set_config(
    'app.inventory_reference_type',
    '',
    true
  );

  perform set_config(
    'app.inventory_reference_id',
    '',
    true
  );

  perform set_config(
    'app.inventory_note',
    '',
    true
  );


  update public.orders
  set
    status = p_new_status,
    completed_at =
      case
        when p_new_status = 'completed'
          then now()
        else null
      end
  where id = p_order_id
    and organization_id = p_organization_id;

  return p_new_status;

end;
$function$;


revoke all
on function public.create_order(uuid, uuid, jsonb)
from public, anon;

grant execute
on function public.create_order(uuid, uuid, jsonb)
to authenticated;


revoke all
on function public.update_order_status(uuid, uuid, text)
from public, anon;

grant execute
on function public.update_order_status(uuid, uuid, text)
to authenticated;

commit;
