import {
  createHash,
} from "node:crypto";

import {
  MIDTRANS_PROVIDER,
} from "./midtrans";

import {
  parseMidtransNotification,
  verifyMidtransNotificationSignature,
} from "./midtrans-notification";

import {
  classifyMidtransStatusOutcome,
  createMidtransStatusClient,
  type MidtransTransactionStatus,
} from "./midtrans-status";

export type MidtransCheckoutSnapshot = {
  checkoutSessionId: string;
  organizationId: string;
  provider: string;
  referenceId: string;
};

export type RecordBillingEventInput = {
  organizationId: string;
  provider: string;
  externalEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

export type ProcessCheckoutPaymentEventInput = {
  organizationId: string;
  provider: string;
  externalEventId: string;
  referenceId: string;
  providerTransactionId: string;
  paymentOutcome:
    | "pending"
    | "completed"
    | "expired"
    | "canceled"
    | "denied"
    | "unknown";
  grossAmount: number;
  currency: string;
  verificationMethod:
    "provider_status_api";
  metadata: Record<string, unknown>;
};

export type MidtransVerifiedNotificationDependencies = {
  serverKey?: string | null;

  findCheckoutByReference:
    (
      orderId: string,
    ) =>
      Promise<
        MidtransCheckoutSnapshot |
        null
      >;

  getTransactionStatus?:
    (
      orderId: string,
    ) =>
      Promise<
        MidtransTransactionStatus
      >;

  recordBillingEvent:
    (
      input:
        RecordBillingEventInput,
    ) =>
      Promise<string>;

  processCheckoutPaymentEvent:
    (
      input:
        ProcessCheckoutPaymentEventInput,
    ) =>
      Promise<string>;
};

export type MidtransVerifiedNotificationResult =
  | {
      kind: "missing_checkout";
      orderId: string;
    }
  | {
      kind: "processed";
      orderId: string;
      eventId: string;
      eventType: string;
      paymentOutcome:
        ProcessCheckoutPaymentEventInput[
          "paymentOutcome"
        ];
      recordResult: string;
      processResult: string;
    };

export class MidtransVerifiedNotificationSignatureError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "MidtransVerifiedNotificationSignatureError";
  }
}

export class MidtransVerifiedStatusError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "MidtransVerifiedStatusError";
  }
}

function normalizeCheckoutSnapshot(
  snapshot:
    MidtransCheckoutSnapshot,
  expectedReferenceId:
    string,
) {
  const checkoutSessionId =
    snapshot
      .checkoutSessionId
      ?.trim();

  const organizationId =
    snapshot
      .organizationId
      ?.trim();

  const provider =
    snapshot
      .provider
      ?.trim()
      .toLowerCase();

  const referenceId =
    snapshot
      .referenceId
      ?.trim();

  if (!checkoutSessionId) {
    throw new MidtransVerifiedStatusError(
      "Checkout snapshot tidak memiliki checkout session id.",
    );
  }

  if (!organizationId) {
    throw new MidtransVerifiedStatusError(
      "Checkout snapshot tidak memiliki organization id.",
    );
  }

  if (
    provider !==
    MIDTRANS_PROVIDER
  ) {
    throw new MidtransVerifiedStatusError(
      "Checkout provider tidak cocok dengan Midtrans.",
    );
  }

  if (
    referenceId !==
    expectedReferenceId
  ) {
    throw new MidtransVerifiedStatusError(
      "Checkout reference tidak cocok dengan signed order_id.",
    );
  }

  return {
    checkoutSessionId,
    organizationId,
    provider,
    referenceId,
  };
}

function verifiedGrossAmount(
  value: string,
) {
  const normalized =
    value.trim();

  if (
    !/^\d+(?:\.0{1,2})?$/
      .test(
        normalized,
      )
  ) {
    throw new MidtransVerifiedStatusError(
      "gross_amount provider status bukan nominal IDR integer yang valid.",
    );
  }

  const amount =
    Number(
      normalized,
    );

  if (
    !Number.isSafeInteger(
      amount,
    ) ||
    amount <= 0
  ) {
    throw new MidtransVerifiedStatusError(
      "gross_amount provider status berada di luar batas aman.",
    );
  }

  return amount;
}

export function buildMidtransVerifiedStatusEventId(
  status:
    MidtransTransactionStatus,
) {
  const fraudStatus =
    status.fraudStatus
      ?.trim()
      .toLowerCase() ??
    "";

  const identity =
    [
      status.transactionId,
      status.orderId,
      status.transactionStatus,
      status.statusCode,
      fraudStatus,
    ]
      .join("|");

  const digest =
    createHash(
      "sha256",
    )
      .update(
        identity,
        "utf8",
      )
      .digest(
        "hex",
      );

  return `mtxv_${digest}`;
}

function buildVerifiedEventType(
  status:
    MidtransTransactionStatus,
) {
  return (
    "midtrans.transaction." +
    status.transactionStatus
  );
}

function buildVerifiedEventPayload(
  status:
    MidtransTransactionStatus,
) {
  return {
    source:
      "midtrans_status_api",

    order_id:
      status.orderId,

    transaction_id:
      status.transactionId,

    transaction_status:
      status.transactionStatus,

    status_code:
      status.statusCode,

    gross_amount:
      status.grossAmount,

    currency:
      status.currency,

    fraud_status:
      status.fraudStatus,

    payment_type:
      status.paymentType,

    transaction_time:
      status.transactionTime,

    settlement_time:
      status.settlementTime,
  };
}

