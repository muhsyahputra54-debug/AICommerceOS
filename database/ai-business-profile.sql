begin;

-- ============================================================
-- AI BUSINESS PROFILE
--
-- One canonical structured AI profile per organization.
--
-- This is intentionally separate from:
-- - operational commerce data
-- - user-scoped AI long-term memory
--
-- Current commerce data remains the source of truth for
-- measurable business facts such as stock, orders, prices,
-- customers, and sales observations.
-- ============================================================

create table if not exists
public.ai_business_profiles (
  organization_id uuid primary key
    references public.organizations(id)
    on delete cascade,

  industry text,
  business_type text,
  sales_model text,
  primary_market text,

  primary_sales_channels text[] not null
    default '{}'::text[],

  pricing_strategy text,
  primary_goal text,

  operational_priorities text[] not null
    default '{}'::text[],

  business_description text,

  created_by uuid
    references auth.users(id)
    on delete set null,

  updated_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint ai_business_profiles_industry_length
    check (
      industry is null
      or (
        length(btrim(industry)) >= 1
        and length(btrim(industry)) <= 120
      )
    ),

  constraint ai_business_profiles_business_type_length
    check (
      business_type is null
      or (
        length(btrim(business_type)) >= 1
        and length(btrim(business_type)) <= 120
      )
    ),

  constraint ai_business_profiles_sales_model_check
    check (
      sales_model is null
      or sales_model in (
        'b2c',
        'b2b',
        'hybrid',
        'other'
      )
    ),

  constraint ai_business_profiles_primary_market_length
    check (
      primary_market is null
      or (
        length(btrim(primary_market)) >= 1
        and length(btrim(primary_market)) <= 160
      )
    ),

  constraint ai_business_profiles_sales_channels_count
    check (
      cardinality(primary_sales_channels) <= 20
    ),

  constraint ai_business_profiles_pricing_strategy_length
    check (
      pricing_strategy is null
      or (
        length(btrim(pricing_strategy)) >= 1
        and length(btrim(pricing_strategy)) <= 500
      )
    ),

  constraint ai_business_profiles_primary_goal_length
    check (
      primary_goal is null
      or (
        length(btrim(primary_goal)) >= 1
        and length(btrim(primary_goal)) <= 1000
      )
    ),

  constraint ai_business_profiles_priorities_count
    check (
      cardinality(operational_priorities) <= 20
    ),

  constraint ai_business_profiles_description_length
    check (
      business_description is null
      or (
        length(btrim(business_description)) >= 1
        and length(btrim(business_description)) <= 3000
      )
    )
);

-- ============================================================
-- UPDATED_AT
-- ============================================================

create or replace function
public.set_ai_business_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all
on function public.set_ai_business_profile_updated_at()
from public, anon, authenticated;

drop trigger if exists
  ai_business_profiles_set_updated_at
on public.ai_business_profiles;

create trigger
  ai_business_profiles_set_updated_at
before update
on public.ai_business_profiles
for each row
execute function
  public.set_ai_business_profile_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.ai_business_profiles
  enable row level security;

drop policy if exists
  ai_business_profiles_select_member
on public.ai_business_profiles;

create policy
  ai_business_profiles_select_member
on public.ai_business_profiles
for select
to authenticated
using (
  public.is_organization_member(
    organization_id
  )
);


drop policy if exists
  ai_business_profiles_insert_member
on public.ai_business_profiles;

create policy
  ai_business_profiles_insert_member
on public.ai_business_profiles
for insert
to authenticated
with check (
  public.is_organization_member(
    organization_id
  )

  and created_by = auth.uid()
  and updated_by = auth.uid()
);


drop policy if exists
  ai_business_profiles_update_member
on public.ai_business_profiles;

create policy
  ai_business_profiles_update_member
on public.ai_business_profiles
for update
to authenticated
using (
  public.is_organization_member(
    organization_id
  )
)
with check (
  public.is_organization_member(
    organization_id
  )

  and updated_by = auth.uid()
);

-- Intentionally no DELETE policy.
-- A business profile is canonical organization context.
-- Profile fields can be cleared through UPDATE when needed.

-- ============================================================
-- PRIVILEGES
-- ============================================================

revoke all
on table public.ai_business_profiles
from anon;

revoke all
on table public.ai_business_profiles
from authenticated;

grant select
on table public.ai_business_profiles
to authenticated;

grant insert (
  organization_id,
  industry,
  business_type,
  sales_model,
  primary_market,
  primary_sales_channels,
  pricing_strategy,
  primary_goal,
  operational_priorities,
  business_description,
  created_by,
  updated_by
)
on public.ai_business_profiles
to authenticated;

grant update (
  industry,
  business_type,
  sales_model,
  primary_market,
  primary_sales_channels,
  pricing_strategy,
  primary_goal,
  operational_priorities,
  business_description,
  updated_by
)
on public.ai_business_profiles
to authenticated;

commit;