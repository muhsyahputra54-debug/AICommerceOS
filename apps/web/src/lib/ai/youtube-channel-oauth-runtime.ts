import {
  encryptPublishingProviderToken,
  type PublishingProviderTokenKeyring,
} from "./tiktok-creator-oauth-server";

import {
  parseYouTubeOAuthTokenResponse,
  type YouTubeOAuthTokenResponse,
} from "./youtube-channel-oauth-server";

import {
  YOUTUBE_CHANNEL_PROVIDER,
  YOUTUBE_REQUIRED_SCOPES,
  YOUTUBE_SUPPORTED_CAPABILITIES,
} from "./youtube-channel";

export type YouTubeOAuthExchangeResult =
  | Readonly<{
      ok: true;
      value: YouTubeOAuthTokenResponse;
    }>
  | Readonly<{
      ok: false;
      code:
        | "token_exchange_failed"
        | "token_exchange_ambiguous"
        | "token_response_invalid"
        | "required_scope_missing"
        | "unexpected_scope_granted";
    }>;

export type YouTubeChannelIdentityResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        channelId: string;
      }>;
    }>
  | Readonly<{
      ok: false;
      code:
        | "channel_identity_request_failed"
        | "channel_identity_provider_error"
        | "channel_identity_response_invalid"
        | "channel_identity_unavailable"
        | "channel_identity_ambiguous";
    }>;

export type YouTubePersistenceInput =
  Readonly<{
    p_organization_id: string;
    p_provider: "youtube";
    p_external_account_id: string;
    p_connected_by_user_id: string;
    p_granted_scopes: readonly string[];
    p_supported_capabilities:
      typeof YOUTUBE_SUPPORTED_CAPABILITIES;
    p_access_token_ciphertext: string;
    p_refresh_token_ciphertext: string;
    p_access_token_expires_at: string;
    p_refresh_token_expires_at: null;
    p_token_type: "Bearer";
    p_encryption_key_version: string;
  }>;

export type YouTubePersistencePreparationResult =
  | Readonly<{
      ok: true;
      value: YouTubePersistenceInput;
    }>
  | Readonly<{
      ok: false;
      code:
        "credential_encryption_failed";
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

export async function exchangeYouTubeAuthorizationCode(
  input: Readonly<{
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    code: string;
    tokenEndpoint: string;
  }>,
  fetchImpl: typeof fetch = fetch,
): Promise<YouTubeOAuthExchangeResult> {
  if (
    !isNonEmptyString(
      input.clientId,
    ) ||
    !isNonEmptyString(
      input.clientSecret,
    ) ||
    !isNonEmptyString(
      input.redirectUri,
    ) ||
    !isNonEmptyString(
      input.code,
    ) ||
    !isNonEmptyString(
      input.tokenEndpoint,
    )
  ) {
    return {
      ok: false,
      code:
        "token_response_invalid",
    };
  }

  const body =
    new URLSearchParams({
      client_id:
        input.clientId.trim(),
      client_secret:
        input.clientSecret.trim(),
      code:
        input.code.trim(),
      grant_type:
        "authorization_code",
      redirect_uri:
        input.redirectUri.trim(),
    });

  let response: Response;

  try {
    response =
      await fetchImpl(
        input.tokenEndpoint,
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            Accept:
              "application/json",
          },
          body,
          cache:
            "no-store",
        },
      );
  } catch {
    return {
      ok: false,
      code:
        "token_exchange_ambiguous",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code:
        "token_exchange_failed",
    };
  }

  let payload: unknown;

  try {
    payload =
      await response.json();
  } catch {
    return {
      ok: false,
      code:
        "token_response_invalid",
    };
  }

  return parseYouTubeOAuthTokenResponse(
    payload,
  );
}

