import {
  createHash,
  randomBytes,
} from "node:crypto";

import { NextResponse } from "next/server";

import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildShopeeAuthorizationUrl,
  isShopeeProvider,
  SHOPEE_PROVIDER,
} from "@/lib/marketplaces/shopee";

const SHOPEE_OAUTH_COOKIE =
  "lakuvo_shopee_oauth_state";

const SHOPEE_OAUTH_MAX_AGE_SECONDS =
  10 * 60;
export async function GET(request: Request) {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return NextResponse.json(
      { error: "Organization aktif tidak ditemukan." },
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
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const accountId =
    new URL(request.url).searchParams
      .get("account_id")
      ?.trim();

  if (!accountId) {
    return NextResponse.json(
      { error: "Marketplace account wajib diisi." },
      { status: 400 },
    );
  }

  const { data: account, error: accountError } =
    await supabase
      .from("marketplace_accounts")
      .select("id, provider, status")
      .eq("id", accountId)
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .maybeSingle();

  if (accountError) {
    return NextResponse.json(
      { error: accountError.message },
      { status: 500 },
    );
  }

  if (!account) {
    return NextResponse.json(
      { error: "Marketplace account tidak ditemukan." },
      { status: 404 },
    );
  }

  if (!isShopeeProvider(account.provider)) {
    return NextResponse.json(
      {
        error:
          "Provider account ini belum menggunakan connector Shopee.",
      },
      { status: 409 },
    );
  }

  if (account.status === "inactive") {
    return NextResponse.json(
      {
        error:
          "Marketplace account inactive. Aktifkan terlebih dahulu.",
      },
      { status: 409 },
    );
  }

  const state = randomBytes(32).toString("base64url");

  const stateHash = createHash("sha256")
    .update(state)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000,
  ).toISOString();

  const admin = createAdminClient();

  const { error: stateError } = await admin.rpc(
    "create_marketplace_oauth_state",
    {
      p_organization_id:
        currentOrganization.organizationId,
      p_marketplace_account_id: account.id,
      p_user_id: user.id,
      p_provider: SHOPEE_PROVIDER,
      p_state_hash: stateHash,
      p_expires_at: expiresAt,
    },
  );

  if (stateError) {
    return NextResponse.json(
      { error: stateError.message },
      { status: 500 },
    );
  }

  try {
    const callbackUrl = new URL(
      "/api/marketplaces/shopee/callback",
      request.url,
    );

    callbackUrl.searchParams.set(
      "state",
      state,
    );

    const response =
      NextResponse.redirect(
        buildShopeeAuthorizationUrl(
          callbackUrl.toString(),
        ),
      );

    response.cookies.set(
      SHOPEE_OAUTH_COOKIE,
      state,
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path:
          "/api/marketplaces/shopee/callback",
        maxAge:
          SHOPEE_OAUTH_MAX_AGE_SECONDS,
      },
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Marketplace authorization configuration error.",
      },
      { status: 503 },
    );
  }
}
