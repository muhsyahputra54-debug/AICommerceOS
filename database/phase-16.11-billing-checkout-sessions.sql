-- ============================================================
-- LAKUVO
-- Phase 16.11 - Provider-neutral billing checkout persistence
-- ============================================================
--
-- Purpose:
--   1. Persist checkout attempts before calling a payment provider.
--   2. Resolve commercial pricing from authoritative billing_plans.
--   3. Never trust amount/currency supplied by the browser.
--   4. Keep checkout lifecycle separate from billing_events,
--      which remains the provider webhook inbox.
--   5. Provide service-role-only mutation RPCs.
--
-- This migration is payment-provider neutral.
-- No Midtrans credentials or provider HTTP logic exist here.
-- ============================================================


-- ============================================================
-- 1. CHECKOUT SESSION TABLE
-- ============================================================

create table if not exists public.billing_checkout_sessions (
  id uuid primary key
    default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  plan_id uuid not null
    references public.billing_plans(id),

  provider text not null,

  reference_id text not null,

  plan_slug text not null,

  billing_interval text not null,

  amount numeric(20, 2) not null,

  currency text not null,

  status text not null
    default 'created',

  external_session_id text,

  provider_transaction_id text,

  checkout_url text,

  expires_at timestamptz,

  provider_session_created_at timestamptz,

  completed_at timestamptz,

  failure_code text,

  metadata jsonb not null
    default '{}'::jsonb,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint billing_checkout_sessions_provider_not_blank
    check (
      length(btrim(provider)) > 0
    ),

  constraint billing_checkout_sessions_reference_not_blank
    check (
      length(btrim(reference_id)) > 0
    ),

  constraint billing_checkout_sessions_reference_length
    check (
      length(reference_id) <= 120
    ),

  constraint billing_checkout_sessions_plan_slug_not_blank
    check (
      length(btrim(plan_slug)) > 0
    ),

  constraint billing_checkout_sessions_interval_check
    check (
      billing_interval in (
        'monthly',
        'annual'
      )
    ),

  constraint billing_checkout_sessions_amount_positive
    check (
      amount > 0
    ),

  constraint billing_checkout_sessions_currency_not_blank
    check (
      length(btrim(currency)) > 0
    ),

  constraint billing_checkout_sessions_currency_uppercase
    check (
      currency = upper(currency)
    ),

  constraint billing_checkout_sessions_status_check
    check (
      status in (
        'created',
        'ready',
        'failed',
        'completed',
        'expired',
        'canceled'
      )
    ),

  constraint billing_checkout_sessions_metadata_object
    check (
      jsonb_typeof(metadata) = 'object'
    )
);


-- ============================================================
-- 2. IDEMPOTENCY / LOOKUP INDEXES
-- ============================================================

create unique index if not exists
  billing_checkout_sessions_provider_reference_key
on public.billing_checkout_sessions (
  provider,
  reference_id
);


create unique index if not exists
  billing_checkout_sessions_provider_external_session_key
on public.billing_checkout_sessions (
  provider,
  external_session_id
)
where
  external_session_id is not null
  and btrim(external_session_id) <> '';


create unique index if not exists
  billing_checkout_sessions_provider_transaction_key
on public.billing_checkout_sessions (
  provider,
  provider_transaction_id
)
where
  provider_transaction_id is not null
  and btrim(provider_transaction_id) <> '';


create index if not exists
  billing_checkout_sessions_org_created_idx
on public.billing_checkout_sessions (
  organization_id,
  created_at desc
);


create index if not exists
  billing_checkout_sessions_status_idx
on public.billing_checkout_sessions (
  status,
  created_at
);


-- ============================================================
-- 3. RLS / DIRECT ACCESS BOUNDARY
-- ============================================================

alter table
  public.billing_checkout_sessions
enable row level security;


revoke all
on table public.billing_checkout_sessions
from public, anon, authenticated;


-- No browser policies are created intentionally.
-- Checkout mutation stays server-controlled.
-- Service role executes SECURITY DEFINER RPCs below.


-- ============================================================
-- 4. AUTHORITATIVE CHECKOUT CREATION
-- ============================================================
--
-- Important:
-- p_amount and p_currency intentionally do not exist.
-- Price and currency are resolved from billing_plans.
--
-- Provider/reference idempotency is concurrency-safe:
-- INSERT ... ON CONFLICT DO NOTHING is used first.
-- If another request wins the race, the committed row is
-- loaded and its immutable checkout attributes are verified.
-- ============================================================

