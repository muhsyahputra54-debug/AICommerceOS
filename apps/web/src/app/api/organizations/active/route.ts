import {
  NextResponse,
} from "next/server";

import {
  ACTIVE_ORGANIZATION_COOKIE,
  ACTIVE_ORGANIZATION_COOKIE_OPTIONS,
  normalizeActiveOrganizationId,
} from "@/lib/organization/active-organization-contract";
import {
  logServerError,
} from "@/lib/observability/server-logger";
import {
  createClient,
} from "@/lib/supabase/server";

type MembershipRow = {
  organization_id: string;
};

export async function POST(
  request: Request,
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

  const requestedOrganizationId =
    normalizeActiveOrganizationId(
      typeof body === "object" &&
      body !== null &&
      "organizationId" in body
        ? body.organizationId
        : undefined,
    );

  if (!requestedOrganizationId) {
    return NextResponse.json(
      {
        error:
          "A valid organization id is required.",
        code:
          "INVALID_ORGANIZATION_ID",
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
    await supabase
      .from(
        "organization_members",
      )
      .select(
        "organization_id",
      )
      .eq(
        "user_id",
        user.id,
      );

  if (error) {
    logServerError({
      event:
        "organization_active_membership_read_failed",
      requestId,
      route:
        "/api/organizations/active",
      method:
        "POST",
      provider:
        "supabase",
      operation:
        "read_organization_memberships",
      error,
    });

    return NextResponse.json(
      {
        error:
          "Organization selection could not be completed.",
        code:
          "ORGANIZATION_SELECTION_FAILED",
      },
      {
        status:
          500,
      },
    );
  }

  const memberships =
    (
      data ??
      []
    ) as MembershipRow[];

  if (memberships.length === 0) {
    return NextResponse.json(
      {
        error:
          "Organization onboarding is required.",
        code:
          "ONBOARDING_REQUIRED",
      },
      {
        status:
          409,
      },
    );
  }

  if (memberships.length === 1) {
    return NextResponse.json(
      {
        error:
          "Organization selection is not required.",
        code:
          "SELECTION_NOT_REQUIRED",
      },
      {
        status:
          409,
      },
    );
  }

  const isMember =
    memberships.some(
      (membership) =>
        normalizeActiveOrganizationId(
          membership.organization_id,
        ) ===
        requestedOrganizationId,
    );

  if (!isMember) {
    return NextResponse.json(
      {
        error:
          "Organization access denied.",
        code:
          "ORGANIZATION_ACCESS_DENIED",
      },
      {
        status:
          403,
      },
    );
  }

  const response =
    NextResponse.json({
      organizationId:
        requestedOrganizationId,
    });

  response.cookies.set(
    ACTIVE_ORGANIZATION_COOKIE,
    requestedOrganizationId,
    ACTIVE_ORGANIZATION_COOKIE_OPTIONS,
  );

  return response;
}
