-- AICommerceOS
-- Marketplace Connector M8 — Controlled Order Status Reconciliation
--
-- Permanent schema migration.
-- This migration intentionally COMMITs.
--
-- Authority:
-- - external marketplace order mirror remains source of marketplace truth
-- - human approval is required before any internal status transition
-- - internal transition is executed only through public.update_order_status(...)
-- - this migration never updates products/product_variants stock directly
--
-- Conservative mapping:
-- - UNPAID / ON_HOLD -> no internal transition
-- - AWAITING_SHIPMENT / PARTIALLY_SHIPPING /
--   AWAITING_COLLECTION / IN_TRANSIT / DELIVERED
--     pending -> processing
--     processing -> no action
-- - COMPLETED
--     pending -> processing first
--     processing -> completed
-- - CANCEL / CANCELLED
--     pending|processing -> cancelled
--
-- DELIVERED intentionally remains processing until TikTok reports COMPLETED.
-- This avoids making the internal order terminal before the marketplace order
-- reaches its final completed state.

begin;


create or replace function public.get_marketplace_order_status_reconciliation(
  p_marketplace_account_id uuid
)
returns table (
  external_order_row_id uuid,
  external_order_id text,
  external_status text,
  internal_order_id uuid,
  internal_status text,
  proposed_status text,
  action_required boolean,
  reason text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with scoped as (
    select
      eo.id as external_order_row_id,
      eo.external_order_id,
      upper(btrim(eo.external_status)) as external_status,
      l.order_id as internal_order_id,
      o.status as internal_status
    from public.marketplace_external_orders eo
    join public.marketplace_order_links l
      on l.organization_id = eo.organization_id
     and l.marketplace_account_id =
         eo.marketplace_account_id
     and l.external_order_id = eo.external_order_id
    join public.orders o
      on o.id = l.order_id
     and o.organization_id = eo.organization_id
    where eo.marketplace_account_id =
          p_marketplace_account_id
      and exists (
        select 1
        from public.organization_members m
        where m.organization_id = eo.organization_id
          and m.user_id = auth.uid()
      )
  ),
  proposal as (
    select
      s.*,
      case
        when s.internal_status in ('completed', 'cancelled')
          then null

        when s.external_status in (
          'UNPAID',
          'ON_HOLD'
        )
          then null

        when s.external_status in (
          'AWAITING_SHIPMENT',
          'PARTIALLY_SHIPPING',
          'AWAITING_COLLECTION',
          'IN_TRANSIT',
          'DELIVERED'
        )
        and s.internal_status = 'pending'
          then 'processing'

        when s.external_status = 'COMPLETED'
        and s.internal_status = 'pending'
          then 'processing'

        when s.external_status = 'COMPLETED'
        and s.internal_status = 'processing'
          then 'completed'

        when s.external_status in (
          'CANCEL',
          'CANCELLED'
        )
        and s.internal_status in (
          'pending',
          'processing'
        )
          then 'cancelled'

        else null
      end as proposed_status,

      case
        when s.internal_status = 'completed'
          then 'Internal order is already completed.'

        when s.internal_status = 'cancelled'
          then 'Internal order is already cancelled.'

        when s.external_status = 'UNPAID'
          then 'Marketplace order is still unpaid.'

        when s.external_status = 'ON_HOLD'
          then 'Marketplace order is still inside the hold/remorse stage.'

        when s.external_status in (
          'AWAITING_SHIPMENT',
          'PARTIALLY_SHIPPING',
          'AWAITING_COLLECTION',
          'IN_TRANSIT'
        )
        and s.internal_status = 'pending'
          then 'Marketplace fulfillment started; approval will move the internal order to processing.'

        when s.external_status = 'DELIVERED'
        and s.internal_status = 'pending'
          then 'Marketplace order is delivered; approval first moves the internal order to processing. Completion waits for marketplace COMPLETED.'

        when s.external_status in (
          'AWAITING_SHIPMENT',
          'PARTIALLY_SHIPPING',
          'AWAITING_COLLECTION',
          'IN_TRANSIT',
          'DELIVERED'
        )
        and s.internal_status = 'processing'
          then 'Internal processing state is aligned; terminal completion waits for marketplace COMPLETED.'

        when s.external_status = 'COMPLETED'
        and s.internal_status = 'pending'
          then 'Marketplace is completed, but internal authority requires pending -> processing before processing -> completed.'

        when s.external_status = 'COMPLETED'
        and s.internal_status = 'processing'
          then 'Marketplace is completed; approval can complete the internal order.'

        when s.external_status in (
          'CANCEL',
          'CANCELLED'
        )
        and s.internal_status in (
          'pending',
          'processing'
        )
          then 'Marketplace is cancelled; approval can cancel the internal order through the protected status workflow.'

        else 'No supported reconciliation action for this status pair.'
      end as reason
    from scoped s
  )
  select
    external_order_row_id,
    external_order_id,
    external_status,
    internal_order_id,
    internal_status,
    proposed_status,
    proposed_status is not null as action_required,
    reason
  from proposal
  order by external_order_id;
$$;


create or replace function public.apply_marketplace_order_status_reconciliation(
  p_external_order_row_id uuid,
  p_expected_external_status text,
  p_expected_target_status text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_external_order public.marketplace_external_orders%rowtype;
  v_order_link public.marketplace_order_links%rowtype;
  v_internal_status text;
  v_external_status text;
  v_target_status text;
  v_result text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select eo.*
  into v_external_order
  from public.marketplace_external_orders eo
  where eo.id = p_external_order_row_id
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

  select l.*
  into v_order_link
  from public.marketplace_order_links l
  where l.organization_id =
        v_external_order.organization_id
    and l.marketplace_account_id =
        v_external_order.marketplace_account_id
    and l.external_order_id =
        v_external_order.external_order_id
  order by l.created_at desc
  limit 1
  for update;

  if v_order_link.id is null then
    raise exception 'External marketplace order is not linked to an internal order';
  end if;

  select o.status
  into v_internal_status
  from public.orders o
  where o.id = v_order_link.order_id
    and o.organization_id =
        v_external_order.organization_id
  for update;

  if v_internal_status is null then
    raise exception 'Linked internal order not found';
  end if;

  v_external_status :=
    upper(btrim(v_external_order.external_status));

  if v_external_status <>
     upper(btrim(coalesce(p_expected_external_status, ''))) then
    raise exception
      'Marketplace order status changed. Refresh before approving reconciliation.';
  end if;

  v_target_status :=
    case
      when v_internal_status in ('completed', 'cancelled')
        then null

      when v_external_status in (
        'UNPAID',
        'ON_HOLD'
      )
        then null

      when v_external_status in (
        'AWAITING_SHIPMENT',
        'PARTIALLY_SHIPPING',
        'AWAITING_COLLECTION',
        'IN_TRANSIT',
        'DELIVERED'
      )
      and v_internal_status = 'pending'
        then 'processing'

      when v_external_status = 'COMPLETED'
      and v_internal_status = 'pending'
        then 'processing'

      when v_external_status = 'COMPLETED'
      and v_internal_status = 'processing'
        then 'completed'

      when v_external_status in (
        'CANCEL',
        'CANCELLED'
      )
      and v_internal_status in (
        'pending',
        'processing'
      )
        then 'cancelled'

      else null
    end;

  if v_target_status is null then
    raise exception
      'No supported reconciliation action for marketplace status % and internal status %',
      v_external_status,
      v_internal_status;
  end if;

  if v_target_status <>
     lower(btrim(coalesce(p_expected_target_status, ''))) then
    raise exception
      'Reconciliation proposal changed. Refresh before approving reconciliation.';
  end if;

  -- Existing commerce authority:
  -- pending -> processing deducts stock
  -- pending -> cancelled does not deduct stock
  -- processing -> completed keeps stock deducted
  -- processing -> cancelled restores stock
  v_result :=
    public.update_order_status(
      v_external_order.organization_id,
      v_order_link.order_id,
      v_target_status
    );

  update public.marketplace_order_links
  set
    external_status = v_external_order.external_status,
    last_synced_at = now(),
    updated_at = now(),
    metadata =
      coalesce(metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'last_status_reconciliation',
        jsonb_build_object(
          'external_order_row_id', v_external_order.id,
          'external_status', v_external_status,
          'internal_status_before', v_internal_status,
          'internal_status_after', v_result,
          'approved_by', auth.uid(),
          'approved_at', now()
        )
      )
  where id = v_order_link.id;

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
    'controlled_status_reconciliation',
    'success',
    v_order_link.order_id,
    v_external_order.external_order_id,
    format(
      'Approved marketplace status reconciliation: %s -> %s.',
      v_internal_status,
      v_result
    ),
    jsonb_build_object(
      'external_order_row_id', v_external_order.id,
      'external_status', v_external_status,
      'internal_status_before', v_internal_status,
      'internal_status_after', v_result,
      'approved_by', auth.uid()
    )
  );

  return v_result;
end;
$$;


revoke all on function public.get_marketplace_order_status_reconciliation(
  uuid
) from public, anon;

grant execute on function public.get_marketplace_order_status_reconciliation(
  uuid
) to authenticated;


revoke all on function public.apply_marketplace_order_status_reconciliation(
  uuid,
  text,
  text
) from public, anon;

grant execute on function public.apply_marketplace_order_status_reconciliation(
  uuid,
  text,
  text
) to authenticated;

commit;


-- Read-only verification
select
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'apply_marketplace_order_status_reconciliation',
    'get_marketplace_order_status_reconciliation'
  )
order by routine_name;
