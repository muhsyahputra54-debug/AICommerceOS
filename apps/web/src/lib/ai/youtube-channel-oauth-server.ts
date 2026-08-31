import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import {
  parsePublishingProviderTokenKeyring,
  type PublishingProviderTokenKeyring,
} from "./tiktok-creator-oauth-server";

import {
  YOUTUBE_ENDPOINTS,
  YOUTUBE_REQUIRED_SCOPES,
} from "./youtube-channel";

export const YOUTUBE_OAUTH_COOKIE_NAME =
  "lakuvo_publishing_youtube_oauth";

export const YOUTUBE_OAUTH_RETURN_TO =
  "/growth";

export const YOUTUBE_OAUTH_TTL_SECONDS =
  600;

const YOUTUBE_OAUTH_STATE_VERSION =
  1;

type YouTubeOAuthStatePayload =
  Readonly<{
    version: 1;
    state: string;
    initiatingUserId: string;
    organizationId: string;
    provider: "youtube";
    issuedAt: number;
    expiresAt: number;
    returnTo: "/growth";
  }>;

export type IssuedYouTubeOAuthState =
  Readonly<{
    state: string;
    cookieValue: string;
    expiresAt: number;
  }>;

export type YouTubeOAuthStateValidationResult =
  | Readonly<{
      ok: true;
      value: YouTubeOAuthStatePayload;
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

export type YouTubeOAuthTokenResponse =
  Readonly<{
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    accessTokenExpiresInSeconds: number;
    grantedScopes: readonly string[];
  }>;

export type YouTubeOAuthTokenValidationResult =
  | Readonly<{
      ok: true;
      value: YouTubeOAuthTokenResponse;
    }>
  | Readonly<{
      ok: false;
      code:
        | "token_response_invalid"
        | "required_scope_missing"
        | "unexpected_scope_granted";
    }>;

export type YouTubeOAuthConfig =
  Readonly<{
    clientId: string;
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

  try {
    return Buffer.from(
      value,
      "base64url",
    );
  } catch {
    return null;
  }
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

function parseStatePayload(
  value: unknown,
): YouTubeOAuthStatePayload | null {
  if (!isRecord(value)) {
    return null;
  }

  const exactKeys = [
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
      YOUTUBE_OAUTH_STATE_VERSION ||
    !isNonEmptyString(value.state) ||
    !isNonEmptyString(
      value.initiatingUserId,
    ) ||
    !isNonEmptyString(
      value.organizationId,
    ) ||
    value.provider !== "youtube" ||
    typeof value.issuedAt !==
      "number" ||
    !Number.isFinite(
      value.issuedAt,
    ) ||
    typeof value.expiresAt !==
      "number" ||
    !Number.isFinite(
      value.expiresAt,
    ) ||
    value.expiresAt <=
      value.issuedAt ||
    value.returnTo !==
      YOUTUBE_OAUTH_RETURN_TO
  ) {
    return null;
  }

  return {
    version: 1,
    state:
      value.state,
    initiatingUserId:
      value.initiatingUserId,
    organizationId:
      value.organizationId,
    provider:
      "youtube",
    issuedAt:
      value.issuedAt,
    expiresAt:
      value.expiresAt,
    returnTo:
      YOUTUBE_OAUTH_RETURN_TO,
  };
}

function normalizeScopes(
  value: unknown,
): readonly string[] | null {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const scopes =
    value
      .split(/\s+/)
      .map((item) =>
        item.trim(),
      )
      .filter(Boolean);

  if (scopes.length === 0) {
    return null;
  }

  return [
    ...new Set(scopes),
  ].sort();
}

export function buildYouTubeAuthorizeUrl(
  input: Readonly<{
    clientId: string;
    redirectUri: string;
    state: string;
  }>,
): string | null {
  if (
    !isNonEmptyString(
      input.clientId,
    ) ||
    !isNonEmptyString(
      input.redirectUri,
    ) ||
    !isNonEmptyString(
      input.state,
    )
  ) {
    return null;
  }

  let redirectUrl: URL;

  try {
    redirectUrl =
      new URL(
        input.redirectUri,
      );
  } catch {
    return null;
  }

  if (
    redirectUrl.protocol !==
      "https:" &&
    redirectUrl.hostname !==
      "localhost"
  ) {
    return null;
  }

  const authorizeUrl =
    new URL(
      YOUTUBE_ENDPOINTS.authorize,
    );

  authorizeUrl.searchParams.set(
    "client_id",
    input.clientId.trim(),
  );

  authorizeUrl.searchParams.set(
    "redirect_uri",
    redirectUrl.toString(),
  );

  authorizeUrl.searchParams.set(
    "response_type",
    "code",
  );

  authorizeUrl.searchParams.set(
    "scope",
    YOUTUBE_REQUIRED_SCOPES.join(
      " ",
    ),
  );

  authorizeUrl.searchParams.set(
    "access_type",
    "offline",
  );

  authorizeUrl.searchParams.set(
    "prompt",
    "consent",
  );

  authorizeUrl.searchParams.set(
    "state",
    input.state.trim(),
  );

  return authorizeUrl.toString();
}

export function issueYouTubeOAuthState(
  input: Readonly<{
    initiatingUserId: string;
    organizationId: string;
    secret: string;
    nowMs?: number;
  }>,
): IssuedYouTubeOAuthState | null {
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
    YOUTUBE_OAUTH_TTL_SECONDS;

  const payload:
    YouTubeOAuthStatePayload = {
    version: 1,
    state,
    initiatingUserId:
      input.initiatingUserId.trim(),
    organizationId:
      input.organizationId.trim(),
    provider:
      "youtube",
    issuedAt,
    expiresAt,
    returnTo:
      YOUTUBE_OAUTH_RETURN_TO,
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

export function validateYouTubeOAuthState(
  input: Readonly<{
    cookieValue: string;
    returnedState: string;
    currentUserId: string;
    currentOrganizationId: string;
    secret: string;
    nowMs?: number;
  }>,
): YouTubeOAuthStateValidationResult {
  const secret =
    parseOAuthStateSecret(
      input.secret,
    );

  if (!secret) {
    return {
      ok: false,
      code:
        "state_cookie_invalid",
    };
  }

  const parts =
    input.cookieValue.split(
      ".",
    );

  if (parts.length !== 2) {
    return {
      ok: false,
      code:
        "state_cookie_invalid",
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
      code:
        "state_cookie_invalid",
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
      code:
        "state_signature_invalid",
    };
  }

  const payloadBuffer =
    fromBase64Url(
      encodedPayload,
    );

  if (!payloadBuffer) {
    return {
      ok: false,
      code:
        "state_payload_invalid",
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
      code:
        "state_payload_invalid",
    };
  }

  const payload =
    parseStatePayload(
      rawPayload,
    );

  if (!payload) {
    return {
      ok: false,
      code:
        "state_payload_invalid",
    };
  }

  const nowSeconds =
    Math.floor(
      (
        input.nowMs ??
        Date.now()
      ) / 1000,
    );

  if (
    !Number.isFinite(
      nowSeconds,
    ) ||
    nowSeconds >
      payload.expiresAt
  ) {
    return {
      ok: false,
      code:
        "state_expired",
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
      code:
        "state_mismatch",
    };
  }

  if (
    payload.initiatingUserId !==
    input.currentUserId
  ) {
    return {
      ok: false,
      code:
        "state_user_mismatch",
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
    value:
      payload,
  };
}

export function parseYouTubeOAuthTokenResponse(
  value: unknown,
): YouTubeOAuthTokenValidationResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      code:
        "token_response_invalid",
    };
  }

  if (
    !isNonEmptyString(
      value.access_token,
    ) ||
    !isNonEmptyString(
      value.refresh_token,
    ) ||
    !isNonEmptyString(
      value.token_type,
    ) ||
    value.token_type
      .trim()
      .toLowerCase() !==
      "bearer" ||
    !isPositiveInteger(
      value.expires_in,
    )
  ) {
    return {
      ok: false,
      code:
        "token_response_invalid",
    };
  }

  const grantedScopes =
    normalizeScopes(
      value.scope,
    );

  if (!grantedScopes) {
    return {
      ok: false,
      code:
        "token_response_invalid",
    };
  }

  const requiredScopeSet =
    new Set<string>(
      YOUTUBE_REQUIRED_SCOPES,
    );

  if (
    !YOUTUBE_REQUIRED_SCOPES.every(
      (scope) =>
        grantedScopes.includes(
          scope,
        ),
    )
  ) {
    return {
      ok: false,
      code:
        "required_scope_missing",
    };
  }

  if (
    grantedScopes.some(
      (scope) =>
        !requiredScopeSet.has(
          scope,
        ),
    )
  ) {
    return {
      ok: false,
      code:
        "unexpected_scope_granted",
    };
  }

  return {
    ok: true,
    value: {
      accessToken:
        value.access_token.trim(),
      refreshToken:
        value.refresh_token.trim(),
      tokenType:
        "Bearer",
      accessTokenExpiresInSeconds:
        value.expires_in,
      grantedScopes,
    },
  };
}

export function resolveYouTubeOAuthConfig(
  env: Readonly<
    Record<
      string,
      string | undefined
    >
  >,
): YouTubeOAuthConfig | null {
  const clientId =
    env.YOUTUBE_OAUTH_CLIENT_ID;

  const clientSecret =
    env.YOUTUBE_OAUTH_CLIENT_SECRET;

  const redirectUri =
    env.YOUTUBE_OAUTH_REDIRECT_URI;

  const oauthStateSecret =
    env.PUBLISHING_PROVIDER_OAUTH_STATE_SECRET;

  const keyringRaw =
    env.PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS;

  const activeVersion =
    env.PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_ACTIVE_VERSION;

  if (
    !isNonEmptyString(
      clientId,
    ) ||
    !isNonEmptyString(
      clientSecret,
    ) ||
    !isNonEmptyString(
      redirectUri,
    ) ||
    !isNonEmptyString(
      oauthStateSecret,
    ) ||
    !isNonEmptyString(
      keyringRaw,
    ) ||
    !isNonEmptyString(
      activeVersion,
    )
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
    parsedRedirectUri.protocol !==
      "https:" &&
    parsedRedirectUri.hostname !==
      "localhost"
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
    clientId:
      clientId.trim(),
    clientSecret:
      clientSecret.trim(),
    redirectUri:
      parsedRedirectUri.toString(),
    oauthStateSecret:
      oauthStateSecret.trim(),
    tokenKeyring,
  };
}
