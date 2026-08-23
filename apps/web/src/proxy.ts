import {
  createServerClient,
} from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  isGuestOnlyAuthPath,
  isPublicAuthPath,
  resolveSafePostAuthPath,
} from "@/lib/auth/auth-routing";
import {
  ACTIVE_ORGANIZATION_COOKIE,
} from "@/lib/organization/active-organization-contract";
import {
  resolveOrganizationPageDestination,
} from "@/lib/organization/organization-access";
import {
  isPublicMarketingPath,
} from "@/lib/routing/public-page";

const requestIdPattern =
  /^[A-Za-z0-9._-]{8,128}$/;

type OrganizationMembershipRow = {
  organization_id: string;
  created_at: string;
};

function resolveRequestId(
  request: NextRequest,
) {
  const incoming =
    request.headers
      .get(
        "x-request-id",
      )
      ?.trim();

  if (
    incoming &&
    requestIdPattern.test(
      incoming,
    )
  ) {
    return incoming;
  }

  return crypto.randomUUID();
}

export async function proxy(
  request: NextRequest,
) {
  const pathname =
    request.nextUrl.pathname;

  const requestId =
    resolveRequestId(
      request,
    );

  function nextResponse() {
    const requestHeaders =
      new Headers(
        request.headers,
      );

    requestHeaders.set(
      "x-request-id",
      requestId,
    );

    const response =
      NextResponse.next({
        request: {
          headers:
            requestHeaders,
        },
      });

    response.headers.set(
      "x-request-id",
      requestId,
    );

    return response;
  }

  function copyResponseCookies(
    source:
      NextResponse,
    target:
      NextResponse,
  ) {
    source.cookies
      .getAll()
      .forEach(
        (cookie) => {
          target.cookies.set(
            cookie,
          );
        },
      );
  }

  function redirectResponse(
    url:
      URL,
    cookieSourceResponse:
      NextResponse,
  ) {
    const redirect =
      NextResponse.redirect(
        url,
      );

    copyResponseCookies(
      cookieSourceResponse,
      redirect,
    );

    redirect.headers.set(
      "x-request-id",
      requestId,
    );

    return redirect;
  }

  function organizationUnavailableResponse(
    cookieSourceResponse:
      NextResponse,
  ) {
    const unavailable =
      new NextResponse(
        "Organization access is temporarily unavailable.",
        {
          status:
            503,
        },
      );

    copyResponseCookies(
      cookieSourceResponse,
      unavailable,
    );

    unavailable.headers.set(
      "x-request-id",
      requestId,
    );

    return unavailable;
  }

  const isMarketplaceWebhook =
    pathname ===
    "/api/marketplaces/tiktok-shop/webhook";

  const isOperationalEndpoint =
    pathname ===
      "/api/health" ||
    pathname ===
      "/api/readiness";

  if (
    isMarketplaceWebhook ||
    isOperationalEndpoint
  ) {
    return nextResponse();
  }

  let response =
    nextResponse();

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies
              .getAll();
          },

          setAll(
            cookiesToSet,
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value,
                );
              },
            );

            response =
              nextResponse();

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                response.cookies.set(
                  name,
                  value,
                  options,
                );
              },
            );
          },
        },
      },
    );

  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  const publicAuthPath =
    isPublicAuthPath(
      pathname,
    );

  const publicMarketingPath =
    isPublicMarketingPath(
      pathname,
    );

  const publiclyAccessiblePage =
    publicAuthPath ||
    publicMarketingPath;

  if (
    !user &&
    !publiclyAccessiblePage
  ) {
    const url =
      request.nextUrl.clone();

    const redirectedFrom =
      pathname +
      request.nextUrl.search;

    url.pathname =
      "/login";

    url.search =
      "";

    url.searchParams.set(
      "redirectedFrom",
      redirectedFrom,
    );

    return redirectResponse(
      url,
      response,
    );
  }

  if (
    user &&
    isGuestOnlyAuthPath(
      pathname,
    )
  ) {
    const url =
      request.nextUrl.clone();

    const destination =
      resolveSafePostAuthPath(
        request.nextUrl.searchParams.get(
          "redirectedFrom",
        ),
      );

    const parsedDestination =
      new URL(
        destination,
        request.nextUrl.origin,
      );

    url.pathname =
      parsedDestination.pathname;

    url.search =
      parsedDestination.search;

    return redirectResponse(
      url,
      response,
    );
  }

  const isApiPath =
    pathname ===
      "/api" ||
    pathname.startsWith(
      "/api/",
    );

  if (
    user &&
    !publiclyAccessiblePage &&
    !isApiPath
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "organization_members",
        )
        .select(
          "organization_id, created_at",
        )
        .eq(
          "user_id",
          user.id,
        )
        .order(
          "created_at",
          {
            ascending:
              true,
          },
        )
        .order(
          "organization_id",
          {
            ascending:
              true,
          },
        );

    if (error) {
      return organizationUnavailableResponse(
        response,
      );
    }

    const memberships =
      (
        data ??
        []
      ) as OrganizationMembershipRow[];

    const destination =
      resolveOrganizationPageDestination(
        pathname,
        memberships.map(
          (membership) => ({
            organizationId:
              membership.organization_id,
          }),
        ),
        request.cookies.get(
          ACTIVE_ORGANIZATION_COOKIE,
        )?.value,
      );

    if (destination) {
      const url =
        request.nextUrl.clone();

      url.pathname =
        destination;

      url.search =
        "";

      return redirectResponse(
        url,
        response,
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
