-- ============================================================
-- LAKUVO
-- Phase 16.11-F3 - Completed checkout -> paid entitlement
-- ============================================================
--
-- Provider-neutral entitlement activation for verified,
-- completed billing checkout sessions.
--
-- Important:
-- - A payment transaction is NOT a recurring subscription id.
-- - provider_subscription_id remains NULL for one-time checkout.
-- - One checkout may activate entitlement only once.
-- - Same-plan early renewal extends the existing paid period.
-- - Active cross-plan changes are held for explicit policy.
-- - Browser input is never trusted by this function.
-- ============================================================


-- ============================================================
-- 1. ENTITLEMENT ACTIVATION LEDGER
-- ============================================================

create table if not exists
public.billing_checkout_entitlement_activations (
  id uuid primary key
    default gen_random_uuid(),

  checkout_session_id uuid not null
    references public.billing_checkout_sessions(id)
    on delete cascade,

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  plan_id uuid not null
    references public.billing_plans(id),

  provider text not null,

  reference_id text not null,

  billing_interval text not null,

  status text not null
    default 'pending',

  result_code text,

  entitlement_period_start timestamptz,

  entitlement_period_end timestamptz,

  applied_at timestamptz,

  metadata jsonb not null
    default '{}'::jsonb,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint
    billing_checkout_entitlement_activations_provider_not_blank
    check (
      length(btrim(provider)) > 0
    ),

  constraint
    billing_checkout_entitlement_activations_reference_not_blank
    check (
      length(btrim(reference_id)) > 0
    ),

  constraint
    billing_checkout_entitlement_activations_interval_check
    check (
      billing_interval in (
        'monthly',
        'annual'
      )
    ),

  constraint
    billing_checkout_entitlement_activations_status_check
    check (
      status in (
        'pending',
        'applied',
        'policy_hold'
      )
    ),

  constraint
    billing_checkout_entitlement_activations_metadata_object
    check (
      jsonb_typeof(metadata) = 'object'
    ),

  constraint
    billing_checkout_entitlement_activations_applied_contract
    check (
      (
        status <> 'applied'
      )
      or
      (
        applied_at is not null
        and entitlement_period_start is not null
        and entitlement_period_end is not null
        and entitlement_period_end
              > entitlement_period_start
      )
    )
);


create unique index if not exists
  billing_checkout_entitlement_activations_checkout_key
on public.billing_checkout_entitlement_activations (
  checkout_session_id
);


create index if not exists
  billing_checkout_entitlement_activations_org_created_idx
on public.billing_checkout_entitlement_activations (
  organization_id,
  created_at desc
);


create index if not exists
  billing_checkout_entitlement_activations_status_idx
on public.billing_checkout_entitlement_activations (
  status,
  created_at
);


-- ============================================================
-- 2. SECURITY
-- ============================================================

alter table
  public.billing_checkout_entitlement_activations
enable row level security;


revoke all
on table public.billing_checkout_entitlement_activations
from public, anon, authenticated, service_role;


-- ============================================================
-- 3. COMPLETED CHECKOUT -> ENTITLEMENT RPC
-- ============================================================

