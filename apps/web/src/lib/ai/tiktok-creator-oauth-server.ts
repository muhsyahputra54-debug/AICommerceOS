import {
  createCipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const TIKTOK_CREATOR_AUTHORIZE_ENDPOINT =
  "https://www.tiktok.com/v2/auth/authorize/";

export const TIKTOK_CREATOR_TOKEN_ENDPOINT =
  "https://open.tiktokapis.com/v2/oauth/token/";

export const TIKTOK_CREATOR_REQUIRED_SCOPE =
  "video.publish";

export const TIKTOK_CREATOR_REQUESTED_SCOPES =
  [
    "user.info.basic",
    TIKTOK_CREATOR_REQUIRED_SCOPE,
  ] as const;

export const TIKTOK_CREATOR_OAUTH_COOKIE_NAME =
  "lakuvo_publishing_tiktok_oauth";

export const TIKTOK_CREATOR_OAUTH_RETURN_TO =
  "/growth";

export const TIKTOK_CREATOR_OAUTH_TTL_SECONDS =
  600;

const TIKTOK_CREATOR_OAUTH_STATE_VERSION =
  1;

const PROVIDER_TOKEN_ENVELOPE_VERSION =
  "ppc1";

const PROVIDER_TOKEN_ALGORITHM =
  "aes-256-gcm";

const PROVIDER_TOKEN_IV_BYTES =
  12;

const PROVIDER_TOKEN_TAG_BYTES =
  16;

type TikTokCreatorOAuthStatePayload = Readonly<{
  version: 1;
  state: string;
  initiatingUserId: string;
  organizationId: string;
  provider: "tiktok";
  issuedAt: number;
  expiresAt: number;
  returnTo: "/growth";
}>;

export type IssuedTikTokCreatorOAuthState =
  Readonly<{
    state: string;
    cookieValue: string;
    expiresAt: number;
  }>;

export type TikTokCreatorOAuthStateValidationInput =
  Readonly<{
    cookieValue: string;
    returnedState: string;
    currentUserId: string;
    currentOrganizationId: string;
    secret: string;
    nowMs?: number;
  }>;

export type TikTokCreatorOAuthStateValidationResult =
  | Readonly<{
      ok: true;
      value: TikTokCreatorOAuthStatePayload;
    }>
  | Readonly<{
      ok: false;
      code:
        | "state_cookie_invalid"
        | "state_signature_invalid"
        | "state_payload_invalid"
        | "state_expired"
        | "state_mismatch"
        | "state_user_mismatch"
        | "state_organization_mismatch";
    }>;

export type TikTokCreatorTokenResponse =
  Readonly<{
    openId: string;
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    accessTokenExpiresInSeconds: number;
    refreshTokenExpiresInSeconds: number;
    grantedScopes: readonly string[];
  }>;

export type TikTokCreatorTokenResponseValidationResult =
  | Readonly<{
      ok: true;
      value: TikTokCreatorTokenResponse;
    }>
  | Readonly<{
      ok: false;
      code:
        | "token_response_invalid"
        | "required_scope_missing";
    }>;

export type PublishingProviderTokenKeyring =
  Readonly<{
    activeVersion: string;
    keys: ReadonlyMap<string, Buffer>;
  }>;

export type PublishingProviderTokenEncryptionInput =
  Readonly<{
    plaintext: string;
    provider: "tiktok";
    organizationId: string;
    externalAccountId: string;
    tokenKind: "access" | "refresh";
    keyVersion: string;
    key: Buffer;
  }>;

export type TikTokCreatorOAuthConfig =
  Readonly<{
    clientKey: string;
    clientSecret: string;
    redirectUri: string;
    oauthStateSecret: string;
    tokenKeyring: PublishingProviderTokenKeyring;
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
    Number.isInteger(value) &&
    value > 0
  );
}

