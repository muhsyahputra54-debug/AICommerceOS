import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  isGuestOnlyAuthPath,
  isPublicAuthPath,
  resolveSafePostAuthPath,
} from "@/lib/auth/auth-routing";

const requestIdPattern =
  /^[A-Za-z0-9._-]{8,128}$/;

function resolveRequestId(
  request: NextRequest,
) {
  const incoming =
    request.headers
      .get("x-request-id")
      ?.trim();

  if (
    incoming &&
    requestIdPattern.test(incoming)
  ) {
    return incoming;
  }

  return crypto.randomUUID();
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestId =
    resolveRequestId(request);

  function nextResponse() {
    const requestHeaders =
      new Headers(request.headers);

    requestHeaders.set(
      "x-request-id",
      requestId,
    );

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set(
      "x-request-id",
      requestId,
    );

    return response;
  }

  function redirectResponse(
    url: URL,
  ) {
    const response =
      NextResponse.redirect(url);

    response.headers.set(
      "x-request-id",
      requestId,
    );

    return response;
  }

  const isMarketplaceWebhook =
    pathname ===
    "/api/marketplaces/tiktok-shop/webhook";

  const isOperationalEndpoint =
    pathname === "/api/health" ||
    pathname === "/api/readiness";

  if (
    isMarketplaceWebhook ||
    isOperationalEndpoint
  ) {
    return nextResponse();
  }

  let response = nextResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value,
              );
            },
          );

          response = nextResponse();

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
    data: { user },
  } = await supabase.auth.getUser();

  const publicAuthPath =
    isPublicAuthPath(pathname);

  if (
    !user &&
    !publicAuthPath
  ) {
    const url =
      request.nextUrl.clone();

    const redirectedFrom =
      pathname +
      request.nextUrl.search;

    url.pathname = "/login";

    url.search = "";

    url.searchParams.set(
      "redirectedFrom",
      redirectedFrom,
    );

    return redirectResponse(url);
  }

  if (
    user &&
    isGuestOnlyAuthPath(pathname)
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

    return redirectResponse(url);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
