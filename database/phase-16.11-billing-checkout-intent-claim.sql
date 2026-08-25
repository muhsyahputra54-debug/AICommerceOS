-- ============================================================
-- LAKUVO / AICommerceOS
-- PHASE 16.11-G2A
-- PROVIDER-NEUTRAL CHECKOUT INTENT CLAIM
--
-- SOURCE MIGRATION ONLY.
-- DO NOT APPLY TO SUPABASE YET.
--
-- Goals:
-- - serialize one open checkout intent per
--   organization + provider + plan + billing interval
-- - reuse a valid ready checkout without a provider API call
-- - return in_progress while another request owns fresh creation
-- - reclaim a stale created row after a bounded lease window
-- - create a new checkout reference only when no reusable/open
--   attempt exists
--
-- No provider-specific token/credential is stored here.
-- ============================================================

create or replace function
public.claim_billing_checkout_intent(
  p_organization_id uuid,
  p_provider text,
  p_plan_slug text,
  p_billing_interval text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  claim_result text,
  checkout_session_id uuid,
  organization_id uuid,
  provider text,
  reference_id text,
  plan_id uuid,
  plan_slug text,
  billing_interval text,
  amount numeric,
  currency text,
  status text,
  external_session_id text,
  checkout_url text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$

declare
  v_plan public.billing_plans%rowtype;
  v_existing public.billing_checkout_sessions%rowtype;
  v_session public.billing_checkout_sessions%rowtype;

  v_provider text;
  v_plan_slug text;
  v_interval text;
  v_currency text;
  v_reference_id text;
  v_amount numeric;

  -- A created checkout updated inside this window is considered
  -- actively owned by another HTTP request. This avoids a second
  -- provider-session creation call during double-click/retry races.
  v_creation_lease interval :=
    interval '5 minutes';

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

  v_plan_slug :=
    btrim(
      coalesce(
        p_plan_slug,
        ''
      )
    );

  v_interval :=
    btrim(
      coalesce(
        p_billing_interval,
        ''
      )
    );


  if length(v_provider) = 0 then
    raise exception
      'provider is required';
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

  if v_interval not in (
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
    where o.id =
          p_organization_id
  ) then
    raise exception
      'organization not found';
  end if;


  select p.*
  into v_plan
  from public.billing_plans p
  where p.slug =
        v_plan_slug
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


  if v_interval = 'monthly' then
    v_amount :=
      v_plan.price_monthly;
  end if;

  if v_interval = 'annual' then
    v_amount :=
      v_plan.price_annual;
  end if;


  if v_amount is null
     or v_amount <= 0 then
    raise exception
      'billing plan price is missing or invalid';
  end if;


  -- ==========================================================
  -- Serialize one checkout intent.
  --
  -- The lock exists only for this RPC transaction. Durable
  -- ownership after return is represented by a fresh `created`
  -- row whose updated_at acts as a bounded creation lease.
  -- ==========================================================

  perform pg_advisory_xact_lock(
    hashtextextended(
      concat_ws(
        '|',
        'billing-checkout-intent-v1',
        p_organization_id::text,
        v_provider,
        v_plan_slug,
        v_interval
      ),
      0
    )
  );


  -- ==========================================================
  -- 1. Reuse a valid provider session that is already ready.
  -- ==========================================================

  v_existing := null;

  select s.*
  into v_existing
  from public.billing_checkout_sessions s
  where s.organization_id =
        p_organization_id
    and s.provider =
        v_provider
    and s.plan_id =
        v_plan.id
    and s.plan_slug =
        v_plan_slug
    and s.billing_interval =
        v_interval
    and s.amount =
        v_amount
    and s.currency =
        v_currency
    and s.status =
        'ready'
    and s.external_session_id is not null
    and btrim(s.external_session_id) <> ''
    and s.checkout_url is not null
    and btrim(s.checkout_url) <> ''
    and (
      s.expires_at is null
      or s.expires_at > now()
    )
  order by
    s.created_at desc
  limit 1
  for update;


  if v_existing.id is not null then

    return query
    select
      'reused_ready'::text,
      v_existing.id,
      v_existing.organization_id,
      v_existing.provider,
      v_existing.reference_id,
      v_existing.plan_id,
      v_existing.plan_slug,
      v_existing.billing_interval,
      v_existing.amount,
      v_existing.currency,
      v_existing.status,
      v_existing.external_session_id,
      v_existing.checkout_url,
      v_existing.expires_at;

    return;
  end if;


  -- ==========================================================
  -- 2. Reuse/serialize a checkout whose provider session is
  --    still being created.
  --
  -- Fresh created row -> another request is in progress.
  -- Stale created row -> this request reclaims creation.
  -- ==========================================================

  v_existing := null;

  select s.*
  into v_existing
  from public.billing_checkout_sessions s
  where s.organization_id =
        p_organization_id
    and s.provider =
        v_provider
    and s.plan_id =
        v_plan.id
    and s.plan_slug =
        v_plan_slug
    and s.billing_interval =
        v_interval
    and s.amount =
        v_amount
    and s.currency =
        v_currency
    and s.status =
        'created'
    and s.external_session_id is null
    and s.checkout_url is null
  order by
    s.created_at desc
  limit 1
  for update;


  if v_existing.id is not null then

    if v_existing.updated_at >
       now() - v_creation_lease then

      return query
      select
        'in_progress'::text,
        v_existing.id,
        v_existing.organization_id,
        v_existing.provider,
        v_existing.reference_id,
        v_existing.plan_id,
        v_existing.plan_slug,
        v_existing.billing_interval,
        v_existing.amount,
        v_existing.currency,
        v_existing.status,
        v_existing.external_session_id,
        v_existing.checkout_url,
        v_existing.expires_at;

      return;
    end if;


    update public.billing_checkout_sessions
    set
      metadata =
        coalesce(
          public.billing_checkout_sessions.metadata,
          '{}'::jsonb
        )
        ||
        coalesce(
          p_metadata,
          '{}'::jsonb
        )
        ||
        jsonb_build_object(
          'checkout_intent_version',
            1,
          'provider_creation_claimed_at',
            now(),
          'provider_creation_reclaimed',
            true
        ),

      updated_at =
        now()

    where id =
          v_existing.id

    returning *
    into v_session;


    return query
    select
      'reclaimed_stale'::text,
      v_session.id,
      v_session.organization_id,
      v_session.provider,
      v_session.reference_id,
      v_session.plan_id,
      v_session.plan_slug,
      v_session.billing_interval,
      v_session.amount,
      v_session.currency,
      v_session.status,
      v_session.external_session_id,
      v_session.checkout_url,
      v_session.expires_at;

    return;
  end if;


  -- ==========================================================
  -- 3. No reusable/open attempt exists.
  --    Create a new authoritative checkout row.
  -- ==========================================================

  v_reference_id :=
    'lkv_'
    ||
    replace(
      gen_random_uuid()::text,
      '-',
      ''
    );


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
    v_interval,
    v_amount,
    v_currency,
    'created',
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
    ||
    jsonb_build_object(
      'checkout_intent_version',
        1,
      'provider_creation_claimed_at',
        now(),
      'provider_creation_reclaimed',
        false
    )
  )
  returning *
  into v_session;


  return query
  select
    'created_claimed'::text,
    v_session.id,
    v_session.organization_id,
    v_session.provider,
    v_session.reference_id,
    v_session.plan_id,
    v_session.plan_slug,
    v_session.billing_interval,
    v_session.amount,
    v_session.currency,
    v_session.status,
    v_session.external_session_id,
    v_session.checkout_url,
    v_session.expires_at;

end;

$function$;


-- ============================================================
-- SECURITY BOUNDARY
-- ============================================================

revoke all
on function
  public.claim_billing_checkout_intent(
    uuid,
    text,
    text,
    text,
    jsonb
  )
from public;

revoke all
on function
  public.claim_billing_checkout_intent(
    uuid,
    text,
    text,
    text,
    jsonb
  )
from anon;

revoke all
on function
  public.claim_billing_checkout_intent(
    uuid,
    text,
    text,
    text,
    jsonb
  )
from authenticated;

revoke all
on function
  public.claim_billing_checkout_intent(
    uuid,
    text,
    text,
    text,
    jsonb
  )
from service_role;


grant execute
on function
  public.claim_billing_checkout_intent(
    uuid,
    text,
    text,
    text,
    jsonb
  )
to service_role;


comment on function
  public.claim_billing_checkout_intent(
    uuid,
    text,
    text,
    text,
    jsonb
  )
is
  'Provider-neutral checkout intent claim. Reuses ready sessions, serializes fresh provider-session creation, and bounds stale created-session reclamation before any external payment-provider call.';