function buildProcessorMetadata(
  status:
    MidtransTransactionStatus,
) {
  return {
    source:
      "midtrans_status_api",

    transaction_status:
      status.transactionStatus,

    status_code:
      status.statusCode,

    fraud_status:
      status.fraudStatus,

    payment_type:
      status.paymentType,

    transaction_time:
      status.transactionTime,

    settlement_time:
      status.settlementTime,
  };
}

export async function processVerifiedMidtransNotification(
  rawPayload: unknown,
  dependencies:
    MidtransVerifiedNotificationDependencies,
):
  Promise<
    MidtransVerifiedNotificationResult
  > {

  // ==========================================================
  // 1. PARSE WEBHOOK PAYLOAD
  // ==========================================================

  const notification =
    parseMidtransNotification(
      rawPayload,
    );


  // ==========================================================
  // 2. VERIFY SIGNATURE BEFORE DB OR PROVIDER STATUS API
  //
  // The notification lifecycle fields themselves are not
  // treated as authoritative after this point.
  // ==========================================================

  const signatureValid =
    verifyMidtransNotificationSignature(
      notification,
      dependencies.serverKey,
    );

  if (!signatureValid) {
    throw new MidtransVerifiedNotificationSignatureError(
      "Midtrans notification signature tidak valid.",
    );
  }


  // ==========================================================
  // 3. RESOLVE INTERNAL CHECKOUT FROM SIGNED ORDER ID
  //
  // Avoid provider API calls for an unknown internal checkout.
  // ==========================================================

  const checkoutRaw =
    await dependencies
      .findCheckoutByReference(
        notification.orderId,
      );

  if (!checkoutRaw) {
    return {
      kind:
        "missing_checkout",

      orderId:
        notification.orderId,
    };
  }

  const checkout =
    normalizeCheckoutSnapshot(
      checkoutRaw,
      notification.orderId,
    );


  // ==========================================================
  // 4. AUTHORITATIVE PROVIDER STATUS
  //
  // The notification is only a trigger.
  // Lifecycle / transaction identity comes from Get Status.
  // ==========================================================

  let status:
    MidtransTransactionStatus;

  if (
    dependencies
      .getTransactionStatus
  ) {
    status =
      await dependencies
        .getTransactionStatus(
          notification.orderId,
        );
  } else {
    const client =
      createMidtransStatusClient();

    status =
      await client
        .getTransactionStatus(
          notification.orderId,
        );
  }


  // ==========================================================
  // 5. ORDER ID MUST STILL MATCH
  //
  // The status client already enforces this for the default
  // implementation. Keep a second orchestration boundary for
  // injected/test implementations.
  // ==========================================================

  if (
    status.orderId !==
    notification.orderId
  ) {
    throw new MidtransVerifiedStatusError(
      "Verified Midtrans status order_id tidak cocok dengan notification.",
    );
  }


  // ==========================================================
  // 6. NORMALIZE AUTHORITATIVE AMOUNT
  //
  // Current LAKUVO Midtrans checkout contract uses integer IDR.
  // Database remains the final authority for amount/currency.
  // ==========================================================

  const grossAmount =
    verifiedGrossAmount(
      status.grossAmount,
    );


  // ==========================================================
  // 7. CLASSIFY PROVIDER STATUS
  // ==========================================================

  const paymentOutcome =
    classifyMidtransStatusOutcome(
      status,
    );


  // ==========================================================
  // 8. VERIFIED EVENT IDENTITY
  //
  // Do NOT derive billing event identity from untrusted webhook
  // transaction_status / transaction_id fields.
  // ==========================================================

  const externalEventId =
    buildMidtransVerifiedStatusEventId(
      status,
    );

  const eventType =
    buildVerifiedEventType(
      status,
    );


  // ==========================================================
  // 9. RECORD INBOX
  //
  // "duplicate" is NOT an instruction to skip processing.
  // An earlier attempt may have recorded the inbox event but
  // failed before D2 processing. Retrying D2 is required.
  // ==========================================================

  const recordResult =
    await dependencies
      .recordBillingEvent({
        organizationId:
          checkout.organizationId,

        provider:
          MIDTRANS_PROVIDER,

        externalEventId,

        eventType,

        payload:
          buildVerifiedEventPayload(
            status,
          ),
      });


  // ==========================================================
  // 10. ATOMIC D2 CHECKOUT PROCESSOR
  //
  // Only provider-status-API data enters the trusted processor
  // path. The database independently re-checks amount/currency,
  // transaction binding, lifecycle and idempotency.
  // ==========================================================

  const processResult =
    await dependencies
      .processCheckoutPaymentEvent({
        organizationId:
          checkout.organizationId,

        provider:
          MIDTRANS_PROVIDER,

        externalEventId,

        referenceId:
          checkout.referenceId,

        providerTransactionId:
          status.transactionId,

        paymentOutcome,

        grossAmount,

        currency:
          status.currency,

        verificationMethod:
          "provider_status_api",

        metadata:
          buildProcessorMetadata(
            status,
          ),
      });


  return {
    kind:
      "processed",

    orderId:
      notification.orderId,

    eventId:
      externalEventId,

    eventType,

    paymentOutcome,

    recordResult,

    processResult,
  };
}
