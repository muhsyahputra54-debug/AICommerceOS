-- AICommerceOS
-- Phase 17.3 ? Controlled AI Action Read Projection + Dispatcher
--
-- Supports:
--   product.update_description
--   product.update_name
--
-- This migration does NOT mutate commerce data.
--
-- Changes:
-- - expands the safe read projection with generic snapshots
-- - adds one DB-side execution dispatcher
-- - dispatcher selects persisted immutable action_type
-- - underlying action-specific executors retain mutation authority
--
-- Security:
-- - authenticated only
-- - owner/admin only
-- - same requester
-- - fixed search_path
-- - no direct ai_controlled_actions table grant
-- - no service_role execute grant

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
    'public.get_ai_controlled_action(uuid,uuid)'
  ) is null then
    raise exception
      'get_ai_controlled_action(uuid,uuid) is required';
  end if;

  if to_regprocedure(
    'public.execute_ai_controlled_action(uuid)'
  ) is null then
    raise exception
      'description executor is required';
  end if;

  if to_regprocedure(
    'public.execute_ai_controlled_product_name_action(uuid)'
  ) is null then
    raise exception
      'product name executor is required';
  end if;

  if to_regprocedure(
    'public.execute_ai_controlled_action_dispatch(uuid)'
  ) is not null then
    raise exception
      'controlled action dispatcher already exists';
  end if;
end;
$$;

-- ============================================================
-- SAFE READ PROJECTION
-- ============================================================

create or replace function
public.get_ai_controlled_action(
  p_organization_id uuid,
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
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  if
    p_organization_id is null
    or p_action_id is null
  then
    raise exception
      'organization_id and action_id are required';
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

  select
    a.*
  into
    v_action
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and a.id =
      p_action_id;

  /*
   * Cross-organization and nonexistent IDs remain
   * indistinguishable to the caller.
   */
  if not found then
    return null;
  end if;

  /*
   * Explicit safe projection.
   *
   * Never expose:
   * - idempotency_key
   * - requested_by
   * - confirmed_by
   * - executed_by
   * - organization membership data
   *
   * The generic snapshot fields are controlled persisted
   * values required to review product.update_name.
   */
  return jsonb_build_object(
    'id',
      v_action.id,

    'contract_version',
      v_action.contract_version,

    'action_type',
      v_action.action_type,

    'status',
      v_action.status,

    'target_resource',
      v_action.target_resource,

    'target_id',
      v_action.target_id,

    'expected_description',
      v_action.expected_description,

    'proposed_description',
      v_action.proposed_description,

    'mutation_field',
      v_action.mutation_field,

    'expected_value',
      v_action.expected_value,

    'proposed_value',
      v_action.proposed_value,

    'created_at',
      v_action.created_at,

    'confirmed_at',
      v_action.confirmed_at,

    'execution_started_at',
      v_action.execution_started_at,

    'finalized_at',
      v_action.finalized_at,

    'error_message',
      v_action.error_message
  );
end;
$function$;

revoke all
on function
public.get_ai_controlled_action(
  uuid,
  uuid
)
from public, anon, authenticated, service_role;

grant execute
on function
public.get_ai_controlled_action(
  uuid,
  uuid
)
to authenticated;

comment on function
public.get_ai_controlled_action(
  uuid,
  uuid
)
is
'Reads one owner/admin organization-scoped controlled AI action using an explicit safe projection for supported action types.';

-- ============================================================
-- IMMUTABLE ACTION-TYPE EXECUTION DISPATCHER
-- ============================================================

create function
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

  raise exception
    'Unsupported controlled action type';
end;
$function$;

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

comment on function
public.execute_ai_controlled_action_dispatch(
  uuid
)
is
'Dispatches execution from the persisted immutable action_type to the matching controlled executor. It does not accept an action type from the client.';

commit;
