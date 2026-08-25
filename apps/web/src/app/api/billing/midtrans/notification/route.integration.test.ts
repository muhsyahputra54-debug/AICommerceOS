import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  calculateMidtransSignature,
} from "@/lib/billing/midtrans-notification";

import {
  MidtransStatusApiError,
  type MidtransTransactionStatus,
} from "@/lib/billing/midtrans-status";

const mocks =
  vi.hoisted(() => ({
    createMidtransStatusClient:
      vi.fn(),

    getTransactionStatus:
      vi.fn(),

    createAdminClient:
      vi.fn(),

    adminFrom:
      vi.fn(),

    adminSelect:
      vi.fn(),

    adminEq:
      vi.fn(),

    adminMaybeSingle:
      vi.fn(),

    adminRpc:
      vi.fn(),

    logServerError:
      vi.fn(),
  }));

vi.mock(
  "@/lib/billing/midtrans-status",
  async () => {
    const actual =
      await vi.importActual<
        typeof import(
          "@/lib/billing/midtrans-status"
        )
      >(
        "@/lib/billing/midtrans-status",
      );

    return {
      ...actual,

      createMidtransStatusClient:
        mocks
          .createMidtransStatusClient,
    };
  },
);

vi.mock(
  "@/lib/supabase/admin",
  () => ({
    createAdminClient:
      mocks.createAdminClient,
  }),
);

vi.mock(
  "@/lib/observability/server-logger",
  () => ({
    logServerError:
      mocks.logServerError,
  }),
);

import {
  POST,
} from "./route";

const testServerKey =
  "SB-Mid-server-d3e-test";

const originalServerKey =
  process.env
    .MIDTRANS_SERVER_KEY;

const originalEnvironment =
  process.env
    .MIDTRANS_ENVIRONMENT;

function restoreEnv(
  name: string,
  value:
    string |
    undefined,
) {
  if (
    value ===
    undefined
  ) {
    delete process.env[name];
    return;
  }

  process.env[name] =
    value;
}

function verifiedStatus(
  overrides:
    Partial<
      MidtransTransactionStatus
    > = {},
):
  MidtransTransactionStatus {

  return {
    orderId:
      "lkv_d3e_001",

    transactionId:
      "verified-provider-txn-001",

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
      "2026-08-25 10:00:00",

    settlementTime:
      "2026-08-25 10:05:00",

    raw: {},

    ...overrides,
  };
}

function signedPayload(
  overrides:
    Record<
      string,
      unknown
    > = {},
) {
  const payload:
    Record<
      string,
      unknown
    > = {
      order_id:
        "lkv_d3e_001",

      // These lifecycle fields are intentionally not trusted
      // by the orchestration layer.
      transaction_id:
        "untrusted-webhook-txn",

      transaction_status:
        "pending",

      status_code:
        "201",

      gross_amount:
        "199000.00",

      currency:
        "IDR",

      fraud_status:
        "accept",

      payment_type:
        "qris",

      ...overrides,
    };

  payload.signature_key =
    calculateMidtransSignature({
      orderId:
        String(
          payload.order_id,
        ),

      statusCode:
        String(
          payload.status_code,
        ),

      grossAmount:
        String(
          payload.gross_amount,
        ),

      serverKey:
        testServerKey,
    });

  return payload;
}

function requestFor(
  payload: unknown,
) {
  return new Request(
    "https://route.test/api/billing/midtrans/notification",
    {
      method:
        "POST",

      headers: {
        "content-type":
          "application/json",

        "x-request-id":
          "request-d3e-12345678",
      },

      body:
        JSON.stringify(
          payload,
        ),
    },
  );
}

function installAdminQueryMock() {
  const query:
    Record<
      string,
      unknown
    > = {};

  query.select =
    mocks.adminSelect;

  query.eq =
    mocks.adminEq;

  query.maybeSingle =
    mocks.adminMaybeSingle;

  mocks.adminSelect
    .mockReturnValue(
      query,
    );

  mocks.adminEq
    .mockReturnValue(
      query,
    );

  mocks.adminFrom
    .mockReturnValue(
      query,
    );

  mocks.createAdminClient
    .mockReturnValue({
      from:
        mocks.adminFrom,

      rpc:
        mocks.adminRpc,
    });
}