create or replace function
public.activate_billing_checkout_entitlement(
  p_checkout_session_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_checkout
    public.billing_checkout_sessions%rowtype;

  v_plan
    public.billing_plans%rowtype;

  v_existing_subscription
    public.organization_subscriptions%rowtype;

  v_existing_plan_slug text;

  v_activation
    public.billing_checkout_entitlement_activations%rowtype;

  v_entitlement_start timestamptz;
  v_entitlement_end timestamptz;

  v_subscription_start timestamptz;

  v_result_code text;
begin

  -- ----------------------------------------------------------
  -- Input
  -- ----------------------------------------------------------

  if p_checkout_session_id is null then
    raise exception
      'checkout session id is required';
  end if;


  -- ----------------------------------------------------------
  -- Authoritative checkout lock
  -- ----------------------------------------------------------

  select c.*
  into v_checkout
  from public.billing_checkout_sessions c
  where c.id = p_checkout_session_id
  for update;


  if v_checkout.id is null then
    return 'missing_checkout';
  end if;


  if v_checkout.status <> 'completed' then
    return 'checkout_not_completed';
  end if;


  if v_checkout.completed_at is null then
    return 'checkout_completion_missing';
  end if;


  if length(
    btrim(
      coalesce(
        v_checkout.provider_transaction_id,
        ''
      )
    )
  ) = 0 then
    return 'provider_transaction_missing';
  end if;


  if v_checkout.plan_slug not in (
    'starter',
    'pro'
  ) then
    return 'unsupported_commercial_plan';
  end if;


  if v_checkout.billing_interval not in (
    'monthly',
    'annual'
  ) then
    return 'unsupported_billing_interval';
  end if;


  -- ----------------------------------------------------------
  -- Authoritative billing plan
  -- ----------------------------------------------------------

  select p.*
  into v_plan
  from public.billing_plans p
  where p.id = v_checkout.plan_id
    and p.slug = v_checkout.plan_slug
    and p.is_active
  limit 1;


  if v_plan.id is null then
    return 'billing_plan_not_available';
  end if;


  -- ----------------------------------------------------------
  -- Idempotency ledger
  -- ----------------------------------------------------------

  insert into
    public.billing_checkout_entitlement_activations (
      checkout_session_id,
      organization_id,
      plan_id,
      provider,
      reference_id,
      billing_interval,
      status,
      metadata
    )
  values (
    v_checkout.id,
    v_checkout.organization_id,
    v_checkout.plan_id,
    lower(btrim(v_checkout.provider)),
    v_checkout.reference_id,
    v_checkout.billing_interval,
    'pending',
    jsonb_build_object(
      'entitlement_source',
        'completed_checkout',
      'checkout_session_id',
        v_checkout.id,
      'checkout_reference_id',
        v_checkout.reference_id,
      'billing_interval',
        v_checkout.billing_interval,
      'payment_provider',
        lower(btrim(v_checkout.provider))
    )
  )
  on conflict (checkout_session_id)
  do nothing;


  select a.*
  into v_activation
  from public.billing_checkout_entitlement_activations a
  where a.checkout_session_id = v_checkout.id
  for update;


  if v_activation.id is null then
    raise exception
      'entitlement activation ledger unavailable';
  end if;


  if v_activation.status = 'applied' then
    return 'already_applied';
  end if;


  if v_activation.status = 'policy_hold' then
    return coalesce(
      nullif(
        btrim(v_activation.result_code),
        ''
      ),
      'policy_hold'
    );
  end if;


  -- ----------------------------------------------------------
  -- Lock current organization subscription
  -- ----------------------------------------------------------

  select s.*
  into v_existing_subscription
  from public.organization_subscriptions s
  where s.organization_id =
        v_checkout.organization_id
  for update;


  v_existing_plan_slug := null;


  if v_existing_subscription.organization_id
     is not null then

    select p.slug
    into v_existing_plan_slug
    from public.billing_plans p
    where p.id =
          v_existing_subscription.plan_id
    limit 1;

  end if;


  -- ----------------------------------------------------------
  -- Cross-plan paid change:
  -- do not invent upgrade/downgrade or proration rules.
  -- ----------------------------------------------------------

  if
    v_existing_subscription.organization_id
      is not null

    and v_existing_subscription.status
      in ('active', 'trialing')

    and v_existing_plan_slug
      in ('starter', 'pro')

    and v_existing_plan_slug
      <> v_checkout.plan_slug

    and v_existing_subscription.current_period_end
      is not null

    and v_existing_subscription.current_period_end
      > v_checkout.completed_at
  then

    update
      public.billing_checkout_entitlement_activations
    set
      status = 'policy_hold',
      result_code =
        'active_paid_plan_change_requires_policy',
      updated_at = now()
    where id = v_activation.id;


    return
      'active_paid_plan_change_requires_policy';

  end if;


  -- ----------------------------------------------------------
  -- Period calculation
  --
  -- Same-plan active renewal:
  -- purchased period starts after the current paid period.
  --
  -- New / expired / different inactive plan:
  -- purchased period starts at completed_at.
  -- ----------------------------------------------------------

  v_entitlement_start :=
    v_checkout.completed_at;


  v_subscription_start :=
    v_checkout.completed_at;


  if
    v_existing_subscription.organization_id
      is not null

    and v_existing_subscription.status
      in ('active', 'trialing')

    and v_existing_plan_slug
      = v_checkout.plan_slug

    and v_existing_subscription.current_period_end
      is not null

    and v_existing_subscription.current_period_end
      > v_checkout.completed_at
  then

    v_entitlement_start :=
      v_existing_subscription.current_period_end;


    v_subscription_start :=
      coalesce(
        v_existing_subscription.current_period_start,
        v_checkout.completed_at
      );

  end if;


  if v_checkout.billing_interval = 'monthly' then
    v_entitlement_end :=
      v_entitlement_start
      + interval '1 month';
  end if;


  if v_checkout.billing_interval = 'annual' then
    v_entitlement_end :=
      v_entitlement_start
      + interval '1 year';
  end if;


  if v_entitlement_end is null
     or v_entitlement_end
        <= v_entitlement_start then
    raise exception
      'entitlement period calculation failed';
  end if;


  -- ----------------------------------------------------------
  -- Result classification
  -- ----------------------------------------------------------

  v_result_code := 'activated';


  if
    v_existing_subscription.organization_id
      is not null

    and v_existing_plan_slug
      = v_checkout.plan_slug

    and v_existing_subscription.status
      in ('active', 'trialing')

    and v_existing_subscription.current_period_end
      is not null

    and v_existing_subscription.current_period_end
      > v_checkout.completed_at
  then
    v_result_code := 'renewed';
  end if;


  -- ----------------------------------------------------------
  -- Paid entitlement
  --
  -- Midtrans/Snap payment transaction is deliberately NOT used
  -- as provider_subscription_id.
  -- ----------------------------------------------------------

  insert into public.organization_subscriptions (
    organization_id,
    plan_id,
    provider,
    provider_customer_id,
    provider_subscription_id,
    status,
    current_period_start,
    current_period_end,
    trial_ends_at,
    cancel_at_period_end,
    metadata,
    updated_at
  )
  values (
    v_checkout.organization_id,
    v_checkout.plan_id,
    lower(btrim(v_checkout.provider)),
    null,
    null,
    'active',
    v_subscription_start,
    v_entitlement_end,
    null,
    true,
    jsonb_build_object(
      'entitlement_source',
        'completed_checkout',
      'checkout_session_id',
        v_checkout.id,
      'checkout_reference_id',
        v_checkout.reference_id,
      'billing_interval',
        v_checkout.billing_interval,
      'payment_provider',
        lower(btrim(v_checkout.provider)),
      'last_entitlement_activation_result',
        v_result_code
    ),
    now()
  )
  on conflict (organization_id)
  do update set
    plan_id = excluded.plan_id,
    provider = excluded.provider,

    -- One-time checkout is not a recurring provider contract.
    provider_customer_id = null,
    provider_subscription_id = null,

    status = excluded.status,
    current_period_start =
      excluded.current_period_start,
    current_period_end =
      excluded.current_period_end,
    trial_ends_at = null,
    cancel_at_period_end = true,

    metadata =
      coalesce(
        public.organization_subscriptions.metadata,
        '{}'::jsonb
      )
      || excluded.metadata,

    updated_at = now();


  -- ----------------------------------------------------------
  -- Ledger applied
  -- ----------------------------------------------------------

  update
    public.billing_checkout_entitlement_activations
  set
    status = 'applied',
    result_code = v_result_code,
    entitlement_period_start =
      v_entitlement_start,
    entitlement_period_end =
      v_entitlement_end,
    applied_at = now(),
    updated_at = now()
  where id = v_activation.id;


  return v_result_code;
end;
$$;


-- ============================================================
-- 4. FUNCTION SECURITY
-- ============================================================

revoke all
on function
  public.activate_billing_checkout_entitlement(uuid)
from public, anon, authenticated;


grant execute
on function
  public.activate_billing_checkout_entitlement(uuid)
to service_role;


comment on function
  public.activate_billing_checkout_entitlement(uuid)
is
  'Idempotently activates or renews paid organization entitlement from an authoritative completed billing checkout without inventing a recurring provider subscription id.';


comment on table
  public.billing_checkout_entitlement_activations
is
  'Provider-neutral idempotency and audit ledger for completed checkout entitlement activation.';
