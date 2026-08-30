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
): NextResponse {
  const appUrl =
    process.env.LAKUVO_APP_URL?.trim();

  if (!appUrl) {
    return clearOAuthCookie(
      NextResponse.json(
        {
          error:
            "LAKUVO application URL is unavailable.",
        },
        {
          status: 503,
        },
      ),
    );
  }

  let baseUrl: URL;

  try {
    baseUrl =
      new URL(
        appUrl,
      );
  } catch {
    return clearOAuthCookie(
      NextResponse.json(
        {
          error:
            "LAKUVO application URL is invalid.",
        },
        {
          status: 503,
        },
      ),
    );
  }

  if (
    baseUrl.protocol !== "https:" &&
    baseUrl.hostname !== "localhost"
  ) {
    return clearOAuthCookie(
      NextResponse.json(
        {
          error:
            "LAKUVO application URL is invalid.",
        },
        {
          status: 503,
        },
      ),
    );
  }

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

function stateFailureRedirect() {
  return fixedGrowthRedirect(
    "state_invalid",
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

  const config =
    resolveTikTokCreatorOAuthConfig(
      process.env,
    );

  if (!config) {
    return fixedGrowthRedirect(
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
    return stateFailureRedirect();
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
    return stateFailureRedirect();
  }

  const providerError =
    url.searchParams
      .get("error")
      ?.trim();

  if (providerError) {
    return fixedGrowthRedirect(
      "authorization_denied",
    );
  }

  const code =
    url.searchParams
      .get("code")
      ?.trim();

  if (!code) {
    return fixedGrowthRedirect(
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
      return fixedGrowthRedirect(
        "scope_missing",
      );
    }

    return fixedGrowthRedirect(
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
    return fixedGrowthRedirect(
      "credential_encryption_failed",
    );
  }

  let admin;

  try {
    admin =
      createAdminClient();
  } catch {
    return fixedGrowthRedirect(
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
    return fixedGrowthRedirect(
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
    return fixedGrowthRedirect(
      "connection_persistence_failed",
    );
  }

  return fixedGrowthRedirect(
    "connected",
  );
}