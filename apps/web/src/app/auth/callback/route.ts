import { createClient } from "@/lib/supabase/server";
import { ensureOrganization } from "@/lib/supabase/organization";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

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
    console.error(
      "Auth callback error:",
      error.message,
    );

    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed`,
    );
  }

  try {
    await ensureOrganization();
  } catch (error) {
    console.error(
      "Organization setup error:",
      error,
    );

    return NextResponse.redirect(
      `${origin}/?error=organization_setup_failed`,
    );
  }

  return NextResponse.redirect(`${origin}/`);
}