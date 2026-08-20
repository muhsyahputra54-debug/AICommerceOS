-- AICommerceOS
-- Phase 17.2 ? Controlled AI Action: Product Name
--
-- Additive expansion of Phase 17.
--
-- Existing production-tested action:
--   product.update_description
--
-- New action:
--   product.update_name
--
-- Safety:
-- - existing description proposal RPC remains unchanged
-- - existing description executor remains unchanged
-- - existing confirm RPC is reused
-- - product name gets its own proposal and executor RPC
-- - owner/admin only
-- - same requester throughout lifecycle
-- - explicit confirmation remains required
-- - exact optimistic compare-and-set
-- - idempotent proposal/replay
-- - stale target performs zero product mutation
-- - no price/stock/inventory/order/billing/automation mutation
-- - no direct controlled-action table grant

begin;

-- ============================================================
-- PRECONDITIONS
-- ============================================================

do $$
begin
  if to_regclass(
    'public.ai_controlled_actions'
  ) is null then
    raise exception
      'ai_controlled_actions table is required';
  end if;

  if to_regprocedure(
    'public.confirm_ai_controlled_action(uuid)'
  ) is null then
    raise exception
      'confirm_ai_controlled_action(uuid) is required';
  end if;

  if to_regprocedure(
    'public.execute_ai_controlled_action(uuid)'
  ) is null then
    raise exception
      'existing description executor is required';
  end if;

  if to_regprocedure(
    'public.propose_ai_controlled_product_description_action(uuid,uuid,text,text,text)'
  ) is null then
    raise exception
      'existing description proposal RPC is required';
  end if;

  if to_regprocedure(
    'public.propose_ai_controlled_product_name_action(uuid,uuid,text,text,text)'
  ) is not null then
    raise exception
      'product name proposal RPC already exists';
  end if;

  if to_regprocedure(
    'public.execute_ai_controlled_product_name_action(uuid)'
  ) is not null then
    raise exception
      'product name executor RPC already exists';
  end if;
end;
$$;

-- ============================================================
-- ADDITIVE GENERIC SNAPSHOT STORAGE
-- ============================================================

alter table public.ai_controlled_actions
  add column mutation_field text,
  add column expected_value text,
  add column proposed_value text;

-- product.update_name stores its payload in the new generic
-- snapshot columns. Description actions retain their existing
-- expected_description / proposed_description storage.
alter table public.ai_controlled_actions
  alter column proposed_description
  drop not null;

alter table public.ai_controlled_actions
  drop constraint
    ai_controlled_actions_action_type_check;

alter table public.ai_controlled_actions
  add constraint
    ai_controlled_actions_action_type_check
  check (
    action_type in (
      'product.update_description',
      'product.update_name'
    )
  );

alter table public.ai_controlled_actions
  add constraint
    ai_controlled_actions_description_payload_check
  check (
    action_type <> 'product.update_description'
    or (
      -- Preserve the original Phase 17 description invariant
      -- after proposed_description becomes nullable for
      -- additive controlled-action types.
      proposed_description is not null

      -- Description actions continue using only the original
      -- description snapshot columns.
      and mutation_field is null
      and expected_value is null
      and proposed_value is null
    )
  );

alter table public.ai_controlled_actions
  add constraint
    ai_controlled_actions_product_name_payload_check
  check (
    action_type <> 'product.update_name'
    or (
      mutation_field = 'name'
      and expected_value is not null
      and proposed_value is not null

      and proposed_value =
        btrim(proposed_value)

      and length(proposed_value) > 0

      and expected_value
        is distinct from
        proposed_value

      -- Do not overload legacy description columns.
      and expected_description is null
      and proposed_description is null
    )
  );

-- ============================================================
-- PRODUCT NAME PROPOSAL
-- ============================================================

