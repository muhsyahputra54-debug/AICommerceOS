-- AICommerceOS
-- Phase 9E — Guarded Organization Test Fixture Cleanup
--
-- Official migration candidate.
-- Not yet applied to the active Supabase database.
--
-- Target:
--   Organization:
--     dc1aa81d-b96d-4f87-974e-eb0b7829fe02
--     RLS Isolation Test Organization
--
--   Product:
--     30fd5ee9-d701-46f3-9bc6-ae96ae0478f6
--     Cross Organization Secret Product
--
--   Inventory movement:
--     ecb38f0f-18a9-42bd-9263-37e84e474e69
--
--   Internal subscription:
--     29cc1fc4-4303-4756-951b-c999a7977233
--
-- Safety model:
-- - exact UUID guards
-- - exact record-signature guards
-- - zero-membership guard
-- - exact 45 organization incoming-FK topology
-- - exact 10 product incoming-FK topology
-- - zero unexpected product references
-- - explicit child deletion
-- - no reliance on organization ON DELETE CASCADE
-- - fail closed if database topology or fixture data changes
--
-- This migration intentionally does NOT alter security functions,
-- RLS policies, application organization logic, or billing logic.

begin;


do $cleanup$
declare

  target_organization_id constant uuid :=
    'dc1aa81d-b96d-4f87-974e-eb0b7829fe02';

  target_product_id constant uuid :=
    '30fd5ee9-d701-46f3-9bc6-ae96ae0478f6';

  target_inventory_movement_id constant uuid :=
    'ecb38f0f-18a9-42bd-9263-37e84e474e69';

  target_subscription_id constant uuid :=
    '29cc1fc4-4303-4756-951b-c999a7977233';

  actual_count bigint;
  expected_count bigint;

  incoming_organization_fk_count bigint;
  supported_organization_fk_count bigint;

  incoming_product_fk_count bigint;

  deleted_count bigint;

  fk record;

