import {
  NextResponse,
} from "next/server";

import {
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

import {
  buildTikTokCreatorAuthorizeUrl,
  issueTikTokCreatorOAuthState,
  resolveTikTokCreatorOAuthConfig,
  TIKTOK_CREATOR_OAUTH_COOKIE_NAME,
  TIKTOK_CREATOR_OAUTH_TTL_SECONDS,
} from "@/lib/ai/tiktok-creator-oauth-server";

const CALLBACK_COOKIE_PATH =
  "/api/ai/publishing-provider-connections/tiktok/callback";

export async function GET() {
  const context =
    await getControlledActionRequestContext();

  if ("error" in context) {
    return context.error;
  }

  const config =
    resolveTikTokCreatorOAuthConfig(
      process.env,
    );

  if (!config) {
    return NextResponse.json(
      {
        error:
          "TikTok creator OAuth configuration is unavailable.",
      },
      {
        status: 503,
      },
    );
  }

  const issued =
    issueTikTokCreatorOAuthState(
      {
        initiatingUserId:
          context.user.id,
        organizationId:
          context.organizationId,
        secret:
          config.oauthStateSecret,
      },
    );

  if (!issued) {
    return NextResponse.json(
      {
        error:
          "TikTok creator OAuth state could not be created.",
      },
      {
        status: 503,
      },
    );
  }

  const authorizeUrl =
    buildTikTokCreatorAuthorizeUrl(
      {
        clientKey:
          config.clientKey,
        redirectUri:
          config.redirectUri,
        state:
          issued.state,
      },
    );

  if (!authorizeUrl) {
    return NextResponse.json(
      {
        error:
          "TikTok creator authorization URL could not be created.",
      },
      {
        status: 503,
      },
    );
  }

  const response =
    NextResponse.redirect(
      authorizeUrl,
    );

  response.cookies.set({
    name:
      TIKTOK_CREATOR_OAUTH_COOKIE_NAME,
    value:
      issued.cookieValue,
    httpOnly:
      true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite:
      "lax",
    path:
      CALLBACK_COOKIE_PATH,
    maxAge:
      TIKTOK_CREATOR_OAUTH_TTL_SECONDS,
  });

  return response;
}