function toBase64Url(
  value: Buffer,
): string {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(
  value: string,
): Buffer | null {
  if (
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    return null;
  }

  const normalized =
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const remainder =
    normalized.length % 4;

  const padded =
    remainder === 0
      ? normalized
      : normalized +
        "=".repeat(4 - remainder);

  try {
    return Buffer.from(
      padded,
      "base64",
    );
  } catch {
    return null;
  }
}

function decodeKeyMaterial(
  value: string,
): Buffer | null {
  const trimmed =
    value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const normalized =
    trimmed
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const remainder =
    normalized.length % 4;

  const padded =
    remainder === 0
      ? normalized
      : normalized +
        "=".repeat(4 - remainder);

  try {
    const decoded =
      Buffer.from(
        padded,
        "base64",
      );

    return decoded.length > 0
      ? decoded
      : null;
  } catch {
    return null;
  }
}

function parseOAuthStateSecret(
  value: string,
): Buffer | null {
  const decoded =
    decodeKeyMaterial(value);

  if (
    !decoded ||
    decoded.length < 32
  ) {
    return null;
  }

  return decoded;
}

function normalizeScopes(
  value: unknown,
): readonly string[] | null {
  let items: string[];

  if (typeof value === "string") {
    items =
      value
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean);
  } else if (
    Array.isArray(value) &&
    value.every(isNonEmptyString)
  ) {
    items =
      value.map((item) =>
        item.trim(),
      );
  } else {
    return null;
  }

  return [
    ...new Set(items),
  ].sort();
}

function parseStatePayload(
  value: unknown,
): TikTokCreatorOAuthStatePayload | null {
  if (!isRecord(value)) {
    return null;
  }

  const exactKeys =
    [
      "version",
      "state",
      "initiatingUserId",
      "organizationId",
      "provider",
      "issuedAt",
      "expiresAt",
      "returnTo",
    ];

  const keys =
    Object.keys(value);

  if (
    keys.length !== exactKeys.length ||
    !keys.every((key) =>
      exactKeys.includes(key),
    )
  ) {
    return null;
  }

  if (
    value.version !==
      TIKTOK_CREATOR_OAUTH_STATE_VERSION ||
    !isNonEmptyString(value.state) ||
    !isNonEmptyString(
      value.initiatingUserId,
    ) ||
    !isNonEmptyString(
      value.organizationId,
    ) ||
    value.provider !== "tiktok" ||
    typeof value.issuedAt !== "number" ||
    !Number.isFinite(value.issuedAt) ||
    typeof value.expiresAt !== "number" ||
    !Number.isFinite(value.expiresAt) ||
    value.expiresAt <= value.issuedAt ||
    value.returnTo !==
      TIKTOK_CREATOR_OAUTH_RETURN_TO
  ) {
    return null;
  }

  return {
    version: 1,
    state: value.state,
    initiatingUserId:
      value.initiatingUserId,
    organizationId:
      value.organizationId,
    provider: "tiktok",
    issuedAt: value.issuedAt,
    expiresAt: value.expiresAt,
    returnTo:
      TIKTOK_CREATOR_OAUTH_RETURN_TO,
  };
}

function safeEqualText(
  left: string,
  right: string,
): boolean {
  const leftBuffer =
    Buffer.from(
      left,
      "utf8",
    );

  const rightBuffer =
    Buffer.from(
      right,
      "utf8",
    );

  if (
    leftBuffer.length !==
    rightBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    leftBuffer,
    rightBuffer,
  );
}

export function buildTikTokCreatorAuthorizeUrl(
  input: Readonly<{
    clientKey: string;
    redirectUri: string;
    state: string;
  }>,
): string | null {
  if (
    !isNonEmptyString(input.clientKey) ||
    !isNonEmptyString(input.redirectUri) ||
    !isNonEmptyString(input.state)
  ) {
    return null;
  }

  let redirectUrl: URL;

  try {
    redirectUrl =
      new URL(input.redirectUri);
  } catch {
    return null;
  }

  if (
    redirectUrl.protocol !== "https:" &&
    redirectUrl.hostname !== "localhost"
  ) {
    return null;
  }

  const authorizeUrl =
    new URL(
      TIKTOK_CREATOR_AUTHORIZE_ENDPOINT,
    );

  authorizeUrl.searchParams.set(
    "client_key",
    input.clientKey.trim(),
  );

  authorizeUrl.searchParams.set(
    "scope",
    TIKTOK_CREATOR_REQUESTED_SCOPES.join(
      ",",
    ),
  );

  authorizeUrl.searchParams.set(
    "response_type",
    "code",
  );

  authorizeUrl.searchParams.set(
    "redirect_uri",
    redirectUrl.toString(),
  );

  authorizeUrl.searchParams.set(
    "state",
    input.state.trim(),
  );

  return authorizeUrl.toString();
}

