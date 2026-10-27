-- LAKUVO SECURITY DEFINER P0 privilege boundary
--
-- Scope:
-- - server-only billing, AI metering, marketplace sync/webhook RPCs
-- - system-only RLS event-trigger function
--
-- This migration changes privileges only. Function bodies, signatures, business
-- rules, and application flows are intentionally unchanged.

-- Billing checkout/webhook server-only RPCs.
REVOKE EXECUTE ON FUNCTION public.activate_billing_checkout_entitlement(uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_billing_checkout_entitlement(uuid)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.attach_billing_checkout_provider_session(uuid, text, text, timestamp with time zone)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_billing_checkout_provider_session(uuid, text, text, timestamp with time zone)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.fail_billing_checkout_session(uuid, text, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_billing_checkout_session(uuid, text, jsonb)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_billing_checkout_payment_event(uuid, text, text, text, text, text, numeric, text, text, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_billing_checkout_payment_event(uuid, text, text, text, text, text, numeric, text, text, jsonb)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_billing_subscription_event(uuid, text, text, text, text, text, text, timestamp with time zone, timestamp with time zone, timestamp with time zone, boolean, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_billing_subscription_event(uuid, text, text, text, text, text, text, timestamp with time zone, timestamp with time zone, timestamp with time zone, boolean, jsonb)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_billing_webhook_event(uuid, text, text, text, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_billing_webhook_event(uuid, text, text, text, jsonb)
TO service_role;

-- AI metering is persisted only by trusted server runtime after provider execution.
REVOKE EXECUTE ON FUNCTION public.record_ai_usage(uuid, uuid, text, text, text, text, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ai_usage(uuid, uuid, text, text, text, text, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, jsonb)
TO service_role;

-- Marketplace sync/webhook RPCs are invoked by server routes through the admin
-- client. Caller-supplied p_user_id remains a business membership input, not an
-- authentication boundary.
REVOKE EXECUTE ON FUNCTION public.claim_marketplace_webhook_events(uuid, uuid, uuid, integer)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_marketplace_webhook_events(uuid, uuid, uuid, integer)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.complete_marketplace_webhook_event(uuid, uuid, uuid, uuid, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_marketplace_webhook_event(uuid, uuid, uuid, uuid, text, text)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_marketplace_order_sync_context(uuid, uuid, uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_order_sync_context(uuid, uuid, uuid)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_marketplace_product_sync_context(uuid, uuid, uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_product_sync_context(uuid, uuid, uuid)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_marketplace_webhook_event(text, text, text, text, integer, text, text, timestamp with time zone, text, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_marketplace_webhook_event(text, text, text, text, integer, text, text, timestamp with time zone, text, jsonb)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.upsert_marketplace_catalog_page(uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_marketplace_catalog_page(uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.upsert_marketplace_external_order_page(uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_marketplace_external_order_page(uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean)
TO service_role;

-- Event-trigger implementation is system-owned. It is not an application RPC.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()
FROM PUBLIC, anon, authenticated, service_role;
