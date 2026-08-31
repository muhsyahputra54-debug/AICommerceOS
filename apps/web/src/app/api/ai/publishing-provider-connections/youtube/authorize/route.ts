import {
  NextResponse,
} from "next/server";

import {
  logServerError,
} from "@/lib/observability/server-logger";

import {
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

import {
  buildYouTubeAuthorizeUrl,
  issueYouTubeOAuthState,
  resolveYouTubeOAuthConfig,
  YOUTUBE_OAUTH_COOKIE_NAME,
  YOUTUBE_OAUTH_TTL_SECONDS,
} from "@/lib/ai/youtube-channel-oauth-server";

const CALLBACK_COOKIE_PATH =
  "/api/ai/publishing-provider-connections/youtube/callback";

export async function GET(
  request: Request,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );

  const context =
    await getControlledActionRequestContext();

  if ("error" in context) {
    return context.error;
  }

  const config =
    resolveYouTubeOAuthConfig(
      process.env,
    );

  if (!config) {
    logServerError({
      event:
        "ai_youtube_authorize_config_unavailable",
      requestId,
      route:
        "/api/ai/publishing-provider-connections/youtube/authorize",
      method:
        "GET",
      provider:
        "youtube",
      operation:
        "resolve_oauth_config",
    });

    return NextResponse.json(
      {
        error:
          "YouTube OAuth configuration is unavailable.",
      },
      {
        status: 503,
      },
    );
  }

  const issued =
    issueYouTubeOAuthState(
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
          "YouTube OAuth state could not be created.",
      },
      {
        status: 503,
      },
    );
  }

  const authorizeUrl =
    buildYouTubeAuthorizeUrl(
      {
        clientId:
          config.clientId,
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
          "YouTube authorization URL could not be created.",
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
      YOUTUBE_OAUTH_COOKIE_NAME,
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
      YOUTUBE_OAUTH_TTL_SECONDS,
  });

  return response;
}
