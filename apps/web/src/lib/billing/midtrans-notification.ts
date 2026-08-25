import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

export type MidtransNotification = {
  orderId: string;
  transactionId: string;
  transactionStatus: string;
  statusCode: string;
  grossAmount: string;
  currency: string | null;
  fraudStatus: string | null;
  paymentType: string | null;
  settlementTime: string | null;
  signatureKey: string;
  raw: Record<string, unknown>;
};

export type MidtransPaymentOutcome =
  | "pending"
  | "completed"
  | "expired"
  | "canceled"
  | "denied"
  | "unknown";

export class MidtransNotificationInputError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "MidtransNotificationInputError";
  }
}

export class MidtransNotificationConfigurationError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "MidtransNotificationConfigurationError";
  }
}

function requiredString(
  value: unknown,
  field: string,
) {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new MidtransNotificationInputError(
      `${field} wajib berupa string non-empty.`,
    );
  }

  return value.trim();
}

function optionalString(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeStatus(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function normalizeFraudStatus(
  value: string | null,
) {
  return value
    ? value
        .trim()
        .toLowerCase()
    : "";
}

function normalizeCurrency(
  value: string | null,
) {
  return value
    ? value
        .trim()
        .toUpperCase()
    : null;
}

function normalizeSignature(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function isHexSha512(
  value: string,
) {
  return /^[0-9a-f]{128}$/i
    .test(value);
}

export function parseMidtransNotification(
  value: unknown,
): MidtransNotification {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new MidtransNotificationInputError(
      "Notification payload wajib berupa JSON object.",
    );
  }

  const raw =
    value as
      Record<string, unknown>;

  const orderId =
    requiredString(
      raw.order_id,
      "order_id",
    );

  const transactionId =
    requiredString(
      raw.transaction_id,
      "transaction_id",
    );

  const transactionStatus =
    normalizeStatus(
      requiredString(
        raw.transaction_status,
        "transaction_status",
      ),
    );

  const statusCode =
    requiredString(
      raw.status_code,
      "status_code",
    );

  const grossAmount =
    requiredString(
      raw.gross_amount,
      "gross_amount",
    );

  const signatureKey =
    normalizeSignature(
      requiredString(
        raw.signature_key,
        "signature_key",
      ),
    );

  if (
    !isHexSha512(
      signatureKey,
    )
  ) {
    throw new MidtransNotificationInputError(
      "signature_key tidak memiliki format SHA-512 hex yang valid.",
    );
  }

  const currency =
    normalizeCurrency(
      optionalString(
        raw.currency,
      ),
    );

  const fraudStatus =
    optionalString(
      raw.fraud_status,
    );

  const paymentType =
    optionalString(
      raw.payment_type,
    );

  const settlementTime =
    optionalString(
      raw.settlement_time,
    );

  return {
    orderId,
    transactionId,
    transactionStatus,
    statusCode,
    grossAmount,
    currency,
    fraudStatus:
      fraudStatus
        ? normalizeStatus(
            fraudStatus,
          )
        : null,
    paymentType,
    settlementTime,
    signatureKey,
    raw,
  };
}

export function calculateMidtransSignature(
  input: {
    orderId: string;
    statusCode: string;
    grossAmount: string;
    serverKey: string;
  },
) {
  return createHash(
    "sha512",
  )
    .update(
      input.orderId +
      input.statusCode +
      input.grossAmount +
      input.serverKey,
      "utf8",
    )
    .digest(
      "hex",
    );
}

export function verifyMidtransNotificationSignature(
  notification:
    MidtransNotification,
  serverKey?:
    string | null,
) {
  const key =
    (
      serverKey ??
      process.env
        .MIDTRANS_SERVER_KEY
    )
      ?.trim();

  if (!key) {
    throw new MidtransNotificationConfigurationError(
      "MIDTRANS_SERVER_KEY belum dikonfigurasi.",
    );
  }

  const expected =
    calculateMidtransSignature({
      orderId:
        notification.orderId,

      statusCode:
        notification.statusCode,

      grossAmount:
        notification.grossAmount,

      serverKey:
        key,
    });

  const actualBuffer =
    Buffer.from(
      notification.signatureKey,
      "hex",
    );

  const expectedBuffer =
    Buffer.from(
      expected,
      "hex",
    );

  if (
    actualBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    actualBuffer,
    expectedBuffer,
  );
}

export function buildMidtransExternalEventId(
  notification:
    MidtransNotification,
) {
  const identity =
    [
      notification.transactionId,
      notification.orderId,
      notification.transactionStatus,
      notification.statusCode,
      normalizeFraudStatus(
        notification.fraudStatus,
      ),
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

  return `mtx_${digest}`;
}

export function classifyMidtransPaymentOutcome(
  notification:
    MidtransNotification,
): MidtransPaymentOutcome {
  const status =
    notification
      .transactionStatus;

  if (
    status === "pending"
  ) {
    return "pending";
  }

  if (
    status === "settlement"
  ) {
    if (
      notification.statusCode !==
      "200"
    ) {
      return "unknown";
    }

    if (
      notification.fraudStatus &&
      notification.fraudStatus !==
        "accept"
    ) {
      return "unknown";
    }

    return "completed";
  }

  if (
    status === "capture"
  ) {
    if (
      notification.statusCode !==
      "200"
    ) {
      return "unknown";
    }

    if (
      notification.fraudStatus &&
      notification.fraudStatus !==
        "accept"
    ) {
      return "unknown";
    }

    return "completed";
  }

  if (
    status === "expire"
  ) {
    return "expired";
  }

  if (
    status === "cancel"
  ) {
    return "canceled";
  }

  if (
    status === "deny"
  ) {
    return "denied";
  }

  return "unknown";
}
