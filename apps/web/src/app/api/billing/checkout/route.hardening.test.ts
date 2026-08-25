import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  BillingCheckoutInput,
} from "@/lib/billing/payment-provider";

const mocks =
  vi.hoisted(() => ({
    getCurrentOrganization:
      vi.fn(),

    createClient:
      vi.fn(),

    getUser:
      vi.fn(),

    createAdminClient:
      vi.fn(),

    adminRpc:
      vi.fn(),

    isMidtransConfigured:
      vi.fn(),

    createMidtransPaymentProvider:
      vi.fn(),

    createCheckoutSession:
      vi.fn(),
  }));

vi.mock(
  "@/lib/supabase/current-organization",
  () => ({
    getCurrentOrganization:
      mocks.getCurrentOrganization,
  }),
);

vi.mock(
  "@/lib/supabase/server",
  () => ({
    createClient:
      mocks.createClient,
  }),
);

vi.mock(
  "@/lib/supabase/admin",
  () => ({
    createAdminClient:
      mocks.createAdminClient,
  }),
);

vi.mock(
  "@/lib/billing/midtrans",
  async () => {
    const actual =
      await vi.importActual<
        typeof import(
          "@/lib/billing/midtrans"
        )
      >(
        "@/lib/billing/midtrans",
      );

    return {
      ...actual,

      isMidtransConfigured:
        mocks.isMidtransConfigured,

      createMidtransPaymentProvider:
        mocks.createMidtransPaymentProvider,
    };
  },
);

import {
  POST,
} from "./route";

const originalAppUrl =
  process.env.LAKUVO_APP_URL;

const organizationId =
  "11111111-1111-4111-8111-111111111111";

const checkoutSessionId =
  "22222222-2222-4222-8222-222222222222";

function restoreEnv(
  name: string,
  value: string | undefined,
) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] =
    value;
}

function jsonRequest(
  body: unknown,
) {
  return new Request(
    "https://untrusted-request-origin.example/api/billing/checkout",
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(body),
    },
  );
}

function malformedRequest() {
  return new Request(
    "https://untrusted-request-origin.example/api/billing/checkout",
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        "{ definitely-not-json",
    },
  );
}

function authoritativeAmount(
  plan: string,
  interval: string,
) {
  if (
    plan === "starter" &&
    interval === "monthly"
  ) {
    return 199000;
  }

  if (
    plan === "starter" &&
    interval === "annual"
  ) {
    return 1990000;
  }

  if (
    plan === "pro" &&
    interval === "monthly"
  ) {
    return 499000;
  }

  return 4990000;
}

type CheckoutClaimResult =
  | "created_claimed"
  | "reclaimed_stale"
  | "in_progress"
  | "reused_ready";

function checkoutClaimResult(
  args: Record<string, unknown>,
  claimResult:
    CheckoutClaimResult =
      "created_claimed",
) {
  const plan =
    String(
      args.p_plan_slug,
    );

  const interval =
    String(
      args.p_billing_interval,
    );

  const ready =
    claimResult ===
      "reused_ready";

  return {
    data: [
      {
        claim_result:
          claimResult,

        checkout_session_id:
          checkoutSessionId,

        organization_id:
          args.p_organization_id,

        provider:
          "midtrans",

        reference_id:
          "lkv_44444444444444444444444444444444",

        plan_id:
          "33333333-3333-4333-8333-333333333333",

        plan_slug:
          plan,

        billing_interval:
          interval,

        amount:
          authoritativeAmount(
            plan,
            interval,
          ),

        currency:
          "IDR",

        status:
          ready
            ? "ready"
            : "created",

        external_session_id:
          ready
            ? "existing-sandbox-session"
            : null,

        checkout_url:
          ready
            ? "https://app.sandbox.midtrans.com/snap/v2/vtweb/existing-token"
            : null,

        expires_at:
          null,
      },
    ],

    error:
      null,
  };
}

function installDefaultRpc() {
  mocks.adminRpc
    .mockImplementation(
      async (
        name: string,
        args:
          Record<string, unknown> = {},
      ) => {
        if (
          name ===
          "claim_billing_checkout_intent"
        ) {
          return checkoutClaimResult(
            args,
          );
        }

        if (
          name ===
          "attach_billing_checkout_provider_session"
        ) {
          return {
            data:
              "ready",
            error:
              null,
          };
        }

        if (
          name ===
          "fail_billing_checkout_session"
        ) {
          return {
            data:
              "failed",
            error:
              null,
          };
        }

        throw new Error(
          `Unexpected RPC: ${name}`,
        );
      },
    );
}

