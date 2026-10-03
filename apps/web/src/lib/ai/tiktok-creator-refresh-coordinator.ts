import { decryptPublishingProviderToken, type PublishingProviderTokenKeyring } from "./tiktok-creator-oauth-server";
import { exchangeTikTokCreatorRefreshToken, prepareTikTokCreatorTokenRotation } from "./tiktok-creator-refresh-runtime";

// Server orchestration only. No default database/transport, route, scheduler or env reads.
export type TikTokRefreshRpc = (name: string, args: Record<string, unknown>) => Promise<{
  data: unknown;
  error: unknown;
}>;
export type TikTokRefreshCoordinatorResult =
  | { ok: true; connectionVersion: number; accessTokenExpiresAt: string }
  | { ok: false; code: "refresh_configuration_invalid" | "refresh_claim_unavailable" |
      "refresh_preparation_failed" | "refresh_dispatch_denied" | "refresh_recovery_required" |
      "reauthorization_required" };

const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const version = (value: unknown): number | null => {
  if (typeof value !== "number" && !(typeof value === "string" && /^[1-9][0-9]*$/.test(value))) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

export async function coordinateTikTokCreatorRefresh(
  input: Readonly<{
    organizationId: string;
    connectionId: string;
    expectedConnectionVersion: number;
    clientKey: string;
    clientSecret: string;
    keyring: PublishingProviderTokenKeyring;
  }>,
  dependencies: Readonly<{ rpc: TikTokRefreshRpc; fetchImpl: typeof fetch; now: () => number }>,
): Promise<TikTokRefreshCoordinatorResult> {
  const { rpc, fetchImpl } = dependencies;
  const now = () => { try { return dependencies.now(); } catch { return NaN; } };
  const clockValid = (n: number) => Number.isSafeInteger(n) && n >= 0 && !Number.isNaN(new Date(n).getTime());
  const key = input.keyring.keys.get(input.keyring.activeVersion);
  if (!uuid(input.organizationId) || !uuid(input.connectionId) ||
      (version(input.expectedConnectionVersion) === null || input.expectedConnectionVersion === Number.MAX_SAFE_INTEGER) || !nonEmpty(input.clientKey) ||
      !nonEmpty(input.clientSecret) || !nonEmpty(input.keyring.activeVersion) || key?.length !== 32 ||
      !clockValid(now())) return { ok: false, code: "refresh_configuration_invalid" };

  const base = { p_organization_id: input.organizationId, p_connection_id: input.connectionId };
  // Do not retry RPCs: a missing response can hide a committed ownership transition.
  const call = async (name: string, args: Record<string, unknown>) => {
    try { return await rpc(name, args); }
    catch { return { data: null, error: true }; }
  };
  const claimed = await call("claim_tiktok_creator_refresh", {
    ...base, p_expected_connection_version: input.expectedConnectionVersion,
  });
  if (claimed.error || !Array.isArray(claimed.data) || claimed.data.length !== 1) {
    return { ok: false, code: "refresh_claim_unavailable" };
  }
  const row: unknown = claimed.data[0];
  if (!record(row) || !nonEmpty(row.attempt_id) || !uuid(row.attempt_id)) {
    return { ok: false, code: "refresh_recovery_required" };
  }
  const owned = { ...base, p_attempt_id: row.attempt_id };
  const finish = async (outcome: "cancelled" | "uncertain" | "reauthorization_required") => {
    const result = await call("finish_tiktok_creator_refresh_failure", { ...owned, p_outcome: outcome });
    return !result.error && result.data === true;
  };
  const cancel = async (): Promise<TikTokRefreshCoordinatorResult> => ({
    ok: false, code: await finish("cancelled") ? "refresh_preparation_failed" : "refresh_recovery_required",
  });
  const checkedAt = now();
  if (!nonEmpty(row.credential_reference_id) || !uuid(row.credential_reference_id) ||
      !nonEmpty(row.external_account_id) || !nonEmpty(row.refresh_token_ciphertext) ||
      !nonEmpty(row.encryption_key_version) || !nonEmpty(row.refresh_token_expires_at) ||
      version(row.connection_version) !== input.expectedConnectionVersion || !clockValid(checkedAt) ||
      !Number.isFinite(Date.parse(row.refresh_token_expires_at)) ||
      Date.parse(row.refresh_token_expires_at) <= checkedAt) return cancel();
  let refreshToken: string | null;
  try {
    refreshToken = await decryptPublishingProviderToken({
      ciphertext: row.refresh_token_ciphertext, provider: "tiktok", organizationId: input.organizationId,
      externalAccountId: row.external_account_id, tokenKind: "refresh",
      keyVersion: row.encryption_key_version, keyring: input.keyring,
    });
  } catch { return cancel(); }
  if (!refreshToken) return cancel();

  // Capture expiry origin before request dispatch (conservative for provider latency).
  const requestedAt = now();
  if (!clockValid(requestedAt)) return cancel();
  const dispatched = await call("dispatch_tiktok_creator_refresh", owned);
  if (dispatched.error) return { ok: false, code: "refresh_recovery_required" };
  if (dispatched.data === false) return { ok: false, code: "refresh_dispatch_denied" };
  if (dispatched.data !== true) return { ok: false, code: "refresh_recovery_required" };

  let exchanged: Awaited<ReturnType<typeof exchangeTikTokCreatorRefreshToken>>;
  try {
    exchanged = await exchangeTikTokCreatorRefreshToken({
      clientKey: input.clientKey, clientSecret: input.clientSecret, refreshToken,
      externalAccountId: row.external_account_id,
    }, fetchImpl);
  } catch {
    await finish("uncertain");
    return { ok: false, code: "refresh_recovery_required" };
  }
  if (!exchanged.ok) {
    const outcome = exchanged.code === "reauthorization_required" ? "reauthorization_required" : "uncertain";
    const recorded = await finish(outcome);
    return { ok: false, code: recorded && outcome === "reauthorization_required"
      ? "reauthorization_required" : "refresh_recovery_required" };
  }
  let rotation: ReturnType<typeof prepareTikTokCreatorTokenRotation>;
  try {
    rotation = prepareTikTokCreatorTokenRotation({ organizationId: input.organizationId,
      externalAccountId: row.external_account_id, token: exchanged.value,
      keyring: input.keyring, nowMs: requestedAt });
  } catch { await finish("uncertain"); return { ok: false, code: "refresh_recovery_required" }; }
  if (!rotation.ok) { await finish("uncertain"); return { ok: false, code: "refresh_recovery_required" }; }
  const value = rotation.value;
  const finalized = await call("finalize_tiktok_creator_refresh", {
    ...owned, p_access_token_ciphertext: value.accessTokenCiphertext,
    p_refresh_token_ciphertext: value.refreshTokenCiphertext,
    p_access_token_expires_at: value.accessTokenExpiresAt,
    p_refresh_token_expires_at: value.refreshTokenExpiresAt,
    p_encryption_key_version: value.encryptionKeyVersion, p_granted_scopes: value.grantedScopes,
  });
  const newVersion = version(finalized.data);
  if (finalized.error || newVersion !== input.expectedConnectionVersion + 1) {
    // This may already be committed. A guarded failure cannot undo success or reconnection.
    await finish("uncertain");
    return { ok: false, code: "refresh_recovery_required" };
  }
  return { ok: true, connectionVersion: newVersion, accessTokenExpiresAt: value.accessTokenExpiresAt };
}
