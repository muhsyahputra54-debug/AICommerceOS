-- AICommerceOS
-- Phase 9E — Organization Security Hardening
--
-- Official migration candidate.
-- Not yet applied to the active Supabase database.
--
-- Scope:
-- - preserve organization membership RLS authorization
-- - harden SECURITY DEFINER search_path
-- - restrict function execution to authenticated users
-- - make default organization provisioning concurrency-safe
-- - preserve future multi-organization capability
-- - make existing default-organization selection deterministic
-- - restrict direct organization table access to SELECT via RLS
--
-- Explicitly excluded:
-- - active-organization selection model
-- - onboarding state
-- - test-fixture cleanup
-- - billing changes
--
-- Test fixture cleanup is intentionally maintained separately.

begin;


-- ============================================================
-- MEMBERSHIP AUTHORIZATION HELPER
-- ============================================================

create or replace function public.is_organization_member(
  target_organization_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
  );
$function$;


revoke execute
on function public.is_organization_member(uuid)
from public;

grant execute
on function public.is_organization_member(uuid)
to authenticated;


-- ============================================================
-- DEFAULT ORGANIZATION PROVISIONING
-- ============================================================
--
-- The advisory transaction lock serializes concurrent default
-- provisioning calls for the same authenticated user.
--
-- No UNIQUE(user_id) constraint is introduced because LAKUVO
-- may intentionally support multiple organizations per user.
-- ============================================================

create or replace function public.create_default_organization()
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid;
  selected_organization_id uuid;
begin

  current_user_id :=
    auth.uid();

  if current_user_id is null then
    raise exception
      'User is not authenticated';
  end if;


  perform
    pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        current_user_id::text,
        0
      )
    );


  -- Re-check only after acquiring the per-user transaction
  -- lock. This closes the concurrent provisioning race.
  select
    organization_id
  into
    selected_organization_id
  from
    public.organization_members
  where
    user_id = current_user_id
  order by
    created_at asc,
    organization_id asc
  limit 1;


  if selected_organization_id is not null then
    return selected_organization_id;
  end if;


  insert into public.organizations (
    name
  )
  values (
    'My Commerce Store'
  )
  returning id
  into selected_organization_id;


  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    selected_organization_id,
    current_user_id,
    'owner'
  );


  return selected_organization_id;

end;
$function$;


revoke execute
on function public.create_default_organization()
from public;

grant execute
on function public.create_default_organization()
to authenticated;


-- ============================================================
-- ORGANIZATION TABLE PRIVILEGES
-- ============================================================
--
-- RLS remains the read authorization boundary.
-- Client-side organization mutation remains RPC-controlled.
-- ============================================================

revoke all privileges
on table public.organizations
from public;

revoke all privileges
on table public.organization_members
from public;


revoke all privileges
on table public.organizations
from anon;

revoke all privileges
on table public.organization_members
from anon;


revoke all privileges
on table public.organizations
from authenticated;

revoke all privileges
on table public.organization_members
from authenticated;


grant select
on table public.organizations
to authenticated;

grant select
on table public.organization_members
to authenticated;


commit;