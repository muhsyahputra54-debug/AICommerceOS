import {
  readFileSync,
} from "node:fs";
import {
  fileURLToPath,
} from "node:url";

import {
  describe,
  expect,
  it,
} from "vitest";

const migration =
  readFileSync(
    fileURLToPath(
      new URL(
        "../../../../../supabase/migrations/20261027060000_security_definer_p1_boundary.sql",
        import.meta.url,
      ),
    ),
    "utf8",
  );

const normalized =
  migration.replace(/\s+/gu, " ").trim();

const serverOnlySignatures = [
  "public.check_ai_allowance(uuid)",
  "public.claim_billing_checkout_intent(uuid, text, text, text, jsonb)",
  "public.create_billing_checkout_session(uuid, text, text, text, text, jsonb)",
  "public.get_ai_usage_summary(uuid, timestamp with time zone, timestamp with time zone)",
  "public.provision_publishing_channel_destination(uuid, text, text, text, text, text[])",
  "public.revoke_publishing_channel_destination(uuid, uuid)",
] as const;

const systemOnlySignatures = [
  "public.record_inventory_stock_movement()",
] as const;

const authenticatedOnlySignatures = [
  "public.append_ai_agent_step(uuid, text, text, jsonb, jsonb, text, text)",
  "public.apply_marketplace_order_status_reconciliation(uuid, text, text)",
  "public.apply_product_description_generation(uuid)",
  "public.apply_product_research_ai_run(uuid)",
  "public.bridge_marketplace_external_order(uuid, uuid)",
  "public.confirm_ai_controlled_action(uuid)",
  "public.confirm_ai_controlled_publication(uuid)",
  "public.create_default_organization()",
  "public.create_initial_organization(text)",
  "public.create_order(uuid, uuid, jsonb)",
  "public.evaluate_automation_rule(uuid)",
  "public.execute_ai_controlled_action(uuid)",
  "public.execute_ai_controlled_action_dispatch(uuid)",
  "public.execute_ai_controlled_product_name_action(uuid)",
  "public.execute_ai_controlled_product_price_action(uuid)",
  "public.execute_ai_controlled_product_status_action(uuid)",
  "public.execute_automation_action(uuid)",
  "public.finish_ai_agent_run(uuid, text, jsonb, text, text, jsonb, jsonb, text)",
  "public.get_ai_controlled_action(uuid, uuid)",
  "public.get_ai_controlled_actions(uuid, integer, integer, text)",
  "public.get_ai_controlled_publication(uuid, uuid)",
  "public.get_ai_controlled_publications(uuid, integer, integer, text)",
  "public.get_billing_overview(uuid)",
  "public.get_commerce_analytics(uuid, integer)",
  "public.get_marketplace_authorized_shops(uuid)",
  "public.get_marketplace_catalog_products(uuid, integer)",
  "public.get_marketplace_connection_status(uuid)",
  "public.get_marketplace_external_order_bridge_readiness(uuid)",
  "public.get_marketplace_external_orders(uuid, integer)",
  "public.get_marketplace_order_status_reconciliation(uuid)",
  "public.get_marketplace_webhook_events(uuid, integer)",
  "public.get_publishing_channel_destinations(uuid, text)",
  "public.is_organization_member(uuid)",
  "public.propose_ai_controlled_product_description_action(uuid, uuid, text, text, text)",
  "public.propose_ai_controlled_product_name_action(uuid, uuid, text, text, text)",
  "public.propose_ai_controlled_product_price_action(uuid, uuid, text, text, text)",
  "public.propose_ai_controlled_product_status_action(uuid, uuid, text, text, text)",
  "public.propose_ai_controlled_publication(uuid, uuid, text, text)",
  "public.propose_ai_controlled_publication_channel(uuid, uuid, text, text)",
  "public.record_price_observation(uuid, numeric, text, timestamp with time zone, jsonb)",
  "public.refresh_billing_usage(uuid)",
  "public.select_marketplace_authorized_shop(uuid, uuid)",
  "public.select_publishing_channel_destination(uuid, uuid)",
  "public.start_ai_agent_run(uuid, text, jsonb, text, text)",
  "public.update_order_status(uuid, uuid, text)",
] as const;

describe(
  "SECURITY DEFINER P1 privilege boundary migration",
  () => {
    it(
      "makes reviewed server RPCs service-role-only",
      () => {
        expect(serverOnlySignatures).toHaveLength(6);

        for (
          const signature of
          serverOnlySignatures
        ) {
          expect(normalized).toContain(
            `REVOKE EXECUTE ON FUNCTION ${signature} FROM PUBLIC, anon, authenticated;`,
          );

          expect(normalized).toContain(
            `GRANT EXECUTE ON FUNCTION ${signature} TO service_role;`,
          );

          expect(normalized).not.toContain(
            `GRANT EXECUTE ON FUNCTION ${signature} TO authenticated`,
          );
        }
      },
    );

    it(
      "keeps system trigger implementation out of application roles",
      () => {
        expect(systemOnlySignatures).toHaveLength(1);

        for (
          const signature of
          systemOnlySignatures
        ) {
          expect(normalized).toContain(
            `REVOKE EXECUTE ON FUNCTION ${signature} FROM PUBLIC, anon, authenticated, service_role;`,
          );

          expect(normalized).not.toContain(
            `GRANT EXECUTE ON FUNCTION ${signature}`,
          );
        }
      },
    );

    it(
      "removes anonymous execution while preserving authenticated contracts",
      () => {
        expect(
          authenticatedOnlySignatures,
        ).toHaveLength(45);

        for (
          const signature of
          authenticatedOnlySignatures
        ) {
          expect(normalized).toContain(
            `REVOKE EXECUTE ON FUNCTION ${signature} FROM PUBLIC, anon;`,
          );

          expect(normalized).toContain(
            `GRANT EXECUTE ON FUNCTION ${signature} TO authenticated, service_role;`,
          );
        }
      },
    );

    it(
      "covers the complete 52-function post-P0 anon surface exactly once",
      () => {
        const reviewed = [
          ...serverOnlySignatures,
          ...systemOnlySignatures,
          ...authenticatedOnlySignatures,
        ];

        expect(reviewed).toHaveLength(52);
        expect(
          new Set(reviewed).size,
        ).toBe(52);
      },
    );

    it(
      "does not rewrite reviewed function bodies",
      () => {
        expect(migration).not.toMatch(
          /create\s+(?:or\s+replace\s+)?function/iu,
        );

        expect(migration).not.toMatch(
          /drop\s+function/iu,
        );
      },
    );

    it(
      "never grants execution to anon or PUBLIC",
      () => {
        expect(migration).not.toMatch(
          /grant\s+execute[\s\S]*?\bto\s+(?:public|anon)\b/iu,
        );
      },
    );
  },
);
