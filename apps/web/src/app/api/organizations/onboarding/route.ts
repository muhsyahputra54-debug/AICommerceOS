import {
  NextResponse,
} from "next/server";

import {
  validateInitialOrganizationName,
} from "@/lib/organization/onboarding";
import {
  logServerError,
} from "@/lib/observability/server-logger";
import {
  normalizeActiveOrganizationId,
} from "@/lib/supabase/active-organization";
import {
  createClient,
} from "@/lib/supabase/server";

export async function POST(
  request:
    Request,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );

  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    return NextResponse.json(
      {
        error:
          "Authentication required.",

        code:
          "AUTH_REQUIRED",
      },
      {
        status:
          401,
      },
    );
  }

  let body:
    unknown;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Request body must be valid JSON.",

        code:
          "INVALID_JSON",
      },
      {
        status:
          400,
      },
    );
  }

  const organizationName =
    typeof body ===
      "object" &&
    body !==
      null &&
    "name" in body
      ? body.name
      : undefined;

  const validation =
    validateInitialOrganizationName(
      organizationName,
    );

  if (
    !validation.ok
  ) {
    return NextResponse.json(
      {
        error:
          validation.error ===
          "name_required"
            ? "Organization name is required."
            : "Organization name must be 100 characters or fewer.",

        code:
          validation.error ===
          "name_required"
            ? "ORGANIZATION_NAME_REQUIRED"
            : "ORGANIZATION_NAME_TOO_LONG",
      },
      {
        status:
          400,
      },
    );
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "create_initial_organization",
      {
        p_name:
          validation.name,
      },
    );

  if (
    error
  ) {
    logServerError({
      event:
        "organization_initial_onboarding_failed",
      requestId,
      route:
        "/api/organizations/onboarding",
      method:
        "POST",
      provider:
        "supabase",
      operation:
        "create_initial_organization",
      error,
    });

    return NextResponse.json(
      {
        error:
          "Organization could not be created.",

        code:
          "ORGANIZATION_SETUP_FAILED",
      },
      {
        status:
          500,
      },
    );
  }

  const organizationId =
    normalizeActiveOrganizationId(
      data,
    );

  if (
    !organizationId
  ) {
    const invalidResultError =
      new Error(
        "create_initial_organization returned an invalid organization id",
      );

    logServerError({
      event:
        "organization_initial_onboarding_invalid_result",
      requestId,
      route:
        "/api/organizations/onboarding",
      method:
        "POST",
      provider:
        "supabase",
      operation:
        "create_initial_organization",
      error:
        invalidResultError,
    });

    return NextResponse.json(
      {
        error:
          "Organization could not be created.",

        code:
          "ORGANIZATION_SETUP_FAILED",
      },
      {
        status:
          500,
      },
    );
  }

  return NextResponse.json({
    organizationId,
  });
}
