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

const routeSource =
  readFileSync(
    fileURLToPath(
      new URL(
        "../../app/api/billing/midtrans/notification/route.ts",
        import.meta.url,
      ),
    ),
    "utf8",
  );

describe(
  "Midtrans notification observability",
  () => {
    it(
      "uses structured warning logging for the entitlement policy hold",
      () => {
        expect(routeSource).not.toMatch(
          /console\.(?:error|warn|log)\(/u,
        );

        const warningCall =
          routeSource.match(
            /logServerWarning\(\{[\s\S]*?billing_checkout_entitlement_policy_hold[\s\S]*?\}\);/u,
          )?.[0];

        expect(warningCall).toBeDefined();
        expect(warningCall).toContain(
          "requestId",
        );
        expect(warningCall).toContain(
          "MIDTRANS_PROVIDER",
        );
        expect(warningCall).toContain(
          "active_paid_plan_change_requires_policy",
        );

        expect(warningCall).not.toMatch(
          /\b(?:serverKey|signature|orderId|transactionId|grossAmount|payload|entitlementResult)\b/u,
        );
      },
    );
  },
);