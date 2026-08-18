-- Phase 16.10 - Public Billing Plan Catalog
--
-- Purpose:
-- - Keep internal/default plans available for subscription fallback.
-- - Expose only active + public plans in customer-facing Plan Catalog.
--
-- Provider checkout remains intentionally disabled until
-- the payment-provider adapter is implemented and verified.

create or replace function public.get_billing_overview(
  p_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_period_start timestamptz;

  v_subscription jsonb := null;
  v_plan jsonb := null;

  v_usage jsonb := '{}'::jsonb;

  v_usage_updated_at timestamptz := null;

  v_plans jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception
      'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'Organization is required';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'Organization access denied';
  end if;

  v_period_start :=
    date_trunc(
      'month',
      now()
    );

  select
    jsonb_build_object(
      'id',
      s.id,

      'status',
      s.status,

      'provider',
      s.provider,

      'provider_customer_id',
      s.provider_customer_id,

      'provider_subscription_id',
      s.provider_subscription_id,

      'current_period_start',
      s.current_period_start,

      'current_period_end',
      s.current_period_end,

      'trial_ends_at',
      s.trial_ends_at,

      'cancel_at_period_end',
      s.cancel_at_period_end
    ),

    jsonb_build_object(
      'id',
      p.id,

      'slug',
      p.slug,

      'name',
      p.name,

      'description',
      p.description,

      'currency',
      p.currency,

      'price_monthly',
      p.price_monthly,

      'price_annual',
      p.price_annual,

      'features',
      p.features,

      'limits',
      p.limits
    )

  into
    v_subscription,
    v_plan

  from public.organization_subscriptions s

  join public.billing_plans p
    on p.id = s.plan_id

  where s.organization_id =
    p_organization_id

  limit 1;

  -- Safety fallback if an organization was created without
  -- a subscription row for any reason.
  if v_plan is null then

    select
      jsonb_build_object(
        'id',
        p.id,

        'slug',
        p.slug,

        'name',
        p.name,

        'description',
        p.description,

        'currency',
        p.currency,

        'price_monthly',
        p.price_monthly,

        'price_annual',
        p.price_annual,

        'features',
        p.features,

        'limits',
        p.limits
      )

    into v_plan

    from public.billing_plans p

    where p.slug =
      'default'

    limit 1;

  end if;

  select
    bu.metrics,
    bu.updated_at

  into
    v_usage,
    v_usage_updated_at

  from public.billing_usage bu

  where bu.organization_id =
      p_organization_id

    and bu.period_start =
      v_period_start

  limit 1;

  if v_usage is null then
    v_usage :=
      '{}'::jsonb;
  end if;

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id',
          p.id,

          'slug',
          p.slug,

          'name',
          p.name,

          'description',
          p.description,

          'currency',
          p.currency,

          'price_monthly',
          p.price_monthly,

          'price_annual',
          p.price_annual,

          'features',
          p.features,

          'limits',
          p.limits,

          'is_public',
          p.is_public
        )
        order by
          p.sort_order,
          p.name
      ),
      '[]'::jsonb
    )

  into v_plans

  from public.billing_plans p

  where p.is_active
    and p.is_public;

  return jsonb_build_object(
    'subscription',
    v_subscription,

    'plan',
    v_plan,

    'usage',
    v_usage,

    'usage_updated_at',
    v_usage_updated_at,

    'period',
    jsonb_build_object(
      'start',
      v_period_start,

      'end',
      v_period_start +
        interval '1 month'
    ),

    'plans',
    v_plans,

    'provider_checkout_configured',
    false
  );
end;
$function$;
