import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  decryptPublishingProviderToken,
  parsePublishingProviderTokenKeyring,
} from "./tiktok-creator-oauth-server";

import {
  parseTikTokCreatorInfoSnapshot,
  TIKTOK_CREATOR_ENDPOINTS,
  TIKTOK_CREATOR_REQUIRED_SCOPE,
  type TikTokCreatorInfoSnapshot,
} from "./tiktok-creator-publishing";

export type TikTokCreatorInfoServerErrorCode =
  | "connection_unavailable"
  | "connection_ambiguous"
  | "scope_missing"
  | "credential_unavailable"
  | "credential_invalid"
  | "token_keyring_unavailable"
  | "token_decryption_failed"
  | "access_token_expired"
  | "creator_info_request_failed"
  | "creator_info_provider_error"
  | "creator_info_response_invalid";

export type TikTokCreatorInfoServerResult =
  | Readonly<{
      ok: true;
      value: TikTokCreatorInfoSnapshot;
    }>
  | Readonly<{
      ok: false;
      code: TikTokCreatorInfoServerErrorCode;
      providerCode?: string;
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

function stringArray(
  value: unknown,
): readonly string[] | null {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        typeof item === "string",
    )
  ) {
    return null;
  }

  return value;
}

function providerErrorCode(
  payload: unknown,
): string | null {
  if (
    !isRecord(payload) ||
    !isRecord(payload.error)
  ) {
    return null;
  }

  return nonEmptyString(
    payload.error.code,
  );
}

export async function queryTikTokCreatorInfo(
  input: Readonly<{
    accessToken: string;
    endpoint?: string;
    nowMs?: number;
  }>,
  fetchImpl: typeof fetch = fetch,
): Promise<TikTokCreatorInfoServerResult> {
  const accessToken =
    nonEmptyString(
      input.accessToken,
    );

  const endpoint =
    nonEmptyString(
      input.endpoint ??
        TIKTOK_CREATOR_ENDPOINTS.creatorInfo,
    );

  const nowMs =
    input.nowMs ??
    Date.now();

  if (
    !accessToken ||
    !endpoint ||
    !Number.isFinite(nowMs) ||
    nowMs < 0
  ) {
    return {
      ok: false,
      code:
        "creator_info_request_failed",
    };
  }

  let response: Response;

  try {
    response =
      await fetchImpl(
        endpoint,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            "Content-Type":
              "application/json; charset=UTF-8",
          },
          cache: "no-store",
        },
      );
  } catch {
    return {
      ok: false,
      code:
        "creator_info_request_failed",
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
        "creator_info_response_invalid",
    };
  }

  const remoteErrorCode =
    providerErrorCode(
      payload,
    );

  if (
    !response.ok ||
    remoteErrorCode !== "ok"
  ) {
    return {
      ok: false,
      code:
        "creator_info_provider_error",
      ...(remoteErrorCode
        ? {
            providerCode:
              remoteErrorCode,
          }
        : {}),
    };
  }

  if (
    !isRecord(payload) ||
    !isRecord(payload.data)
  ) {
    return {
      ok: false,
      code:
        "creator_info_response_invalid",
    };
  }

  const data =
    payload.data;

  const parsed =
    parseTikTokCreatorInfoSnapshot(
      {
        checkedAt:
          new Date(
            nowMs,
          ).toISOString(),
        creatorUsername:
          data.creator_username,
        creatorNickname:
          data.creator_nickname,
        privacyLevelOptions:
          data.privacy_level_options,
        commentDisabled:
          data.comment_disabled,
        duetDisabled:
          data.duet_disabled,
        stitchDisabled:
          data.stitch_disabled,
        maxVideoPostDurationSec:
          data.max_video_post_duration_sec,
      },
    );

  if (!parsed.ok) {
    return {
      ok: false,
      code:
        "creator_info_response_invalid",
    };
  }

  return {
    ok: true,
    value:
      parsed.value,
  };
}

async function loadTikTokCreatorAccessContext(
  input: Readonly<{
    organizationId: string;
    nowMs?: number;
  }>,
): Promise<
  | Readonly<{
      ok: true;
      value: Readonly<{
        accessToken: string;
      }>;
    }>
  | Readonly<{
      ok: false;
      code: TikTokCreatorInfoServerErrorCode;
    }>
