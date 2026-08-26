import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  calculateMidtransSignature,
} from "./midtrans-notification";

import type {
  MidtransTransactionStatus,
} from "./midtrans-status";

import {
  buildMidtransVerifiedStatusEventId,
  MidtransVerifiedNotificationSignatureError,
  MidtransVerifiedStatusError,
  processVerifiedMidtransNotification,
  type MidtransCheckoutSnapshot,
} from "./midtrans-orchestrator";

const serverKey =
  "SB-Mid-server-test";

function notificationPayload(
  overrides:
    Record<string, unknown> = {},
) {
  const payload:
    Record<string, unknown> = {
      order_id:
        "lkv_test_001",

      transaction_id:
        "webhook-untrusted-txn",

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

      serverKey,
    });

  return payload;
}

function checkoutSnapshot():
  MidtransCheckoutSnapshot {
  return {
    checkoutSessionId:
      "checkout-001",

    organizationId:
      "organization-001",

    provider:
      "midtrans",

    referenceId:
      "lkv_test_001",
  };
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
      "lkv_test_001",

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

function createMocks() {
  const findCheckoutByReference =
    vi.fn(
      async (
        _orderId: string,
      ):
        Promise<
          MidtransCheckoutSnapshot |
          null
        > => {
        void _orderId;

        return checkoutSnapshot();
      },
    );

  const getTransactionStatus =
    vi.fn(
      async (
        _orderId: string,
      ):
        Promise<
          MidtransTransactionStatus
        > => {
        void _orderId;

        return verifiedStatus();
      },
    );

  const recordBillingEvent =
    vi.fn(
      async (
        _input: unknown,
      ) => {
        void _input;

        return "recorded";
      },
    );

  const processCheckoutPaymentEvent =
    vi.fn(
      async (
        _input: unknown,
      ) => {
        void _input;

        return "completed";
      },
    );

  return {
    findCheckoutByReference,
    getTransactionStatus,
    recordBillingEvent,
    processCheckoutPaymentEvent,
  };
}

describe(
  "verified Midtrans notification orchestration",
  () => {
    it(
      "rejects invalid signature before DB lookup or status API",
      async () => {
        const mocks =
          createMocks();

        const payload =
          notificationPayload();

        payload.signature_key =
          "0".repeat(
            128,
          );

        await expect(
          processVerifiedMidtransNotification(
            payload,
            {
              serverKey,
              ...mocks,
            },
          ),
        ).rejects.toBeInstanceOf(
          MidtransVerifiedNotificationSignatureError,
        );

        expect(
          mocks.findCheckoutByReference,
        ).not.toHaveBeenCalled();

        expect(
          mocks.getTransactionStatus,
        ).not.toHaveBeenCalled();

        expect(
          mocks.recordBillingEvent,
        ).not.toHaveBeenCalled();

        expect(
          mocks.processCheckoutPaymentEvent,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "does not call provider status API for unknown internal checkout",
      async () => {
        const mocks =
          createMocks();

        mocks
          .findCheckoutByReference
          .mockResolvedValue(
            null,
          );

        const result =
          await processVerifiedMidtransNotification(
            notificationPayload(),
            {
              serverKey,
              ...mocks,
            },
          );

        expect(
          result,
        ).toEqual({
          kind:
            "missing_checkout",

          orderId:
            "lkv_test_001",
        });

        expect(
          mocks.getTransactionStatus,
        ).not.toHaveBeenCalled();

        expect(
          mocks.recordBillingEvent,
        ).not.toHaveBeenCalled();

        expect(
          mocks.processCheckoutPaymentEvent,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "uses provider status instead of untrusted webhook lifecycle fields",
      async () => {
        const mocks =
          createMocks();

        const result =
          await processVerifiedMidtransNotification(
            notificationPayload({
              transaction_id:
                "forged-webhook-transaction",

              transaction_status:
                "deny",
            }),
            {
              serverKey,
              ...mocks,
            },
          );

        expect(
          mocks.getTransactionStatus,
        ).toHaveBeenCalledWith(
          "lkv_test_001",
        );

        expect(
          result.kind,
        ).toBe(
          "processed",
        );

        if (
          result.kind !==
          "processed"
        ) {
          throw new Error(
            "Expected processed result.",
          );
        }

        expect(
          result.paymentOutcome,
        ).toBe(
          "completed",
        );

        expect(
          mocks.processCheckoutPaymentEvent,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId:
              "organization-001",

            provider:
              "midtrans",

            referenceId:
              "lkv_test_001",

            providerTransactionId:
              "verified-provider-txn-001",

            paymentOutcome:
              "completed",

            grossAmount:
              199000,

            currency:
              "IDR",

            verificationMethod:
              "provider_status_api",
          }),
        );

        const processInput =
          mocks
            .processCheckoutPaymentEvent
            .mock.calls[0]?.[0] as
              Record<
                string,
                unknown
              >;

        expect(
          processInput
            .providerTransactionId,
        ).not.toBe(
          "forged-webhook-transaction",
        );
      },
    );


    it(
      "builds stable verified event id for duplicate provider status",
      () => {
        const first =
          verifiedStatus();

        const second =
          verifiedStatus({
            raw: {
              future_field:
                "different",
            },
          });

        expect(
          buildMidtransVerifiedStatusEventId(
            first,
          ),
        ).toBe(
          buildMidtransVerifiedStatusEventId(
            second,
          ),
        );
      },
    );


    it(
      "builds a new event id for a verified lifecycle transition",
      () => {
        const pending =
          verifiedStatus({
            transactionStatus:
              "pending",

            statusCode:
              "201",

            settlementTime:
              null,
          });

        const settled =
          verifiedStatus({
            transactionStatus:
              "settlement",

            statusCode:
              "200",
          });

        expect(
          buildMidtransVerifiedStatusEventId(
            pending,
          ),
        ).not.toBe(
          buildMidtransVerifiedStatusEventId(
            settled,
          ),
        );
      },
    );


    it(
      "still calls D2 processor when inbox record is duplicate",
      async () => {
        const mocks =
          createMocks();

        mocks
          .recordBillingEvent
          .mockResolvedValue(
            "duplicate",
          );

        mocks
          .processCheckoutPaymentEvent
          .mockResolvedValue(
            "already_processed",
          );

        const result =
          await processVerifiedMidtransNotification(
            notificationPayload(),
            {
              serverKey,
              ...mocks,
            },
          );

        expect(
          mocks.processCheckoutPaymentEvent,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          result,
        ).toMatchObject({
          kind:
            "processed",

          recordResult:
            "duplicate",

          processResult:
            "already_processed",
        });
      },
    );


    it(
      "rejects mismatched order id from injected status provider",
      async () => {
        const mocks =
          createMocks();

        mocks
          .getTransactionStatus
          .mockResolvedValue(
            verifiedStatus({
              orderId:
                "different-order",
            }),
          );

        await expect(
          processVerifiedMidtransNotification(
            notificationPayload(),
            {
              serverKey,
              ...mocks,
            },
          ),
        ).rejects.toBeInstanceOf(
          MidtransVerifiedStatusError,
        );

        expect(
          mocks.recordBillingEvent,
        ).not.toHaveBeenCalled();

        expect(
          mocks.processCheckoutPaymentEvent,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "rejects non-integer provider amount before billing mutation",
      async () => {
        const mocks =
          createMocks();

        mocks
          .getTransactionStatus
          .mockResolvedValue(
            verifiedStatus({
              grossAmount:
                "199000.50",
            }),
          );

        await expect(
          processVerifiedMidtransNotification(
            notificationPayload(),
            {
              serverKey,
              ...mocks,
            },
          ),
        ).rejects.toBeInstanceOf(
          MidtransVerifiedStatusError,
        );

        expect(
          mocks.recordBillingEvent,
        ).not.toHaveBeenCalled();

        expect(
          mocks.processCheckoutPaymentEvent,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "propagates provider status failure without recording or processing event",
      async () => {
        const mocks =
          createMocks();

        mocks
          .getTransactionStatus
          .mockRejectedValue(
            new Error(
              "synthetic status failure",
            ),
          );

        await expect(
          processVerifiedMidtransNotification(
            notificationPayload(),
            {
              serverKey,
              ...mocks,
            },
          ),
        ).rejects.toThrow(
          "synthetic status failure",
        );

        expect(
          mocks.recordBillingEvent,
        ).not.toHaveBeenCalled();

        expect(
          mocks.processCheckoutPaymentEvent,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