export function issueTikTokCreatorOAuthState(
  input: Readonly<{
    initiatingUserId: string;
    organizationId: string;
    secret: string;
    nowMs?: number;
  }>,
): IssuedTikTokCreatorOAuthState | null {
  if (
    !isNonEmptyString(
      input.initiatingUserId,
    ) ||
    !isNonEmptyString(
      input.organizationId,
    )
  ) {
    return null;
  }

  const secret =
    parseOAuthStateSecret(
      input.secret,
    );

  if (!secret) {
    return null;
  }

  const nowMs =
    input.nowMs ??
    Date.now();

  if (
    !Number.isFinite(nowMs) ||
    nowMs < 0
  ) {
    return null;
  }

  const state =
    toBase64Url(
      randomBytes(32),
    );

  const issuedAt =
    Math.floor(
      nowMs / 1000,
    );

  const expiresAt =
    issuedAt +
    TIKTOK_CREATOR_OAUTH_TTL_SECONDS;

  const payload:
    TikTokCreatorOAuthStatePayload = {
      version: 1,
      state,
      initiatingUserId:
        input.initiatingUserId.trim(),
      organizationId:
        input.organizationId.trim(),
      provider: "tiktok",
      issuedAt,
      expiresAt,
      returnTo:
        TIKTOK_CREATOR_OAUTH_RETURN_TO,
    };

  const encodedPayload =
    toBase64Url(
      Buffer.from(
        JSON.stringify(payload),
        "utf8",
      ),
    );

  const signature =
    createHmac(
      "sha256",
      secret,
    )
      .update(
        encodedPayload,
        "utf8",
      )
      .digest();

  return {
    state,
    cookieValue:
      `${encodedPayload}.${toBase64Url(
        signature,
      )}`,
    expiresAt,
  };
}

export function validateTikTokCreatorOAuthState(
  input: TikTokCreatorOAuthStateValidationInput,
): TikTokCreatorOAuthStateValidationResult {
  const secret =
    parseOAuthStateSecret(
      input.secret,
    );

  if (!secret) {
    return {
      ok: false,
      code: "state_cookie_invalid",
    };
  }

  const parts =
    input.cookieValue.split(
      ".",
    );

  if (parts.length !== 2) {
    return {
      ok: false,
      code: "state_cookie_invalid",
    };
  }

  const [
    encodedPayload,
    encodedSignature,
  ] =
    parts;

  const suppliedSignature =
    fromBase64Url(
      encodedSignature,
    );

  if (!suppliedSignature) {
    return {
      ok: false,
      code: "state_cookie_invalid",
    };
  }

  const expectedSignature =
    createHmac(
      "sha256",
      secret,
    )
      .update(
        encodedPayload,
        "utf8",
      )
      .digest();

  if (
    suppliedSignature.length !==
      expectedSignature.length ||
    !timingSafeEqual(
      suppliedSignature,
      expectedSignature,
    )
  ) {
    return {
      ok: false,
      code: "state_signature_invalid",
    };
  }

  const payloadBuffer =
    fromBase64Url(
      encodedPayload,
    );

  if (!payloadBuffer) {
    return {
      ok: false,
      code: "state_payload_invalid",
    };
  }

  let rawPayload: unknown;

  try {
    rawPayload =
      JSON.parse(
        payloadBuffer.toString(
          "utf8",
        ),
      );
  } catch {
    return {
      ok: false,
      code: "state_payload_invalid",
    };
  }

  const payload =
    parseStatePayload(
      rawPayload,
    );

  if (!payload) {
    return {
      ok: false,
      code: "state_payload_invalid",
    };
  }

  const nowMs =
    input.nowMs ??
    Date.now();

  const nowSeconds =
    Math.floor(
      nowMs / 1000,
    );

  if (
    !Number.isFinite(nowSeconds) ||
    nowSeconds >
      payload.expiresAt
  ) {
    return {
      ok: false,
      code: "state_expired",
    };
  }

  if (
    !safeEqualText(
      payload.state,
      input.returnedState,
    )
  ) {
    return {
      ok: false,
      code: "state_mismatch",
    };
  }

  if (
    payload.initiatingUserId !==
    input.currentUserId
  ) {
    return {
      ok: false,
      code: "state_user_mismatch",
    };
  }

  if (
    payload.organizationId !==
    input.currentOrganizationId
  ) {
    return {
      ok: false,
      code:
        "state_organization_mismatch",
    };
  }

  return {
    ok: true,
    value: payload,
  };
}

