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
        mocks
          .isMidtransConfigured,

      createMidtransPaymentProvider:
        mocks
          .createMidtransPaymentProvider,
    };
  },
);

import {
  MidtransApiError,
} from "@/lib/billing/midtrans";

import {
  POST,
} from "./route";

const originalAppUrl =
  process.env.LAKUVO_APP_URL;

function restoreEnv(
  name: string,
  value:
    | string
    | undefined,
) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] =
    value;
}

function checkoutRequest(
  body: unknown,
) {
  return new Request(
    "https://route.test/api/billing/checkout",
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          body,
        ),
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
      args
        .p_plan_slug,
    );

  const interval =
    String(
      args
        .p_billing_interval,
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
          "22222222-2222-4222-8222-222222222222",

        organization_id:
          args
            .p_organization_id,

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

function installDefaultRpcMock(
  claimResult:
    CheckoutClaimResult =
      "created_claimed",
) {
  mocks.adminRpc
    .mockImplementation(
      async (
        name: string,
        args:
          Record<
            string,
            unknown
          > = {},
      ) => {
        if (
          name ===
          "claim_billing_checkout_intent"
        ) {
          return checkoutClaimResult(
            args,
            claimResult,
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
      organizationId:
        "11111111-1111-4111-8111-111111111111",

      role:
        "member",

      organization: {
        id:
          "11111111-1111-4111-8111-111111111111",

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

  installDefaultRpcMock();

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
        mocks
          .createCheckoutSession,
    });
});

afterEach(() => {
  restoreEnv(
    "LAKUVO_APP_URL",
    originalAppUrl,
  );
});

describe(
  "POST /api/billing/checkout",
  () => {
    it(
      "requires an active organization",
      async () => {
        mocks
          .getCurrentOrganization
          .mockResolvedValueOnce(
            null,
          );

        const response =
          await POST(
            checkoutRequest({
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
          mocks
            .createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an invalid commercial plan",
      async () => {
        const response =
          await POST(
            checkoutRequest({
              plan:
                "enterprise",

              interval:
                "monthly",
            }),
          );

        expect(
          response.status,
        ).toBe(400);

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks
            .createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed when canonical app origin is missing",
      async () => {
        delete process.env
          .LAKUVO_APP_URL;

        const response =
          await POST(
            checkoutRequest({
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
          mocks
            .createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed when Midtrans server configuration is missing",
      async () => {
        mocks
          .isMidtransConfigured
          .mockReturnValueOnce(
            false,
          );

        const response =
          await POST(
            checkoutRequest({
              plan:
                "starter",

              interval:
                "monthly",
            }),
          );

        expect(
          response.status,
        ).toBe(503);

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks
            .createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "uses authoritative database pricing and database-generated reference",
      async () => {
        const response =
          await POST(
            checkoutRequest({
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
        ).toBe(201);

        expect(
          body.provider,
        ).toBe(
          "midtrans",
        );

        expect(
          body.plan,
        ).toBe(
          "starter",
        );

        expect(
          body.interval,
        ).toBe(
          "monthly",
        );

        expect(
          body.reference_id,
        ).toBe(
          "lkv_44444444444444444444444444444444",
        );

        expect(
          body.checkout_state,
        ).toBe(
          "created_claimed",
        );

        expect(
          body.reused,
        ).toBe(false);

        expect(
          body.checkout_url,
        ).toBe(
          "https://app.sandbox.midtrans.com/snap/v2/vtweb/test-token",
        );

        const claimCall =
          mocks
            .adminRpc
            .mock
            .calls
            .find(
              (call) =>
                call[0] ===
                "claim_billing_checkout_intent",
            );

        expect(
          claimCall,
        ).toBeTruthy();

        const rpcArgs =
          claimCall?.[1] as
            Record<
              string,
              unknown
            >;

        expect(
          rpcArgs
            .p_organization_id,
        ).toBe(
          "11111111-1111-4111-8111-111111111111",
        );

        expect(
          rpcArgs
            .p_provider,
        ).toBe(
          "midtrans",
        );

        expect(
          rpcArgs,
        ).not.toHaveProperty(
          "p_reference_id",
        );

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

        const providerInput =
          mocks
            .createCheckoutSession
            .mock
            .calls[0]?.[0] as
              BillingCheckoutInput;

        expect(
          providerInput.amount,
        ).toBe(199000);

        expect(
          providerInput.currency,
        ).toBe(
          "IDR",
        );

        expect(
          providerInput
            .referenceId,
        ).toBe(
          body.reference_id,
        );

        expect(
          providerInput
            .successUrl,
        ).toBe(
          "https://app.lakuvo.test/billing?payment=finish",
        );

        expect(
          providerInput
            .cancelUrl,
        ).toBe(
          "https://app.lakuvo.test/billing?payment=cancel",
        );

        expect(
          providerInput
            .customerEmail,
        ).toBe(
          "buyer@example.com",
        );

        const attachCall =
          mocks
            .adminRpc
            .mock
            .calls
            .find(
              (call) =>
                call[0] ===
                "attach_billing_checkout_provider_session",
            );

        expect(
          attachCall,
        ).toBeTruthy();
      },
    );

    it(
      "reuses an existing ready checkout without calling Midtrans",
      async () => {
        mocks.adminRpc.mockReset();
        installDefaultRpcMock(
          "reused_ready",
        );

        const response =
          await POST(
            checkoutRequest({
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
        ).toBe(200);

        expect(
          body.checkout_state,
        ).toBe(
          "reused_ready",
        );

        expect(
          body.reused,
        ).toBe(true);

        expect(
          body.checkout_url,
        ).toBe(
          "https://app.sandbox.midtrans.com/snap/v2/vtweb/existing-token",
        );

        expect(
          mocks
            .createCheckoutSession,
        ).not.toHaveBeenCalled();

        const attachCall =
          mocks.adminRpc
            .mock.calls
            .find(
              (call) =>
                call[0] ===
                "attach_billing_checkout_provider_session",
            );

        expect(
          attachCall,
        ).toBeUndefined();
      },
    );

    it(
      "returns retryable conflict while checkout creation is already in progress",
      async () => {
        mocks.adminRpc.mockReset();
        installDefaultRpcMock(
          "in_progress",
        );

        const response =
          await POST(
            checkoutRequest({
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
          response.headers.get(
            "Retry-After",
          ),
        ).toBe("2");

        expect(
          body.code,
        ).toBe(
          "BILLING_CHECKOUT_IN_PROGRESS",
        );

        expect(
          body.retryable,
        ).toBe(true);

        expect(
          mocks
            .createCheckoutSession,
        ).not.toHaveBeenCalled();

        expect(
          mocks.adminRpc,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "allows a reclaimed stale checkout owner to create the provider session exactly once",
      async () => {
        mocks.adminRpc.mockReset();
        installDefaultRpcMock(
          "reclaimed_stale",
        );

        const response =
          await POST(
            checkoutRequest({
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
        ).toBe(201);

        expect(
          body.checkout_state,
        ).toBe(
          "reclaimed_stale",
        );

        expect(
          mocks
            .createCheckoutSession,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "does not call Midtrans when checkout persistence fails",
      async () => {
        mocks
          .adminRpc
          .mockResolvedValueOnce({
            data:
              null,

            error: {
              message:
                "database failure",
            },
          });

        const response =
          await POST(
            checkoutRequest({
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
          "BILLING_CHECKOUT_PERSISTENCE_FAILED",
        );

        expect(
          mocks
            .createCheckoutSession,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "marks the persisted checkout failed when provider creation fails",
      async () => {
        mocks
          .createCheckoutSession
          .mockRejectedValueOnce(
            new MidtransApiError(
              "provider failure",
              500,
            ),
          );

        const response =
          await POST(
            checkoutRequest({
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
        ).toBe(502);

        expect(
          body.code,
        ).toBe(
          "PAYMENT_PROVIDER_ERROR",
        );

        const failureCall =
          mocks
            .adminRpc
            .mock
            .calls
            .find(
              (call) =>
                call[0] ===
                "fail_billing_checkout_session",
            );

        expect(
          failureCall,
        ).toBeTruthy();

        expect(
          failureCall?.[1],
        ).toMatchObject({
          p_failure_code:
            "MIDTRANS_API_ERROR",
        });
      },
    );
  },
);
