import {
  NextResponse,
} from "next/server";

import {
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

import {
  decryptPublishingProviderToken,
} from "@/lib/ai/tiktok-creator-oauth-server";

import {
  classifyYouTubeConnectionHealth,
  exchangeYouTubeRefreshToken,
  prepareYouTubeAccessTokenRotation,
} from "@/lib/ai/youtube-channel-refresh-runtime";

import {
  resolveYouTubeOAuthConfig,
} from "@/lib/ai/youtube-channel-oauth-server";

import {
  YOUTUBE_ENDPOINTS,
} from "@/lib/ai/youtube-channel";

import {
  logServerError,
  logServerWarning,
} from "@/lib/observability/server-logger";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

const ROUTE =
  "/api/ai/publishing-provider-connections/youtube/health";

type RefreshContext = Readonly<{
  connectionId: string;
  externalAccountId: string;
  refreshTokenCiphertext: string;
  accessTokenExpiresAt: string;
  encryptionKeyVersion: string;
  connectionVersion: number;
}>;

function nonEmptyString(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return null;
  }

  return value.trim();
}

function parseRefreshContext(
  value: unknown,
): RefreshContext | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  const row =
    value as
      Record<string, unknown>;

  const connectionId =
    nonEmptyString(
      row.connection_id,
    );

  const externalAccountId =
    nonEmptyString(
      row.external_account_id,
    );

  const refreshTokenCiphertext =
    nonEmptyString(
      row.refresh_token_ciphertext,
    );

  const accessTokenExpiresAt =
    nonEmptyString(
      row.access_token_expires_at,
    );

  const encryptionKeyVersion =
    nonEmptyString(
      row.encryption_key_version,
    );

  const connectionVersion =
    row.connection_version;

  if (
    !connectionId ||
    !externalAccountId ||
    !refreshTokenCiphertext ||
    !accessTokenExpiresAt ||
    !encryptionKeyVersion ||
    typeof connectionVersion !==
      "number" ||
    !Number.isSafeInteger(
      connectionVersion,
    ) ||
    connectionVersion < 1
  ) {
    return null;
  }

  return {
    connectionId,
    externalAccountId,
    refreshTokenCiphertext,
    accessTokenExpiresAt,
    encryptionKeyVersion,
    connectionVersion,
  };
}

async function resolveRefreshContext(
  organizationId: string,
) {
  let admin;

  try {
    admin =
      createAdminClient();
  } catch {
    return {
      ok: false as const,
      status: 503,
      code:
        "refresh_storage_unavailable",
    };
  }

  const {
    data,
    error,
  } =
    await admin.rpc(
      "get_publishing_provider_refresh_credentials",
      {
        p_organization_id:
          organizationId,
        p_provider:
          "youtube",
      },
    );

  if (
    error ||
    !Array.isArray(data)
  ) {
    return {
      ok: false as const,
      status: 502,
      code:
        "refresh_storage_unavailable",
      error,
    };
  }

  if (data.length === 0) {
    return {
      ok: false as const,
      status: 409,
      code:
        "refresh_credential_unavailable",
    };
  }

  if (data.length !== 1) {
    return {
      ok: false as const,
      status: 409,
      code:
        "refresh_connection_ambiguous",
    };
  }

  const value =
    parseRefreshContext(
      data[0],
    );

  if (!value) {
    return {
      ok: false as const,
      status: 502,
      code:
        "refresh_context_invalid",
    };
  }

  return {
    ok: true as const,
    value,
    admin,
  };
}