beforeEach(() => {
  vi.resetAllMocks();

  process.env.LAKUVO_APP_URL =
    "https://app.lakuvo.test";

  mocks
    .getCurrentOrganization
    .mockResolvedValue({
      organizationId,

      role:
        "member",

      organization: {
        id:
          organizationId,

        name:
          "Test Organization",
      },
    });

  mocks
    .getUser
    .mockResolvedValue({
      data: {
        user: {
          id:
            "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",

          email:
            "buyer@example.com",
        },
      },

      error:
        null,
    });

  mocks
    .createClient
    .mockResolvedValue({
      auth: {
        getUser:
          mocks.getUser,
      },
    });

  installDefaultRpc();

  mocks
    .createAdminClient
    .mockReturnValue({
      rpc:
        mocks.adminRpc,
    });

  mocks
    .isMidtransConfigured
    .mockReturnValue(
      true,
    );

  mocks
    .createCheckoutSession
    .mockResolvedValue({
      provider:
        "midtrans",

      externalSessionId:
        "sandbox-snap-token",

      checkoutUrl:
        "https://app.sandbox.midtrans.com/snap/v2/vtweb/test-token",

      expiresAt:
        null,
    });

  mocks
    .createMidtransPaymentProvider
    .mockReturnValue({
      name:
        "midtrans",

      createCheckoutSession:
        mocks.createCheckoutSession,
    });
});

afterEach(() => {
  restoreEnv(
    "LAKUVO_APP_URL",
    originalAppUrl,
  );
});