export async function resolveYouTubeChannelIdentity(
  input: Readonly<{
    accessToken: string;
    channelsEndpoint: string;
  }>,
  fetchImpl: typeof fetch = fetch,
): Promise<YouTubeChannelIdentityResult> {
  if (
    !isNonEmptyString(
      input.accessToken,
    ) ||
    !isNonEmptyString(
      input.channelsEndpoint,
    )
  ) {
    return {
      ok: false,
      code:
        "channel_identity_response_invalid",
    };
  }

  let endpoint: URL;

  try {
    endpoint =
      new URL(
        input.channelsEndpoint,
      );
  } catch {
    return {
      ok: false,
      code:
        "channel_identity_response_invalid",
    };
  }

  endpoint.searchParams.set(
    "part",
    "id",
  );

  endpoint.searchParams.set(
    "mine",
    "true",
  );

  endpoint.searchParams.set(
    "maxResults",
    "2",
  );

  endpoint.searchParams.set(
    "fields",
    "items(id)",
  );

  let response: Response;

  try {
    response =
      await fetchImpl(
        endpoint,
        {
          method:
            "GET",
          headers: {
            Authorization:
              `Bearer ${input.accessToken.trim()}`,
            Accept:
              "application/json",
          },
          cache:
            "no-store",
        },
      );
  } catch {
    return {
      ok: false,
      code:
        "channel_identity_request_failed",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code:
        "channel_identity_provider_error",
    };
  }

  let payload: unknown;

  try {
    payload =
      await response.json();
  } catch {
    return {
      ok: false,
      code:
        "channel_identity_response_invalid",
    };
  }

  if (
    !isRecord(payload) ||
    !Array.isArray(
      payload.items,
    )
  ) {
    return {
      ok: false,
      code:
        "channel_identity_response_invalid",
    };
  }

  if (
    payload.items.length === 0
  ) {
    return {
      ok: false,
      code:
        "channel_identity_unavailable",
    };
  }

  if (
    payload.items.length !== 1
  ) {
    return {
      ok: false,
      code:
        "channel_identity_ambiguous",
    };
  }

  const item =
    payload.items[0];

  if (
    !isRecord(item) ||
    !isNonEmptyString(
      item.id,
    )
  ) {
    return {
      ok: false,
      code:
        "channel_identity_response_invalid",
    };
  }

  return {
    ok: true,
    value: {
      channelId:
        item.id.trim(),
    },
  };
}

export function prepareYouTubeConnectionPersistence(
  input: Readonly<{
    organizationId: string;
    userId: string;
    channelId: string;
    token: YouTubeOAuthTokenResponse;
    keyring: PublishingProviderTokenKeyring;
    nowMs?: number;
  }>,
): YouTubePersistencePreparationResult {
  const nowMs =
    input.nowMs ??
    Date.now();

  if (
    !isNonEmptyString(
      input.organizationId,
    ) ||
    !isNonEmptyString(
      input.userId,
    ) ||
    !isNonEmptyString(
      input.channelId,
    ) ||
    !Number.isFinite(
      nowMs,
    ) ||
    nowMs < 0 ||
    !YOUTUBE_REQUIRED_SCOPES.every(
      (scope) =>
        input.token
          .grantedScopes
          .includes(scope),
    )
  ) {
    return {
      ok: false,
      code:
        "credential_encryption_failed",
    };
  }

  const key =
    input.keyring.keys.get(
      input.keyring.activeVersion,
    );

  if (!key) {
    return {
      ok: false,
      code:
        "credential_encryption_failed",
    };
  }

  const accessCiphertext =
    encryptPublishingProviderToken(
      {
        plaintext:
          input.token.accessToken,
        provider:
          YOUTUBE_CHANNEL_PROVIDER,
        organizationId:
          input.organizationId,
        externalAccountId:
          input.channelId,
        tokenKind:
          "access",
        keyVersion:
          input.keyring.activeVersion,
        key,
      },
    );

  const refreshCiphertext =
    encryptPublishingProviderToken(
      {
        plaintext:
          input.token.refreshToken,
        provider:
          YOUTUBE_CHANNEL_PROVIDER,
        organizationId:
          input.organizationId,
        externalAccountId:
          input.channelId,
        tokenKind:
          "refresh",
        keyVersion:
          input.keyring.activeVersion,
        key,
      },
    );

  if (
    !accessCiphertext ||
    !refreshCiphertext
  ) {
    return {
      ok: false,
      code:
        "credential_encryption_failed",
    };
  }

  const accessExpiresAt =
    new Date(
      nowMs +
        input.token
          .accessTokenExpiresInSeconds *
          1000,
    ).toISOString();

  return {
    ok: true,
    value: {
      p_organization_id:
        input.organizationId.trim(),
      p_provider:
        YOUTUBE_CHANNEL_PROVIDER,
      p_external_account_id:
        input.channelId.trim(),
      p_connected_by_user_id:
        input.userId.trim(),
      p_granted_scopes:
        input.token.grantedScopes,
      p_supported_capabilities:
        YOUTUBE_SUPPORTED_CAPABILITIES,
      p_access_token_ciphertext:
        accessCiphertext,
      p_refresh_token_ciphertext:
        refreshCiphertext,
      p_access_token_expires_at:
        accessExpiresAt,
      p_refresh_token_expires_at:
        null,
      p_token_type:
        "Bearer",
      p_encryption_key_version:
        input.keyring.activeVersion,
    },
  };
}
