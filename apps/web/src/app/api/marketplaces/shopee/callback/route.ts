import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  encryptMarketplaceSecret,
} from "@/lib/marketplaces/crypto";
import {
  exchangeShopeeAuthorizationCode,
  SHOPEE_PROVIDER,
} from "@/lib/marketplaces/shopee";

const SHOPEE_OAUTH_COOKIE =
  "lakuvo_shopee_oauth_state";
type OAuthStateRow = {
  organization_id: string;
  marketplace_account_id: string;
  initiated_by: string;
};

function marketplaceRedirect(
  request: Request,
  accountId: string | null,
  result: "connected" | "error",
) {
  const path = accountId
    ? `/marketplaces/${accountId}`
    : "/marketplaces";

  const url = new URL(path, request.url);

  url.searchParams.set("connector", result);

  const response =
    NextResponse.redirect(url);

  response.cookies.set(
    SHOPEE_OAUTH_COOKIE,
    "",
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path:
        "/api/marketplaces/shopee/callback",
      maxAge: 0,
    },
  );

  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code =
    url.searchParams.get("code")?.trim();

  const shopIdValue =
    url.searchParams.get("shop_id")?.trim();

  const callbackState =
    url.searchParams.get("state")?.trim();

  const cookieState =
    request.cookies
      .get(SHOPEE_OAUTH_COOKIE)
      ?.value.trim();

  const shopId =
    Number(shopIdValue);

  if (
    !code ||
    !callbackState ||
    !cookieState ||
    callbackState !== cookieState ||
    !Number.isSafeInteger(shopId) ||
    shopId <= 0
  ) {
    return marketplaceRedirect(
      request,
      null,
      "error",
    );
  }

  const stateHash = createHash("sha256")
    .update(callbackState)
    .digest("hex");

  const admin = createAdminClient();

  const {
    data: stateRows,
    error: stateError,
  } = await admin.rpc(
    "consume_marketplace_oauth_state",
    {
      p_state_hash: stateHash,
      p_provider: SHOPEE_PROVIDER,
    },
  );

  if (stateError) {
    return marketplaceRedirect(
      request,
      null,
      "error",
    );
  }

  const oauthState =
    Array.isArray(stateRows) && stateRows.length > 0
      ? (stateRows[0] as OAuthStateRow)
      : null;

  if (!oauthState) {
    return marketplaceRedirect(
      request,
      null,
      "error",
    );
  }

  try {
    const authorization =
      await exchangeShopeeAuthorizationCode(code, shopId);

    const accessTokenCiphertext =
      encryptMarketplaceSecret(
        authorization.accessToken,
      );

    const refreshTokenCiphertext =
      encryptMarketplaceSecret(
        authorization.refreshToken,
      );

    const { error: connectionError } =
      await admin.rpc(
        "upsert_marketplace_connection",
        {
          p_organization_id:
            oauthState.organization_id,

          p_marketplace_account_id:
            oauthState.marketplace_account_id,

          p_connected_by:
            oauthState.initiated_by,

          p_provider:
            SHOPEE_PROVIDER,

          p_open_id:
            String(authorization.shopId),

          p_access_token_ciphertext:
            accessTokenCiphertext,

          p_refresh_token_ciphertext:
            refreshTokenCiphertext,

          p_access_token_expires_at:
            authorization.accessTokenExpiresAt,

          p_refresh_token_expires_at:
            authorization.refreshTokenExpiresAt,

          p_granted_scopes:
            [],

          p_user_type:
            null,

          p_metadata: {
            authorization_flow:
              "shop_oauth",
            shop_id:
              authorization.shopId,
            request_id:
              authorization.requestId,
          },
        },
      );

    if (connectionError) {
      throw new Error(connectionError.message);
    }

    return marketplaceRedirect(
      request,
      oauthState.marketplace_account_id,
      "connected",
    );
  } catch {
    return marketplaceRedirect(
      request,
      oauthState.marketplace_account_id,
      "error",
    );
  }
}