describe(
  "billing checkout hardening contract",
  () => {
    it(
      "rejects malformed JSON before billing persistence",
      async () => {
        const response =
          await POST(
            malformedRequest(),
          );

        expect(
          response.status,
        ).toBe(400);

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "requires an authenticated user",
      async () => {
        mocks
          .getUser
          .mockResolvedValueOnce({
            data: {
              user:
                null,
            },

            error:
              null,
          });

        const response =
          await POST(
            jsonRequest({
              plan:
                "starter",

              interval:
                "monthly",
            }),
          );

        expect(
          response.status,
        ).toBe(401);

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an invalid billing interval",
      async () => {
        const response =
          await POST(
            jsonRequest({
              plan:
                "starter",

              interval:
                "weekly",
            }),
          );

        expect(
          response.status,
        ).toBe(400);

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed for an invalid canonical app URL",
      async () => {
        process.env.LAKUVO_APP_URL =
          "javascript:alert(1)";

        const response =
          await POST(
            jsonRequest({
              plan:
                "starter",

              interval:
                "monthly",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(503);

        expect(
          body.code,
        ).toBe(
          "PAYMENT_PROVIDER_NOT_CONFIGURED",
        );

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed when Supabase admin configuration is unavailable",
      async () => {
        mocks
          .createAdminClient
          .mockImplementationOnce(
            () => {
              throw new Error(
                "admin configuration unavailable",
              );
            },
          );

        const response =
          await POST(
            jsonRequest({
              plan:
                "starter",

              interval:
                "monthly",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(503);

        expect(
          body.code,
        ).toBe(
          "BILLING_SERVER_NOT_CONFIGURED",
        );

        expect(
          mocks.createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects malformed authoritative persistence data before provider creation",
      async () => {
        mocks
          .adminRpc
          .mockResolvedValueOnce({
            data: [
              {
                checkout_session_id:
                  checkoutSessionId,

                organization_id:
                  organizationId,

                provider:
                  "midtrans",

                reference_id:
                  "wrong-reference",

                plan_slug:
                  "starter",

                billing_interval:
                  "monthly",

                amount:
                  0,

                currency:
                  "IDR",

                status:
                  "created",
              },
            ],

            error:
              null,
          });

        const response =
          await POST(
            jsonRequest({
              plan:
                "starter",

              interval:
                "monthly",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(500);

        expect(
          body.code,
        ).toBe(
          "BILLING_CHECKOUT_PERSISTENCE_INVALID",
        );

        expect(
          mocks.createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "ignores browser supplied amount currency and reference values",
      async () => {
        const response =
          await POST(
            jsonRequest({
              plan:
                "pro",

              interval:
                "monthly",

              amount:
                1,

              currency:
                "USD",

              reference_id:
                "browser-controlled-order-id",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(201);

        const claimRpcCall =
          mocks.adminRpc
            .mock.calls
            .find(
              (call) =>
                call[0] ===
                "claim_billing_checkout_intent",
            );

        expect(
          claimRpcCall,
        ).toBeTruthy();

        const rpcArgs =
          claimRpcCall?.[1] as
            Record<string, unknown>;

        expect(
          rpcArgs,
        ).not.toHaveProperty(
          "p_amount",
        );

        expect(
          rpcArgs,
        ).not.toHaveProperty(
          "p_currency",
        );

        expect(
          rpcArgs,
        ).not.toHaveProperty(
          "p_reference_id",
        );

        expect(
          body.reference_id,
        ).not.toBe(
          "browser-controlled-order-id",
        );

        expect(
          body.reference_id,
        ).toBe(
          "lkv_44444444444444444444444444444444",
        );

        const providerInput =
          mocks
            .createCheckoutSession
            .mock.calls[0]?.[0] as
              BillingCheckoutInput;

        expect(
          providerInput.amount,
        ).toBe(
          499000,
        );

        expect(
          providerInput.currency,
        ).toBe(
          "IDR",
        );

        expect(
          providerInput.referenceId,
        ).toBe(
          body.reference_id,
        );

        expect(
          providerInput.successUrl,
        ).toBe(
          "https://app.lakuvo.test/billing?payment=finish",
        );

        expect(
          providerInput.successUrl,
        ).not.toContain(
          "untrusted-request-origin.example",
        );
      },
    );

    it(
      "does not call Midtrans for an authoritative reused_ready checkout",
      async () => {
        mocks.adminRpc.mockReset();

        mocks.adminRpc
          .mockImplementation(
            async (
              name: string,
              args:
                Record<string, unknown> = {},
            ) => {
              if (
                name ===
                "claim_billing_checkout_intent"
              ) {
                return checkoutClaimResult(
                  args,
                  "reused_ready",
                );
              }

              throw new Error(
                `Unexpected RPC: ${name}`,
              );
            },
          );

        const response =
          await POST(
            jsonRequest({
              plan:
                "starter",

              interval:
                "monthly",
            }),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          mocks.createCheckoutSession,
        ).not.toHaveBeenCalled();

        expect(
          mocks.adminRpc,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "does not call Midtrans while an authoritative checkout claim is in progress",
      async () => {
        mocks.adminRpc.mockReset();

        mocks.adminRpc
          .mockImplementation(
            async (
              name: string,
              args:
                Record<string, unknown> = {},
            ) => {
              if (
                name ===
                "claim_billing_checkout_intent"
              ) {
                return checkoutClaimResult(
                  args,
                  "in_progress",
                );
              }

              throw new Error(
                `Unexpected RPC: ${name}`,
              );
            },
          );

        const response =
          await POST(
            jsonRequest({
              plan:
                "starter",

              interval:
                "monthly",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(409);

        expect(
          body.code,
        ).toBe(
          "BILLING_CHECKOUT_IN_PROGRESS",
        );

        expect(
          mocks.createCheckoutSession,
        ).not.toHaveBeenCalled();

        expect(
          mocks.adminRpc,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "fails safely when provider-session persistence fails",
      async () => {
        mocks.adminRpc
          .mockImplementation(
            async (
              name: string,
              args:
                Record<string, unknown> = {},
            ) => {
              if (
                name ===
                "claim_billing_checkout_intent"
              ) {
                return checkoutClaimResult(
                  args,
                );
              }

              if (
                name ===
                "attach_billing_checkout_provider_session"
              ) {
                return {
                  data:
                    null,

                  error: {
                    message:
                      "attach failed",
                  },
                };
              }

              if (
                name ===
                "fail_billing_checkout_session"
              ) {
                return {
                  data:
                    "failed",

                  error:
                    null,
                };
              }

              throw new Error(
                `Unexpected RPC: ${name}`,
              );
            },
          );

        const response =
          await POST(
            jsonRequest({
              plan:
                "starter",

              interval:
                "monthly",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(500);

        expect(
          body.code,
        ).toBe(
          "BILLING_CHECKOUT_ATTACH_FAILED",
        );

        const failCall =
          mocks.adminRpc
            .mock.calls
            .find(
              (call) =>
                call[0] ===
                "fail_billing_checkout_session",
            );

        expect(
          failCall,
        ).toBeTruthy();

        expect(
          failCall?.[1],
        ).toMatchObject({
          p_failure_code:
            "MIDTRANS_SESSION_ATTACH_FAILED",
        });
      },
    );

    it(
      "accepts already_ready as an idempotent provider-session attach result",
      async () => {
        mocks.adminRpc
          .mockImplementation(
            async (
              name: string,
              args:
                Record<string, unknown> = {},
            ) => {
              if (
                name ===
                "claim_billing_checkout_intent"
              ) {
                return checkoutClaimResult(
                  args,
                );
              }

              if (
                name ===
                "attach_billing_checkout_provider_session"
              ) {
                return {
                  data:
                    "already_ready",

                  error:
                    null,
                };
              }

              if (
                name ===
                "fail_billing_checkout_session"
              ) {
                return {
                  data:
                    "failed",

                  error:
                    null,
                };
              }

              throw new Error(
                `Unexpected RPC: ${name}`,
              );
            },
          );

        const response =
          await POST(
            jsonRequest({
              plan:
                "starter",

              interval:
                "annual",
            }),
          );

        expect(
          response.status,
        ).toBe(201);

        expect(
          mocks.createCheckoutSession,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );
  },
);
