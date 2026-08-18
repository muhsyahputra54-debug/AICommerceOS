import { NextResponse } from "next/server";

import {
  isBillingInterval,
  isCommercialPlanSlug,
} from "@/lib/billing/payment-provider";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type CheckoutRequestBody = {
  plan?: unknown;
  interval?: unknown;
};

export async function POST(request: Request) {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return NextResponse.json(
      {
        error:
          "Organization aktif tidak ditemukan.",
      },
      { status: 401 },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        error: "Authentication required.",
      },
      { status: 401 },
    );
  }

  let body: CheckoutRequestBody;

  try {
    body =
      (await request.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json(
      {
        error: "Request body harus berupa JSON.",
      },
      { status: 400 },
    );
  }

  const plan =
    typeof body.plan === "string"
      ? body.plan.trim()
      : "";

  const interval =
    typeof body.interval === "string"
      ? body.interval.trim()
      : "";

  if (!isCommercialPlanSlug(plan)) {
    return NextResponse.json(
      {
        error:
          "Commercial plan tidak valid.",
      },
      { status: 400 },
    );
  }

  if (!isBillingInterval(interval)) {
    return NextResponse.json(
      {
        error:
          "Billing interval tidak valid.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error:
        "Payment-provider checkout belum dikonfigurasi.",
      code:
        "PAYMENT_PROVIDER_NOT_CONFIGURED",
      organization_id:
        currentOrganization.organizationId,
      plan,
      interval,
    },
    { status: 503 },
  );
}
