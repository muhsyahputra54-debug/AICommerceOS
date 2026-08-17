import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  const isLoginPage =
    pathname === "/login";

  const isAuthCallback =
    pathname.startsWith("/auth");

  if (
    !user &&
    !isLoginPage &&
    !isAuthCallback
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname = "/login";

    url.searchParams.set(
      "redirectedFrom",
      pathname,
    );

    return redirectResponse(url);
  }

  if (user && isLoginPage) {
    const url =
      request.nextUrl.clone();

    url.pathname = "/";

    return redirectResponse(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
