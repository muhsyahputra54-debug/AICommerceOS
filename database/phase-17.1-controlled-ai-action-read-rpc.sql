-- AICommerceOS / LAKUVO
-- Phase 17.1 — Controlled AI Action Read RPC
--
-- Purpose:
--   Provide a narrow authenticated read path for one persisted
--   controlled AI action without granting direct table SELECT.
--
-- Security:
--   - authenticated user required
--   - owner/admin membership required
--   - organization is explicit and must match the action
--   - cross-organization action IDs return null
--   - no product or commerce mutation
--   - service_role is intentionally not granted EXECUTE

begin;

do $$
begin
  if to_regclass(
    'public.ai_controlled_actions'
  ) is null then
    raise exception
      'ai_controlled_actions table is missing';
  end if;

  if to_regprocedure(
    'public.get_ai_controlled_action(uuid,uuid)'
  ) is not null then
    raise exception
      'get_ai_controlled_action(uuid,uuid) already exists';
  end if;
end;
$$;

create function public.get_ai_controlled_action(
  p_organization_id uuid,
  p_action_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid :=
    auth.uid();

  v_action
    public.ai_controlled_actions%rowtype;

begin
  if v_user_id is null then
    raise exception
      'Authentication required.'
      using errcode = '42501';
  end if;

  /*
   * Scope lookup through BOTH:
   *   - explicit organization argument
   *   - current authenticated owner/admin membership
   *
   * A nonexistent, cross-organization, or unauthorized action
   * is deliberately indistinguishable and returns null.
   */
  select
    a.*
  into
    v_action
  from
    public.ai_controlled_actions a
  inner join
    public.organization_members m
      on m.organization_id =
        a.organization_id
      and m.user_id =
        v_user_id
  where
    a.id =
      p_action_id
    and a.organization_id =
      p_organization_id
    and m.role::text in (
      'owner',
      'admin'
    )
  limit 1;

  if not found then
    return null;
  end if;

  /*
   * Explicit response projection.
   *
   * Do not return organization membership data,
   * idempotency keys, or additional future columns
   * automatically.
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
on function public.get_ai_controlled_action(
  uuid,
  uuid
)
from public;

revoke all
on function public.get_ai_controlled_action(
  uuid,
  uuid
)
from anon;

revoke all
on function public.get_ai_controlled_action(
  uuid,
  uuid
)
from authenticated;

revoke all
on function public.get_ai_controlled_action(
  uuid,
  uuid
)
from service_role;

grant execute
on function public.get_ai_controlled_action(
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
  'Read one organization-scoped controlled AI action for an authenticated owner/admin without granting direct table SELECT.';

commit;