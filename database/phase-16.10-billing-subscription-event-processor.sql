-- Phase 16.10 - Billing subscription event processor
--
-- Atomically applies a normalized provider subscription event.
--
-- Expected flow:
--   authenticated provider webhook
--   -> record_billing_webhook_event() = received
--   -> process_billing_subscription_event()
--   -> organization_subscriptions updated
--   -> billing_events = processed
--
-- Provider-specific HTTP/signature handling remains outside SQL.

create or replace function public.process_billing_subscription_event(
  p_organization_id uuid,
  p_provider text,
  p_external_event_id text,
  p_plan_slug text,
  p_provider_customer_id text,
  p_provider_subscription_id text,
  p_subscription_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_trial_ends_at timestamptz,
  p_cancel_at_period_end boolean,
  p_metadata jsonb
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.billing_events%rowtype;
  v_plan public.billing_plans%rowtype;
begin
  if p_organization_id is null then
    raise exception 'organization id is required';
  end if;

  if length(btrim(coalesce(p_provider, ''))) = 0 then
    raise exception 'provider is required';
  end if;

  if length(btrim(coalesce(p_external_event_id, ''))) = 0 then
    raise exception 'external event id is required';
  end if;

  if length(btrim(coalesce(p_plan_slug, ''))) = 0 then
    raise exception 'plan slug is required';
  end if;

  if length(
    btrim(coalesce(p_provider_subscription_id, ''))
  ) = 0 then
    raise exception 'provider subscription id is required';
  end if;

  if length(
    btrim(coalesce(p_subscription_status, ''))
  ) = 0 then
    raise exception 'subscription status is required';
  end if;

  if p_plan_slug not in ('starter', 'pro') then
    raise exception 'unsupported commercial plan';
  end if;

  if p_subscription_status not in (
    'active',
    'canceled',
    'incomplete',
    'past_due',
    'trialing'
  ) then
    raise exception 'invalid subscription status';
  end if;

  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'metadata must be a json object';
  end if;

  select e.*
  into v_event
  from public.billing_events e
  where e.organization_id = p_organization_id
    and e.provider = lower(btrim(p_provider))
    and e.external_event_id = btrim(p_external_event_id)
  for update;

  if v_event.id is null then
    return 'missing_event';
  end if;

  if v_event.status = 'processed' then
    return 'already_processed';
  end if;

  if v_event.status <> 'received' then
    return 'event_not_processable';
  end if;

  select p.*
  into v_plan
  from public.billing_plans p
  where p.slug = btrim(p_plan_slug)
    and p.is_active
  limit 1;

  if v_plan.id is null then
    raise exception 'billing plan not found or inactive';
  end if;

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
    p_organization_id,
    v_plan.id,
    lower(btrim(p_provider)),
    nullif(btrim(coalesce(p_provider_customer_id, '')), ''),
    nullif(btrim(coalesce(p_provider_subscription_id, '')), ''),
    p_subscription_status,
    p_current_period_start,
    p_current_period_end,
    p_trial_ends_at,
    coalesce(p_cancel_at_period_end, false),
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (organization_id)
  do update set
    plan_id = excluded.plan_id,
    provider = excluded.provider,
    provider_customer_id = excluded.provider_customer_id,
    provider_subscription_id = excluded.provider_subscription_id,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    trial_ends_at = excluded.trial_ends_at,
    cancel_at_period_end = excluded.cancel_at_period_end,
    metadata =
      coalesce(public.organization_subscriptions.metadata, '{}'::jsonb)
      || excluded.metadata,
    updated_at = now();

  update public.billing_events
  set
    status = 'processed',
    processed_at = now()
  where id = v_event.id;

  return 'processed';
end;
$$;

revoke all on function public.process_billing_subscription_event(
  uuid, text, text, text, text, text, text,
  timestamptz, timestamptz, timestamptz, boolean, jsonb
) from public, anon, authenticated;

grant execute on function public.process_billing_subscription_event(
  uuid, text, text, text, text, text, text,
  timestamptz, timestamptz, timestamptz, boolean, jsonb
) to service_role;

comment on function public.process_billing_subscription_event(
  uuid, text, text, text, text, text, text,
  timestamptz, timestamptz, timestamptz, boolean, jsonb
) is
  'Atomically applies a normalized commercial subscription event and marks its billing inbox event processed.';