> {
  const organizationId =
    nonEmptyString(
      input.organizationId,
    );

  if (!organizationId) {
    return {
      ok: false,
      code:
        "connection_unavailable",
    };
  }

  let admin;

  try {
    admin =
      createAdminClient();
  } catch {
    return {
      ok: false,
      code:
        "credential_unavailable",
    };
  }

  const {
    data: connections,
    error: connectionError,
  } =
    await admin
      .from(
        "publishing_provider_connections",
      )
      .select(
        "id,external_account_id,credential_reference_id,granted_scopes,authorization_status,revoked_at",
      )
      .eq(
        "organization_id",
        organizationId,
      )
      .eq(
        "provider",
        "tiktok",
      )
      .eq(
        "authorization_status",
        "authorized",
      )
      .is(
        "revoked_at",
        null,
      )
      .limit(
        2,
      );

  if (
    connectionError ||
    !Array.isArray(connections)
  ) {
    return {
      ok: false,
      code:
        "credential_unavailable",
    };
  }

  if (connections.length === 0) {
    return {
      ok: false,
      code:
        "connection_unavailable",
    };
  }

  if (connections.length !== 1) {
    return {
      ok: false,
      code:
        "connection_ambiguous",
    };
  }

  const connection =
    connections[0] as
      Record<string, unknown>;

  const connectionId =
    nonEmptyString(
      connection.id,
    );

  const externalAccountId =
    nonEmptyString(
      connection.external_account_id,
    );

  const credentialReferenceId =
    nonEmptyString(
      connection.credential_reference_id,
    );

  const grantedScopes =
    stringArray(
      connection.granted_scopes,
    );

  if (
    !connectionId ||
    !externalAccountId ||
    !credentialReferenceId ||
    !grantedScopes
  ) {
    return {
      ok: false,
      code:
        "credential_invalid",
    };
  }

  if (
    !grantedScopes.includes(
      TIKTOK_CREATOR_REQUIRED_SCOPE,
    )
  ) {
    return {
      ok: false,
      code:
        "scope_missing",
    };
  }

  const {
    data: credential,
    error: credentialError,
  } =
    await admin
      .from(
        "publishing_provider_credentials",
      )
      .select(
        "id,connection_id,access_token_ciphertext,access_token_expires_at,encryption_key_version",
      )
      .eq(
        "id",
        credentialReferenceId,
      )
      .eq(
        "connection_id",
        connectionId,
      )
      .maybeSingle();

  if (
    credentialError ||
    !credential ||
    !isRecord(credential)
  ) {
    return {
      ok: false,
      code:
        "credential_unavailable",
    };
  }

  const ciphertext =
    nonEmptyString(
      credential.access_token_ciphertext,
    );

  const keyVersion =
    nonEmptyString(
      credential.encryption_key_version,
    );

  const accessTokenExpiresAt =
    nonEmptyString(
      credential.access_token_expires_at,
    );

  if (
    !ciphertext ||
    !keyVersion ||
    !accessTokenExpiresAt
  ) {
    return {
      ok: false,
      code:
        "credential_invalid",
    };
  }

  const expiresAtMs =
    Date.parse(
      accessTokenExpiresAt,
    );

  const nowMs =
    input.nowMs ??
    Date.now();

  if (
    Number.isNaN(expiresAtMs) ||
    !Number.isFinite(nowMs) ||
    nowMs < 0
  ) {
    return {
      ok: false,
      code:
        "credential_invalid",
    };
  }

  if (expiresAtMs <= nowMs) {
    return {
      ok: false,
      code:
        "access_token_expired",
    };
  }

  const keyring =
    parsePublishingProviderTokenKeyring(
      process.env
        .PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS ??
        "",
      process.env
        .PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_ACTIVE_VERSION ??
        "",
    );

  if (!keyring) {
    return {
      ok: false,
      code:
        "token_keyring_unavailable",
    };
  }

  const accessToken =
    await decryptPublishingProviderToken(
      {
        ciphertext,
        organizationId,
        externalAccountId,
        tokenKind:
          "access",
        keyVersion,
        keyring,
      },
    );

  if (!accessToken) {
    return {
      ok: false,
      code:
        "token_decryption_failed",
    };
  }

  return {
    ok: true,
    value: {
      accessToken,
    },
  };
}

export async function getTikTokCreatorInfoForOrganization(
  input: Readonly<{
    organizationId: string;
    nowMs?: number;
  }>,
  fetchImpl: typeof fetch = fetch,
): Promise<TikTokCreatorInfoServerResult> {
  const accessContext =
    await loadTikTokCreatorAccessContext(
      input,
    );

  if (!accessContext.ok) {
    return accessContext;
  }

  return queryTikTokCreatorInfo(
    {
      accessToken:
        accessContext.value.accessToken,
      nowMs:
        input.nowMs,
    },
    fetchImpl,
  );
}