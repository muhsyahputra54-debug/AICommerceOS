import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildMidtransExternalEventId,
  calculateMidtransSignature,
  classifyMidtransPaymentOutcome,
  MidtransNotificationInputError,
  parseMidtransNotification,
  verifyMidtransNotificationSignature,
} from "./midtrans-notification";

const serverKey =
  "SB-Mid-server-test";

function signedPayload(
  overrides:
    Record<string, unknown> = {},
) {
  const payload:
    Record<string, unknown> = {
      transaction_time:
        "2026-08-25 09:30:00",

      transaction_status:
        "pending",

      transaction_id:
        "midtrans-transaction-001",

      status_code:
        "201",

      payment_type:
        "qris",

      order_id:
        "lkv_11111111-1111-4111-8111-111111111111",

      gross_amount:
        "199000.00",

      currency:
        "IDR",

      fraud_status:
        "accept",

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

describe(
  "Midtrans notification contract",
  () => {
    it(
      "parses required fields while tolerating additional fields",
      () => {
        const notification =
          parseMidtransNotification(
            signedPayload({
              future_midtrans_field:
                "must-not-break-parser",
            }),
          );

        expect(
          notification.orderId,
        ).toMatch(
          /^lkv_/,
        );

        expect(
          notification.transactionId,
        ).toBe(
          "midtrans-transaction-001",
        );

        expect(
          notification.currency,
        ).toBe(
          "IDR",
        );

        expect(
          notification.raw
            .future_midtrans_field,
        ).toBe(
          "must-not-break-parser",
        );
      },
    );

    it(
      "rejects missing required fields",
      () => {
        const payload =
          signedPayload();

        delete payload.order_id;

        expect(
          () =>
            parseMidtransNotification(
              payload,
            ),
        ).toThrow(
          MidtransNotificationInputError,
        );
      },
    );

    it(
      "verifies a valid Midtrans signature",
      () => {
        const notification =
          parseMidtransNotification(
            signedPayload(),
          );

        expect(
          verifyMidtransNotificationSignature(
            notification,
            serverKey,
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects a tampered signed amount",
      () => {
        const payload =
          signedPayload();

        payload.gross_amount =
          "1.00";

        const notification =
          parseMidtransNotification(
            payload,
          );

        expect(
          verifyMidtransNotificationSignature(
            notification,
            serverKey,
          ),
        ).toBe(false);
      },
    );

    it(
      "builds a stable event id for duplicate delivery",
      () => {
        const first =
          parseMidtransNotification(
            signedPayload(),
          );

        const second =
          parseMidtransNotification(
            signedPayload({
              some_extra_field:
                "different-nonidentity-metadata",
            }),
          );

        expect(
          buildMidtransExternalEventId(
            first,
          ),
        ).toBe(
          buildMidtransExternalEventId(
            second,
          ),
        );
      },
    );

    it(
      "creates a different event id for a legitimate status transition",
      () => {
        const pending =
          parseMidtransNotification(
            signedPayload(),
          );

        const settlement =
          parseMidtransNotification(
            signedPayload({
              transaction_status:
                "settlement",

              status_code:
                "200",

              settlement_time:
                "2026-08-25 09:35:00",
            }),
          );

        expect(
          buildMidtransExternalEventId(
            pending,
          ),
        ).not.toBe(
          buildMidtransExternalEventId(
            settlement,
          ),
        );
      },
    );

    it(
      "classifies pending without activating payment",
      () => {
        const notification =
          parseMidtransNotification(
            signedPayload(),
          );

        expect(
          classifyMidtransPaymentOutcome(
            notification,
          ),
        ).toBe(
          "pending",
        );
      },
    );

    it(
      "classifies settlement success only with status code 200",
      () => {
        const valid =
          parseMidtransNotification(
            signedPayload({
              transaction_status:
                "settlement",

              status_code:
                "200",
            }),
          );

        const invalid =
          parseMidtransNotification(
            signedPayload({
              transaction_status:
                "settlement",

              status_code:
                "201",
            }),
          );

        expect(
          classifyMidtransPaymentOutcome(
            valid,
          ),
        ).toBe(
          "completed",
        );

        expect(
          classifyMidtransPaymentOutcome(
            invalid,
          ),
        ).toBe(
          "unknown",
        );
      },
    );

    it(
      "requires fraud accept for successful capture when fraud_status exists",
      () => {
        const accepted =
          parseMidtransNotification(
            signedPayload({
              transaction_status:
                "capture",

              status_code:
                "200",

              fraud_status:
                "accept",
            }),
          );

        const challenged =
          parseMidtransNotification(
            signedPayload({
              transaction_status:
                "capture",

              status_code:
                "200",

              fraud_status:
                "challenge",
            }),
          );

        expect(
          classifyMidtransPaymentOutcome(
            accepted,
          ),
        ).toBe(
          "completed",
        );

        expect(
          classifyMidtransPaymentOutcome(
            challenged,
          ),
        ).toBe(
          "unknown",
        );
      },
    );

    it(
      "maps expiry cancellation and denial separately",
      () => {
        const expired =
          parseMidtransNotification(
            signedPayload({
              transaction_status:
                "expire",
            }),
          );

        const canceled =
          parseMidtransNotification(
            signedPayload({
              transaction_status:
                "cancel",
            }),
          );

        const denied =
          parseMidtransNotification(
            signedPayload({
              transaction_status:
                "deny",
            }),
          );

        expect(
          classifyMidtransPaymentOutcome(
            expired,
          ),
        ).toBe(
          "expired",
        );

        expect(
          classifyMidtransPaymentOutcome(
            canceled,
          ),
        ).toBe(
          "canceled",
        );

        expect(
          classifyMidtransPaymentOutcome(
            denied,
          ),
        ).toBe(
          "denied",
        );
      },
    );
  },
);
