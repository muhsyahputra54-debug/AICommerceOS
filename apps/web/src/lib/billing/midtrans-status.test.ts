import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  classifyMidtransStatusOutcome,
  createMidtransStatusClient,
  MidtransStatusApiError,
  MidtransStatusConfigurationError,
  MidtransStatusResponseError,
} from "./midtrans-status";

const originalServerKey =
  process.env.MIDTRANS_SERVER_KEY;

const originalEnvironment =
  process.env.MIDTRANS_ENVIRONMENT;

function restoreEnv(
  name: string,
  value:
    string |
    undefined,
) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] =
    value;
}

function response(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(
      body,
    ),
    {
      status,

      headers: {
        "Content-Type":
          "application/json",
      },
    },
  );
}

function successfulStatus(
  overrides:
    Record<string, unknown> = {},
) {
  return {
    status_code:
      "200",

    status_message:
      "Success",

    transaction_id:
      "midtrans-txn-001",

    order_id:
      "lkv_test_001",

    payment_type:
      "qris",

    transaction_time:
      "2026-08-25 10:00:00",

    transaction_status:
      "settlement",

    fraud_status:
      "accept",

    gross_amount:
      "199000.00",

    currency:
      "IDR",

    settlement_time:
      "2026-08-25 10:05:00",

    ...overrides,
  };
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

describe(
  "Midtrans Get Transaction Status client",
  () => {
    it(
      "uses sandbox endpoint and Basic Auth",
      async () => {
        const fetchMock =
          vi.fn(
            async (
              ..._args: Parameters<typeof fetch>
            ) => {
              void _args;

              return response(
                successfulStatus(),
              );
            },
          );

        const client =
          createMidtransStatusClient({
            serverKey:
              "SB-Mid-server-test",

            environment:
              "sandbox",

            fetchImpl:
              fetchMock as
                typeof fetch,
          });

        const result =
          await client
            .getTransactionStatus(
              "lkv_test_001",
            );

        expect(
          result.transactionId,
        ).toBe(
          "midtrans-txn-001",
        );

        expect(
          result.orderId,
        ).toBe(
          "lkv_test_001",
        );

        expect(
          result.grossAmount,
        ).toBe(
          "199000.00",
        );

        expect(
          result.currency,
        ).toBe(
          "IDR",
        );

        expect(
          fetchMock,
        ).toHaveBeenCalledTimes(
          1,
        );

        const [
          url,
          init,
        ] =
          fetchMock.mock.calls[0];

        expect(
          url,
        ).toBe(
          "https://api.sandbox.midtrans.com/v2/lkv_test_001/status",
        );

        expect(
          init?.method,
        ).toBe(
          "GET",
        );

        const expectedAuth =
          "Basic " +
          Buffer.from(
            "SB-Mid-server-test:",
            "utf8",
          ).toString(
            "base64",
          );

        expect(
          (
            init?.headers as
              Record<
                string,
                string
              >
          ).Authorization,
        ).toBe(
          expectedAuth,
        );
      },
    );


    it(
      "uses production status base URL explicitly",
      async () => {
        const fetchMock =
          vi.fn(
            async (
              ..._args: Parameters<typeof fetch>
            ) => {
              void _args;

              return response(
                successfulStatus(),
              );
            },
          );

        const client =
          createMidtransStatusClient({
            serverKey:
              "Mid-server-production",

            environment:
              "production",

            fetchImpl:
              fetchMock as
                typeof fetch,
          });

        await client
          .getTransactionStatus(
            "lkv_test_001",
          );

        expect(
          fetchMock.mock
            .calls[0]?.[0],
        ).toBe(
          "https://api.midtrans.com/v2/lkv_test_001/status",
        );
      },
    );


    it(
      "fails closed without server configuration",
      () => {
        delete process.env
          .MIDTRANS_SERVER_KEY;

        delete process.env
          .MIDTRANS_ENVIRONMENT;

        expect(
          () =>
            createMidtransStatusClient(),
        ).toThrow(
          MidtransStatusConfigurationError,
        );
      },
    );


    it(
      "rejects mismatched order id in provider response",
      async () => {
        const client =
          createMidtransStatusClient({
            serverKey:
              "SB-Mid-server-test",

            environment:
              "sandbox",

            fetchImpl:
              vi.fn(
                async () =>
                  response(
                    successfulStatus({
                      order_id:
                        "different-order",
                    }),
                  ),
              ) as
                unknown as
                typeof fetch,
          });

        await expect(
          client.getTransactionStatus(
            "lkv_test_001",
          ),
        ).rejects.toBeInstanceOf(
          MidtransStatusResponseError,
        );
      },
    );


    it(
      "rejects malformed successful response",
      async () => {
        const client =
          createMidtransStatusClient({
            serverKey:
              "SB-Mid-server-test",

            environment:
              "sandbox",

            fetchImpl:
              vi.fn(
                async () =>
                  response({
                    status_code:
                      "200",

                    order_id:
                      "lkv_test_001",
                  }),
              ) as
                unknown as
                typeof fetch,
          });

        await expect(
          client.getTransactionStatus(
            "lkv_test_001",
          ),
        ).rejects.toBeInstanceOf(
          MidtransStatusResponseError,
        );
      },
    );


    it(
      "surfaces Midtrans non-success HTTP response safely",
      async () => {
        const client =
          createMidtransStatusClient({
            serverKey:
              "SB-Mid-server-test",

            environment:
              "sandbox",

            fetchImpl:
              vi.fn(
                async () =>
                  response(
                    {
                      status_code:
                        "401",
                    },
                    401,
                  ),
              ) as
                unknown as
                typeof fetch,
          });

        await expect(
          client.getTransactionStatus(
            "lkv_test_001",
          ),
        ).rejects.toMatchObject({
          name:
            "MidtransStatusApiError",

          status:
            401,
        } satisfies Partial<
          MidtransStatusApiError
        >);
      },
    );


    it(
      "classifies verified successful settlement",
      () => {
        const status = {
          orderId:
            "lkv_test_001",

          transactionId:
            "txn",

          transactionStatus:
            "settlement",

          statusCode:
            "200",

          grossAmount:
            "199000.00",

          currency:
            "IDR",

          fraudStatus:
            "accept",

          paymentType:
            "qris",

          transactionTime:
            null,

          settlementTime:
            null,

          raw: {},
        };

        expect(
          classifyMidtransStatusOutcome(
            status,
          ),
        ).toBe(
          "completed",
        );
      },
    );


    it(
      "does not classify challenged capture as completed",
      () => {
        const status = {
          orderId:
            "lkv_test_001",

          transactionId:
            "txn",

          transactionStatus:
            "capture",

          statusCode:
            "200",

          grossAmount:
            "199000.00",

          currency:
            "IDR",

          fraudStatus:
            "challenge",

          paymentType:
            "credit_card",

          transactionTime:
            null,

          settlementTime:
            null,

          raw: {},
        };

        expect(
          classifyMidtransStatusOutcome(
            status,
          ),
        ).toBe(
          "unknown",
        );
      },
    );


    it(
      "maps pending expire cancel and deny",
      () => {
        const base = {
          orderId:
            "lkv_test_001",

          transactionId:
            "txn",

          statusCode:
            "201",

          grossAmount:
            "199000.00",

          currency:
            "IDR",

          fraudStatus:
            null,

          paymentType:
            "qris",

          transactionTime:
            null,

          settlementTime:
            null,

          raw: {},
        };

        expect(
          classifyMidtransStatusOutcome({
            ...base,
            transactionStatus:
              "pending",
          }),
        ).toBe(
          "pending",
        );

        expect(
          classifyMidtransStatusOutcome({
            ...base,
            transactionStatus:
              "expire",
          }),
        ).toBe(
          "expired",
        );

        expect(
          classifyMidtransStatusOutcome({
            ...base,
            transactionStatus:
              "cancel",
          }),
        ).toBe(
          "canceled",
        );

        expect(
          classifyMidtransStatusOutcome({
            ...base,
            transactionStatus:
              "deny",
          }),
        ).toBe(
          "denied",
        );
      },
    );
  },
);
