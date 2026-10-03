import {
  type NextRequest,
  NextResponse,
} from "next/server";

import {
  logServerError,
} from "@/lib/observability/server-logger";

import {
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

import {
  exchangeTikTokCreatorAuthorizationCode,
  prepareTikTokCreatorConnectionPersistence,
} from "@/lib/ai/tiktok-creator-oauth-runtime";

import {
  resolveTikTokCreatorOAuthConfig,
  TIKTOK_CREATOR_OAUTH_COOKIE_NAME,
  TIKTOK_CREATOR_OAUTH_RETURN_TO,
  TIKTOK_CREATOR_TOKEN_ENDPOINT,
  validateTikTokCreatorOAuthState,
} from "@/lib/ai/tiktok-creator-oauth-server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import { resolveTikTokOAuthAppUrl } from "@/lib/ai/tiktok-creator-oauth-app-url";

const CALLBACK_COOKIE_PATH =
  "/api/ai/publishing-provider-connections/tiktok/callback";

type CallbackStatus =
  | "connected"
  | "state_invalid"
  | "authorization_denied"
  | "authorization_code_missing"
  | "scope_missing"
  | "token_exchange_failed"
  | "token_exchange_ambiguous"
  | "token_response_invalid"
  | "credential_encryption_failed"
  | "connection_persistence_failed"
  | "configuration_unavailable";

function clearOAuthCookie(
  response: NextResponse,
) {
  response.cookies.set({
    name:
      TIKTOK_CREATOR_OAUTH_COOKIE_NAME,
    value:
      "",
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
      0,
  });

  return response;
}

function fixedGrowthRedirect(
  status: CallbackStatus,
  baseUrl: URL,
): NextResponse {
  const target =
    new URL(
      TIKTOK_CREATOR_OAUTH_RETURN_TO,
      baseUrl,
    );

  target.searchParams.set(
    "publishingConnection",
    "tiktok",
  );

  target.searchParams.set(
    "status",
    status,
  );

  return clearOAuthCookie(
    NextResponse.redirect(
      target,
    ),
  );
}

export async function GET(
  request: NextRequest,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );
  const context =
    await getControlledActionRequestContext();

  if ("error" in context) {
    if (context.error) {
      return clearOAuthCookie(
        context.error,
      );
    }

    logServerError({
      event:
        "ai_tiktok_callback_auth_context_unavailable",
      requestId,
      route:
        "/api/ai/publishing-provider-connections/tiktok/callback",
      method:
        "GET",
      provider:
        "tiktok",
      operation:
        "resolve_authentication_context",
    });

    return clearOAuthCookie(
      NextResponse.json(
        {
          error:
            "Authentication context is unavailable.",
        },
        {
          status: 500,
        },
      ),
    );
  }

  const appUrl = resolveTikTokOAuthAppUrl(process.env.LAKUVO_APP_URL);
  if (!appUrl.ok) {
    logServerError({
      event: "ai_tiktok_callback_config_unavailable",
      requestId,
      route: "/api/ai/publishing-provider-connections/tiktok/callback",
      method: "GET", provider: "tiktok", operation: "resolve_oauth_app_url",
      error: { code: "application_url_unavailable" },
    });
    return clearOAuthCookie(NextResponse.json({ error: appUrl.error }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    }));
  }
  // Capture one validated destination for every outcome of this callback.
  const redirect = (status: CallbackStatus) => fixedGrowthRedirect(status, appUrl.url);

  const config =
    resolveTikTokCreatorOAuthConfig(
      process.env,
    );

  if (!config) {
    return redirect(
      "configuration_unavailable",
    );
  }

  const url =
    new URL(
      request.url,
    );

  const returnedState =
    url.searchParams
      .get("state")
      ?.trim();

  const cookieValue =
    request.cookies.get(
      TIKTOK_CREATOR_OAUTH_COOKIE_NAME,
    )?.value;

  if (
    !returnedState ||
    !cookieValue
  ) {
    return redirect("state_invalid");
  }

  const stateValidation =
    validateTikTokCreatorOAuthState(
      {
        cookieValue,
        returnedState,
        currentUserId:
          context.user.id,
        currentOrganizationId:
          context.organizationId,
        secret:
          config.oauthStateSecret,
      },
    );

  if (!stateValidation.ok) {
    return redirect("state_invalid");
  }

  const providerError =
    url.searchParams
      .get("error")
      ?.trim();

  if (providerError) {
    return redirect(
      "authorization_denied",
    );
  }

  const code =
    url.searchParams
      .get("code")
      ?.trim();

  if (!code) {
    return redirect(
      "authorization_code_missing",
    );
  }

  const exchange =
    await exchangeTikTokCreatorAuthorizationCode(
      {
        clientKey:
          config.clientKey,
        clientSecret:
          config.clientSecret,
        redirectUri:
          config.redirectUri,
        code,
        tokenEndpoint:
          TIKTOK_CREATOR_TOKEN_ENDPOINT,
      },
    );

  if (!exchange.ok) {
    if (
      exchange.code ===
      "required_scope_missing"
    ) {
      return redirect(
        "scope_missing",
      );
    }

    return redirect(
      exchange.code,
    );
  }

  const prepared =
    prepareTikTokCreatorConnectionPersistence(
      {
        organizationId:
          context.organizationId,
        userId:
          context.user.id,
        token:
          exchange.value,
        keyring:
          config.tokenKeyring,
      },
    );

  if (!prepared.ok) {
    return redirect(
      "credential_encryption_failed",
    );
  }

  let admin;

  try {
    admin =
      createAdminClient();
  } catch {
    return redirect(
      "connection_persistence_failed",
    );
  }

  const {
    data,
    error,
  } =
    await admin.rpc(
      "upsert_publishing_provider_connection",
      prepared.value,
    );

  if (
    error ||
    !Array.isArray(data) ||
    data.length !== 1
  ) {
    return redirect(
      "connection_persistence_failed",
    );
  }

  const row =
    data[0] as
      Record<string, unknown>;

  if (
    typeof row.connection_id !==
      "string" ||
    row.connection_id.trim().length ===
      0 ||
    typeof row.credential_reference_id !==
      "string" ||
    row.credential_reference_id.trim()
      .length === 0
  ) {
    return redirect(
      "connection_persistence_failed",
    );
  }

  return redirect(
    "connected",
  );
}