-- AICommerceOS / LAKUVO
-- Phase 17 â€” Controlled AI Actions
--
-- First controlled action:
--   product.update_description
--
-- Safety model:
-- - proposal does not authorize execution
-- - authenticated owner/admin only
-- - same requesting user confirms and executes
-- - direct table writes are denied
-- - execution happens through SECURITY DEFINER RPC
-- - product description uses exact compare-and-set
-- - stale target results in zero product mutation
-- - idempotency key is unique per organization
-- - only products.description may be mutated

begin;

-- ============================================================
-- FAIL CLOSED IF A PARTIAL / UNKNOWN INSTALLATION EXISTS
-- ============================================================

do $$
begin
  if to_regclass(
    'public.ai_controlled_actions'
  ) is not null then
    raise exception
      'public.ai_controlled_actions already exists; inspect live schema before applying Phase 17';
  end if;

  if to_regprocedure(
    'public.propose_ai_controlled_product_description_action(uuid,uuid,text,text,text)'
  ) is not null then
    raise exception
      'proposal RPC already exists; inspect live schema before applying Phase 17';
  end if;

  if to_regprocedure(
    'public.confirm_ai_controlled_action(uuid)'
  ) is not null then
    raise exception
      'confirmation RPC already exists; inspect live schema before applying Phase 17';
  end if;

  if to_regprocedure(
    'public.execute_ai_controlled_action(uuid)'
  ) is not null then
    raise exception
      'execution RPC already exists; inspect live schema before applying Phase 17';
  end if;
end;
$$;


-- ============================================================
-- CONTROLLED ACTION AUDIT / LIFECYCLE TABLE
-- ============================================================

create table public.ai_controlled_actions (
  id uuid primary key
    default gen_random_uuid(),

  contract_version smallint not null
    default 1,

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  requested_by uuid not null,

  action_type text not null,

  status text not null
    default 'proposed',

  target_resource text not null,
  target_id uuid not null,

  expected_description text,
  proposed_description text not null,

  idempotency_key text not null,

  confirmed_by uuid,
  executed_by uuid,

  created_at timestamptz not null
    default now(),

  confirmed_at timestamptz,
  execution_started_at timestamptz,
  finalized_at timestamptz,

  error_message text,

  constraint ai_controlled_actions_contract_version_check
    check (
      contract_version = 1
    ),

  constraint ai_controlled_actions_action_type_check
    check (
      action_type =
        'product.update_description'
    ),

  constraint ai_controlled_actions_target_resource_check
    check (
      target_resource = 'product'
    ),

  constraint ai_controlled_actions_status_check
    check (
      status in (
        'proposed',
        'confirmed',
        'executing',
        'executed',
        'stale',
        'failed',
        'cancelled'
      )
    ),

  constraint ai_controlled_actions_idempotency_key_check
    check (
      idempotency_key =
        btrim(idempotency_key)
      and length(idempotency_key)
        between 1 and 128
    ),

  constraint ai_controlled_actions_proposed_description_check
    check (
      proposed_description =
        btrim(proposed_description)
      and length(proposed_description) > 0
    ),

  constraint ai_controlled_actions_not_noop_check
    check (
      coalesce(
        btrim(expected_description),
        ''
      ) <>
      btrim(proposed_description)
    ),

  constraint ai_controlled_actions_confirmation_pair_check
    check (
      (
        confirmed_by is null
        and confirmed_at is null
      )
      or
      (
        confirmed_by is not null
        and confirmed_at is not null
      )
    ),

  constraint ai_controlled_actions_execution_pair_check
    check (
      (
        executed_by is null
        and execution_started_at is null
      )
      or
      (
        executed_by is not null
        and execution_started_at is not null
      )
    ),

  constraint ai_controlled_actions_proposed_unconfirmed_check
    check (
      status <> 'proposed'
      or (
        confirmed_by is null
        and confirmed_at is null
      )
    ),

  constraint ai_controlled_actions_confirmation_required_check
    check (
      status not in (
        'confirmed',
        'executing',
        'executed',
        'stale',
        'failed'
      )
      or (
        confirmed_by is not null
        and confirmed_at is not null
      )
    ),

  constraint ai_controlled_actions_execution_started_check
    check (
      status not in (
        'executing',
        'executed',
        'stale',
        'failed'
      )
      or (
        executed_by is not null
        and execution_started_at is not null
      )
    ),

  constraint ai_controlled_actions_finalized_check
    check (
      (
        status in (
          'executed',
          'stale',
          'failed',
          'cancelled'
        )
        and finalized_at is not null
      )
      or
      (
        status not in (
          'executed',
          'stale',
          'failed',
          'cancelled'
        )
        and finalized_at is null
      )
    ),

  constraint ai_controlled_actions_org_idempotency_key
    unique (
      organization_id,
      idempotency_key
    )
);