export function parseTikTokCreatorTokenResponse(
  value: unknown,
): TikTokCreatorTokenResponseValidationResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      code: "token_response_invalid",
    };
  }

  if (
    !isNonEmptyString(value.open_id) ||
    !isNonEmptyString(
      value.access_token,
    ) ||
    !isNonEmptyString(
      value.refresh_token,
    ) ||
    !isNonEmptyString(
      value.token_type,
    ) ||
    value.token_type.toLowerCase() !==
      "bearer" ||
    !isPositiveInteger(
      value.expires_in,
    ) ||
    !isPositiveInteger(
      value.refresh_expires_in,
    )
  ) {
    return {
      ok: false,
      code: "token_response_invalid",
    };
  }

  const grantedScopes =
    normalizeScopes(
      value.scope,
    );

  if (!grantedScopes) {
    return {
      ok: false,
      code: "token_response_invalid",
    };
  }

  if (
    !grantedScopes.includes(
      TIKTOK_CREATOR_REQUIRED_SCOPE,
    )
  ) {
    return {
      ok: false,
      code: "required_scope_missing",
    };
  }

  return {
    ok: true,
    value: {
      openId:
        value.open_id.trim(),
      accessToken:
        value.access_token.trim(),
      refreshToken:
        value.refresh_token.trim(),
      tokenType: "Bearer",
      accessTokenExpiresInSeconds:
        value.expires_in,
      refreshTokenExpiresInSeconds:
        value.refresh_expires_in,
      grantedScopes,
    },
  };
}

export function parsePublishingProviderTokenKeyring(
  rawKeyring: string,
  activeVersion: string,
): PublishingProviderTokenKeyring | null {
  if (
    !isNonEmptyString(rawKeyring) ||
    !isNonEmptyString(activeVersion)
  ) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(rawKeyring);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const keys =
    new Map<string, Buffer>();

  for (
    const [
      version,
      encodedKey,
    ] of Object.entries(parsed)
  ) {
    if (
      !isNonEmptyString(version) ||
      !isNonEmptyString(encodedKey)
    ) {
      return null;
    }

    const key =
      decodeKeyMaterial(
        encodedKey,
      );

    if (
      !key ||
      key.length !== 32
    ) {
      return null;
    }

    keys.set(
      version.trim(),
      key,
    );
  }

  const normalizedActiveVersion =
    activeVersion.trim();

  if (
    keys.size === 0 ||
    !keys.has(
      normalizedActiveVersion,
    )
  ) {
    return null;
  }

  return {
    activeVersion:
      normalizedActiveVersion,
    keys,
  };
}

export function encryptPublishingProviderToken(
  input: PublishingProviderTokenEncryptionInput,
): string | null {
  if (
    !isNonEmptyString(
      input.plaintext,
    ) ||
    !isNonEmptyString(
      input.organizationId,
    ) ||
    !isNonEmptyString(
      input.externalAccountId,
    ) ||
    !isNonEmptyString(
      input.keyVersion,
    ) ||
    input.key.length !== 32
  ) {
    return null;
  }

  const iv =
    randomBytes(
      PROVIDER_TOKEN_IV_BYTES,
    );

  const aad =
    Buffer.from(
      [
        "provider=tiktok",
        `organizationId=${input.organizationId.trim()}`,
        `externalAccountId=${input.externalAccountId.trim()}`,
        `tokenKind=${input.tokenKind}`,
        `keyVersion=${input.keyVersion.trim()}`,
      ].join("\n"),
      "utf8",
    );

  const cipher =
    createCipheriv(
      PROVIDER_TOKEN_ALGORITHM,
      input.key,
      iv,
      {
        authTagLength:
          PROVIDER_TOKEN_TAG_BYTES,
      },
    );

  cipher.setAAD(
    aad,
  );

  const ciphertext =
    Buffer.concat([
      cipher.update(
        input.plaintext,
        "utf8",
      ),
      cipher.final(),
    ]);

  const tag =
    cipher.getAuthTag();

  return [
    PROVIDER_TOKEN_ENVELOPE_VERSION,
    input.keyVersion.trim(),
    toBase64Url(iv),
    toBase64Url(ciphertext),
    toBase64Url(tag),
  ].join(".");
}

