import { NextResponse } from "next/server";

import {
  createMidtransPaymentProvider,
  isMidtransConfigured,
  MIDTRANS_PROVIDER,
  MidtransApiError,
  MidtransConfigurationError,
  MidtransInputError,
} from "@/lib/billing/midtrans";
import {
  isBillingInterval,
  isCommercialPlanSlug,
  type BillingInterval,
  type CommercialPlanSlug,
} from "@/lib/billing/payment-provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type CheckoutRequestBody = {
  plan?: unknown;
  interval?: unknown;
};

type CheckoutClaimResult =
  | "created_claimed"
  | "reclaimed_stale"
  | "in_progress"
  | "reused_ready";

type CheckoutPersistenceRow = {
  claimResult: CheckoutClaimResult;
  checkoutSessionId: string;
  organizationId: string;
  provider: string;
  referenceId: string;
  planSlug: CommercialPlanSlug;
  interval: BillingInterval;
  amount: number;
  currency: string;
  status: "created" | "ready";
  externalSessionId: string | null;
  checkoutUrl: string | null;
  expiresAt: string | null;
};

type CheckoutExpectation = {
  organizationId: string;
  plan: CommercialPlanSlug;
  interval: BillingInterval;
};

function nonBlankString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function safePositiveInteger(
  value: unknown,
): number | null {
  let parsed: number;

  if (typeof value === "number") {
    parsed = value;
  } else if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    parsed = Number(value);
  } else {
    return null;
  }

  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

