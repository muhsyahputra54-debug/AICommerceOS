-- LAKUVO SECURITY DEFINER P1 privilege boundary
--
-- Scope:
-- - remove anonymous/public EXECUTE from reviewed authenticated-user functions
-- - make reviewed server/internal functions service-role-only
-- - remove direct application-role EXECUTE from the inventory trigger implementation
--
-- Privilege-only migration: function bodies and business logic are unchanged.

-- ============================================================
-- A. Server-only functions
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.check_ai_allowance(uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_allowance(uuid)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.claim_billing_checkout_intent(uuid, text, text, text, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_billing_checkout_intent(uuid, text, text, text, jsonb)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.create_billing_checkout_session(uuid, text, text, text, text, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_billing_checkout_session(uuid, text, text, text, text, jsonb)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_ai_usage_summary(uuid, timestamp with time zone, timestamp with time zone)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_summary(uuid, timestamp with time zone, timestamp with time zone)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.provision_publishing_channel_destination(uuid, text, text, text, text, text[])
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_publishing_channel_destination(uuid, text, text, text, text, text[])
TO service_role;

REVOKE EXECUTE ON FUNCTION public.revoke_publishing_channel_destination(uuid, uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_publishing_channel_destination(uuid, uuid)
TO service_role;

-- ============================================================
-- B. System-only trigger implementation
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.record_inventory_stock_movement()
FROM PUBLIC, anon, authenticated, service_role;

-- ============================================================
-- C. Authenticated-user functions
-- ============================================================
-- Keep authenticated + service_role access explicit, while removing
-- anonymous/public execution inherited from broad legacy grants.

REVOKE EXECUTE ON FUNCTION public.append_ai_agent_step(uuid, text, text, jsonb, jsonb, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.append_ai_agent_step(uuid, text, text, jsonb, jsonb, text, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.apply_marketplace_order_status_reconciliation(uuid, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_marketplace_order_status_reconciliation(uuid, text, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.apply_product_description_generation(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_product_description_generation(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.apply_product_research_ai_run(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_product_research_ai_run(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.bridge_marketplace_external_order(uuid, uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bridge_marketplace_external_order(uuid, uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.confirm_ai_controlled_action(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_ai_controlled_action(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.confirm_ai_controlled_publication(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_ai_controlled_publication(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.create_default_organization()
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_default_organization()
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.create_initial_organization(text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_initial_organization(text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.create_order(uuid, uuid, jsonb)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(uuid, uuid, jsonb)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.evaluate_automation_rule(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.evaluate_automation_rule(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.execute_ai_controlled_action(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_ai_controlled_action(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.execute_ai_controlled_action_dispatch(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_ai_controlled_action_dispatch(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.execute_ai_controlled_product_name_action(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_ai_controlled_product_name_action(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.execute_ai_controlled_product_price_action(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_ai_controlled_product_price_action(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.execute_ai_controlled_product_status_action(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_ai_controlled_product_status_action(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.execute_automation_action(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_automation_action(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.finish_ai_agent_run(uuid, text, jsonb, text, text, jsonb, jsonb, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finish_ai_agent_run(uuid, text, jsonb, text, text, jsonb, jsonb, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_ai_controlled_action(uuid, uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_controlled_action(uuid, uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_ai_controlled_actions(uuid, integer, integer, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_controlled_actions(uuid, integer, integer, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_ai_controlled_publication(uuid, uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_controlled_publication(uuid, uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_ai_controlled_publications(uuid, integer, integer, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_controlled_publications(uuid, integer, integer, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_billing_overview(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_billing_overview(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_commerce_analytics(uuid, integer)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_commerce_analytics(uuid, integer)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_marketplace_authorized_shops(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_marketplace_authorized_shops(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_marketplace_catalog_products(uuid, integer)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_marketplace_catalog_products(uuid, integer)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_marketplace_connection_status(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_marketplace_connection_status(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_marketplace_external_order_bridge_readiness(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_marketplace_external_order_bridge_readiness(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_marketplace_external_orders(uuid, integer)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_marketplace_external_orders(uuid, integer)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_marketplace_order_status_reconciliation(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_marketplace_order_status_reconciliation(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_marketplace_webhook_events(uuid, integer)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_marketplace_webhook_events(uuid, integer)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_publishing_channel_destinations(uuid, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_publishing_channel_destinations(uuid, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_organization_member(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_organization_member(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.propose_ai_controlled_product_description_action(uuid, uuid, text, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.propose_ai_controlled_product_description_action(uuid, uuid, text, text, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.propose_ai_controlled_product_name_action(uuid, uuid, text, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.propose_ai_controlled_product_name_action(uuid, uuid, text, text, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.propose_ai_controlled_product_price_action(uuid, uuid, text, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.propose_ai_controlled_product_price_action(uuid, uuid, text, text, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.propose_ai_controlled_product_status_action(uuid, uuid, text, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.propose_ai_controlled_product_status_action(uuid, uuid, text, text, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.propose_ai_controlled_publication(uuid, uuid, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.propose_ai_controlled_publication(uuid, uuid, text, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.propose_ai_controlled_publication_channel(uuid, uuid, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.propose_ai_controlled_publication_channel(uuid, uuid, text, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.record_price_observation(uuid, numeric, text, timestamp with time zone, jsonb)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_price_observation(uuid, numeric, text, timestamp with time zone, jsonb)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_billing_usage(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_billing_usage(uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.select_marketplace_authorized_shop(uuid, uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.select_marketplace_authorized_shop(uuid, uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.select_publishing_channel_destination(uuid, uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.select_publishing_channel_destination(uuid, uuid)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.start_ai_agent_run(uuid, text, jsonb, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_ai_agent_run(uuid, text, jsonb, text, text)
TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_order_status(uuid, uuid, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, uuid, text)
TO authenticated, service_role;
