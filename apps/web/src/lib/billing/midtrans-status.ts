import type {
  MidtransEnvironment,
} from "./midtrans";

export const MIDTRANS_STATUS_BASE_URLS = {
  sandbox:
    "https://api.sandbox.midtrans.com",

  production:
    "https://api.midtrans.com",
} as const;

export type MidtransTransactionStatus = {
  orderId: string;
  transactionId: string;
  transactionStatus: string;
  statusCode: string;
  grossAmount: string;
  currency: string;
  fraudStatus: string | null;
  paymentType: string | null;
  transactionTime: string | null;
  settlementTime: string | null;
  raw: Record<string, unknown>;
};

type MidtransStatusClientOptions = {
  serverKey?: string | null;
  environment?:
    MidtransEnvironment | null;
  fetchImpl?: typeof fetch;
};

export class MidtransStatusConfigurationError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "MidtransStatusConfigurationError";
  }
}

export class MidtransStatusInputError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "MidtransStatusInputError";
  }
}

export class MidtransStatusApiError
  extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);

    this.name =
      "MidtransStatusApiError";

    this.status =
      status;
  }
}

export class MidtransStatusResponseError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "MidtransStatusResponseError";
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
    throw new MidtransStatusResponseError(
      `${field} tidak tersedia pada response Midtrans.`,
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

function resolveEnvironment(
  explicit:
    MidtransEnvironment |
    null |
    undefined,
): MidtransEnvironment {
  const raw =
    (
      explicit ??
      process.env
        .MIDTRANS_ENVIRONMENT
    )
      ?.trim()
      .toLowerCase();

  if (
    raw === "sandbox" ||
    raw === "production"
  ) {
    return raw;
  }

  throw new MidtransStatusConfigurationError(
    "MIDTRANS_ENVIRONMENT wajib bernilai sandbox atau production.",
  );
}

function resolveServerKey(
  explicit:
    string |
    null |
    undefined,
) {
  const key =
    (
      explicit ??
      process.env
        .MIDTRANS_SERVER_KEY
    )
      ?.trim();

  if (!key) {
    throw new MidtransStatusConfigurationError(
      "MIDTRANS_SERVER_KEY belum dikonfigurasi.",
    );
  }

  return key;
}

function createBasicAuth(
  serverKey: string,
) {
  return (
    "Basic " +
    Buffer.from(
      `${serverKey}:`,
      "utf8",
    ).toString(
      "base64",
    )
  );
}

function parseTransactionStatus(
  value: unknown,
  expectedOrderId: string,
): MidtransTransactionStatus {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new MidtransStatusResponseError(
      "Response Get Status harus berupa JSON object.",
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
    requiredString(
      raw.transaction_status,
      "transaction_status",
    )
      .toLowerCase();

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

  const currency =
    requiredString(
      raw.currency,
      "currency",
    )
      .toUpperCase();

  if (
    orderId !==
    expectedOrderId
  ) {
    throw new MidtransStatusResponseError(
      "order_id Get Status tidak cocok dengan checkout reference.",
    );
  }

  return {
    orderId,
    transactionId,
    transactionStatus,
    statusCode,
    grossAmount,
    currency,

    fraudStatus:
      optionalString(
        raw.fraud_status,
      )?.toLowerCase() ??
      null,

    paymentType:
      optionalString(
        raw.payment_type,
      ),

    transactionTime:
      optionalString(
        raw.transaction_time,
      ),

    settlementTime:
      optionalString(
        raw.settlement_time,
      ),

    raw,
  };
}

export function classifyMidtransStatusOutcome(
  status:
    MidtransTransactionStatus,
):
  | "pending"
  | "completed"
  | "expired"
  | "canceled"
  | "denied"
  | "unknown" {

  if (
    status.transactionStatus ===
    "pending"
  ) {
    return "pending";
  }

  if (
    status.transactionStatus ===
      "settlement" ||
    status.transactionStatus ===
      "capture"
  ) {
    if (
      status.statusCode !==
      "200"
    ) {
      return "unknown";
    }

    if (
      status.fraudStatus &&
      status.fraudStatus !==
        "accept"
    ) {
      return "unknown";
    }

    return "completed";
  }

  if (
    status.transactionStatus ===
    "expire"
  ) {
    return "expired";
  }

  if (
    status.transactionStatus ===
    "cancel"
  ) {
    return "canceled";
  }

  if (
    status.transactionStatus ===
    "deny"
  ) {
    return "denied";
  }

  return "unknown";
}

export function createMidtransStatusClient(
  options:
    MidtransStatusClientOptions = {},
) {
  const environment =
    resolveEnvironment(
      options.environment,
    );

  const serverKey =
    resolveServerKey(
      options.serverKey,
    );

  const fetchImpl =
    options.fetchImpl ??
    fetch;

  const baseUrl =
    MIDTRANS_STATUS_BASE_URLS[
      environment
    ];

  return {
    async getTransactionStatus(
      orderId: string,
    ):
      Promise<
        MidtransTransactionStatus
      > {

      const normalizedOrderId =
        orderId.trim();

      if (!normalizedOrderId) {
        throw new MidtransStatusInputError(
          "orderId wajib diisi.",
        );
      }

      if (
        normalizedOrderId.length >
        120
      ) {
        throw new MidtransStatusInputError(
          "orderId terlalu panjang.",
        );
      }

      const response =
        await fetchImpl(
          `${baseUrl}/v2/${encodeURIComponent(
            normalizedOrderId,
          )}/status`,
          {
            method:
              "GET",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                createBasicAuth(
                  serverKey,
                ),
            },

            cache:
              "no-store",
          },
        );

      let body:
        unknown = null;

      try {
        body =
          await response.json();
      } catch {
        throw new MidtransStatusResponseError(
          "Midtrans Get Status mengembalikan response non-JSON.",
        );
      }

      if (!response.ok) {
        throw new MidtransStatusApiError(
          "Midtrans Get Status request gagal.",
          response.status,
        );
      }

      return parseTransactionStatus(
        body,
        normalizedOrderId,
      );
    },
  };
}
