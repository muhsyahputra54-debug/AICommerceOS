import type {
  BillingCheckoutInput,
  BillingCheckoutSession,
  BillingPaymentProvider,
} from "./payment-provider";

export const MIDTRANS_PROVIDER = "midtrans";

export type MidtransEnvironment =
  | "sandbox"
  | "production";

export const MIDTRANS_SNAP_URLS = {
  sandbox:
    "https://app.sandbox.midtrans.com/snap/v1/transactions",
  production:
    "https://app.midtrans.com/snap/v1/transactions",
} as const;

type MidtransProviderOptions = {
  serverKey?: string | null;
  environment?: MidtransEnvironment | null;
  fetchImpl?: typeof fetch;
};

type MidtransSnapRequest = {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  callbacks: {
    finish: string;
  };
  customer_details?: {
    email: string;
  };
};

type MidtransSnapResponse = {
  token?: unknown;
  redirect_url?: unknown;
  error_messages?: unknown;
};

export class MidtransConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MidtransConfigurationError";
  }
}

export class MidtransInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MidtransInputError";
  }
}

export class MidtransApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = "MidtransApiError";
    this.status = status;
  }
}

function nonBlankString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function resolveEnvironment(
  explicitEnvironment:
    | MidtransEnvironment
    | null
    | undefined,
): MidtransEnvironment {
  const raw =
    explicitEnvironment ??
    process.env.MIDTRANS_ENVIRONMENT;

  const normalized =
    raw?.trim().toLowerCase();

  if (
    normalized === "sandbox" ||
    normalized === "production"
  ) {
    return normalized;
  }

  throw new MidtransConfigurationError(
    "MIDTRANS_ENVIRONMENT wajib bernilai sandbox atau production.",
  );
}

function resolveServerKey(
  explicitServerKey:
    | string
    | null
    | undefined,
): string {
  const serverKey =
    (
      explicitServerKey ??
      process.env.MIDTRANS_SERVER_KEY
    )?.trim();

  if (!serverKey) {
    throw new MidtransConfigurationError(
      "MIDTRANS_SERVER_KEY belum dikonfigurasi.",
    );
  }

  return serverKey;
}

function assertHttpUrl(
  value: string,
  field: string,
) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new MidtransInputError(
      `${field} harus berupa URL valid.`,
    );
  }

  if (
    parsed.protocol !== "https:" &&
    parsed.protocol !== "http:"
  ) {
    throw new MidtransInputError(
      `${field} harus menggunakan HTTP atau HTTPS.`,
    );
  }
}

function assertCheckoutInput(
  input: BillingCheckoutInput,
) {
  if (!input.organizationId.trim()) {
    throw new MidtransInputError(
      "organizationId wajib diisi.",
    );
  }

  if (!input.referenceId.trim()) {
    throw new MidtransInputError(
      "referenceId wajib diisi.",
    );
  }

  if (
    !Number.isSafeInteger(input.amount) ||
    input.amount <= 0
  ) {
    throw new MidtransInputError(
      "amount harus berupa integer positif.",
    );
  }

  if (
    input.currency.trim().toUpperCase() !==
    "IDR"
  ) {
    throw new MidtransInputError(
      "Midtrans LAKUVO saat ini hanya mendukung IDR.",
    );
  }

  assertHttpUrl(
    input.successUrl,
    "successUrl",
  );

  assertHttpUrl(
    input.cancelUrl,
    "cancelUrl",
  );
}

function midtransErrorMessage(
  body: MidtransSnapResponse,
  status: number,
) {
  if (Array.isArray(body.error_messages)) {
    const messages =
      body.error_messages
        .filter(
          (value): value is string =>
            typeof value === "string",
        )
        .map((value) => value.trim())
        .filter(Boolean);

    if (messages.length > 0) {
      return (
        "Midtrans Snap request ditolak: " +
        messages.join("; ").slice(0, 300)
      );
    }
  }

  return `Midtrans Snap request gagal (HTTP ${status}).`;
}

async function readSnapResponse(
  response: Response,
): Promise<MidtransSnapResponse> {
  try {
    return (
      await response.json()
    ) as MidtransSnapResponse;
  } catch {
    return {};
  }
}

export function isMidtransConfigured() {
  const serverKey =
    process.env.MIDTRANS_SERVER_KEY?.trim();

  const environment =
    process.env.MIDTRANS_ENVIRONMENT
      ?.trim()
      .toLowerCase();

  return Boolean(
    serverKey &&
      (
        environment === "sandbox" ||
        environment === "production"
      ),
  );
}

export function createMidtransPaymentProvider(
  options: MidtransProviderOptions = {},
): BillingPaymentProvider {
  const serverKey =
    resolveServerKey(options.serverKey);

  const environment =
    resolveEnvironment(options.environment);

  const fetchImpl =
    options.fetchImpl ?? fetch;

  const endpoint =
    MIDTRANS_SNAP_URLS[environment];

  const authorization =
    `Basic ${Buffer.from(
      `${serverKey}:`,
      "utf8",
    ).toString("base64")}`;

  return {
    name: MIDTRANS_PROVIDER,

    async createCheckoutSession(
      input: BillingCheckoutInput,
    ): Promise<BillingCheckoutSession> {
      assertCheckoutInput(input);

      const payload: MidtransSnapRequest = {
        transaction_details: {
          order_id:
            input.referenceId.trim(),
          gross_amount:
            input.amount,
        },

        callbacks: {
          finish:
            input.successUrl,
        },
      };

      const customerEmail =
        input.customerEmail?.trim();

      if (customerEmail) {
        payload.customer_details = {
          email: customerEmail,
        };
      }

      /*
       * Snap Redirect supports a per-transaction
       * finish callback. cancelUrl remains part of
       * the provider-neutral contract for providers
       * that expose a dedicated cancel callback and
       * for LAKUVO's later checkout UX.
       */
      void input.cancelUrl;

      const response =
        await fetchImpl(
          endpoint,
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
              Authorization:
                authorization,
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(payload),
          },
        );

      const body =
        await readSnapResponse(
          response,
        );

      if (!response.ok) {
        throw new MidtransApiError(
          midtransErrorMessage(
            body,
            response.status,
          ),
          response.status,
        );
      }

      const token =
        nonBlankString(body.token);

      const checkoutUrl =
        nonBlankString(
          body.redirect_url,
        );

      if (!token || !checkoutUrl) {
        throw new MidtransApiError(
          "Midtrans Snap response tidak memiliki token atau redirect_url yang valid.",
          response.status,
        );
      }

      assertHttpUrl(
        checkoutUrl,
        "Midtrans redirect_url",
      );

      return {
        provider:
          MIDTRANS_PROVIDER,

        externalSessionId:
          token,

        checkoutUrl,

        expiresAt:
          null,
      };
    },
  };
}
