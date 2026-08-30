import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  logServerError,
  logServerWarning,
} from "./server-logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe(
  "structured server logger",
  () => {
    it(
      "redacts credential-like values from error messages",
      () => {
        const consoleError =
          vi.spyOn(
            console,
            "error",
          ).mockImplementation(
            () => undefined,
          );

        const error =
          new Error(
            [
              "Bearer demo-token-value",
              "access_token=demo-access-value",
              "refresh_token:demo-refresh-value",
              "client_secret=demo-client-secret",
              "oauth_code=demo-code",
              "oauth_state=demo-state",
              "cookie=session-demo",
              "publish_id=demo-publish",
              "upload_url=https://upload.example.invalid/demo",
              "ciphertext=demo-cipher",
              "encryption_key=demo-key",
            ].join(" "),
          );

        logServerError({
          event:
            "redaction_test",
          route:
            "/api/test",
          method:
            "POST",
          error,
        });

        expect(
          consoleError,
        ).toHaveBeenCalledTimes(
          1,
        );

        const serialized =
          String(
            consoleError.mock
              .calls[0]?.[0] ??
              "",
          );

        expect(
          serialized,
        ).toContain(
          "[REDACTED]",
        );

        expect(
          serialized,
        ).not.toContain(
          "demo-token-value",
        );
        expect(
          serialized,
        ).not.toContain(
          "demo-access-value",
        );
        expect(
          serialized,
        ).not.toContain(
          "demo-refresh-value",
        );
        expect(
          serialized,
        ).not.toContain(
          "demo-client-secret",
        );
        expect(
          serialized,
        ).not.toContain(
          "demo-code",
        );
        expect(
          serialized,
        ).not.toContain(
          "demo-state",
        );
        expect(
          serialized,
        ).not.toContain(
          "session-demo",
        );
        expect(
          serialized,
        ).not.toContain(
          "demo-publish",
        );
        expect(
          serialized,
        ).not.toContain(
          "https://upload.example.invalid/demo",
        );
        expect(
          serialized,
        ).not.toContain(
          "demo-cipher",
        );
        expect(
          serialized,
        ).not.toContain(
          "demo-key",
        );
      },
    );

    it(
      "keeps non-sensitive structured metadata",
      () => {
        const consoleError =
          vi.spyOn(
            console,
            "error",
          ).mockImplementation(
            () => undefined,
          );

        logServerError({
          event:
            "ai_route_failed",
          requestId:
            "req-demo-123",
          route:
            "/api/ai/example",
          method:
            "POST",
          provider:
            "supabase",
          operation:
            "load_profile",
          error:
            new Error(
              "query failed",
            ),
        });

        const serialized =
          String(
            consoleError.mock
              .calls[0]?.[0] ??
              "",
          );

        const entry =
          JSON.parse(
            serialized,
          ) as Record<
            string,
            unknown
          >;

        expect(
          entry.event,
        ).toBe(
          "ai_route_failed",
        );
        expect(
          entry.request_id,
        ).toBe(
          "req-demo-123",
        );
        expect(
          entry.route,
        ).toBe(
          "/api/ai/example",
        );
        expect(
          entry.operation,
        ).toBe(
          "load_profile",
        );
        expect(
          entry.error_message,
        ).toBe(
          "query failed",
        );
      },
    );
  },
);

describe(
  "structured server warning logger",
  () => {
    it(
      "emits redacted warning metadata with request correlation",
      () => {
        const consoleWarn =
          vi.spyOn(
            console,
            "warn",
          ).mockImplementation(
            () => undefined,
          );

        logServerWarning({
          event:
            "billing_checkout_entitlement_policy_hold",
          requestId:
            "req-warning-demo",
          route:
            "/api/billing/midtrans/notification",
          method:
            "POST",
          provider:
            "midtrans",
          operation:
            "active_paid_plan_change_requires_policy",
          error:
            new Error(
              "access_token=warning-secret",
            ),
        });

        expect(
          consoleWarn,
        ).toHaveBeenCalledTimes(
          1,
        );

        const entry =
          JSON.parse(
            String(
              consoleWarn.mock.calls[0]?.[0],
            ),
          ) as Record<string, unknown>;

        expect(entry.level).toBe(
          "warn",
        );
        expect(entry.event).toBe(
          "billing_checkout_entitlement_policy_hold",
        );
        expect(entry.request_id).toBe(
          "req-warning-demo",
        );
        expect(entry.provider).toBe(
          "midtrans",
        );
        expect(
          String(entry.error_message),
        ).not.toContain(
          "warning-secret",
        );
      },
    );
  },
);