export async function decryptPublishingProviderToken(
  input: Readonly<{
    ciphertext: string;
    organizationId: string;
    externalAccountId: string;
    tokenKind: "access" | "refresh";
    keyVersion: string;
    keyring: PublishingProviderTokenKeyring;
  }>,
): Promise<string | null> {
  if (
    !isNonEmptyString(input.ciphertext) ||
    !isNonEmptyString(input.organizationId) ||
    !isNonEmptyString(input.externalAccountId) ||
    !isNonEmptyString(input.keyVersion)
  ) {
    return null;
  }

  const envelope =
    input.ciphertext.trim().split(".");

  if (envelope.length !== 5) {
    return null;
  }

  const [
    envelopeVersion,
    keyVersion,
    encodedIv,
    encodedCiphertext,
    encodedTag,
  ] = envelope;

  if (
    envelopeVersion !==
      PROVIDER_TOKEN_ENVELOPE_VERSION ||
    keyVersion !== input.keyVersion.trim()
  ) {
    return null;
  }

  const key =
    input.keyring.keys.get(
      keyVersion,
    );

  if (
    !key ||
    key.length !== 32
  ) {
    return null;
  }

  function decodeEnvelopePart(
    value: string,
  ): Buffer | null {
    if (
      value.length === 0 ||
      !/^[A-Za-z0-9_-]+$/.test(value)
    ) {
      return null;
    }

    try {
      return Buffer.from(
        value,
        "base64url",
      );
    } catch {
      return null;
    }
  }

  const iv =
    decodeEnvelopePart(
      encodedIv,
    );

  const ciphertext =
    decodeEnvelopePart(
      encodedCiphertext,
    );

  const tag =
    decodeEnvelopePart(
      encodedTag,
    );

  if (
    !iv ||
    !ciphertext ||
    !tag ||
    iv.length !== PROVIDER_TOKEN_IV_BYTES ||
    ciphertext.length === 0 ||
    tag.length !== PROVIDER_TOKEN_TAG_BYTES
  ) {
    return null;
  }

  const aad =
    Buffer.from(
      [
        "provider=tiktok",
        `organizationId=${input.organizationId.trim()}`,
        `externalAccountId=${input.externalAccountId.trim()}`,
        `tokenKind=${input.tokenKind}`,
        `keyVersion=${keyVersion}`,
      ].join("\n"),
      "utf8",
    );

  try {
    const {
      createDecipheriv,
    } =
      await import(
        "node:crypto"
      );

    const decipher =
      createDecipheriv(
        PROVIDER_TOKEN_ALGORITHM,
        key,
        iv,
        {
          authTagLength:
            PROVIDER_TOKEN_TAG_BYTES,
        },
      );

    decipher.setAAD(
      aad,
    );

    decipher.setAuthTag(
      tag,
    );

    const plaintext =
      Buffer.concat([
        decipher.update(
          ciphertext,
        ),
        decipher.final(),
      ]).toString("utf8");

    if (!isNonEmptyString(plaintext)) {
      return null;
    }

    return plaintext;
  } catch {
    return null;
  }
}

export function resolveTikTokCreatorOAuthConfig(
  env: Readonly<
    Record<
      string,
      string | undefined
    >
  >,
): TikTokCreatorOAuthConfig | null {
  const clientKey =
    env.TIKTOK_CREATOR_CLIENT_KEY;

  const clientSecret =
    env.TIKTOK_CREATOR_CLIENT_SECRET;

  const redirectUri =
    env.TIKTOK_CREATOR_REDIRECT_URI;

  const oauthStateSecret =
    env.PUBLISHING_PROVIDER_OAUTH_STATE_SECRET;

  const keyringRaw =
    env.PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS;

  const activeVersion =
    env.PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_ACTIVE_VERSION;

  if (
    !isNonEmptyString(clientKey) ||
    !isNonEmptyString(clientSecret) ||
    !isNonEmptyString(redirectUri) ||
    !isNonEmptyString(oauthStateSecret) ||
    !isNonEmptyString(keyringRaw) ||
    !isNonEmptyString(activeVersion)
  ) {
    return null;
  }

  let parsedRedirectUri: URL;

  try {
    parsedRedirectUri =
      new URL(
        redirectUri,
      );
  } catch {
    return null;
  }

  if (
    parsedRedirectUri.protocol !== "https:" &&
    parsedRedirectUri.hostname !== "localhost"
  ) {
    return null;
  }

  if (
    !parseOAuthStateSecret(
      oauthStateSecret,
    )
  ) {
    return null;
  }

  const tokenKeyring =
    parsePublishingProviderTokenKeyring(
      keyringRaw,
      activeVersion,
    );

  if (!tokenKeyring) {
    return null;
  }

  return {
    clientKey:
      clientKey.trim(),
    clientSecret:
      clientSecret.trim(),
    redirectUri:
      parsedRedirectUri.toString(),
    oauthStateSecret:
      oauthStateSecret.trim(),
    tokenKeyring,
  };
}