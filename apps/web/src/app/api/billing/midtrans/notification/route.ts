import {
  NextResponse,
} from "next/server";

import {
  MIDTRANS_PROVIDER,
} from "@/lib/billing/midtrans";

import {
  MidtransNotificationConfigurationError,
  MidtransNotificationInputError,
} from "@/lib/billing/midtrans-notification";

import {
  MidtransVerifiedNotificationSignatureError,
  MidtransVerifiedStatusError,
  processVerifiedMidtransNotification,
  type MidtransCheckoutSnapshot,
  type ProcessCheckoutPaymentEventInput,
  type RecordBillingEventInput,
} from "@/lib/billing/midtrans-orchestrator";

import {
  MidtransStatusApiError,
  MidtransStatusConfigurationError,
  MidtransStatusInputError,
  MidtransStatusResponseError,
} from "@/lib/billing/midtrans-status";

import {
  logServerError,
} from "@/lib/observability/server-logger";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

const ROUTE_PATH =
  "/api/billing/midtrans/notification";

const MAX_NOTIFICATION_BYTES =
  64 * 1024;

const ACCEPTED_PROCESS_RESULTS =
  new Set([
    "pending",
    "ignored_unknown",
    "completed",
    "expired",
    "canceled",
    "denied",
    "already_processed",
    "already_completed",
    "already_expired",
    "already_canceled",
    "already_denied",
    "ignored_terminal",
  ]);

const RETRYABLE_PROCESS_RESULTS =
  new Set([
    "checkout_not_ready",
    "missing_event",
    "event_not_processable",
  ]);

const PERMANENT_INTEGRITY_RESULTS =
  new Set([
    "missing_checkout",
    "amount_mismatch",
    "currency_mismatch",
    "transaction_mismatch",
    "transaction_conflict",
    "checkout_not_completable",
    "checkout_not_expirable",
    "checkout_not_cancelable",
    "checkout_not_deniable",
  ]);

const INTERNAL_CONTRACT_FAILURE_RESULTS =
  new Set([
    "status_verification_required",
    "pending_unverified",
    "ignored_unknown_unverified",
  ]);

class NotificationBodyTooLargeError
  extends Error {

  constructor() {
    super(
      "Midtrans notification body exceeds configured limit.",
    );

    this.name =
      "NotificationBodyTooLargeError";
  }
}

class BillingNotificationDatabaseError
  extends Error {

  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "BillingNotificationDatabaseError";
  }
}

