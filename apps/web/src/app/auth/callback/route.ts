import { logServerError } from "@/lib/observability/server-logger";
import { ensureOrganization } from "@/lib/supabase/organization";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const requestId =
    request.headers.get("x-request-id");

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_code`,
    );
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logServerError({
      event: "auth_callback_exchange_failed",
      requestId,
      route: "/auth/callback",
      method: "GET",
      provider: "supabase",
      operation:
        "exchange_code_for_session",
      error,
    });

    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed`,
    );
  }

  try {
    await ensureOrganization();
  } catch (error) {
    logServerError({
      event:
        "auth_callback_organization_setup_failed",
      requestId,
      route: "/auth/callback",
      method: "GET",
      provider: "supabase",
      operation: "ensure_organization",
      error,
    });

    return NextResponse.redirect(
      `${origin}/?error=organization_setup_failed`,
    );
  }

  return NextResponse.redirect(`${origin}/`);
}