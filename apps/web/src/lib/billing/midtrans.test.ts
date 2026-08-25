import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createMidtransPaymentProvider,
  isMidtransConfigured,
  MIDTRANS_PROVIDER,
  MIDTRANS_SNAP_URLS,
  MidtransApiError,
  MidtransConfigurationError,
  MidtransInputError,
} from "./midtrans";

import type {
  BillingCheckoutInput,
} from "./payment-provider";

const originalServerKey =
  process.env.MIDTRANS_SERVER_KEY;

const originalEnvironment =
  process.env.MIDTRANS_ENVIRONMENT;

function restoreEnv(
  name: string,
  value: string | undefined,
) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

afterEach(() => {
  restoreEnv(
    "MIDTRANS_SERVER_KEY",
    originalServerKey,
  );

  restoreEnv(
    "MIDTRANS_ENVIRONMENT",
    originalEnvironment,
  );
});

const baseInput: BillingCheckoutInput = {
  organizationId:
    "11111111-1111-4111-8111-111111111111",

  referenceId:
    "lakuvo-checkout-test-001",

  planSlug:
    "starter",

  interval:
    "monthly",

  amount:
    199000,

  currency:
    "IDR",

  successUrl:
    "https://app.lakuvo.test/billing?payment=finish",

  cancelUrl:
    "https://app.lakuvo.test/billing?payment=cancel",

  customerEmail:
    "buyer@example.com",
};