create function
public.propose_ai_controlled_product_name_action(
  p_organization_id uuid,
  p_product_id uuid,
  p_expected_name text,
  p_proposed_name text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid;
  v_role text;

  v_key text;
  v_proposed_name text;
  v_current_name text;

  v_existing
    public.ai_controlled_actions%rowtype;

  v_action_id uuid;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  if p_product_id is null then
    raise exception
      'product_id is required';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      p_organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  v_key :=
    btrim(
      coalesce(
        p_idempotency_key,
        ''
      )
    );

  if length(v_key) = 0 then
    raise exception
      'idempotency key is required';
  end if;

  v_proposed_name :=
    btrim(
      coalesce(
        p_proposed_name,
        ''
      )
    );

  if length(v_proposed_name) = 0 then
    raise exception
      'proposed product name is required';
  end if;

  -- ----------------------------------------------------------
  -- IDEMPOTENT REPLAY BEFORE CURRENT-TARGET VALIDATION
  -- ----------------------------------------------------------

  select
    a.*
  into
    v_existing
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.idempotency_key =
      v_key;

  if found then
    if
      v_existing.requested_by
        is distinct from
        v_user_id

      or v_existing.action_type
        <> 'product.update_name'

      or v_existing.target_resource
        <> 'product'

      or v_existing.target_id
        is distinct from
        p_product_id

      or v_existing.mutation_field
        <> 'name'

      or v_existing.expected_value
        is distinct from
        p_expected_name

      or v_existing.proposed_value
        is distinct from
        v_proposed_name
    then
      raise exception
        'idempotency key conflict';
    end if;

    return jsonb_build_object(
      'action_id',
      v_existing.id
    );
  end if;

  -- ----------------------------------------------------------
  -- AUTHORITATIVE CURRENT PRODUCT SNAPSHOT
  -- ----------------------------------------------------------

  select
    p.name
  into
    v_current_name
  from public.products p
  where
    p.id =
      p_product_id
    and p.organization_id =
      p_organization_id;

  if not found then
    raise exception
      'Product not found';
  end if;

  if
    v_current_name
      is distinct from
      p_expected_name
  then
    raise exception
      'Product name changed before proposal creation';
  end if;

  if
    v_current_name
      is not distinct from
      v_proposed_name
  then
    raise exception
      'proposed product name does not change the current name';
  end if;

  -- ----------------------------------------------------------
  -- CREATE PROPOSAL
  -- ----------------------------------------------------------

  insert into public.ai_controlled_actions (
    contract_version,
    organization_id,
    requested_by,

    action_type,
    status,

    target_resource,
    target_id,

    mutation_field,
    expected_value,
    proposed_value,

    idempotency_key
  )
  values (
    1,
    p_organization_id,
    v_user_id,

    'product.update_name',
    'proposed',

    'product',
    p_product_id,

    'name',
    p_expected_name,
    v_proposed_name,

    v_key
  )
  on conflict (
    organization_id,
    idempotency_key
  )
  do nothing
  returning id
  into v_action_id;

  if v_action_id is not null then
    return jsonb_build_object(
      'action_id',
      v_action_id
    );
  end if;

  -- Concurrent request may have won the unique-key race.
  select
    a.*
  into
    v_existing
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.idempotency_key =
      v_key;

  if not found then
    raise exception
      'controlled action proposal could not be created';
  end if;

  if
    v_existing.requested_by
      is distinct from
      v_user_id

    or v_existing.action_type
      <> 'product.update_name'

    or v_existing.target_resource
      <> 'product'

    or v_existing.target_id
      is distinct from
      p_product_id

    or v_existing.mutation_field
      <> 'name'

    or v_existing.expected_value
      is distinct from
      p_expected_name

    or v_existing.proposed_value
      is distinct from
      v_proposed_name
  then
    raise exception
      'idempotency key conflict';
  end if;

  return jsonb_build_object(
    'action_id',
    v_existing.id
  );
end;
$function$;

-- ============================================================
-- PRODUCT NAME EXECUTOR
-- ============================================================

create function
public.execute_ai_controlled_product_name_action(
  p_action_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid;
  v_role text;

  v_action
    public.ai_controlled_actions%rowtype;

  v_affected integer;
  v_target_exists boolean;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if p_action_id is null then
    raise exception
      'action_id is required';
  end if;

  select
    a.*
  into
    v_action
  from public.ai_controlled_actions a
  where
    a.id =
      p_action_id
  for update;

  if not found then
    raise exception
      'Controlled action not found';
  end if;

  if
    v_action.action_type
      <> 'product.update_name'
    or v_action.target_resource
      <> 'product'
    or v_action.mutation_field
      <> 'name'
  then
    raise exception
      'Action is not a product name action';
  end if;

  if
    v_action.requested_by
      is distinct from
      v_user_id
  then
    raise exception
      'Controlled action requester mismatch';
  end if;

  select
    m.role
  into
    v_role
  from public.organization_members m
  where
    m.organization_id =
      v_action.organization_id
    and m.user_id =
      v_user_id
  limit 1;

  if
    v_role is null
    or v_role not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin';
  end if;

  -- Terminal states are replay-safe.
  if v_action.status in (
    'executed',
    'stale',
    'failed',
    'cancelled'
  ) then
    return jsonb_build_object(
      'action_id',
      v_action.id
    );
  end if;

  if v_action.status = 'executing' then
    raise exception
      'Controlled action is already executing';
  end if;

  if v_action.status <> 'confirmed' then
    raise exception
      'Controlled action must be confirmed before execution';
  end if;

  if
    v_action.confirmed_by
      is distinct from
      v_user_id
  then
    raise exception
      'Controlled action confirmation requester mismatch';
  end if;

  -- ----------------------------------------------------------
  -- EXECUTION AUDIT START
  -- ----------------------------------------------------------

  update public.ai_controlled_actions
  set
    status =
      'executing',

    executed_by =
      v_user_id,

    execution_started_at =
      now(),

    finalized_at =
      null,

    error_message =
      null
  where id =
    v_action.id;

  -- ----------------------------------------------------------
  -- EXACT PRODUCT NAME COMPARE-AND-SET
  -- ----------------------------------------------------------

  update public.products
  set
    name =
      v_action.proposed_value
  where
    id =
      v_action.target_id

    and organization_id =
      v_action.organization_id

    and name
      is not distinct from
      v_action.expected_value;

  get diagnostics
    v_affected =
      row_count;

  if v_affected = 1 then
    update public.ai_controlled_actions
    set
      status =
        'executed',

      finalized_at =
        now(),

      error_message =
        null
    where id =
      v_action.id;

    return jsonb_build_object(
      'action_id',
      v_action.id
    );
  end if;

  -- ----------------------------------------------------------
  -- ZERO ROWS: STALE OR TARGET REMOVED
  -- ----------------------------------------------------------

  select exists (
    select 1
    from public.products p
    where
      p.id =
        v_action.target_id
      and p.organization_id =
        v_action.organization_id
  )
  into
    v_target_exists;

  if v_target_exists then
    update public.ai_controlled_actions
    set
      status =
        'stale',

      finalized_at =
        now(),

      error_message =
        'Product name changed after proposal confirmation'
    where id =
      v_action.id;
  else
    update public.ai_controlled_actions
    set
      status =
        'failed',

      finalized_at =
        now(),

      error_message =
        'Product no longer exists'
    where id =
      v_action.id;
  end if;

  return jsonb_build_object(
    'action_id',
    v_action.id
  );
end;
$function$;

-- ============================================================
-- FUNCTION PRIVILEGES
-- ============================================================

revoke all
on function
public.propose_ai_controlled_product_name_action(
  uuid,
  uuid,
  text,
  text,
  text
)
from public, anon, authenticated, service_role;

grant execute
on function
public.propose_ai_controlled_product_name_action(
  uuid,
  uuid,
  text,
  text,
  text
)
to authenticated;

revoke all
on function
public.execute_ai_controlled_product_name_action(
  uuid
)
from public, anon, authenticated, service_role;

grant execute
on function
public.execute_ai_controlled_product_name_action(
  uuid
)
to authenticated;

comment on function
public.propose_ai_controlled_product_name_action(
  uuid,
  uuid,
  text,
  text,
  text
)
is
'Creates or idempotently replays a product.update_name proposal. Does not mutate products.';

comment on function
public.execute_ai_controlled_product_name_action(
  uuid
)
is
'Executes an explicitly confirmed product.update_name action using exact product-name compare-and-set.';

commit;
