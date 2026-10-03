import { describe, expect, it, vi } from "vitest";
import { decryptPublishingProviderToken, encryptPublishingProviderToken } from "./tiktok-creator-oauth-server";
import { coordinateTikTokCreatorRefresh, type TikTokRefreshRpc } from "./tiktok-creator-refresh-coordinator";
const org = "11111111-1111-4111-8111-111111111111";
const conn = "22222222-2222-4222-8222-222222222222";
const attempt = "33333333-3333-4333-8333-333333333333";
const keyring = { activeVersion: "new", keys: new Map([["old", Buffer.alloc(32, 1)], ["new", Buffer.alloc(32, 2)]]) };
const time = Date.parse("2026-10-03T15:00:00Z");
const input = { organizationId: org, connectionId: conn, expectedConnectionVersion: 7,
  clientKey: "client", clientSecret: "private-secret", keyring };
const row = { attempt_id: attempt, credential_reference_id: "44444444-4444-4444-8444-444444444444",
  external_account_id: "creator", refresh_token_ciphertext: encryptPublishingProviderToken({ plaintext: "old-refresh",
    provider: "tiktok", organizationId: org, externalAccountId: "creator", tokenKind: "refresh",
    keyVersion: "old", key: keyring.keys.get("old")! }),
  refresh_token_expires_at: new Date(time + 86400_000).toISOString(), encryption_key_version: "old", connection_version: "7" };
const payload = { open_id: "creator", access_token: "replacement-access", refresh_token: "replacement-refresh",
  expires_in: 86400, refresh_expires_in: 31536000, token_type: "Bearer", scope: "video.publish,user.info.basic" };