create index
  ai_controlled_actions_org_created_idx
on public.ai_controlled_actions (
  organization_id,
  created_at desc
);


create index
  ai_controlled_actions_org_status_created_idx
on public.ai_controlled_actions (
  organization_id,
  status,
  created_at desc
);


comment on table public.ai_controlled_actions is
  'Persisted human-controlled AI action lifecycle. Phase 17 initially supports only product.update_description.';


-- ============================================================
-- DIRECT TABLE ACCESS
-- ============================================================

alter table public.ai_controlled_actions
  enable row level security;


revoke all
on table public.ai_controlled_actions
from public, anon, authenticated, service_role;


-- Defense-in-depth policy for any future explicitly granted reads.
-- No INSERT / UPDATE / DELETE policy is created.

create policy
  "Owners and admins can view controlled AI actions"
on public.ai_controlled_actions
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members m
    where
      m.organization_id =
        ai_controlled_actions.organization_id
      and m.user_id = auth.uid()
      and m.role::text in (
        'owner',
        'admin'
      )
  )
);


-- ============================================================
-- PROPOSE
-- ============================================================

create function
  public.propose_ai_controlled_product_description_action(
    p_organization_id uuid,
    p_product_id uuid,
    p_expected_description text,
    p_proposed_description text,
    p_idempotency_key text
  )
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_role text;

  v_key text;
  v_proposed_description text;

  v_current_description text;

  v_existing
    public.ai_controlled_actions%rowtype;

  v_action_id uuid;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  if p_product_id is null then
    raise exception
      'product_id is required';
  end if;

  v_key :=
    btrim(
      coalesce(
        p_idempotency_key,
        ''
      )
    );

  if
    length(v_key) = 0
    or length(v_key) > 128
  then
    raise exception
      'invalid idempotency key';
  end if;

  v_proposed_description :=
    btrim(
      coalesce(
        p_proposed_description,
        ''
      )
    );

  if length(v_proposed_description) = 0 then
    raise exception
      'proposed description is required';
  end if;

  if
    coalesce(
      btrim(p_expected_description),
      ''
    ) =
    v_proposed_description
  then
    raise exception
      'proposed description does not change the current description';
  end if;

  select
    m.role::text
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
    coalesce(v_role, '')
    not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin'
      using errcode = '42501';
  end if;

  -- ----------------------------------------------------------
  -- Idempotent replay is checked before current product state.
  -- A successfully persisted action remains replayable even
  -- after later product changes or execution.
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
        is distinct from v_user_id
      or v_existing.action_type
        <> 'product.update_description'
      or v_existing.target_resource
        <> 'product'
      or v_existing.target_id
        is distinct from p_product_id
      or v_existing.expected_description
        is distinct from p_expected_description
      or v_existing.proposed_description
        <> v_proposed_description
    then
      raise exception
        'idempotency key conflict';
    end if;

    return jsonb_build_object(
      'action_id',
        v_existing.id,
      'status',
        v_existing.status,
      'created',
        false,
      'idempotent_replay',
        true
    );
  end if;

  -- ----------------------------------------------------------
  -- Current product must match the preview snapshot at the
  -- moment a new proposal is persisted.
  -- ----------------------------------------------------------

  select
    p.description
  into
    v_current_description
  from public.products p
  where
    p.id = p_product_id
    and p.organization_id =
      p_organization_id;

  if not found then
    raise exception
      'Product not found';
  end if;

  if
    v_current_description
      is distinct from
        p_expected_description
  then
    raise exception
      'Product description changed before proposal creation';
  end if;

  insert into public.ai_controlled_actions (
    contract_version,
    organization_id,
    requested_by,
    action_type,
    status,
    target_resource,
    target_id,
    expected_description,
    proposed_description,
    idempotency_key
  )
  values (
    1,
    p_organization_id,
    v_user_id,
    'product.update_description',
    'proposed',
    'product',
    p_product_id,
    p_expected_description,
    v_proposed_description,
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
        v_action_id,
      'status',
        'proposed',
      'created',
        true,
      'idempotent_replay',
        false
    );
  end if;

  -- ----------------------------------------------------------
  -- Concurrent request won the unique-key race.
  -- Validate that it is the exact same logical request.
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

  if not found then
    raise exception
      'Unable to resolve idempotent controlled action';
  end if;

  if
    v_existing.requested_by
      is distinct from v_user_id
    or v_existing.action_type
      <> 'product.update_description'
    or v_existing.target_resource
      <> 'product'
    or v_existing.target_id
      is distinct from p_product_id
    or v_existing.expected_description
      is distinct from p_expected_description
    or v_existing.proposed_description
      <> v_proposed_description
  then
    raise exception
      'idempotency key conflict';
  end if;

  return jsonb_build_object(
    'action_id',
      v_existing.id,
    'status',
      v_existing.status,
    'created',
      false,
    'idempotent_replay',
      true
  );
