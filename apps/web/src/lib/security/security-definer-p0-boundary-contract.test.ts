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
        "../../../../../supabase/migrations/20261027050000_security_definer_p0_boundary.sql",
        import.meta.url,
      ),
    ),
    "utf8",
  );

const normalized =
  migration.replace(/\s+/gu, " ").trim();

const serverOnlySignatures = [
  "public.activate_billing_checkout_entitlement(uuid)",
  "public.attach_billing_checkout_provider_session(uuid, text, text, timestamp with time zone)",
  "public.fail_billing_checkout_session(uuid, text, jsonb)",
  "public.process_billing_checkout_payment_event(uuid, text, text, text, text, text, numeric, text, text, jsonb)",
  "public.process_billing_subscription_event(uuid, text, text, text, text, text, text, timestamp with time zone, timestamp with time zone, timestamp with time zone, boolean, jsonb)",
  "public.record_billing_webhook_event(uuid, text, text, text, jsonb)",
  "public.record_ai_usage(uuid, uuid, text, text, text, text, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, jsonb)",
  "public.claim_marketplace_webhook_events(uuid, uuid, uuid, integer)",
  "public.complete_marketplace_webhook_event(uuid, uuid, uuid, uuid, text, text)",
  "public.get_marketplace_order_sync_context(uuid, uuid, uuid)",
  "public.get_marketplace_product_sync_context(uuid, uuid, uuid)",
  "public.record_marketplace_webhook_event(text, text, text, text, integer, text, text, timestamp with time zone, text, jsonb)",
  "public.upsert_marketplace_catalog_page(uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean)",
  "public.upsert_marketplace_external_order_page(uuid, uuid, uuid, uuid, text, jsonb, text, integer, boolean)",
] as const;

describe(
  "SECURITY DEFINER P0 privilege boundary migration",
  () => {
    it(
      "makes each reviewed server RPC service-role-only",
      () => {
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
        }
      },
    );

    it(
      "keeps the RLS event-trigger implementation out of application roles",
      () => {
        expect(normalized).toContain(
          "REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated, service_role;",
        );

        expect(normalized).not.toContain(
          "GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;",
        );
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
      "never grants reviewed RPCs to browser roles",
      () => {
        expect(migration).not.toMatch(
          /grant\s+execute[\s\S]*?\bto\s+(?:public|anon|authenticated)\b/iu,
        );
      },
    );
  },
);
