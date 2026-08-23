-- AICommerceOS
-- Phase 9F-D — Initial Organization Whitespace Normalization Repair
--
-- Fix:
-- Normalize all whitespace first, then trim the resulting ordinary
-- spaces. This ensures tab/newline-only names cannot become " "
-- and bypass the required-name guard.
--
-- No billing, subscription, trial, RLS, or table privilege changes.

begin;


create or replace function public.create_initial_organization(
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid;
  selected_organization_id uuid;
  normalized_name text;
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


  normalized_name :=
    pg_catalog.btrim(
      pg_catalog.regexp_replace(
        coalesce(
          p_name,
          ''
        ),
        '[[:space:]]+',
        ' ',
        'g'
      )
    );


  if
    pg_catalog.char_length(
      normalized_name
    ) < 1
  then
    raise exception
      'Organization name is required';
  end if;


  if
    pg_catalog.char_length(
      normalized_name
    ) > 100
  then
    raise exception
      'Organization name must be 100 characters or fewer';
  end if;


  insert into public.organizations (
    name
  )
  values (
    normalized_name
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
on function public.create_initial_organization(text)
from public;


revoke execute
on function public.create_initial_organization(text)
from anon;


grant execute
on function public.create_initial_organization(text)
to authenticated;


commit;
