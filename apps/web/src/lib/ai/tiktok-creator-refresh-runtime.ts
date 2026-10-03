import {
  encryptPublishingProviderToken,
  parseTikTokCreatorTokenResponse,
  type PublishingProviderTokenKeyring,
  type TikTokCreatorTokenResponse,
} from "./tiktok-creator-oauth-server";
import { TIKTOK_CREATOR_ENDPOINTS } from "./tiktok-creator-publishing";

export type TikTokRefreshError =
  | "refresh_request_invalid"
  | "refresh_request_ambiguous"
  | "refresh_response_invalid"
  | "refresh_rejected"
  | "reauthorization_required"
  | "creator_identity_mismatch"
  | "required_scope_missing";

const nonEmpty = (value: string) => value.trim().length > 0;

// Deliberately requires an injected transport. No route invokes this foundation.
export async function exchangeTikTokCreatorRefreshToken(
  input: Readonly<{
    clientKey: string;
    clientSecret: string;
    refreshToken: string;
    externalAccountId: string;
  }>,
  fetchImpl: typeof fetch,
): Promise<
  | Readonly<{ ok: true; value: TikTokCreatorTokenResponse }>
  | Readonly<{ ok: false; code: TikTokRefreshError }>
> {
  if (!Object.values(input).every(nonEmpty)) {
    return { ok: false, code: "refresh_request_invalid" };
  }
  let response: Response;
  try {
    response = await fetchImpl(TIKTOK_CREATOR_ENDPOINTS.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_key: input.clientKey.trim(),
        client_secret: input.clientSecret.trim(),
        refresh_token: input.refreshToken.trim(),
        grant_type: "refresh_token",
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    // A lost response may have consumed/rotated the refresh token. Never retry here.
    return { ok: false, code: "refresh_request_ambiguous" };
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, code: "refresh_response_invalid" };
  }
  const error = typeof payload === "object" && payload !== null && "error" in payload
    ? payload.error : undefined;
  if (!response.ok || error) {
    // Do not turn rate limits, server errors, or app configuration errors into revocation.
    if (response.status === 400 && error === "invalid_grant") {
      return { ok: false, code: "reauthorization_required" };
    }
    return { ok: false, code: "refresh_rejected" };
  }
  const parsed = parseTikTokCreatorTokenResponse(payload);
  if (!parsed.ok) {
    return { ok: false, code: parsed.code === "required_scope_missing"
      ? "required_scope_missing" : "refresh_response_invalid" };
  }
  if (parsed.value.openId !== input.externalAccountId.trim()) {
    return { ok: false, code: "creator_identity_mismatch" };
  }
  return parsed;
}

export type TikTokRefreshRotation = Readonly<{
  accessTokenCiphertext: string;
  refreshTokenCiphertext: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  encryptionKeyVersion: string;
  grantedScopes: readonly string[];
}>;

export function prepareTikTokCreatorTokenRotation(input: Readonly<{
  organizationId: string;
  externalAccountId: string;
  token: TikTokCreatorTokenResponse;
  keyring: PublishingProviderTokenKeyring;
  nowMs: number;
}>):
  | Readonly<{ ok: true; value: TikTokRefreshRotation }>
  | Readonly<{ ok: false; code: "credential_encryption_failed" }> {
  const failed = { ok: false, code: "credential_encryption_failed" } as const;
  const keyVersion = input.keyring.activeVersion;
  const key = input.keyring.keys.get(keyVersion);
  const { token, nowMs } = input;
  const validDuration = (seconds: number) => Number.isSafeInteger(seconds) && seconds > 0;
  const accessExpiry = nowMs + token.accessTokenExpiresInSeconds * 1000;
  const refreshExpiry = nowMs + token.refreshTokenExpiresInSeconds * 1000;
  if (!nonEmpty(input.organizationId) || !nonEmpty(input.externalAccountId) ||
      token.openId !== input.externalAccountId.trim() || !key || key.length !== 32 ||
      !nonEmpty(keyVersion) || !Number.isSafeInteger(nowMs) || nowMs < 0 ||
      !validDuration(token.accessTokenExpiresInSeconds) ||
      !validDuration(token.refreshTokenExpiresInSeconds) ||
      Number.isNaN(new Date(accessExpiry).getTime()) ||
      Number.isNaN(new Date(refreshExpiry).getTime()) ||
      token.tokenType !== "Bearer" || !token.grantedScopes.includes("video.publish")) return failed;
  const encrypt = (plaintext: string, tokenKind: "access" | "refresh") =>
    encryptPublishingProviderToken({
      plaintext, provider: "tiktok", organizationId: input.organizationId.trim(),
      externalAccountId: input.externalAccountId.trim(), tokenKind, keyVersion, key,
    });
  const accessTokenCiphertext = encrypt(token.accessToken, "access");
  const refreshTokenCiphertext = encrypt(token.refreshToken, "refresh");
  if (!accessTokenCiphertext || !refreshTokenCiphertext) return failed;
  return { ok: true, value: {
    accessTokenCiphertext, refreshTokenCiphertext,
    accessTokenExpiresAt: new Date(accessExpiry).toISOString(),
    refreshTokenExpiresAt: new Date(refreshExpiry).toISOString(),
    encryptionKeyVersion: keyVersion, grantedScopes: [...token.grantedScopes],
  } };
}
