import {
  encryptPublishingProviderToken,
  parseTikTokCreatorTokenResponse,
  type PublishingProviderTokenKeyring,
  type TikTokCreatorTokenResponse,
} from "./tiktok-creator-oauth-server";

export const TIKTOK_CREATOR_SUPPORTED_CAPABILITIES =
  [
    "publish_image",
    "publish_video",
  ] as const;

export type TikTokCreatorExchangeResult =
  | Readonly<{
      ok: true;
      value: TikTokCreatorTokenResponse;
    }>
  | Readonly<{
      ok: false;
      code:
        | "token_exchange_failed"
        | "token_exchange_ambiguous"
        | "token_response_invalid"
        | "required_scope_missing";
    }>;

export type TikTokCreatorPersistenceInput =
  Readonly<{
    p_organization_id: string;
    p_provider: "tiktok";
    p_external_account_id: string;
    p_connected_by_user_id: string;
    p_granted_scopes: readonly string[];
    p_supported_capabilities:
      readonly [
        "publish_image",
        "publish_video",
      ];
    p_access_token_ciphertext: string;
    p_refresh_token_ciphertext: string;
    p_access_token_expires_at: string;
    p_refresh_token_expires_at: string;
    p_token_type: "Bearer";
    p_encryption_key_version: string;
  }>;

export type TikTokCreatorPersistencePreparationResult =
  | Readonly<{
      ok: true;
      value: TikTokCreatorPersistenceInput;
    }>
  | Readonly<{
      ok: false;
      code: "credential_encryption_failed";
    }>;

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export async function exchangeTikTokCreatorAuthorizationCode(
  input: Readonly<{
    clientKey: string;
    clientSecret: string;
    redirectUri: string;
    code: string;
    tokenEndpoint: string;
  }>,
  fetchImpl: typeof fetch = fetch,
): Promise<TikTokCreatorExchangeResult> {
  if (
    !isNonEmptyString(input.clientKey) ||
    !isNonEmptyString(input.clientSecret) ||
    !isNonEmptyString(input.redirectUri) ||
    !isNonEmptyString(input.code) ||
    !isNonEmptyString(input.tokenEndpoint)
  ) {
    return {
      ok: false,
      code: "token_response_invalid",
    };
  }

  const body =
    new URLSearchParams({
      client_key:
        input.clientKey.trim(),
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
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body,
          cache: "no-store",
        },
      );
  } catch {
    return {
      ok: false,
      code: "token_exchange_ambiguous",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code: "token_exchange_failed",
    };
  }

  let payload: unknown;

  try {
    payload =
      await response.json();
  } catch {
    return {
      ok: false,
      code: "token_response_invalid",
    };
  }

  const parsed =
    parseTikTokCreatorTokenResponse(
      payload,
    );

  if (!parsed.ok) {
    return parsed;
  }

  return parsed;
}

export function prepareTikTokCreatorConnectionPersistence(
  input: Readonly<{
    organizationId: string;
    userId: string;
    token: TikTokCreatorTokenResponse;
    keyring: PublishingProviderTokenKeyring;
    nowMs?: number;
  }>,
): TikTokCreatorPersistencePreparationResult {
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
    !Number.isFinite(nowMs) ||
    nowMs < 0
  ) {
    return {
      ok: false,
      code: "credential_encryption_failed",
    };
  }

  const key =
    input.keyring.keys.get(
      input.keyring.activeVersion,
    );

  if (!key) {
    return {
      ok: false,
      code: "credential_encryption_failed",
    };
  }

  const accessCiphertext =
    encryptPublishingProviderToken(
      {
        plaintext:
          input.token.accessToken,
        provider:
          "tiktok",
        organizationId:
          input.organizationId,
        externalAccountId:
          input.token.openId,
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
          "tiktok",
        organizationId:
          input.organizationId,
        externalAccountId:
          input.token.openId,
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
      code: "credential_encryption_failed",
    };
  }

  const accessExpiresAt =
    new Date(
      nowMs +
        input.token
          .accessTokenExpiresInSeconds *
          1000,
    ).toISOString();

  const refreshExpiresAt =
    new Date(
      nowMs +
        input.token
          .refreshTokenExpiresInSeconds *
          1000,
    ).toISOString();

  return {
    ok: true,
    value: {
      p_organization_id:
        input.organizationId.trim(),
      p_provider:
        "tiktok",
      p_external_account_id:
        input.token.openId,
      p_connected_by_user_id:
        input.userId.trim(),
      p_granted_scopes:
        input.token.grantedScopes,
      p_supported_capabilities:
        TIKTOK_CREATOR_SUPPORTED_CAPABILITIES,
      p_access_token_ciphertext:
        accessCiphertext,
      p_refresh_token_ciphertext:
        refreshCiphertext,
      p_access_token_expires_at:
        accessExpiresAt,
      p_refresh_token_expires_at:
        refreshExpiresAt,
      p_token_type:
        "Bearer",
      p_encryption_key_version:
        input.keyring.activeVersion,
    },
  };
}