import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  encryptMarketplaceSecret,
} from "@/lib/marketplaces/crypto";
import {
  exchangeAuthorizationCode,
  TIKTOK_SHOP_PROVIDER,
} from "@/lib/marketplaces/tiktok-shop";

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

  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();

  if (!code || !state) {
    return marketplaceRedirect(
      request,
      null,
      "error",
    );
  }

  const stateHash = createHash("sha256")
    .update(state)
    .digest("hex");

  const admin = createAdminClient();

  const {
    data: stateRows,
    error: stateError,
  } = await admin.rpc(
    "consume_marketplace_oauth_state",
    {
      p_state_hash: stateHash,
      p_provider: TIKTOK_SHOP_PROVIDER,
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
      await exchangeAuthorizationCode(code);

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
            TIKTOK_SHOP_PROVIDER,

          p_open_id:
            authorization.openId,

          p_access_token_ciphertext:
            accessTokenCiphertext,

          p_refresh_token_ciphertext:
            refreshTokenCiphertext,

          p_access_token_expires_at:
            authorization.accessTokenExpiresAt,

          p_refresh_token_expires_at:
            authorization.refreshTokenExpiresAt,

          p_granted_scopes:
            authorization.grantedScopes,

          p_user_type:
            authorization.userType,

          p_metadata: {
            authorization_flow: "seller_oauth",
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