end;
$$;


-- ============================================================
-- CONFIRM
-- ============================================================

create function
  public.confirm_ai_controlled_action(
    p_action_id uuid
  )
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_role text;

  v_action
    public.ai_controlled_actions%rowtype;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required'
      using errcode = '42501';
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
    a.id = p_action_id
  for update;

  if not found then
    raise exception
      'Controlled action not found';
  end if;

  select
    m.role::text
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
    coalesce(v_role, '')
    not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin'
      using errcode = '42501';
  end if;

  if
    v_action.requested_by
      is distinct from
        v_user_id
  then
    raise exception
      'Only the requesting user may confirm this controlled action'
      using errcode = '42501';
  end if;

  if v_action.status = 'proposed' then
    update public.ai_controlled_actions
    set
      status =
        'confirmed',
      confirmed_by =
        v_user_id,
      confirmed_at =
        now()
    where
      id =
        v_action.id;

    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        'confirmed',
      'confirmed',
        true,
      'idempotent_replay',
        false
    );
  end if;

  if
    v_action.status = 'confirmed'
    and v_action.confirmed_by =
      v_user_id
  then
    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        'confirmed',
      'confirmed',
        true,
      'idempotent_replay',
        true
    );
  end if;

  if
    v_action.status in (
      'executing',
      'executed',
      'stale',
      'failed',
      'cancelled'
    )
  then
    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        v_action.status,
      'confirmed',
        v_action.confirmed_at
          is not null,
      'idempotent_replay',
        true
    );
  end if;

  raise exception
    'Controlled action cannot be confirmed from status %',
    v_action.status;
end;
$$;


-- ============================================================
-- EXECUTE
-- ============================================================

