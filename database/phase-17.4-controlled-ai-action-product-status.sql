-- AICommerceOS
-- Phase 17.4 — Controlled AI Action: product.update_status
--
-- Adds a third controlled action without widening direct client authority.
--
-- Lifecycle:
--   proposed -> confirmed -> executing -> executed | stale | failed | cancelled
--
-- Invariants:
-- - owner/admin only
-- - same authenticated requester
-- - proposal/confirmation do not mutate products
-- - execution uses exact products.status compare-and-set
-- - persisted immutable action_type selects the executor
-- - allowed status values are exactly active | inactive
-- - no direct table grant is added
-- - controlled functions are executable only by authenticated

begin;

-- ============================================================
-- 1. PRECONDITIONS
-- ============================================================

do $$
begin
  if to_regclass('public.ai_controlled_actions') is null then
    raise exception
      'Precondition failed: public.ai_controlled_actions is missing';
  end if;

  if to_regclass('public.products') is null then
    raise exception
      'Precondition failed: public.products is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ai_controlled_actions'
      and column_name = 'mutation_field'
      and data_type = 'text'
  ) then
    raise exception
      'Precondition failed: mutation_field text column is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ai_controlled_actions'
      and column_name = 'expected_value'
      and data_type = 'text'
  ) then
    raise exception
      'Precondition failed: expected_value text column is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ai_controlled_actions'
      and column_name = 'proposed_value'
      and data_type = 'text'
  ) then
    raise exception
      'Precondition failed: proposed_value text column is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'status'
      and data_type = 'text'
      and is_nullable = 'NO'
  ) then
    raise exception
      'Precondition failed: products.status text NOT NULL column is missing';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t
      on t.oid = c.conrelid
    join pg_namespace n
      on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'products'
      and c.conname = 'products_status_check'
  ) then
    raise exception
      'Precondition failed: products_status_check is missing';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t
      on t.oid = c.conrelid
    join pg_namespace n
      on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'ai_controlled_actions'
      and c.conname =
        'ai_controlled_actions_action_type_check'
  ) then
    raise exception
      'Precondition failed: controlled action type constraint is missing';
  end if;

  if to_regprocedure(
    'public.get_ai_controlled_action(uuid,uuid)'
  ) is null then
    raise exception
      'Precondition failed: controlled action read RPC is missing';
  end if;

  if to_regprocedure(
    'public.propose_ai_controlled_product_name_action(uuid,uuid,text,text,text)'
  ) is null then
    raise exception
      'Precondition failed: product name proposer is missing';
  end if;

  if to_regprocedure(
    'public.execute_ai_controlled_product_name_action(uuid)'
  ) is null then
    raise exception
      'Precondition failed: product name executor is missing';
  end if;

  if to_regprocedure(
    'public.execute_ai_controlled_action_dispatch(uuid)'
  ) is null then
    raise exception
      'Precondition failed: controlled action dispatcher is missing';
  end if;

  if to_regprocedure(
    'public.confirm_ai_controlled_action(uuid)'
  ) is null then
    raise exception
      'Precondition failed: generic confirmation RPC is missing';
  end if;

  if to_regprocedure(
    'public.propose_ai_controlled_product_status_action(uuid,uuid,text,text,text)'
  ) is not null then
    raise exception
      'Precondition failed: product status proposer already exists';
  end if;

  if to_regprocedure(
    'public.execute_ai_controlled_product_status_action(uuid)'
  ) is not null then
    raise exception
      'Precondition failed: product status executor already exists';
  end if;

  if exists (
    select 1
    from pg_constraint c
    join pg_class t
      on t.oid = c.conrelid
    join pg_namespace n
      on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'ai_controlled_actions'
      and c.conname =
        'ai_controlled_actions_product_status_payload_check'
  ) then
    raise exception
      'Precondition failed: product status payload constraint already exists';
  end if;

  if exists (
    select 1
    from public.ai_controlled_actions
    where action_type = 'product.update_status'
  ) then
    raise exception
      'Precondition failed: product.update_status rows already exist';
  end if;
end;
$$;

-- ============================================================
-- 2. ACTION-TYPE + PAYLOAD CONSTRAINTS
-- ============================================================

alter table public.ai_controlled_actions
drop constraint
  ai_controlled_actions_action_type_check;

alter table public.ai_controlled_actions
add constraint
  ai_controlled_actions_action_type_check
check (
  action_type in (
    'product.update_description',
    'product.update_name',
    'product.update_status'
  )
);

alter table public.ai_controlled_actions
add constraint
  ai_controlled_actions_product_status_payload_check
check (
  action_type <> 'product.update_status'
  or (
    mutation_field = 'status'
    and expected_value is not null
    and proposed_value is not null
    and expected_value in (
      'active',
      'inactive'
    )
    and proposed_value in (
      'active',
      'inactive'
    )
    and expected_value
      is distinct from
      proposed_value
    and expected_description is null
    and proposed_description is null
  )
);

-- ============================================================
-- 3. PROPOSER — product.update_status
-- ============================================================