function nonBlankString(
  value: unknown,
): string | null {

  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function parseCheckoutSnapshot(
  value: unknown,
  expectedReferenceId: string,
):
  MidtransCheckoutSnapshot |
  null {

  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  const row =
    value as
      Record<
        string,
        unknown
      >;

  const checkoutSessionId =
    nonBlankString(
      row.id,
    );

  const organizationId =
    nonBlankString(
      row.organization_id,
    );

  const provider =
    nonBlankString(
      row.provider,
    );

  const referenceId =
    nonBlankString(
      row.reference_id,
    );

  if (
    !checkoutSessionId ||
    !organizationId ||
    provider !==
      MIDTRANS_PROVIDER ||
    referenceId !==
      expectedReferenceId
  ) {
    throw new BillingNotificationDatabaseError(
      "Checkout billing menghasilkan snapshot yang tidak valid.",
    );
  }

  return {
    checkoutSessionId,
    organizationId,
    provider,
    referenceId,
  };
}

function declaredBodyTooLarge(
  request: Request,
) {
  const raw =
    request.headers
      .get(
        "content-length",
      )
      ?.trim();

  if (
    !raw ||
    !/^\d+$/.test(
      raw,
    )
  ) {
    return false;
  }

  const length =
    Number(raw);

  if (
    !Number.isFinite(
      length,
    )
  ) {
    return true;
  }

  return (
    length >
    MAX_NOTIFICATION_BYTES
  );
}

async function readNotificationBody(
  request: Request,
) {
  if (!request.body) {
    return "";
  }

  const reader =
    request.body
      .getReader();

  const decoder =
    new TextDecoder();

  let totalBytes =
    0;

  let body =
    "";

  try {

    while (true) {
      const {
        done,
        value,
      } =
        await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      totalBytes +=
        value.byteLength;

      if (
        totalBytes >
        MAX_NOTIFICATION_BYTES
      ) {
        try {
          await reader.cancel();
        } catch {
          // Body is already being rejected.
        }

        throw new NotificationBodyTooLargeError();
      }

      body +=
        decoder.decode(
          value,
          {
            stream:
              true,
          },
        );
    }

    body +=
      decoder.decode();

    return body;

  } finally {

    try {
      reader.releaseLock();
    } catch {
      // No action required.
    }
  }
}

function logNotificationFailure(
  requestId:
    string |
    null,
  operation: string,
  error: unknown,
) {
  logServerError({
    event:
      "billing_midtrans_notification_failed",

    requestId,

    route:
      ROUTE_PATH,

    method:
      "POST",

    provider:
      MIDTRANS_PROVIDER,

    operation,

    error,
  });
}

function acknowledge() {
  return new NextResponse(
    null,
    {
      status:
        200,
    },
  );
}

function serviceUnavailable() {
  return new NextResponse(
    null,
    {
      status:
        503,
    },
  );
}

function badGateway() {
  return new NextResponse(
    null,
    {
      status:
        502,
    },
  );
}

export async function POST(
  request: Request,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );


  // ==========================================================
  // 1. CHEAP DECLARED BODY SIZE GUARD
  // ==========================================================

  if (
    declaredBodyTooLarge(
      request,
    )
  ) {
    return new NextResponse(
      null,
      {
        status:
          413,
      },
    );
  }


  // ==========================================================
  // 2. READ RAW BODY
  //
  // Midtrans signature verification itself uses parsed fields,
  // but reading text first allows an explicit local size guard.
  // ==========================================================

  let rawBody: string;

  try {
    rawBody =
      await readNotificationBody(
        request,
      );
  } catch (error) {

    if (
      error instanceof
      NotificationBodyTooLargeError
    ) {
      return new NextResponse(
        null,
        {
          status:
            413,
        },
      );
    }

    return new NextResponse(
      null,
      {
        status:
          400,
      },
    );
  }


  // ==========================================================
  // 3. JSON PARSE
  // ==========================================================

  let payload: unknown;

  try {
    payload =
      JSON.parse(
        rawBody,
      );
  } catch {
    return new NextResponse(
      null,
      {
        status:
          400,
      },
    );
  }


  // ==========================================================
  // 4. LAZY SERVICE-ROLE CLIENT
  //
  // Invalid signatures fail inside the orchestrator before any
  // dependency is invoked, so the admin client is not created
  // for unauthenticated notification traffic.
  // ==========================================================

  let admin:
    ReturnType<
      typeof createAdminClient
    > |
    null =
      null;

  function getAdmin() {
    if (admin) {
      return admin;
    }

    try {
      admin =
        createAdminClient();
    } catch {
      throw new BillingNotificationDatabaseError(
        "Supabase admin client tidak tersedia.",
      );
    }

    return admin;
  }


  // ==========================================================
  // 5. INTERNAL CHECKOUT LOOKUP
  //
  // Only provider + signed order/reference is used.
  // No browser organization context is involved.
  // ==========================================================

  async function findCheckoutByReference(
    orderId: string,
  ):
    Promise<
      MidtransCheckoutSnapshot |
      null
    > {

    const client =
      getAdmin();

    let result;

    try {
      result =
        await client
          .from(
            "billing_checkout_sessions",
          )
          .select(
            "id, organization_id, provider, reference_id",
          )
          .eq(
            "provider",
            MIDTRANS_PROVIDER,
          )
          .eq(
            "reference_id",
            orderId,
          )
          .maybeSingle();
    } catch {
      throw new BillingNotificationDatabaseError(
        "Checkout billing tidak dapat dibaca.",
      );
    }

    if (
      result.error
    ) {
      throw new BillingNotificationDatabaseError(
        "Checkout billing tidak dapat dibaca.",
      );
    }

    if (!result.data) {
      return null;
    }

    return parseCheckoutSnapshot(
      result.data,
      orderId,
    );
  }


  // ==========================================================
  // 6. BILLING WEBHOOK INBOX ADAPTER
  // ==========================================================

  async function recordBillingEvent(
    input:
      RecordBillingEventInput,
  ) {
    const client =
      getAdmin();

    let result;

    try {
      result =
        await client.rpc(
          "record_billing_webhook_event",
          {
            p_organization_id:
              input.organizationId,

            p_provider:
              input.provider,

            p_external_event_id:
              input.externalEventId,

            p_event_type:
              input.eventType,

            p_payload:
              input.payload,
          },
        );
    } catch {
      throw new BillingNotificationDatabaseError(
        "Billing webhook event tidak dapat direkam.",
      );
    }

    if (
      result.error
    ) {
      throw new BillingNotificationDatabaseError(
        "Billing webhook event tidak dapat direkam.",
      );
    }

    if (
      result.data !==
        "recorded" &&
      result.data !==
        "duplicate"
    ) {
      throw new BillingNotificationDatabaseError(
        "Billing webhook inbox menghasilkan status yang tidak valid.",
      );
    }

    return result.data;
  }


  // ==========================================================
  // 7. ATOMIC CHECKOUT PAYMENT PROCESSOR ADAPTER
  // ==========================================================

  async function processCheckoutPaymentEvent(
    input:
      ProcessCheckoutPaymentEventInput,
  ) {
    const client =
      getAdmin();

    let result;

    try {
      result =
        await client.rpc(
          "process_billing_checkout_payment_event",
          {
            p_organization_id:
              input.organizationId,

            p_provider:
              input.provider,

            p_external_event_id:
              input.externalEventId,

            p_reference_id:
              input.referenceId,

            p_provider_transaction_id:
              input.providerTransactionId,

            p_payment_outcome:
              input.paymentOutcome,

            p_gross_amount:
              input.grossAmount,

            p_currency:
              input.currency,

            p_verification_method:
              input.verificationMethod,

            p_metadata:
              input.metadata,
          },
        );
    } catch {
      throw new BillingNotificationDatabaseError(
        "Checkout payment event tidak dapat diproses.",
      );
    }

    if (
      result.error
    ) {
      throw new BillingNotificationDatabaseError(
        "Checkout payment event tidak dapat diproses.",
      );
    }

    const processorResult =
      nonBlankString(
        result.data,
      );

    if (!processorResult) {
      throw new BillingNotificationDatabaseError(
        "Checkout payment processor menghasilkan status kosong.",
      );
    }

    return processorResult;
  }


  // ==========================================================
  // 8. VERIFIED MIDTRANS ORCHESTRATION
  // ==========================================================

  try {
    const result =
      await processVerifiedMidtransNotification(
        payload,
        {
          findCheckoutByReference,
          recordBillingEvent,
          processCheckoutPaymentEvent,
        },
      );


    // ========================================================
    // Signed but not one of our checkout references.
    //
    // No Get Status call is made by D3B for this case.
    // Acknowledge so Midtrans does not retry an order that
    // cannot ever belong to this LAKUVO checkout database.
    // ========================================================

    if (
      result.kind ===
      "missing_checkout"
    ) {
      return acknowledge();
    }


    // ========================================================
    // Temporary/race failures should be retried by provider.
    // ========================================================

    if (
      RETRYABLE_PROCESS_RESULTS
        .has(
          result.processResult,
        )
    ) {
      logNotificationFailure(
        requestId,
        "process_billing_checkout_payment_event_retryable",
        new Error(
          "Checkout payment event requires retry.",
        ),
      );

      return serviceUnavailable();
    }


    // ========================================================
    // These results should be impossible because D3B only
    // invokes D2 with provider_status_api verification.
    // ========================================================

    if (
      INTERNAL_CONTRACT_FAILURE_RESULTS
        .has(
          result.processResult,
        )
    ) {
      logNotificationFailure(
        requestId,
        "process_billing_checkout_payment_event_contract",
        new Error(
          "Checkout payment processor contract violation.",
        ),
      );

      return new NextResponse(
        null,
        {
          status:
            500,
        },
      );
    }


    // ========================================================
    // Permanent integrity mismatches are not retryable.
    //
    // Repeating provider delivery cannot repair authoritative
    // amount/currency or transaction identity conflicts.
    // Record the anomaly in server logs, then acknowledge to
    // avoid an infinite provider retry loop.
    // ========================================================

    if (
      PERMANENT_INTEGRITY_RESULTS
        .has(
          result.processResult,
        )
    ) {
      logNotificationFailure(
        requestId,
        "process_billing_checkout_payment_event_integrity",
        new Error(
          `Permanent checkout payment integrity result: ${result.processResult}`,
        ),
      );

      return acknowledge();
    }


    // ========================================================
    // Explicitly known accepted/idempotent outcomes.
    // ========================================================

    if (
      ACCEPTED_PROCESS_RESULTS
        .has(
          result.processResult,
        )
    ) {
      return acknowledge();
    }


    // ========================================================
    // UNKNOWN INTERNAL RESULT
    //
    // Never silently acknowledge a new/unrecognized database
    // processor contract value. A future schema/application
    // drift must fail closed until deliberately classified.
    // ========================================================

    logNotificationFailure(
      requestId,
      "process_billing_checkout_payment_event_unknown_result",
      new Error(
        `Unknown checkout payment processor result: ${result.processResult}`,
      ),
    );

    return new NextResponse(
      null,
      {
        status:
          500,
      },
    );

  } catch (error) {

    // ========================================================
    // INVALID PROVIDER SIGNATURE
    // ========================================================

    if (
      error instanceof
      MidtransVerifiedNotificationSignatureError
    ) {
      return new NextResponse(
        null,
        {
          status:
            401,
        },
      );
    }


    // ========================================================
    // MALFORMED MIDTRANS PAYLOAD
    // ========================================================

    if (
      error instanceof
      MidtransNotificationInputError
    ) {
      return new NextResponse(
        null,
        {
          status:
            400,
        },
      );
    }


    // ========================================================
    // SERVER CONFIGURATION
    //
    // Non-2xx intentionally allows legitimate provider retry.
    // ========================================================

    if (
      error instanceof
        MidtransNotificationConfigurationError ||
      error instanceof
        MidtransStatusConfigurationError ||
      error instanceof
        BillingNotificationDatabaseError
    ) {
      logNotificationFailure(
        requestId,
        "notification_server_configuration_or_database",
        error,
      );

      return serviceUnavailable();
    }


    // ========================================================
    // PROVIDER STATUS / VERIFIED RESPONSE FAILURE
    // ========================================================

    if (
      error instanceof
        MidtransStatusApiError ||
      error instanceof
        MidtransStatusInputError ||
      error instanceof
        MidtransStatusResponseError ||
      error instanceof
        MidtransVerifiedStatusError
    ) {
      logNotificationFailure(
        requestId,
        "midtrans_status_verification",
        error,
      );

      return badGateway();
    }


    // ========================================================
    // UNKNOWN FAILURE
    // ========================================================

    logNotificationFailure(
      requestId,
      "verified_notification_orchestration",
      error,
    );

    return new NextResponse(
      null,
      {
        status:
          500,
      },
    );
  }
}
