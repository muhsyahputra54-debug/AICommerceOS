-- ============================================================
-- Phase 17.6
-- LAKUVO AI Action Center - Safe Controlled Action List Read
-- ============================================================
--
-- Purpose:
-- - provide an organization-scoped read model for Action Center
-- - preserve ai_controlled_actions as the canonical source of truth
-- - expose only the same safe fields used by the detail read RPC
-- - require authenticated owner/admin access
-- - never grant direct table access
--
-- This migration is READ ONLY.
-- It does not add or modify controlled-action mutation behavior.
-- ============================================================

do $preflight$
begin
  if to_regclass(
    'public.ai_controlled_actions'
  ) is null then
    raise exception
      'Precondition failed: public.ai_controlled_actions is missing';
  end if;

  if to_regprocedure(
    'public.get_ai_controlled_action(uuid,uuid)'
  ) is null then
    raise exception
      'Precondition failed: get_ai_controlled_action(uuid,uuid) is missing';
  end if;

  if to_regprocedure(
    'public.get_ai_controlled_actions(uuid,integer,integer,text)'
  ) is not null then
    raise exception
      'get_ai_controlled_actions(uuid,integer,integer,text) already exists';
  end if;
end;
$preflight$;


create function
public.get_ai_controlled_actions(
  p_organization_id uuid,
  p_limit integer default 50,
  p_offset integer default 0,
  p_status text default null
)
returns table (
  id uuid,
  contract_version smallint,
  action_type text,
  status text,
  target_resource text,
  target_id uuid,
  expected_description text,
  proposed_description text,
  mutation_field text,
  expected_value text,
  proposed_value text,
  created_at timestamptz,
  confirmed_at timestamptz,
  execution_started_at timestamptz,
  finalized_at timestamptz,
  error_message text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid;
  v_role text;
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

  if
    p_limit is null
    or p_limit < 1
    or p_limit > 100
  then
    raise exception
      'limit must be between 1 and 100';
  end if;

  if
    p_offset is null
    or p_offset < 0
    or p_offset > 10000
  then
    raise exception
      'offset must be between 0 and 10000';
  end if;

  if
    p_status is not null
    and p_status not in (
      'proposed',
      'confirmed',
      'executing',
      'executed',
      'stale',
      'failed',
      'cancelled'
    )
  then
    raise exception
      'Unsupported controlled action status';
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

  /*
   * Explicit safe projection.
   *
   * Never expose:
   * - organization_id
   * - idempotency_key
   * - requested_by
   * - confirmed_by
   * - executed_by
   * - organization membership data
   */
  return query
  select
    a.id,
    a.contract_version,
    a.action_type,
    a.status,
    a.target_resource,
    a.target_id,
    a.expected_description,
    a.proposed_description,
    a.mutation_field,
    a.expected_value,
    a.proposed_value,
    a.created_at,
    a.confirmed_at,
    a.execution_started_at,
    a.finalized_at,
    a.error_message
  from public.ai_controlled_actions a
  where
    a.organization_id =
      p_organization_id
    and (
      p_status is null
      or a.status =
        p_status
    )
  order by
    a.created_at desc,
    a.id desc
  limit
    p_limit
  offset
    p_offset;
end;
$function$;


revoke all
on function
public.get_ai_controlled_actions(
  uuid,
  integer,
  integer,
  text
)
from
  public,
  anon,
  authenticated,
  service_role;


grant execute
on function
public.get_ai_controlled_actions(
  uuid,
  integer,
  integer,
  text
)
to authenticated;


comment on function
public.get_ai_controlled_actions(
  uuid,
  integer,
  integer,
  text
)
is
'Reads an owner/admin organization-scoped controlled AI action list using an explicit safe projection for LAKUVO Action Center.';


-- ============================================================
-- Verification
-- ============================================================

do $verify$
begin
  if to_regprocedure(
    'public.get_ai_controlled_actions(uuid,integer,integer,text)'
  ) is null then
    raise exception
      'Verification failed: get_ai_controlled_actions was not created';
  end if;
end;
$verify$;
