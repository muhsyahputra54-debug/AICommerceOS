import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks =
  vi.hoisted(() => ({
    processVerifiedMidtransNotification:
      vi.fn(),

    createAdminClient:
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
      },

      body,
    },
  );
}

function processedResult(
  processResult: string,
) {
  return {
    kind:
      "processed" as const,

    orderId:
      "lkv_test_001",

    eventId:
      "mtxv_test_event",

    eventType:
      "midtrans.transaction.settlement",

    paymentOutcome:
      "completed" as const,

    recordResult:
      "recorded",

    processResult,
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks
    .processVerifiedMidtransNotification
    .mockResolvedValue(
      processedResult(
        "completed",
      ),
    );
});

describe(
  "Midtrans notification route hardening",
  () => {

    it(
      "rejects an oversized multi-byte stream before orchestration",
      async () => {
        const body =
          JSON.stringify({
            payload:
              "€".repeat(
                30000,
              ),
          });

        expect(
          body.length,
        ).toBeLessThan(
          64 * 1024,
        );

        expect(
          new TextEncoder()
            .encode(
              body,
            )
            .byteLength,
        ).toBeGreaterThan(
          64 * 1024,
        );

        const response =
          await POST(
            requestWithBody(
              body,
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
      "logs and acknowledges a permanent authoritative integrity mismatch",
      async () => {
        mocks
          .processVerifiedMidtransNotification
          .mockResolvedValueOnce(
            processedResult(
              "amount_mismatch",
            ),
          );

        const response =
          await POST(
            requestWithBody(
              JSON.stringify({
                order_id:
                  "lkv_test_001",
              }),
            ),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledTimes(
          1,
        );

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


    it(
      "acknowledges an explicitly accepted idempotent processor result",
      async () => {
        mocks
          .processVerifiedMidtransNotification
          .mockResolvedValueOnce({
            ...processedResult(
              "already_processed",
            ),

            paymentOutcome:
              "pending" as const,
          });

        const response =
          await POST(
            requestWithBody(
              JSON.stringify({
                order_id:
                  "lkv_test_001",
              }),
            ),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          mocks.logServerError,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "fails closed for an unknown database processor result",
      async () => {
        mocks
          .processVerifiedMidtransNotification
          .mockResolvedValueOnce(
            processedResult(
              "future_unclassified_result",
            ),
          );

        const response =
          await POST(
            requestWithBody(
              JSON.stringify({
                order_id:
                  "lkv_test_001",
              }),
            ),
          );

        expect(
          response.status,
        ).toBe(500);

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            operation:
              "process_billing_checkout_payment_event_unknown_result",
          }),
        );
      },
    );
  },
);