function harness(options: { row?: unknown; dispatch?: unknown; finalize?: unknown; rpcFailure?: string;
  finish?: unknown; body?: unknown; status?: number; networkError?: boolean } = {}) {
  const events: string[] = [];
  const rpc = vi.fn<TikTokRefreshRpc>(async (name) => {
    events.push(name);
    if (options.rpcFailure === name) throw new Error("private-secret old-refresh");
    return { data: name === "claim_tiktok_creator_refresh" ? [options.row ?? row]
      : name === "dispatch_tiktok_creator_refresh" ? options.dispatch ?? true
      : name === "finalize_tiktok_creator_refresh" ? options.finalize ?? "8" : options.finish ?? true, error: null };
  });
  const fetchImpl = vi.fn<typeof fetch>(async () => {
    events.push("provider");
    if (options.networkError) throw new Error("private-secret old-refresh");
    return new Response(JSON.stringify(options.body ?? payload), { status: options.status ?? 200 });
  });
  const dependencies = { rpc, fetchImpl, now: () => time };
  return { rpc, fetchImpl, events, dependencies, run: () => coordinateTikTokCreatorRefresh(input, dependencies) };
}
const outcome = (h: ReturnType<typeof harness>) => h.rpc.mock.calls.find(([n]) => n === "finish_tiktok_creator_refresh_failure")?.[1].p_outcome;
describe("TikTok refresh coordinator (mock only)", () => {
  it("persists both encrypted tokens before reporting success", async () => {
    const h = harness();
    expect(await h.run()).toEqual({ ok: true, connectionVersion: 8, accessTokenExpiresAt: new Date(time + 86400_000).toISOString() });
    expect(h.events).toEqual(["claim_tiktok_creator_refresh", "dispatch_tiktok_creator_refresh", "provider", "finalize_tiktok_creator_refresh"]);
    const args = h.rpc.mock.calls[2][1];
    expect(args).toMatchObject({ p_organization_id: org, p_connection_id: conn, p_attempt_id: attempt, p_encryption_key_version: "new" });
    for (const kind of ["access", "refresh"] as const) expect(await decryptPublishingProviderToken({
      ciphertext: args[`p_${kind}_token_ciphertext`] as string, provider: "tiktok", organizationId: org,
      externalAccountId: "creator", tokenKind: kind, keyVersion: "new", keyring })).toBe(`replacement-${kind}`);
    expect(JSON.stringify(args)).not.toContain("replacement-refresh");
    expect(Object.fromEntries(h.fetchImpl.mock.calls[0][1]?.body as URLSearchParams).refresh_token).toBe("old-refresh");
  });
  it.each([{ organizationId: "wrong" }, { connectionId: "wrong" }, { expectedConnectionVersion: 0 },
    { expectedConnectionVersion: Number.MAX_SAFE_INTEGER + 1 }, { clientKey: "" }, { clientSecret: "" },
    { keyring: { activeVersion: "missing", keys: new Map() } }])("rejects preflight %j", async (patch) => {
    const h = harness();
    expect(await coordinateTikTokCreatorRefresh({ ...input, ...patch }, h.dependencies)).toEqual({ ok: false, code: "refresh_configuration_invalid" });
    expect(h.events).toEqual([]);
  });
  it("invalid clock fails before claim", async () => {
    const h = harness();
    expect(await coordinateTikTokCreatorRefresh(input, { ...h.dependencies, now: () => NaN }))
      .toEqual({ ok: false, code: "refresh_configuration_invalid" });
    expect(h.events).toEqual([]);
  });
  it("clock failure after claim cancels before dispatch", async () => {
    const h = harness();
    const now = vi.fn().mockReturnValueOnce(time).mockReturnValue(NaN);
    expect(await coordinateTikTokCreatorRefresh(input, { ...h.dependencies, now }))
      .toEqual({ ok: false, code: "refresh_preparation_failed" });
    expect(outcome(h)).toBe("cancelled");
    expect(h.fetchImpl).not.toHaveBeenCalled();
  });
  it("waits for database commit confirmation before returning success", async () => {
    const h = harness();
    let resolve!: (value: { data: unknown; error: unknown }) => void;
    const pending = new Promise<{ data: unknown; error: unknown }>((r) => { resolve = r; });
    const original = h.rpc.getMockImplementation()!;
    h.rpc.mockImplementation((name, args) => name === "finalize_tiktok_creator_refresh"
      ? pending : original(name, args));
    let settled = false;
    const result = h.run().then((r) => { settled = true; return r; });
    await vi.waitFor(() => expect(h.rpc.mock.calls.some(([n]) => n === "finalize_tiktok_creator_refresh")).toBe(true));
    expect(settled).toBe(false);
    resolve({ data: "8", error: null });
    expect(await result).toMatchObject({ ok: true });
  });
  it("claim response loss never sends or retries", async () => {
    const h = harness({ rpcFailure: "claim_tiktok_creator_refresh" });
    expect(await h.run()).toEqual({ ok: false, code: "refresh_claim_unavailable" });
    expect(h.events).toEqual(["claim_tiktok_creator_refresh"]);
  });
  it.each([{ refresh_token_ciphertext: "broken" }, { encryption_key_version: "missing" },
    { connection_version: 8 }, { credential_reference_id: "invalid" },
    { refresh_token_expires_at: new Date(time).toISOString() }, { external_account_id: "wrong" }])("cancels invalid context %j", async (patch) => {
    const h = harness({ row: { ...row, ...patch } });
    expect(await h.run()).toEqual({ ok: false, code: "refresh_preparation_failed" });
    expect(outcome(h)).toBe("cancelled");
    expect(h.fetchImpl).not.toHaveBeenCalled();
  });
  it("cannot cancel without valid attempt ownership", async () => {
    const h = harness({ row: { ...row, attempt_id: "invalid" } });
    expect(await h.run()).toEqual({ ok: false, code: "refresh_recovery_required" });
    expect(outcome(h)).toBeUndefined();
  });
  it("failed cancellation requires recovery", async () => {
    const h = harness({ row: { ...row, refresh_token_ciphertext: "broken" }, finish: false });
    expect(await h.run()).toEqual({ ok: false, code: "refresh_recovery_required" });
  });
  it.each([{ dispatch: false, code: "refresh_dispatch_denied" },
    { rpcFailure: "dispatch_tiktok_creator_refresh", code: "refresh_recovery_required" },
    { dispatch: "true", code: "refresh_recovery_required" }])("requires confirmed dispatch %j", async ({ code, ...options }) => {
    const h = harness(options);
    expect(await h.run()).toEqual({ ok: false, code });
    expect(h.fetchImpl).not.toHaveBeenCalled();
    expect(outcome(h)).toBeUndefined();
  });
  it.each([{ networkError: true }, { body: { ...payload, open_id: "other" } },
    { body: { ...payload, scope: "user.info.basic" } }, { body: {} },
    { status: 429, body: { error: "rate_limit_exceeded" } },
    { status: 400, body: { error: "invalid_client" } }])("records uncertainty without replay %j", async (options) => {
    const h = harness(options);
    expect(await h.run()).toEqual({ ok: false, code: "refresh_recovery_required" });
    expect(h.fetchImpl).toHaveBeenCalledTimes(1);
    expect(outcome(h)).toBe("uncertain");
    expect(h.events).not.toContain("finalize_tiktok_creator_refresh");
  });
  it.each([true, false])("reauthorization must be confirmed by guarded DB update: %s", async (finish) => {
    const h = harness({ status: 400, body: { error: "invalid_grant" }, finish });
    expect(await h.run()).toEqual({ ok: false, code: finish ? "reauthorization_required" : "refresh_recovery_required" });
    expect(outcome(h)).toBe("reauthorization_required");
  });
  it.each([{ rpcFailure: "finalize_tiktok_creator_refresh" }, { finalize: false }, { finalize: "9" }])("never reports success after failed finalization %j", async (options) => {
    const h = harness(options);
    expect(await h.run()).toEqual({ ok: false, code: "refresh_recovery_required" });
    expect(h.fetchImpl).toHaveBeenCalledTimes(1);
    expect(h.rpc.mock.calls.filter(([n]) => n === "finalize_tiktok_creator_refresh")).toHaveLength(1);
    expect(outcome(h)).toBe("uncertain");
  });
});
