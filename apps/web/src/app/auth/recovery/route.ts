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

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_recovery_code`,
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
        "password_recovery_exchange_failed",
      requestId,
      route:
        "/auth/recovery",
      method: "GET",
      provider:
        "supabase",
      operation:
        "exchange_code_for_session",
      error,
    });

    return NextResponse.redirect(
      `${origin}/login?error=password_recovery_failed`,
    );
  }

  return NextResponse.redirect(
    `${origin}/reset-password`,
  );
}