create or replace function
public.create_billing_checkout_session(
  p_organization_id uuid,
  p_provider text,
  p_reference_id text,
  p_plan_slug text,
  p_billing_interval text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  checkout_session_id uuid,
  organization_id uuid,
  provider text,
  reference_id text,
  plan_id uuid,
  plan_slug text,
  billing_interval text,
  amount numeric,
  currency text,
  status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
#variable_conflict use_column
declare
  v_plan public.billing_plans%rowtype;
  v_existing public.billing_checkout_sessions%rowtype;
  v_amount numeric;
  v_currency text;
  v_session public.billing_checkout_sessions%rowtype;
  v_provider text;
  v_reference_id text;
  v_plan_slug text;
begin
  if p_organization_id is null then
    raise exception
      'organization id is required';
  end if;

  v_provider :=
    lower(
      btrim(
        coalesce(
          p_provider,
          ''
        )
      )
    );

  v_reference_id :=
    btrim(
      coalesce(
        p_reference_id,
        ''
      )
    );

  v_plan_slug :=
    btrim(
      coalesce(
        p_plan_slug,
        ''
      )
    );

  if length(v_provider) = 0 then
    raise exception
      'provider is required';
  end if;

  if length(v_reference_id) = 0 then
    raise exception
      'reference id is required';
  end if;

  if length(v_reference_id) > 120 then
    raise exception
      'reference id is too long';
  end if;

  if length(v_plan_slug) = 0 then
    raise exception
      'plan slug is required';
  end if;

  if v_plan_slug not in (
    'starter',
    'pro'
  ) then
    raise exception
      'unsupported commercial plan';
  end if;

  if p_billing_interval not in (
    'monthly',
    'annual'
  ) then
    raise exception
      'unsupported billing interval';
  end if;

  if jsonb_typeof(
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
  ) <> 'object' then
    raise exception
      'metadata must be a json object';
  end if;

  if not exists (
    select 1
    from public.organizations o
    where o.id = p_organization_id
  ) then
    raise exception
      'organization not found';
  end if;

  select p.*
  into v_plan
  from public.billing_plans p
  where p.slug = v_plan_slug
    and p.is_active
  limit 1;

  if v_plan.id is null then
    raise exception
      'billing plan not found or inactive';
  end if;

  v_currency :=
    upper(
      btrim(
        coalesce(
          v_plan.currency,
          ''
        )
      )
    );

  if length(v_currency) = 0 then
    raise exception
      'billing plan currency is missing';
  end if;

  if p_billing_interval = 'monthly' then
    v_amount :=
      v_plan.price_monthly;
  end if;

  if p_billing_interval = 'annual' then
    v_amount :=
      v_plan.price_annual;
  end if;

  if v_amount is null
     or v_amount <= 0 then
    raise exception
      'billing plan price is missing or invalid';
  end if;

  insert into public.billing_checkout_sessions (
    organization_id,
    plan_id,
    provider,
    reference_id,
    plan_slug,
    billing_interval,
    amount,
    currency,
    status,
    metadata
  )
  values (
    p_organization_id,
    v_plan.id,
    v_provider,
    v_reference_id,
    v_plan_slug,
    p_billing_interval,
    v_amount,
    v_currency,
    'created',
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
  )
  on conflict (
    provider,
    reference_id
  )
  do nothing
  returning *
  into v_session;

  if v_session.id is not null then
    return query
    select
      v_session.id,
      v_session.organization_id,
      v_session.provider,
      v_session.reference_id,
      v_session.plan_id,
      v_session.plan_slug,
      v_session.billing_interval,
      v_session.amount,
      v_session.currency,
      v_session.status;

    return;
  end if;

  select s.*
  into v_existing
  from public.billing_checkout_sessions s
  where s.provider =
        v_provider
    and s.reference_id =
        v_reference_id;

  if v_existing.id is null then
    raise exception
      'checkout reference conflict could not be resolved';
  end if;

  if v_existing.organization_id
       <> p_organization_id
     or v_existing.plan_id
       <> v_plan.id
     or v_existing.plan_slug
       <> v_plan_slug
     or v_existing.billing_interval
       <> p_billing_interval then

    raise exception
      'checkout reference already exists with different attributes';
  end if;

  return query
  select
    v_existing.id,
    v_existing.organization_id,
    v_existing.provider,
    v_existing.reference_id,
    v_existing.plan_id,
    v_existing.plan_slug,
    v_existing.billing_interval,
    v_existing.amount,
    v_existing.currency,
    v_existing.status;
end;
$function$;

-- ============================================================
-- 5. ATTACH PROVIDER SESSION
-- ============================================================

create or replace function
public.attach_billing_checkout_provider_session(
  p_checkout_session_id uuid,
  p_external_session_id text,
  p_checkout_url text,
  p_expires_at timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_session public.billing_checkout_sessions%rowtype;
begin
  if p_checkout_session_id is null then
    raise exception
      'checkout session id is required';
  end if;

  if length(
    btrim(
      coalesce(
        p_external_session_id,
        ''
      )
    )
  ) = 0 then
    raise exception
      'external session id is required';
  end if;

  if length(
    btrim(
      coalesce(
        p_checkout_url,
        ''
      )
    )
  ) = 0 then
    raise exception
      'checkout url is required';
  end if;

  select s.*
  into v_session
  from public.billing_checkout_sessions s
  where s.id =
        p_checkout_session_id
  for update;

  if v_session.id is null then
    return 'missing_session';
  end if;

  if v_session.status = 'ready' then

    if v_session.external_session_id =
         btrim(p_external_session_id)
       and v_session.checkout_url =
         btrim(p_checkout_url) then

      return 'already_ready';
    end if;

    raise exception
      'checkout session already attached to a different provider session';
  end if;

  if v_session.status <> 'created' then
    return
      'session_not_attachable';
  end if;

  update public.billing_checkout_sessions
  set
    status = 'ready',
    external_session_id =
      btrim(p_external_session_id),
    checkout_url =
      btrim(p_checkout_url),
    expires_at =
      p_expires_at,
    provider_session_created_at =
      now(),
    updated_at =
      now()
  where id =
        p_checkout_session_id;

  return 'ready';
end;
$function$;


-- ============================================================
-- 6. MARK CHECKOUT CREATION FAILURE
-- ============================================================
--
-- Do not persist raw credentials or unsafe provider errors.
-- failure_code should be a controlled internal classification.
-- ============================================================

create or replace function
public.fail_billing_checkout_session(
  p_checkout_session_id uuid,
  p_failure_code text,
  p_metadata jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_session public.billing_checkout_sessions%rowtype;
begin
  if p_checkout_session_id is null then
    raise exception
      'checkout session id is required';
  end if;

  if length(
    btrim(
      coalesce(
        p_failure_code,
        ''
      )
    )
  ) = 0 then
    raise exception
      'failure code is required';
  end if;

  if jsonb_typeof(
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
  ) <> 'object' then
    raise exception
      'metadata must be a json object';
  end if;

  select s.*
  into v_session
  from public.billing_checkout_sessions s
  where s.id =
        p_checkout_session_id
  for update;

  if v_session.id is null then
    return 'missing_session';
  end if;

  if v_session.status = 'failed' then
    return 'already_failed';
  end if;

  if v_session.status <> 'created' then
    return 'session_not_failable';
  end if;

  update public.billing_checkout_sessions
  set
    status = 'failed',
    failure_code =
      btrim(p_failure_code),
    metadata =
      coalesce(
        public.billing_checkout_sessions.metadata,
        '{}'::jsonb
      )
      ||
      coalesce(
        p_metadata,
        '{}'::jsonb
      ),
    updated_at =
      now()
  where id =
        p_checkout_session_id;

  return 'failed';
end;
$function$;


-- ============================================================
-- 7. RPC ACCESS BOUNDARY
-- ============================================================

revoke all
on function public.create_billing_checkout_session(
  uuid,
  text,
  text,
  text,
  text,
  jsonb
)
from public, anon, authenticated;


grant execute
on function public.create_billing_checkout_session(
  uuid,
  text,
  text,
  text,
  text,
  jsonb
)
to service_role;


revoke all
on function public.attach_billing_checkout_provider_session(
  uuid,
  text,
  text,
  timestamptz
)
from public, anon, authenticated;


grant execute
on function public.attach_billing_checkout_provider_session(
  uuid,
  text,
  text,
  timestamptz
)
to service_role;


revoke all
on function public.fail_billing_checkout_session(
  uuid,
  text,
  jsonb
)
from public, anon, authenticated;


grant execute
on function public.fail_billing_checkout_session(
  uuid,
  text,
  jsonb
)
to service_role;


-- ============================================================
-- 8. COMMENTS
-- ============================================================

comment on table
public.billing_checkout_sessions is
  'Provider-neutral server-controlled billing checkout attempts. Price and currency are authoritative snapshots resolved from billing_plans.';


comment on function
public.create_billing_checkout_session(
  uuid,
  text,
  text,
  text,
  text,
  jsonb
) is
  'Creates or reuses an idempotent server-side checkout session while resolving authoritative commercial pricing from billing_plans.';


comment on function
public.attach_billing_checkout_provider_session(
  uuid,
  text,
  text,
  timestamptz
) is
  'Attaches a payment-provider session/token and checkout URL to a previously persisted checkout attempt.';


comment on function
public.fail_billing_checkout_session(
  uuid,
  text,
  jsonb
) is
  'Marks a newly-created checkout attempt failed using a controlled internal failure classification.';
