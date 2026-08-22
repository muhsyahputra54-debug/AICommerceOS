import {
  resolveSafePostAuthPath,
} from "@/lib/auth/auth-routing";
import {
  logServerError,
} from "@/lib/observability/server-logger";
import {
  createClient,
} from "@/lib/supabase/server";
import {
  NextResponse,
} from "next/server";

export async function GET(
  request: Request,
) {
  const {
    searchParams,
    origin,
  } =
    new URL(request.url);

  const requestId =
    request.headers.get(
      "x-request-id",
    );

  const code =
    searchParams.get("code");

  const destination =
    resolveSafePostAuthPath(
      searchParams.get(
        "redirectedFrom",
      ),
    );

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_signup_code`,
    );
  }

  const supabase =
    await createClient();

  const {
    error,
  } =
    await supabase.auth
      .exchangeCodeForSession(
        code,
      );

  if (error) {
    logServerError({
      event:
        "signup_callback_exchange_failed",
      requestId,
      route:
        "/auth/signup-callback",
      method: "GET",
      provider:
        "supabase",
      operation:
        "exchange_code_for_session",
      error,
    });

    return NextResponse.redirect(
      `${origin}/login?error=signup_callback_failed`,
    );
  }

  return NextResponse.redirect(
    new URL(
      destination,
      origin,
    ),
  );
}