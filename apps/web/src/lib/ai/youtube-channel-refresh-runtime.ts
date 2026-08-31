import {
  encryptPublishingProviderToken,
  type PublishingProviderTokenKeyring,
} from "./tiktok-creator-oauth-server";

import {
  YOUTUBE_CHANNEL_PROVIDER,
} from "./youtube-channel";

export const YOUTUBE_REFRESH_RECOMMENDED_WINDOW_MS =
  10 * 60 * 1000;

export type YouTubeConnectionHealth =
  | "healthy"
  | "refresh_recommended"
  | "expired"
  | "invalid";

export type YouTubeRefreshTokenResponse = Readonly<{
  accessToken: string;
  tokenType: "Bearer";
  accessTokenExpiresInSeconds: number;
}>;

export type YouTubeRefreshExchangeResult =
  | Readonly<{
      ok: true;
      value: YouTubeRefreshTokenResponse;
    }>
  | Readonly<{
      ok: false;
      code:
        | "refresh_request_invalid"
        | "refresh_request_ambiguous"
        | "refresh_rejected"
        | "reauthorization_required"
        | "refresh_response_invalid";
    }>;

export type YouTubeAccessTokenRotationResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        accessTokenCiphertext: string;
        accessTokenExpiresAt: string;
        encryptionKeyVersion: string;
      }>;
    }>
  | Readonly<{
      ok: false;
      code: "credential_encryption_failed";
    }>;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isPositiveInteger(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

export function classifyYouTubeConnectionHealth(
  input: Readonly<{
    accessTokenExpiresAt: string;
    nowMs?: number;
    refreshRecommendedWindowMs?: number;
  }>,
): YouTubeConnectionHealth {
  const expiresAtMs =
    Date.parse(
      input.accessTokenExpiresAt,
    );

  const nowMs =
    input.nowMs ??
    Date.now();

  const windowMs =
    input.refreshRecommendedWindowMs ??
    YOUTUBE_REFRESH_RECOMMENDED_WINDOW_MS;

  if (
    Number.isNaN(expiresAtMs) ||
    !Number.isFinite(nowMs) ||
    nowMs < 0 ||
    !Number.isFinite(windowMs) ||
    windowMs < 0
  ) {
    return "invalid";
  }

  if (expiresAtMs <= nowMs) {
    return "expired";
  }

  if (
    expiresAtMs - nowMs <=
    windowMs
  ) {
    return "refresh_recommended";
  }

  return "healthy";
}

export async function exchangeYouTubeRefreshToken(
  input: Readonly<{
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    tokenEndpoint: string;
  }>,
  fetchImpl: typeof fetch = fetch,
): Promise<YouTubeRefreshExchangeResult> {
  if (
    !isNonEmptyString(input.clientId) ||
    !isNonEmptyString(input.clientSecret) ||
    !isNonEmptyString(input.refreshToken) ||
    !isNonEmptyString(input.tokenEndpoint)
  ) {
    return {
      ok: false,
      code: "refresh_request_invalid",
    };
  }

  const body =
    new URLSearchParams({
      client_id:
        input.clientId.trim(),
      client_secret:
        input.clientSecret.trim(),
      refresh_token:
        input.refreshToken.trim(),
      grant_type:
        "refresh_token",
    });

  let response: Response;

  try {
    response =
      await fetchImpl(
        input.tokenEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            Accept:
              "application/json",
          },
          body,
          cache: "no-store",
        },
      );
  } catch {
    return {
      ok: false,
      code: "refresh_request_ambiguous",
    };
  }

  let payload: unknown;

  try {
    payload =
      await response.json();
  } catch {
    return {
      ok: false,
      code: "refresh_response_invalid",
    };
  }

  if (!response.ok) {
    if (
      isRecord(payload) &&
      payload.error ===
        "invalid_grant"
    ) {
      return {
        ok: false,
        code: "reauthorization_required",
      };
    }

    return {
      ok: false,
      code: "refresh_rejected",
    };
  }

  if (
    !isRecord(payload) ||
    !isNonEmptyString(
      payload.access_token,
    ) ||
    !isNonEmptyString(
      payload.token_type,
    ) ||
    payload.token_type
      .trim()
      .toLowerCase() !==
      "bearer" ||
    !isPositiveInteger(
      payload.expires_in,
    )
  ) {
    return {
      ok: false,
      code: "refresh_response_invalid",
    };
  }

  return {
    ok: true,
    value: {
      accessToken:
        payload.access_token.trim(),
      tokenType:
        "Bearer",
      accessTokenExpiresInSeconds:
        payload.expires_in,
    },
  };
}

export function prepareYouTubeAccessTokenRotation(
  input: Readonly<{
    organizationId: string;
    externalAccountId: string;
    token: YouTubeRefreshTokenResponse;
    encryptionKeyVersion: string;
    keyring: PublishingProviderTokenKeyring;
    nowMs?: number;
  }>,
): YouTubeAccessTokenRotationResult {
  const nowMs =
    input.nowMs ??
    Date.now();

  const key =
    input.keyring.keys.get(
      input.encryptionKeyVersion,
    );

  if (
    !isNonEmptyString(
      input.organizationId,
    ) ||
    !isNonEmptyString(
      input.externalAccountId,
    ) ||
    !isNonEmptyString(
      input.encryptionKeyVersion,
    ) ||
    !key ||
    !Number.isFinite(nowMs) ||
    nowMs < 0
  ) {
    return {
      ok: false,
      code: "credential_encryption_failed",
    };
  }

  const ciphertext =
    encryptPublishingProviderToken({
      plaintext:
        input.token.accessToken,
      provider:
        YOUTUBE_CHANNEL_PROVIDER,
      organizationId:
        input.organizationId.trim(),
      externalAccountId:
        input.externalAccountId.trim(),
      tokenKind:
        "access",
      keyVersion:
        input.encryptionKeyVersion.trim(),
      key,
    });

  if (!ciphertext) {
    return {
      ok: false,
      code: "credential_encryption_failed",
    };
  }

  return {
    ok: true,
    value: {
      accessTokenCiphertext:
        ciphertext,
      accessTokenExpiresAt:
        new Date(
          nowMs +
            input.token
              .accessTokenExpiresInSeconds *
              1000,
        ).toISOString(),
      encryptionKeyVersion:
        input.encryptionKeyVersion.trim(),
    },
  };
}
