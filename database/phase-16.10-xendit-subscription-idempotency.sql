-- Phase 16.10 - Payment provider subscription idempotency
--
-- Prevent one external provider subscription from being linked
-- to more than one LAKUVO organization subscription.
--
-- NULL / blank provider_subscription_id values are intentionally
-- excluded because an internal subscription may exist before a
-- payment-provider subscription has been created.

create unique index if not exists
  organization_subscriptions_provider_subscription_key
on public.organization_subscriptions (
  provider,
  provider_subscription_id
)
where provider_subscription_id is not null
  and btrim(provider_subscription_id) <> '';