create function
public.propose_ai_controlled_product_status_action(
  p_organization_id uuid,
  p_product_id uuid,
  p_expected_status text,
  p_proposed_status text,
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
  v_current_status text;

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

  if
    p_expected_status is null
    or p_expected_status not in (
      'active',
      'inactive'
    )
  then
    raise exception
      'expected product status is invalid';
  end if;

  if
    p_proposed_status is null
    or p_proposed_status not in (
      'active',
      'inactive'
    )
  then
    raise exception
      'proposed product status is invalid';
  end if;

  if
    p_expected_status
      is not distinct from
      p_proposed_status
  then
    raise exception
      'proposed product status does not change the current status';
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
        <> 'product.update_status'

      or v_existing.target_resource
        <> 'product'

      or v_existing.target_id
        is distinct from
        p_product_id

      or v_existing.mutation_field
        <> 'status'

      or v_existing.expected_value
        is distinct from
        p_expected_status

      or v_existing.proposed_value
        is distinct from
        p_proposed_status
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
    p.status
  into
    v_current_status
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
    v_current_status
      is distinct from
      p_expected_status
  then
    raise exception
      'Product status changed before proposal creation';
  end if;

  if
    v_current_status
      is not distinct from
      p_proposed_status
  then
    raise exception
      'proposed product status does not change the current status';
  end if;

  -- ----------------------------------------------------------
  -- CREATE PROPOSAL
  -- ==========================================================

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

    'product.update_status',
    'proposed',

    'product',
    p_product_id,

    'status',
    p_expected_status,
    p_proposed_status,

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
      <> 'product.update_status'

    or v_existing.target_resource
      <> 'product'

    or v_existing.target_id
      is distinct from
      p_product_id

    or v_existing.mutation_field
      <> 'status'

    or v_existing.expected_value
      is distinct from
      p_expected_status

    or v_existing.proposed_value
      is distinct from
      p_proposed_status
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
-- 4. EXECUTOR — product.update_status
-- ============================================================

create function
public.execute_ai_controlled_product_status_action(
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
      <> 'product.update_status'
    or v_action.target_resource
      <> 'product'
    or v_action.mutation_field
      <> 'status'
  then
    raise exception
      'Action is not a product status action';
  end if;

  if
    v_action.expected_value is null
    or v_action.expected_value not in (
      'active',
      'inactive'
    )
    or v_action.proposed_value is null
    or v_action.proposed_value not in (
      'active',
      'inactive'
    )
    or v_action.expected_value
      is not distinct from
      v_action.proposed_value
  then
    raise exception
      'Product status action payload is invalid';
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
  -- EXACT PRODUCT STATUS COMPARE-AND-SET
  -- ----------------------------------------------------------

  update public.products
  set
    status =
      v_action.proposed_value
  where
    id =
      v_action.target_id

    and organization_id =
      v_action.organization_id

    and status
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
        'Product status changed after proposal confirmation'
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
-- 5. DISPATCHER — persisted immutable action_type only
-- ============================================================

create or replace function
public.execute_ai_controlled_action_dispatch(
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

  v_organization_id uuid;
  v_requested_by uuid;
  v_action_type text;
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

  /*
   * The caller does NOT choose the executor.
   *
   * Dispatch is derived only from the persisted,
   * immutable action_type.
   */
  select
    a.organization_id,
    a.requested_by,
    a.action_type
  into
    v_organization_id,
    v_requested_by,
    v_action_type
  from public.ai_controlled_actions a
  where a.id =
    p_action_id;

  if not found then
    raise exception
      'Controlled action not found';
  end if;

  if
    v_requested_by
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
      v_organization_id
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

  if
    v_action_type =
      'product.update_description'
  then
    return
      public.execute_ai_controlled_action(
        p_action_id
      );
  end if;

  if
    v_action_type =
      'product.update_name'
  then
    return
      public.execute_ai_controlled_product_name_action(
        p_action_id
      );
  end if;

  if
    v_action_type =
      'product.update_status'
  then
    return
      public.execute_ai_controlled_product_status_action(
        p_action_id
      );
  end if;

  raise exception
    'Unsupported controlled action type';
end;
$function$;

-- ============================================================
-- 6. ACL
-- ============================================================

revoke all
on function
public.propose_ai_controlled_product_status_action(
  uuid,
  uuid,
  text,
  text,
  text
)
from public, anon, authenticated, service_role;

grant execute
on function
public.propose_ai_controlled_product_status_action(
  uuid,
  uuid,
  text,
  text,
  text
)
to authenticated;

revoke all
on function
public.execute_ai_controlled_product_status_action(
  uuid
)
from public, anon, authenticated, service_role;

grant execute
on function
public.execute_ai_controlled_product_status_action(
  uuid
)
to authenticated;

-- Reassert dispatcher ACL after CREATE OR REPLACE.
revoke all
on function
public.execute_ai_controlled_action_dispatch(
  uuid
)
from public, anon, authenticated, service_role;

grant execute
on function
public.execute_ai_controlled_action_dispatch(
  uuid
)
to authenticated;

-- ============================================================
-- 7. DOCUMENTATION
-- ============================================================

comment on constraint
ai_controlled_actions_product_status_payload_check
on public.ai_controlled_actions
is
'product.update_status stores an exact active/inactive before/after snapshot in generic mutation fields.';

comment on function
public.propose_ai_controlled_product_status_action(
  uuid,
  uuid,
  text,
  text,
  text
)
is
'Creates or idempotently replays a product.update_status proposal. Does not mutate products.';

comment on function
public.execute_ai_controlled_product_status_action(
  uuid
)
is
'Executes an explicitly confirmed product.update_status action using exact product-status compare-and-set.';

comment on function
public.execute_ai_controlled_action_dispatch(
  uuid
)
is
'Dispatches execution from the persisted immutable action_type to the matching controlled executor. It does not accept an action type from the client.';

commit;