beforeEach(() => {
  vi.clearAllMocks();

  process.env
    .MIDTRANS_SERVER_KEY =
      testServerKey;

  process.env
    .MIDTRANS_ENVIRONMENT =
      "sandbox";

  installAdminQueryMock();

  mocks
    .createMidtransStatusClient
    .mockReturnValue({
      getTransactionStatus:
        mocks
          .getTransactionStatus,
    });

  mocks
    .getTransactionStatus
    .mockResolvedValue(
      verifiedStatus(),
    );

  mocks
    .adminMaybeSingle
    .mockResolvedValue({
      data: {
        id:
          "checkout-d3e-001",

        organization_id:
          "organization-d3e-001",

        provider:
          "midtrans",

        reference_id:
          "lkv_d3e_001",
      },

      error:
        null,
    });

  mocks
    .adminRpc
    .mockImplementation(
      async (
        name: string,
      ) => {

        if (
          name ===
          "record_billing_webhook_event"
        ) {
          return {
            data:
              "recorded",

            error:
              null,
          };
        }

        if (
          name ===
          "process_billing_checkout_payment_event"
        ) {
          return {
            data:
              "completed",

            error:
              null,
          };
        }

        return {
          data:
            null,

          error: {
            message:
              "unexpected rpc",
          },
        };
      },
    );
});

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
  "Midtrans notification full security integration",
  () => {

    it(
      "rejects an invalid signature before DB lookup and status API",
      async () => {
        const payload =
          signedPayload();

        payload.signature_key =
          "0".repeat(
            128,
          );

        const response =
          await POST(
            requestFor(
              payload,
            ),
          );

        expect(
          response.status,
        ).toBe(401);

        expect(
          mocks.createAdminClient,
        ).not.toHaveBeenCalled();

        expect(
          mocks.getTransactionStatus,
        ).not.toHaveBeenCalled();

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "acknowledges a valid signed unknown checkout without provider status lookup",
      async () => {
        mocks
          .adminMaybeSingle
          .mockResolvedValueOnce({
            data:
              null,

            error:
              null,
          });

        const response =
          await POST(
            requestFor(
              signedPayload(),
            ),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          mocks.createAdminClient,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.getTransactionStatus,
        ).not.toHaveBeenCalled();

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "uses authoritative Get Status transaction identity and lifecycle instead of webhook fields",
      async () => {
        const response =
          await POST(
            requestFor(
              signedPayload({
                transaction_id:
                  "forged-webhook-txn",

                transaction_status:
                  "deny",
              }),
            ),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          mocks.getTransactionStatus,
        ).toHaveBeenCalledWith(
          "lkv_d3e_001",
        );

        expect(
          mocks.adminRpc,
        ).toHaveBeenCalledWith(
          "record_billing_webhook_event",
          expect.objectContaining({
            p_organization_id:
              "organization-d3e-001",

            p_provider:
              "midtrans",

            p_event_type:
              "midtrans.transaction.settlement",

            p_payload:
              expect.objectContaining({
                source:
                  "midtrans_status_api",

                order_id:
                  "lkv_d3e_001",

                transaction_id:
                  "verified-provider-txn-001",

                transaction_status:
                  "settlement",

                gross_amount:
                  "199000.00",

                currency:
                  "IDR",
              }),
          }),
        );

        expect(
          mocks.adminRpc,
        ).toHaveBeenCalledWith(
          "process_billing_checkout_payment_event",
          expect.objectContaining({
            p_organization_id:
              "organization-d3e-001",

            p_provider:
              "midtrans",

            p_reference_id:
              "lkv_d3e_001",

            p_provider_transaction_id:
              "verified-provider-txn-001",

            p_payment_outcome:
              "completed",

            p_gross_amount:
              199000,

            p_currency:
              "IDR",

            p_verification_method:
              "provider_status_api",
          }),
        );

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalledWith(
          "process_billing_checkout_payment_event",
          expect.objectContaining({
            p_provider_transaction_id:
              "forged-webhook-txn",
          }),
        );
      },
    );


    it(
      "rejects a mismatched authoritative provider order id before inbox mutation",
      async () => {
        mocks
          .getTransactionStatus
          .mockResolvedValueOnce(
            verifiedStatus({
              orderId:
                "different-order",
            }),
          );

        const response =
          await POST(
            requestFor(
              signedPayload(),
            ),
          );

        expect(
          response.status,
        ).toBe(502);

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );


    it(
      "returns retryable non-2xx when provider status API fails",
      async () => {
        mocks
          .getTransactionStatus
          .mockRejectedValueOnce(
            new MidtransStatusApiError(
              "synthetic provider failure",
              503,
            ),
          );

        const response =
          await POST(
            requestFor(
              signedPayload(),
            ),
          );

        expect(
          response.status,
        ).toBe(502);

        expect(
          mocks.adminRpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );


    it(
      "reprocesses a duplicate inbox event and safely accepts D2 idempotency",
      async () => {
        mocks
          .adminRpc
          .mockImplementation(
            async (
              name: string,
            ) => {

              if (
                name ===
                "record_billing_webhook_event"
              ) {
                return {
                  data:
                    "duplicate",

                  error:
                    null,
                };
              }

              if (
                name ===
                "process_billing_checkout_payment_event"
              ) {
                return {
                  data:
                    "already_processed",

                  error:
                    null,
                };
              }

              return {
                data:
                  null,

                error: {
                  message:
                    "unexpected rpc",
                },
              };
            },
          );

        const response =
          await POST(
            requestFor(
              signedPayload(),
            ),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          mocks.adminRpc,
        ).toHaveBeenCalledWith(
          "record_billing_webhook_event",
          expect.any(
            Object,
          ),
        );

        expect(
          mocks.adminRpc,
        ).toHaveBeenCalledWith(
          "process_billing_checkout_payment_event",
          expect.any(
            Object,
          ),
        );

        expect(
          mocks.logServerError,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "logs and acknowledges a permanent authoritative amount mismatch without retry loop",
      async () => {
        mocks
          .adminRpc
          .mockImplementation(
            async (
              name: string,
            ) => {

              if (
                name ===
                "record_billing_webhook_event"
              ) {
                return {
                  data:
                    "recorded",

                  error:
                    null,
                };
              }

              if (
                name ===
                "process_billing_checkout_payment_event"
              ) {
                return {
                  data:
                    "amount_mismatch",

                  error:
                    null,
                };
              }

              return {
                data:
                  null,

                error: {
                  message:
                    "unexpected rpc",
                },
              };
            },
          );

        const response =
          await POST(
            requestFor(
              signedPayload(),
            ),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            event:
              "billing_midtrans_notification_failed",

            operation:
              "process_billing_checkout_payment_event_integrity",
          }),
        );
      },
    );
  },
);