describe(
  "Midtrans payment provider",
  () => {
    it(
      "reports configuration only when required server env exists",
      () => {
        delete process.env
          .MIDTRANS_SERVER_KEY;

        delete process.env
          .MIDTRANS_ENVIRONMENT;

        expect(
          isMidtransConfigured(),
        ).toBe(false);

        process.env
          .MIDTRANS_SERVER_KEY =
            "SB-Mid-server-test";

        process.env
          .MIDTRANS_ENVIRONMENT =
            "sandbox";

        expect(
          isMidtransConfigured(),
        ).toBe(true);
      },
    );

    it(
      "requires explicit server key and environment",
      () => {
        delete process.env
          .MIDTRANS_SERVER_KEY;

        delete process.env
          .MIDTRANS_ENVIRONMENT;

        expect(
          () =>
            createMidtransPaymentProvider(),
        ).toThrow(
          MidtransConfigurationError,
        );
      },
    );

    it(
      "creates a sandbox Snap checkout using Basic Auth",
      async () => {
        const fetchImpl =
          vi.fn(
            async (
              ...args:
                Parameters<typeof fetch>
            ) => {
              const [
                input,
                init,
              ] = args;

              expect(
                String(input),
              ).toBe(
                MIDTRANS_SNAP_URLS.sandbox,
              );

              expect(
                init?.method,
              ).toBe("POST");

              const headers =
                new Headers(
                  init?.headers,
                );

              expect(
                headers.get(
                  "authorization",
                ),
              ).toBe(
                "Basic U0ItTWlkLXNlcnZlci10ZXN0Og==",
              );

              expect(
                headers.get(
                  "content-type",
                ),
              ).toBe(
                "application/json",
              );

              const payload =
                JSON.parse(
                  String(
                    init?.body ??
                      "",
                  ),
                );

              expect(
                payload,
              ).toEqual({
                transaction_details: {
                  order_id:
                    "lakuvo-checkout-test-001",
                  gross_amount:
                    199000,
                },

                callbacks: {
                  finish:
                    "https://app.lakuvo.test/billing?payment=finish",
                },

                customer_details: {
                  email:
                    "buyer@example.com",
                },
              });

              return new Response(
                JSON.stringify({
                  token:
                    "sandbox-snap-token",

                  redirect_url:
                    "https://app.sandbox.midtrans.com/snap/v2/vtweb/test-token",
                }),
                {
                  status: 201,
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                },
              );
            },
          ) as unknown as typeof fetch;

        const provider =
          createMidtransPaymentProvider(
            {
              serverKey:
                "SB-Mid-server-test",

              environment:
                "sandbox",

              fetchImpl,
            },
          );

        expect(
          provider.name,
        ).toBe(
          MIDTRANS_PROVIDER,
        );

        const session =
          await provider
            .createCheckoutSession(
              baseInput,
            );

        expect(
          session,
        ).toEqual({
          provider:
            "midtrans",

          externalSessionId:
            "sandbox-snap-token",

          checkoutUrl:
            "https://app.sandbox.midtrans.com/snap/v2/vtweb/test-token",

          expiresAt:
            null,
        });

        expect(
          fetchImpl,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "selects the production Snap endpoint explicitly",
      async () => {
        const fetchImpl =
          vi.fn(
            async (
              ...args:
                Parameters<typeof fetch>
            ) => {
              const [
                input,
              ] = args;

              expect(
                String(input),
              ).toBe(
                MIDTRANS_SNAP_URLS.production,
              );

              return new Response(
                JSON.stringify({
                  token:
                    "production-token",

                  redirect_url:
                    "https://app.midtrans.com/snap/v2/vtweb/production-token",
                }),
                {
                  status: 201,
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                },
              );
            },
          ) as unknown as typeof fetch;

        const provider =
          createMidtransPaymentProvider(
            {
              serverKey:
                "Mid-server-production",

              environment:
                "production",

              fetchImpl,
            },
          );

        await provider
          .createCheckoutSession(
            baseInput,
          );

        expect(
          fetchImpl,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "rejects invalid amount before calling Midtrans",
      async () => {
        const fetchImpl =
          vi.fn() as unknown as
            typeof fetch;

        const provider =
          createMidtransPaymentProvider(
            {
              serverKey:
                "SB-Mid-server-test",

              environment:
                "sandbox",

              fetchImpl,
            },
          );

        await expect(
          provider
            .createCheckoutSession({
              ...baseInput,
              amount: 0,
            }),
        ).rejects.toBeInstanceOf(
          MidtransInputError,
        );

        expect(
          fetchImpl,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects unsupported currency before calling Midtrans",
      async () => {
        const fetchImpl =
          vi.fn() as unknown as
            typeof fetch;

        const provider =
          createMidtransPaymentProvider(
            {
              serverKey:
                "SB-Mid-server-test",

              environment:
                "sandbox",

              fetchImpl,
            },
          );

        await expect(
          provider
            .createCheckoutSession({
              ...baseInput,
              currency: "USD",
            }),
        ).rejects.toBeInstanceOf(
          MidtransInputError,
        );

        expect(
          fetchImpl,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "maps Midtrans HTTP failure to a safe provider error",
      async () => {
        const fetchImpl =
          vi.fn(
            async () =>
              new Response(
                JSON.stringify({
                  error_messages: [
                    "Access denied",
                  ],
                }),
                {
                  status: 401,
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                },
              ),
          ) as unknown as typeof fetch;

        const provider =
          createMidtransPaymentProvider(
            {
              serverKey:
                "invalid-test-key",

              environment:
                "sandbox",

              fetchImpl,
            },
          );

        await expect(
          provider
            .createCheckoutSession(
              baseInput,
            ),
        ).rejects.toMatchObject({
          name:
            "MidtransApiError",
          status:
            401,
        } satisfies Partial<MidtransApiError>);
      },
    );

    it(
      "rejects malformed success response",
      async () => {
        const fetchImpl =
          vi.fn(
            async () =>
              new Response(
                JSON.stringify({
                  token: "",
                  redirect_url: "",
                }),
                {
                  status: 201,
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                },
              ),
          ) as unknown as typeof fetch;

        const provider =
          createMidtransPaymentProvider(
            {
              serverKey:
                "SB-Mid-server-test",

              environment:
                "sandbox",

              fetchImpl,
            },
          );

        await expect(
          provider
            .createCheckoutSession(
              baseInput,
            ),
        ).rejects.toBeInstanceOf(
          MidtransApiError,
        );
      },
    );
  },
);
