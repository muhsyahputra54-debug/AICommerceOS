import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  MIDTRANS_PROVIDER,
} from "@/lib/billing/midtrans";

import {
  MidtransNotificationConfigurationError,
} from "@/lib/billing/midtrans-notification";

import {
  MidtransVerifiedNotificationSignatureError,
  type MidtransVerifiedNotificationDependencies,
} from "@/lib/billing/midtrans-orchestrator";

import {
  MidtransStatusApiError,
} from "@/lib/billing/midtrans-status";

const mocks =
  vi.hoisted(() => ({
    processVerifiedMidtransNotification:
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
  "@/lib/billing/midtrans-orchestrator",
  async () => {
    const actual =
      await vi.importActual<
        typeof import(
          "@/lib/billing/midtrans-orchestrator"
        )
      >(
        "@/lib/billing/midtrans-orchestrator",
      );

    return {
      ...actual,

      processVerifiedMidtransNotification:
        mocks
          .processVerifiedMidtransNotification,
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

function requestWithBody(
  body: string,
  headers:
    Record<
      string,
      string
    > = {},
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
          "request-12345678",

        ...headers,
      },

      body,
    },
  );
}

function jsonRequest(
  payload: unknown,
  headers:
    Record<
      string,
      string
    > = {},
) {
  return requestWithBody(
    JSON.stringify(
      payload,
    ),
    headers,
  );
}

function processedResult(
  processResult =
    "completed",
) {
  return {
    kind:
      "processed" as const,

    orderId:
      "lkv_test_001",

    eventId:
      "mtxv_event_001",

    eventType:
      "midtrans.transaction.settlement",

    paymentOutcome:
      "completed" as const,

    recordResult:
      "recorded",

    processResult,
  };
}

function installAdminQueryMock() {
  const query:
    Record<
      string,
      unknown
    > = {};

  mocks.adminSelect
    .mockReturnValue(
      query,
    );

  mocks.adminEq
    .mockReturnValue(
      query,
    );

  query.select =
    mocks.adminSelect;

  query.eq =
    mocks.adminEq;

  query.maybeSingle =
    mocks.adminMaybeSingle;

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

  installAdminQueryMock();

  mocks
    .processVerifiedMidtransNotification
    .mockResolvedValue(
      processedResult(),
    );

  mocks
    .adminMaybeSingle
    .mockResolvedValue({
      data: {
        id:
          "checkout-001",

        organization_id:
          "organization-001",

        provider:
          "midtrans",

        reference_id:
          "lkv_test_001",
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

        if (
          name ===
          "activate_billing_checkout_entitlement"
        ) {
          return {
            data:
              "activated",

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

describe(
  "POST /api/billing/midtrans/notification",
  () => {

    it(
      "rejects declared payloads larger than 64 KiB before orchestration",
      async () => {
        const response =
          await POST(
            requestWithBody(
              "{}",
              {
                "content-length":
                  String(
                    64 * 1024 +
                    1,
                  ),
              },
            ),
          );

        expect(
          response.status,
        ).toBe(413);

        expect(
          mocks
            .processVerifiedMidtransNotification,
        ).not.toHaveBeenCalled();

        expect(
          mocks.createAdminClient,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "rejects actual payloads larger than 64 KiB",
      async () => {
        const response =
          await POST(
            requestWithBody(
              "x".repeat(
                64 * 1024 +
                1,
              ),
            ),
          );

        expect(
          response.status,
        ).toBe(413);

        expect(
          mocks
            .processVerifiedMidtransNotification,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "rejects malformed JSON",
      async () => {
        const response =
          await POST(
            requestWithBody(
              "{broken-json",
            ),
          );

        expect(
          response.status,
        ).toBe(400);

        expect(
          mocks
            .processVerifiedMidtransNotification,
        ).not.toHaveBeenCalled();

        expect(
          mocks.createAdminClient,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "returns 401 for an invalid Midtrans signature",
      async () => {
        mocks
          .processVerifiedMidtransNotification
          .mockRejectedValueOnce(
            new MidtransVerifiedNotificationSignatureError(
              "invalid signature",
            ),
          );

        const response =
          await POST(
            jsonRequest({
              order_id:
                "lkv_test_001",
            }),
          );

        expect(
          response.status,
        ).toBe(401);

        expect(
          mocks.createAdminClient,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "returns 503 when Midtrans server configuration is unavailable",
      async () => {
        mocks
          .processVerifiedMidtransNotification
          .mockRejectedValueOnce(
            new MidtransNotificationConfigurationError(
              "missing server key",
            ),
          );

        const response =
          await POST(
            jsonRequest({
              order_id:
                "lkv_test_001",
            }),
          );

        expect(
          response.status,
        ).toBe(503);

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );


    it(
      "returns 502 when authoritative Midtrans status lookup fails",
      async () => {
        mocks
          .processVerifiedMidtransNotification
          .mockRejectedValueOnce(
            new MidtransStatusApiError(
              "synthetic status error",
              503,
            ),
          );

        const response =
          await POST(
            jsonRequest({
              order_id:
                "lkv_test_001",
            }),
          );

        expect(
          response.status,
        ).toBe(502);

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );


    it(
      "acknowledges a valid signed notification for an unknown checkout",
      async () => {
        mocks
          .processVerifiedMidtransNotification
          .mockResolvedValueOnce({
            kind:
              "missing_checkout",

            orderId:
              "lkv_test_001",
          });

        const response =
          await POST(
            jsonRequest({
              order_id:
                "lkv_test_001",
            }),
          );

        expect(
          response.status,
        ).toBe(200);
      },
    );


    it(
      "acknowledges a successfully processed verified notification",
      async () => {
        const response =
          await POST(
            jsonRequest({
              order_id:
                "lkv_test_001",
            }),
          );

        expect(
          response.status,
        ).toBe(200);
      },
    );


    it(
      "returns 503 when completion races before checkout readiness",
      async () => {
        mocks
          .processVerifiedMidtransNotification
          .mockResolvedValueOnce(
            processedResult(
              "checkout_not_ready",
            ),
          );

        const response =
          await POST(
            jsonRequest({
              order_id:
                "lkv_test_001",
            }),
          );

        expect(
          response.status,
        ).toBe(503);

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );


    it(
      "returns 503 when the recorded billing event cannot be found by the processor",
      async () => {
        mocks
          .processVerifiedMidtransNotification
          .mockResolvedValueOnce(
            processedResult(
              "missing_event",
            ),
          );

        const response =
          await POST(
            jsonRequest({
              order_id:
                "lkv_test_001",
            }),
          );

        expect(
          response.status,
        ).toBe(503);
      },
    );


    it(
      "fails closed with 503 if service-role Supabase configuration is unavailable",
      async () => {
        mocks
          .createAdminClient
          .mockImplementationOnce(
            () => {
              throw new Error(
                "admin unavailable",
              );
            },
          );

        mocks
          .processVerifiedMidtransNotification
          .mockImplementationOnce(
            async (
              _payload: unknown,
              dependencies:
                MidtransVerifiedNotificationDependencies,
            ) => {

              await dependencies
                .findCheckoutByReference(
                  "lkv_test_001",
                );

              throw new Error(
                "unreachable",
              );
            },
          );

        const response =
          await POST(
            jsonRequest({
              order_id:
                "lkv_test_001",
            }),
          );

        expect(
          response.status,
        ).toBe(503);

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );


    it(
      "wires checkout lookup and both billing RPC adapters with exact server-side fields",
      async () => {
        mocks
          .processVerifiedMidtransNotification
          .mockImplementationOnce(
            async (
              _payload: unknown,
              dependencies:
                MidtransVerifiedNotificationDependencies,
            ) => {

              const checkout =
                await dependencies
                  .findCheckoutByReference(
                    "lkv_test_001",
                  );

              expect(
                checkout,
              ).toEqual({
                checkoutSessionId:
                  "checkout-001",

                organizationId:
                  "organization-001",

                provider:
                  "midtrans",

                referenceId:
                  "lkv_test_001",
              });

              const recordResult =
                await dependencies
                  .recordBillingEvent({
                    organizationId:
                      "organization-001",

                    provider:
                      "midtrans",

                    externalEventId:
                      "mtxv_event_001",

                    eventType:
                      "midtrans.transaction.settlement",

                    payload: {
                      source:
                        "midtrans_status_api",
                    },
                  });

              const processResult =
                await dependencies
                  .processCheckoutPaymentEvent({
                    organizationId:
                      "organization-001",

                    provider:
                      "midtrans",

                    externalEventId:
                      "mtxv_event_001",

                    referenceId:
                      "lkv_test_001",

                    providerTransactionId:
                      "verified-txn-001",

                    paymentOutcome:
                      "completed",

                    grossAmount:
                      199000,

                    currency:
                      "IDR",

                    verificationMethod:
                      "provider_status_api",

                    metadata: {
                      source:
                        "midtrans_status_api",
                    },
                  });

              return {
                kind:
                  "processed" as const,

                orderId:
                  "lkv_test_001",

                eventId:
                  "mtxv_event_001",

                eventType:
                  "midtrans.transaction.settlement",

                paymentOutcome:
                  "completed" as const,

                recordResult,

                processResult,
              };
            },
          );

        const response =
          await POST(
            jsonRequest({
              order_id:
                "lkv_test_001",
            }),
          );

        expect(
          response.status,
        ).toBe(200);


        // -----------------------------------------------------
        // Checkout lookup
        // -----------------------------------------------------

        expect(
          mocks.adminFrom,
        ).toHaveBeenCalledWith(
          "billing_checkout_sessions",
        );

        expect(
          mocks.adminSelect,
        ).toHaveBeenCalledWith(
          "id, organization_id, provider, reference_id",
        );

        expect(
          mocks.adminEq,
        ).toHaveBeenNthCalledWith(
          1,
          "provider",
          MIDTRANS_PROVIDER,
        );

        expect(
          mocks.adminEq,
        ).toHaveBeenNthCalledWith(
          2,
          "reference_id",
          "lkv_test_001",
        );


        // -----------------------------------------------------
        // Inbox RPC
        // -----------------------------------------------------

        expect(
          mocks.adminRpc,
        ).toHaveBeenCalledWith(
          "record_billing_webhook_event",
          {
            p_organization_id:
              "organization-001",

            p_provider:
              "midtrans",

            p_external_event_id:
              "mtxv_event_001",

            p_event_type:
              "midtrans.transaction.settlement",

            p_payload: {
              source:
                "midtrans_status_api",
            },
          },
        );


        // -----------------------------------------------------
        // D2 processor RPC
        // -----------------------------------------------------

        expect(
          mocks.adminRpc,
        ).toHaveBeenCalledWith(
          "process_billing_checkout_payment_event",
          {
            p_organization_id:
              "organization-001",

            p_provider:
              "midtrans",

            p_external_event_id:
              "mtxv_event_001",

            p_reference_id:
              "lkv_test_001",

            p_provider_transaction_id:
              "verified-txn-001",

            p_payment_outcome:
              "completed",

            p_gross_amount:
              199000,

            p_currency:
              "IDR",

            p_verification_method:
              "provider_status_api",

            p_metadata: {
              source:
                "midtrans_status_api",
            },
          },
        );
      },
    );
  },
);