function parseCheckoutPersistenceRow(
  value: unknown,
  expected: CheckoutExpectation,
): CheckoutPersistenceRow | null {
  const candidate =
    Array.isArray(value)
      ? value[0]
      : value;

  if (
    typeof candidate !== "object" ||
    candidate === null ||
    Array.isArray(candidate)
  ) {
    return null;
  }

  const row =
    candidate as Record<string, unknown>;

  const claimResult =
    nonBlankString(
      row.claim_result,
    );

  const checkoutSessionId =
    nonBlankString(
      row.checkout_session_id,
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

  const planSlug =
    nonBlankString(
      row.plan_slug,
    );

  const interval =
    nonBlankString(
      row.billing_interval,
    );

  const amount =
    safePositiveInteger(
      row.amount,
    );

  const currency =
    nonBlankString(
      row.currency,
    );

  const status =
    nonBlankString(
      row.status,
    );

  const externalSessionId =
    row.external_session_id == null
      ? null
      : nonBlankString(
          row.external_session_id,
        );

  const checkoutUrl =
    row.checkout_url == null
      ? null
      : nonBlankString(
          row.checkout_url,
        );

  const expiresAt =
    row.expires_at == null
      ? null
      : nonBlankString(
          row.expires_at,
        );

  if (
    claimResult !== "created_claimed" &&
    claimResult !== "reclaimed_stale" &&
    claimResult !== "in_progress" &&
    claimResult !== "reused_ready"
  ) {
    return null;
  }

  const expectedStatus =
    claimResult === "reused_ready"
      ? "ready"
      : "created";

  if (
    !checkoutSessionId ||
    organizationId !==
      expected.organizationId ||
    provider !==
      MIDTRANS_PROVIDER ||
    !referenceId ||
    planSlug !==
      expected.plan ||
    interval !==
      expected.interval ||
    amount === null ||
    !currency ||
    status !==
      expectedStatus
  ) {
    return null;
  }

  if (
    claimResult === "reused_ready"
  ) {
    if (
      !externalSessionId ||
      !checkoutUrl
    ) {
      return null;
    }
  } else if (
    row.external_session_id != null ||
    row.checkout_url != null
  ) {
    return null;
  }

  return {
    claimResult,
    checkoutSessionId,
    organizationId,
    provider,
    referenceId,
    planSlug:
      expected.plan,
    interval:
      expected.interval,
    amount,
    currency:
      currency.toUpperCase(),
    status:
      expectedStatus,
    externalSessionId,
    checkoutUrl,
    expiresAt,
  };
}

function resolveCanonicalAppOrigin():
string | null {
  const raw =
    process.env
      .LAKUVO_APP_URL
      ?.trim();

  if (!raw) {
    return null;
  }

  let parsed: URL;

  try {
    parsed =
      new URL(raw);
  } catch {
    return null;
  }

  if (
    parsed.protocol !== "https:" &&
    parsed.protocol !== "http:"
  ) {
    return null;
  }

  if (
    parsed.username ||
    parsed.password
  ) {
    return null;
  }

  return parsed.origin;
}

function buildBillingReturnUrl(
  origin: string,
  paymentState:
    | "finish"
    | "cancel",
) {
  const url =
    new URL(
      "/billing",
      origin,
    );

  url.searchParams.set(
    "payment",
    paymentState,
  );

  return url.toString();
}

async function bestEffortFailCheckout(
  admin:
    ReturnType<
      typeof createAdminClient
    >,
  checkoutSessionId: string,
  failureCode: string,
) {
  try {
    await admin.rpc(
      "fail_billing_checkout_session",
      {
        p_checkout_session_id:
          checkoutSessionId,
        p_failure_code:
          failureCode,
        p_metadata: {},
      },
    );
  } catch {
    // Preserve the original checkout/provider failure.
  }
}

function paymentProviderErrorResponse(
  error: unknown,
) {
  if (
    error instanceof
    MidtransConfigurationError
  ) {
    return NextResponse.json(
      {
        error:
          "Payment-provider checkout belum dikonfigurasi.",
        code:
          "PAYMENT_PROVIDER_NOT_CONFIGURED",
      },
      {
        status: 503,
      },
    );
  }

  if (
    error instanceof
    MidtransInputError
  ) {
    return NextResponse.json(
      {
        error:
          "Kontrak checkout payment provider tidak valid.",
        code:
          "PAYMENT_PROVIDER_INPUT_INVALID",
      },
      {
        status: 500,
      },
    );
  }

  if (
    error instanceof
    MidtransApiError
  ) {
    return NextResponse.json(
      {
        error:
          "Payment provider tidak dapat membuat checkout.",
        code:
          "PAYMENT_PROVIDER_ERROR",
      },
      {
        status: 502,
      },
    );
  }

  return NextResponse.json(
    {
      error:
        "Payment provider tidak dapat membuat checkout.",
      code:
        "PAYMENT_PROVIDER_ERROR",
    },
    {
      status: 502,
    },
  );
}

export async function POST(
  request: Request,
) {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return NextResponse.json(
      {
        error:
          "Organization aktif tidak ditemukan.",
      },
      {
        status: 401,
      },
    );
  }

  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth
      .getUser();

  if (
    userError ||
    !user
  ) {
    return NextResponse.json(
      {
        error:
          "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  let body:
    CheckoutRequestBody;

  try {
    body =
      (
        await request.json()
      ) as CheckoutRequestBody;
  } catch {
    return NextResponse.json(
      {
        error:
          "Request body harus berupa JSON.",
      },
      {
        status: 400,
      },
    );
  }

  const plan =
    typeof body.plan ===
      "string"
      ? body.plan.trim()
      : "";

  const interval =
    typeof body.interval ===
      "string"
      ? body.interval.trim()
      : "";

  if (
    !isCommercialPlanSlug(
      plan,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Commercial plan tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !isBillingInterval(
      interval,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Billing interval tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  const appOrigin =
    resolveCanonicalAppOrigin();

  if (
    !appOrigin ||
    !isMidtransConfigured()
  ) {
    return NextResponse.json(
      {
        error:
          "Payment-provider checkout belum dikonfigurasi.",
        code:
          "PAYMENT_PROVIDER_NOT_CONFIGURED",
      },
      {
        status: 503,
      },
    );
  }

  let admin:
    ReturnType<
      typeof createAdminClient
    >;

  try {
    admin =
      createAdminClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Billing server belum dikonfigurasi.",
        code:
          "BILLING_SERVER_NOT_CONFIGURED",
      },
      {
        status: 503,
      },
    );
  }

  let persistence:
    CheckoutPersistenceRow | null =
      null;

  try {
    const {
      data,
      error,
    } =
      await admin.rpc(
        "claim_billing_checkout_intent",
        {
          p_organization_id:
            currentOrganization
              .organizationId,
          p_provider:
            MIDTRANS_PROVIDER,
          p_plan_slug:
            plan,
          p_billing_interval:
            interval,
          p_metadata: {
            source:
              "api.billing.checkout",
          },
        },
      );

    if (error) {
      return NextResponse.json(
        {
          error:
            "Checkout billing tidak dapat dipersiapkan.",
          code:
            "BILLING_CHECKOUT_PERSISTENCE_FAILED",
        },
        {
          status: 500,
        },
      );
    }

    persistence =
      parseCheckoutPersistenceRow(
        data,
        {
          organizationId:
            currentOrganization
              .organizationId,
          plan,
          interval,
        },
      );
  } catch {
    return NextResponse.json(
      {
        error:
          "Checkout billing tidak dapat dipersiapkan.",
        code:
          "BILLING_CHECKOUT_PERSISTENCE_FAILED",
      },
      {
        status: 500,
      },
    );
  }

  if (!persistence) {
    return NextResponse.json(
      {
        error:
          "Checkout billing menghasilkan data yang tidak valid.",
        code:
          "BILLING_CHECKOUT_PERSISTENCE_INVALID",
      },
      {
        status: 500,
      },
    );
  }

  if (
    persistence.claimResult ===
      "reused_ready"
  ) {
    return NextResponse.json(
      {
        provider:
          persistence.provider,

        reference_id:
          persistence.referenceId,

        plan:
          persistence.planSlug,

        interval:
          persistence.interval,

        checkout_url:
          persistence.checkoutUrl,

        checkout_state:
          persistence.claimResult,

        reused:
          true,
      },
      {
        status: 200,
      },
    );
  }

  if (
    persistence.claimResult ===
      "in_progress"
  ) {
    return NextResponse.json(
      {
        error:
          "Checkout billing sedang dipersiapkan. Silakan coba lagi sebentar.",
        code:
          "BILLING_CHECKOUT_IN_PROGRESS",
        retryable:
          true,

        reference_id:
          persistence.referenceId,

        plan:
          persistence.planSlug,

        interval:
          persistence.interval,
      },
      {
        status: 409,
        headers: {
          "Retry-After":
            "2",
        },
      },
    );
  }

  const successUrl =
    buildBillingReturnUrl(
      appOrigin,
      "finish",
    );

  const cancelUrl =
    buildBillingReturnUrl(
      appOrigin,
      "cancel",
    );

  let providerSession;

  try {
    const provider =
      createMidtransPaymentProvider();

    providerSession =
      await provider
        .createCheckoutSession({
          organizationId:
            persistence
              .organizationId,
          referenceId:
            persistence
              .referenceId,
          planSlug:
            persistence
              .planSlug,
          interval:
            persistence
              .interval,

          // Authoritative values come only
          // from the service-role database RPC.
          amount:
            persistence.amount,
          currency:
            persistence.currency,

          successUrl,
          cancelUrl,

          customerEmail:
            user.email ??
            null,
        });
  } catch (error) {
    await bestEffortFailCheckout(
      admin,
      persistence
        .checkoutSessionId,
      error instanceof
        MidtransConfigurationError
        ? "MIDTRANS_CONFIGURATION_ERROR"
        : error instanceof
            MidtransInputError
          ? "MIDTRANS_INPUT_ERROR"
          : error instanceof
              MidtransApiError
            ? "MIDTRANS_API_ERROR"
            : "MIDTRANS_UNKNOWN_ERROR",
    );

    return paymentProviderErrorResponse(
      error,
    );
  }

  let attachResult:
    unknown = null;

  let attachError:
    unknown = null;

  try {
    const result =
      await admin.rpc(
        "attach_billing_checkout_provider_session",
        {
          p_checkout_session_id:
            persistence
              .checkoutSessionId,
          p_external_session_id:
            providerSession
              .externalSessionId,
          p_checkout_url:
            providerSession
              .checkoutUrl,
          p_expires_at:
            providerSession
              .expiresAt ??
            null,
        },
      );

    attachResult =
      result.data;

    attachError =
      result.error;
  } catch {
    attachError =
      new Error(
        "provider session persistence failed",
      );
  }

  if (
    attachError ||
    (
      attachResult !== "ready" &&
      attachResult !==
        "already_ready"
    )
  ) {
    await bestEffortFailCheckout(
      admin,
      persistence
        .checkoutSessionId,
      "MIDTRANS_SESSION_ATTACH_FAILED",
    );

    return NextResponse.json(
      {
        error:
          "Checkout provider berhasil dibuat tetapi tidak dapat dipersistenkan.",
        code:
          "BILLING_CHECKOUT_ATTACH_FAILED",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json(
    {
      provider:
        providerSession.provider,

      reference_id:
        persistence.referenceId,

      plan:
        persistence.planSlug,

      interval:
        persistence.interval,

      checkout_url:
        providerSession.checkoutUrl,

      checkout_state:
        persistence.claimResult,

      reused:
        false,
    },
    {
      status: 201,
    },
  );
}