export async function GET(
  request: Request,
) {
  const context =
    await getControlledActionRequestContext();

  if ("error" in context) {
    return context.error;
  }

  const refreshContext =
    await resolveRefreshContext(
      context.organizationId,
    );

  if (!refreshContext.ok) {
    return NextResponse.json(
      {
        ok: false,
        code:
          refreshContext.code,
      },
      {
        status:
          refreshContext.status,
      },
    );
  }

  const health =
    classifyYouTubeConnectionHealth({
      accessTokenExpiresAt:
        refreshContext.value
          .accessTokenExpiresAt,
    });

  if (health === "invalid") {
    logServerError({
      event:
        "ai_youtube_connection_health_invalid",
      requestId:
        request.headers.get(
          "x-request-id",
        ),
      route: ROUTE,
      method: "GET",
      provider: "youtube",
      operation:
        "classify_connection_health",
    });

    return NextResponse.json(
      {
        ok: false,
        code:
          "connection_health_invalid",
      },
      {
        status: 502,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    health,
    accessTokenExpiresAt:
      refreshContext.value
        .accessTokenExpiresAt,
    refreshReady: true,
  });
}

export async function POST(
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
    return NextResponse.json(
      {
        ok: false,
        code:
          "configuration_unavailable",
      },
      {
        status: 503,
      },
    );
  }

  const refreshContext =
    await resolveRefreshContext(
      context.organizationId,
    );

  if (!refreshContext.ok) {
    if (
      "error" in refreshContext &&
      refreshContext.error
    ) {
      logServerError({
        event:
          "ai_youtube_refresh_context_load_failed",
        requestId,
        route: ROUTE,
        method: "POST",
        provider: "supabase",
        operation:
          "get_publishing_provider_refresh_credentials",
        error:
          refreshContext.error,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        code:
          refreshContext.code,
      },
      {
        status:
          refreshContext.status,
      },
    );
  }

  const refreshToken =
    await decryptPublishingProviderToken({
      ciphertext:
        refreshContext.value
          .refreshTokenCiphertext,
      provider: "youtube",
      organizationId:
        context.organizationId,
      externalAccountId:
        refreshContext.value
          .externalAccountId,
      tokenKind: "refresh",
      keyVersion:
        refreshContext.value
          .encryptionKeyVersion,
      keyring:
        config.tokenKeyring,
    });

  if (!refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        code:
          "refresh_token_decryption_failed",
      },
      {
        status: 500,
      },
    );
  }

  const exchange =
    await exchangeYouTubeRefreshToken(
      {
        clientId:
          config.clientId,
        clientSecret:
          config.clientSecret,
        refreshToken,
        tokenEndpoint:
          YOUTUBE_ENDPOINTS.token,
      },
    );

  if (!exchange.ok) {
    if (
      exchange.code ===
      "reauthorization_required"
    ) {
      const {
        error,
      } =
        await refreshContext.admin.rpc(
          "mark_publishing_provider_reauthorization_required",
          {
            p_organization_id:
              context.organizationId,
            p_provider:
              "youtube",
            p_connection_id:
              refreshContext.value
                .connectionId,
            p_expected_connection_version:
              refreshContext.value
                .connectionVersion,
          },
        );

      if (error) {
        logServerError({
          event:
            "ai_youtube_reauthorization_mark_failed",
          requestId,
          route: ROUTE,
          method: "POST",
          provider: "supabase",
          operation:
            "mark_publishing_provider_reauthorization_required",
          error,
        });

        return NextResponse.json(
          {
            ok: false,
            code:
              "reauthorization_persistence_failed",
          },
          {
            status: 502,
          },
        );
      }
    }

    logServerWarning({
      event:
        "ai_youtube_token_refresh_failed",
      requestId,
      route: ROUTE,
      method: "POST",
      provider: "youtube",
      operation:
        "refresh_access_token",
      error: {
        code:
          exchange.code,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        code:
          exchange.code,
      },
      {
        status:
          exchange.code ===
          "reauthorization_required"
            ? 409
            : 502,
      },
    );
  }

  const prepared =
    prepareYouTubeAccessTokenRotation({
      organizationId:
        context.organizationId,
      externalAccountId:
        refreshContext.value
          .externalAccountId,
      token:
        exchange.value,
      encryptionKeyVersion:
        refreshContext.value
          .encryptionKeyVersion,
      keyring:
        config.tokenKeyring,
    });

  if (!prepared.ok) {
    return NextResponse.json(
      {
        ok: false,
        code:
          prepared.code,
      },
      {
        status: 500,
      },
    );
  }

  const {
    data,
    error,
  } =
    await refreshContext.admin.rpc(
      "rotate_publishing_provider_access_token",
      {
        p_organization_id:
          context.organizationId,
        p_provider:
          "youtube",
        p_connection_id:
          refreshContext.value
            .connectionId,
        p_expected_connection_version:
          refreshContext.value
            .connectionVersion,
        p_access_token_ciphertext:
          prepared.value
            .accessTokenCiphertext,
        p_access_token_expires_at:
          prepared.value
            .accessTokenExpiresAt,
        p_encryption_key_version:
          prepared.value
            .encryptionKeyVersion,
      },
    );

  if (
    error ||
    !Array.isArray(data) ||
    data.length !== 1
  ) {
    logServerError({
      event:
        "ai_youtube_token_rotation_failed",
      requestId,
      route: ROUTE,
      method: "POST",
      provider: "supabase",
      operation:
        "rotate_publishing_provider_access_token",
      error,
    });

    return NextResponse.json(
      {
        ok: false,
        code:
          "credential_rotation_failed",
      },
      {
        status: 502,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    health: "healthy",
    accessTokenExpiresAt:
      prepared.value
        .accessTokenExpiresAt,
  });
}