create function
  public.execute_ai_controlled_action(
    p_action_id uuid
  )
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_role text;

  v_action
    public.ai_controlled_actions%rowtype;

  v_affected integer;
  v_target_exists boolean;

  v_error text;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required'
      using errcode = '42501';
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
    a.id = p_action_id
  for update;

  if not found then
    raise exception
      'Controlled action not found';
  end if;

  select
    m.role::text
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
    coalesce(v_role, '')
    not in (
      'owner',
      'admin'
    )
  then
    raise exception
      'Controlled AI actions require owner or admin'
      using errcode = '42501';
  end if;

  if
    v_action.requested_by
      is distinct from
        v_user_id
  then
    raise exception
      'Only the requesting user may execute this controlled action'
      using errcode = '42501';
  end if;

  -- Terminal statuses are exactly-once replays.
  -- They never mutate the product again.

  if
    v_action.status in (
      'executed',
      'stale',
      'failed',
      'cancelled'
    )
  then
    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        v_action.status,
      'executed',
        v_action.status = 'executed',
      'idempotent_replay',
        true
    );
  end if;

  if v_action.status = 'executing' then
    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        'executing',
      'executed',
        false,
      'idempotent_replay',
        true
    );
  end if;

  if v_action.status = 'proposed' then
    raise exception
      'Explicit confirmation is required before execution'
      using errcode = '42501';
  end if;

  if v_action.status <> 'confirmed' then
    raise exception
      'Controlled action cannot execute from status %',
      v_action.status;
  end if;

  if
    v_action.confirmed_by
      is distinct from
        v_user_id
    or v_action.confirmed_at
      is null
  then
    raise exception
      'Controlled action confirmation does not belong to the authenticated requester'
      using errcode = '42501';
  end if;

  update public.ai_controlled_actions
  set
    status =
      'executing',
    executed_by =
      v_user_id,
    execution_started_at =
      now(),
    error_message =
      null
  where
    id =
      v_action.id;

  begin
    -- --------------------------------------------------------
    -- THE ONLY COMMERCE MUTATION IN PHASE 17.
    --
    -- Exact compare-and-set:
    -- current description must still equal the proposal's
    -- expected snapshot.
    -- --------------------------------------------------------

    update public.products
    set
      description =
        v_action.proposed_description
    where
      id =
        v_action.target_id
      and organization_id =
        v_action.organization_id
      and description
        is not distinct from
          v_action.expected_description;

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
      where
        id =
          v_action.id;

      return jsonb_build_object(
        'action_id',
          v_action.id,
        'status',
          'executed',
        'executed',
          true,
        'idempotent_replay',
          false
      );
    end if;

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
      -- Product still exists but description changed after
      -- proposal preview. Manual/current data wins.

      update public.ai_controlled_actions
      set
        status =
          'stale',
        finalized_at =
          now(),
        error_message =
          'target_description_changed'
      where
        id =
          v_action.id;

      return jsonb_build_object(
        'action_id',
          v_action.id,
        'status',
          'stale',
        'executed',
          false,
        'idempotent_replay',
          false
      );
    end if;

    update public.ai_controlled_actions
    set
      status =
        'failed',
      finalized_at =
        now(),
      error_message =
        'target_not_found'
    where
      id =
        v_action.id;

    return jsonb_build_object(
      'action_id',
        v_action.id,
      'status',
        'failed',
      'executed',
        false,
      'idempotent_replay',
        false
    );

  exception
    when others then
      v_error :=
        left(
          sqlerrm,
          4000
        );

      update public.ai_controlled_actions
      set
        status =
          'failed',
        finalized_at =
          now(),
        error_message =
          v_error
      where
        id =
          v_action.id;

      return jsonb_build_object(
        'action_id',
          v_action.id,
        'status',
          'failed',
        'executed',
          false,
        'idempotent_replay',
          false
      );
  end;
end;
$$;


-- ============================================================
-- FUNCTION PRIVILEGES
-- ============================================================

revoke all
on function
  public.propose_ai_controlled_product_description_action(
    uuid,
    uuid,
    text,
    text,
    text
  )
from public, anon, authenticated;


grant execute
on function
  public.propose_ai_controlled_product_description_action(
    uuid,
    uuid,
    text,
    text,
    text
  )
to authenticated;


revoke all
on function
  public.confirm_ai_controlled_action(
    uuid
  )
from public, anon, authenticated;


grant execute
on function
  public.confirm_ai_controlled_action(
    uuid
  )
to authenticated;


revoke all
on function
  public.execute_ai_controlled_action(
    uuid
  )
from public, anon, authenticated;


grant execute
on function
  public.execute_ai_controlled_action(
    uuid
  )
to authenticated;


comment on function
  public.propose_ai_controlled_product_description_action(
    uuid,
    uuid,
    text,
    text,
    text
  )
is
  'Creates or idempotently replays a persisted product description proposal. Does not mutate products.';


comment on function
  public.confirm_ai_controlled_action(
    uuid
  )
is
  'Explicit same-requester owner/admin confirmation for a controlled AI action.';


comment on function
  public.execute_ai_controlled_action(
    uuid
  )
is
  'Executes a confirmed product description action exactly once using exact description compare-and-set.';


commit;