begin


  -- ==========================================================
  -- 1. EXACT ORGANIZATION SIGNATURE
  -- ==========================================================

  select count(*)
  into actual_count
  from public.organizations
  where
    id = target_organization_id
    and name = 'RLS Isolation Test Organization'
    and created_at =
      '2026-08-08 15:05:55.620772+00'::timestamptz;

  if actual_count <> 1 then
    raise exception
      'STOP: exact test organization signature changed';
  end if;


  -- ==========================================================
  -- 2. ZERO MEMBERSHIP GUARD
  -- ==========================================================

  select count(*)
  into actual_count
  from public.organization_members
  where organization_id = target_organization_id;

  if actual_count <> 0 then
    raise exception
      'STOP: test organization now has membership';
  end if;


  -- ==========================================================
  -- 3. EXACT PRODUCT SIGNATURE
  -- ==========================================================

  select count(*)
  into actual_count
  from public.products
  where
    id = target_product_id
    and organization_id = target_organization_id
    and name = 'Cross Organization Secret Product'
    and description =
      'Product belonging to Organization B for RLS isolation testing'
    and price = 99999
    and stock = 99
    and status = 'active';

  if actual_count <> 1 then
    raise exception
      'STOP: exact RLS test product signature changed';
  end if;


  select count(*)
  into actual_count
  from public.products
  where organization_id = target_organization_id;

  if actual_count <> 1 then
    raise exception
      'STOP: unexpected product count for test organization';
  end if;


  -- ==========================================================
  -- 4. EXACT INVENTORY FIXTURE SIGNATURE
  -- ==========================================================

  select count(*)
  into actual_count
  from public.inventory_movements
  where
    id = target_inventory_movement_id
    and organization_id = target_organization_id
    and product_id = target_product_id
    and target_type = 'product'
    and movement_type = 'opening'
    and quantity_delta = 99
    and stock_before = 0
    and stock_after = 99
    and reference_type = 'migration'
    and reference_id is null
    and created_by is null
    and note = 'Phase 5.3 opening inventory balance';

  if actual_count <> 1 then
    raise exception
      'STOP: exact inventory fixture signature changed';
  end if;


  select count(*)
  into actual_count
  from public.inventory_movements
  where organization_id = target_organization_id;

  if actual_count <> 1 then
    raise exception
      'STOP: unexpected inventory movement count';
  end if;


  -- ==========================================================
  -- 5. EXACT SUBSCRIPTION FIXTURE SIGNATURE
  -- ==========================================================

  select count(*)
  into actual_count
  from public.organization_subscriptions
  where
    id = target_subscription_id
    and organization_id = target_organization_id
    and provider = 'internal'
    and provider_customer_id is null
    and provider_subscription_id is null
    and status = 'active';

  if actual_count <> 1 then
    raise exception
      'STOP: exact subscription fixture signature changed';
  end if;


  select count(*)
  into actual_count
  from public.organization_subscriptions
  where organization_id = target_organization_id;

  if actual_count <> 1 then
    raise exception
      'STOP: unexpected subscription count';
  end if;


  -- ==========================================================
  -- 6. ORGANIZATION FK TOPOLOGY GUARD
  -- ==========================================================
  --
  -- Prior read-only audit established exactly 45 direct FKs
  -- pointing to public.organizations.
  --
  -- Abort if schema topology changes before this migration runs.
  -- ==========================================================

  select count(*)
  into incoming_organization_fk_count
  from pg_constraint con
  join pg_class parent
    on parent.oid = con.confrelid
  join pg_namespace parent_ns
    on parent_ns.oid = parent.relnamespace
  where
    con.contype = 'f'
    and parent_ns.nspname = 'public'
    and parent.relname = 'organizations';

  if incoming_organization_fk_count <> 45 then
    raise exception
      'STOP: organizations incoming FK topology changed: expected 45, found %',
      incoming_organization_fk_count;
  end if;


  -- Every currently audited organization FK is expected to be a
  -- single-column FK to organizations.id. Fail if this changes.

  select count(*)
  into supported_organization_fk_count
  from pg_constraint con
  join pg_class parent
    on parent.oid = con.confrelid
  join pg_namespace parent_ns
    on parent_ns.oid = parent.relnamespace
  join pg_attribute parent_att
    on parent_att.attrelid = parent.oid
   and parent_att.attnum = con.confkey[1]
  where
    con.contype = 'f'
    and parent_ns.nspname = 'public'
    and parent.relname = 'organizations'
    and array_length(con.conkey, 1) = 1
    and array_length(con.confkey, 1) = 1
    and parent_att.attname = 'id';

  if supported_organization_fk_count <>
     incoming_organization_fk_count then
    raise exception
      'STOP: unsupported organization FK shape detected';
  end if;


  -- ==========================================================
  -- 7. EXACT ORGANIZATION REFERENCE GUARD ACROSS ALL 45 FKs
  -- ==========================================================
  --
  -- Allowed references:
  --
  -- products                   = 1
  -- inventory_movements        = 1
  -- organization_subscriptions = 1
  --
  -- Every other organization FK must resolve to zero rows.
  -- ==========================================================

  for fk in

    select
      child_ns.nspname as child_schema,
      child.relname as child_table,
      child_att.attname as child_column

    from pg_constraint con

    join pg_class child
      on child.oid = con.conrelid

    join pg_namespace child_ns
      on child_ns.oid = child.relnamespace

    join pg_class parent
      on parent.oid = con.confrelid

    join pg_namespace parent_ns
      on parent_ns.oid = parent.relnamespace

    join pg_attribute child_att
      on child_att.attrelid = child.oid
     and child_att.attnum = con.conkey[1]

    join pg_attribute parent_att
      on parent_att.attrelid = parent.oid
     and parent_att.attnum = con.confkey[1]

    where
      con.contype = 'f'
      and parent_ns.nspname = 'public'
      and parent.relname = 'organizations'
      and array_length(con.conkey, 1) = 1
      and array_length(con.confkey, 1) = 1
      and parent_att.attname = 'id'

    order by
      child_ns.nspname,
      child.relname,
      con.conname

  loop

    execute format(
      'select count(*) from %I.%I where %I = $1',
      fk.child_schema,
      fk.child_table,
      fk.child_column
    )
    into actual_count
    using target_organization_id;


    expected_count :=
      case fk.child_table

        when 'products'
          then 1

        when 'inventory_movements'
          then 1

        when 'organization_subscriptions'
          then 1

        else 0

      end;


    if actual_count <> expected_count then

      raise exception
        'STOP: unexpected organization reference in %.%: expected %, found %',
        fk.child_schema,
        fk.child_table,
        expected_count,
        actual_count;

    end if;

  end loop;


  -- ==========================================================
  -- 8. PRODUCT FK TOPOLOGY GUARD
  -- ==========================================================

  select count(*)
  into incoming_product_fk_count
  from pg_constraint con
  join pg_class parent
    on parent.oid = con.confrelid
  join pg_namespace parent_ns
    on parent_ns.oid = parent.relnamespace
  where
    con.contype = 'f'
    and parent_ns.nspname = 'public'
    and parent.relname = 'products';

  if incoming_product_fk_count <> 10 then
    raise exception
      'STOP: product incoming FK topology changed: expected 10, found %',
      incoming_product_fk_count;
  end if;


  -- ==========================================================
  -- 9. EXACT PRODUCT REFERENCE GUARDS
  -- ==========================================================

  select count(*)
  into actual_count
  from public.automation_actions
  where
    product_id = target_product_id
    and organization_id = target_organization_id;

  if actual_count <> 0 then
    raise exception
      'STOP: unexpected automation_actions product reference';
  end if;


  select count(*)
  into actual_count
  from public.inventory_movements
  where product_id = target_product_id;

  if actual_count <> 1 then
    raise exception
      'STOP: expected exactly one inventory product reference';
  end if;


  select count(*)
  into actual_count
  from public.marketplace_listings
  where
    product_id = target_product_id
    and organization_id = target_organization_id;

  if actual_count <> 0 then
    raise exception
      'STOP: unexpected marketplace_listings product reference';
  end if;


  -- CRITICAL: product FK uses ON DELETE RESTRICT.

  select count(*)
  into actual_count
  from public.order_items
  where product_id = target_product_id;

  if actual_count <> 0 then
    raise exception
      'STOP: order_items RESTRICT reference exists';
  end if;


  select count(*)
  into actual_count
  from public.price_monitor_targets
  where
    product_id = target_product_id
    and organization_id = target_organization_id;

  if actual_count <> 0 then
    raise exception
      'STOP: unexpected price_monitor_targets product reference';
  end if;


  select count(*)
  into actual_count
  from public.product_description_generations
  where
    product_id = target_product_id
    and organization_id = target_organization_id;

  if actual_count <> 0 then
    raise exception
      'STOP: unexpected product_description_generations reference';
  end if;


  select count(*)
  into actual_count
  from public.product_images
  where
    product_id = target_product_id
    and organization_id = target_organization_id;

  if actual_count <> 0 then
    raise exception
      'STOP: unexpected product_images reference';
  end if;


  select count(*)
  into actual_count
  from public.product_research_items
  where
    linked_product_id = target_product_id
    and organization_id = target_organization_id;

  if actual_count <> 0 then
    raise exception
      'STOP: unexpected product_research_items reference';
  end if;


  select count(*)
  into actual_count
  from public.product_variants
  where
    product_id = target_product_id
    and organization_id = target_organization_id;

  if actual_count <> 0 then
    raise exception
      'STOP: unexpected product_variants reference';
  end if;


  select count(*)
  into actual_count
  from public.supplier_items
  where
    product_id = target_product_id
    and organization_id = target_organization_id;

  if actual_count <> 0 then
    raise exception
      'STOP: unexpected supplier_items product reference';
  end if;


  -- ==========================================================
  -- 10. NO INCOMING FK TO THE TWO OTHER CHILD FIXTURES
  -- ==========================================================

  select count(*)
  into actual_count
  from pg_constraint con
  join pg_class parent
    on parent.oid = con.confrelid
  join pg_namespace parent_ns
    on parent_ns.oid = parent.relnamespace
  where
    con.contype = 'f'
    and parent_ns.nspname = 'public'
    and parent.relname in (
      'inventory_movements',
      'organization_subscriptions'
    );

  if actual_count <> 0 then
    raise exception
      'STOP: incoming FK added to inventory/subscription fixture tables';
  end if;


  -- ==========================================================
  -- 11. DELETE EXACT FIXTURE CHILD ROWS
  -- ==========================================================
  --
  -- Explicit deletion avoids relying on organization cascades.
  -- ==========================================================

  delete from public.inventory_movements
  where
    id = target_inventory_movement_id
    and organization_id = target_organization_id
    and product_id = target_product_id;

  get diagnostics deleted_count = row_count;

  if deleted_count <> 1 then
    raise exception
      'STOP: inventory fixture delete affected % rows',
      deleted_count;
  end if;


  delete from public.organization_subscriptions
  where
    id = target_subscription_id
    and organization_id = target_organization_id;

  get diagnostics deleted_count = row_count;

  if deleted_count <> 1 then
    raise exception
      'STOP: subscription fixture delete affected % rows',
      deleted_count;
  end if;


  -- ==========================================================
  -- 12. DELETE EXACT PRODUCT
  -- ==========================================================

  delete from public.products
  where
    id = target_product_id
    and organization_id = target_organization_id
    and name = 'Cross Organization Secret Product';

  get diagnostics deleted_count = row_count;

  if deleted_count <> 1 then
    raise exception
      'STOP: product fixture delete affected % rows',
      deleted_count;
  end if;


  -- ==========================================================
  -- 13. DELETE EXACT ORGANIZATION
  -- ==========================================================

  delete from public.organizations
  where
    id = target_organization_id
    and name = 'RLS Isolation Test Organization';

  get diagnostics deleted_count = row_count;

  if deleted_count <> 1 then
    raise exception
      'STOP: organization fixture delete affected % rows',
      deleted_count;
  end if;


  -- ==========================================================
  -- 14. POST-CONDITIONS
  -- ==========================================================

  if exists (
    select 1
    from public.organizations
    where id = target_organization_id
  ) then
    raise exception
      'STOP: organization remains after cleanup';
  end if;


  if exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
  ) then
    raise exception
      'STOP: organization membership remains after cleanup';
  end if;


  if exists (
    select 1
    from public.products
    where id = target_product_id
       or organization_id = target_organization_id
  ) then
    raise exception
      'STOP: product fixture remains after cleanup';
  end if;


  if exists (
    select 1
    from public.inventory_movements
    where id = target_inventory_movement_id
       or organization_id = target_organization_id
  ) then
    raise exception
      'STOP: inventory fixture remains after cleanup';
  end if;


  if exists (
    select 1
    from public.organization_subscriptions
    where id = target_subscription_id
       or organization_id = target_organization_id
  ) then
    raise exception
      'STOP: subscription fixture remains after cleanup';
  end if;


  raise notice
    'LAKUVO Phase 9E guarded test-fixture cleanup completed';

end
$cleanup$;


commit;