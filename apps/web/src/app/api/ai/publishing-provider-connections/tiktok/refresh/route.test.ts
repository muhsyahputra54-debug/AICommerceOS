import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ context: vi.fn(), metadata: vi.fn(), admin: vi.fn(),
  adminRpc: vi.fn(), coordinate: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/ai/controlled-action-server", () => ({ getControlledActionRequestContext: mocks.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/lib/ai/tiktok-creator-refresh-coordinator", () => ({ coordinateTikTokCreatorRefresh: mocks.coordinate }));
vi.mock("@/lib/observability/server-logger", () => ({ logServerError: mocks.log }));
import { GET, POST } from "./route";
const app = "https://staging.example.test";
const org = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const row = { id, organization_id: org, provider: "tiktok", external_account_id: "creator",
  authorization_status: "authorized", granted_scopes: ["video.publish"], supported_capabilities: ["publish_video"],
  credential_reference_id: "33333333-3333-4333-8333-333333333333", credential_expires_at: "2026-10-03T14:00:00Z",
  credential_updated_at: "2026-10-01T00:00:00Z", revoked_at: null, version: 7, updated_at: "2026-10-01T00:00:00Z" };
const body = { connectionId: id, expectedConnectionVersion: 7, consent: true };
function request(overrides: { origin?: string; site?: string; contentType?: string; body?: unknown; raw?: string; url?: string } = {}) {
  return new Request(`${overrides.url ?? app}/api/ai/publishing-provider-connections/tiktok/refresh`, {
    method: "POST", headers: { origin: overrides.origin ?? app, "sec-fetch-site": overrides.site ?? "same-origin",
      "content-type": overrides.contentType ?? "application/json", "x-request-id": "refresh-test" },
    body: overrides.raw ?? JSON.stringify(overrides.body ?? body),
  });
}
async function denied(req: Request, status: number, code: string) {
  const res = await POST(req);
  expect(res.status).toBe(status);
  expect(await res.json()).toEqual({ error: code });
  expect(res.headers.get("Cache-Control")).toBe("no-store");
  expect(mocks.admin).not.toHaveBeenCalled();
  expect(mocks.coordinate).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
}
describe("TikTok refresh POST (default disabled, mock only)", () => {
  beforeEach(() => {
    vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-03T15:00:00Z"));
    for (const [name, value] of Object.entries({ TIKTOK_CREATOR_REFRESH_ENABLED: "true", VERCEL_ENV: "preview",
      NEXT_PUBLIC_SUPABASE_URL: "https://ogqsmnurtbexpvbyrvtn.supabase.co", LAKUVO_APP_URL: app,
      TIKTOK_CREATOR_CLIENT_KEY: "client", TIKTOK_CREATOR_CLIENT_SECRET: "private-secret",
      PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS: JSON.stringify({ new: Buffer.alloc(32, 4).toString("base64") }),
      PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_ACTIVE_VERSION: "new" })) vi.stubEnv(name, value);
    mocks.context.mockResolvedValue({ organizationId: org, role: "owner", user: { id: "user" }, supabase: { rpc: mocks.metadata } });
    mocks.metadata.mockResolvedValue({ data: [row], error: null });
    mocks.admin.mockReturnValue({ rpc: mocks.adminRpc });
    mocks.adminRpc.mockResolvedValue({ data: true, error: null });
    mocks.coordinate.mockResolvedValue({ ok: true, connectionVersion: 8, accessTokenExpiresAt: "2026-10-04T15:00:00Z" });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Live HTTP forbidden"); }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it.each(["", "false"])("availability defaults disabled without credential access: %s", async (flag) => {
    vi.stubEnv("TIKTOK_CREATOR_REFRESH_ENABLED", flag);
    const res = await GET(new Request(`${app}/api/ai/publishing-provider-connections/tiktok/refresh`));
    expect(await res.json()).toEqual({ availability: { status: "disabled", target: null } });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.metadata).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled(); expect(mocks.coordinate).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it("availability returns only current connection ID/version and cannot refresh", async () => {
    const res = await GET(new Request(`${app}/api/ai/publishing-provider-connections/tiktok/refresh`));
    expect(await res.json()).toEqual({ availability: { status: "eligible", target: { connectionId: id, expectedConnectionVersion: 7 } } });
    expect(mocks.metadata).toHaveBeenCalledOnce();
    expect(mocks.admin).not.toHaveBeenCalled(); expect(mocks.coordinate).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it.each([401, 403])("availability preserves auth denial %s", async (status) => {
    mocks.context.mockResolvedValue({ error: Response.json({ error: "denied" }, { status }) });
    const res = await GET(new Request(`${app}/api/ai/publishing-provider-connections/tiktok/refresh`));
    expect(res.status).toBe(status); expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.metadata).not.toHaveBeenCalled(); expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("availability does not offer renewal of a healthy token", async () => {
    mocks.metadata.mockResolvedValue({ data: [{ ...row, credential_expires_at: "2026-10-04T00:00:00Z" }], error: null });
    const res = await GET(new Request(`${app}/api/ai/publishing-provider-connections/tiktok/refresh`));
    expect(await res.json()).toEqual({ availability: { status: "unavailable", target: null } });
    expect(mocks.admin).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["LAKUVO_APP_URL", "PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS"])("availability rejects missing configuration %s", async (name) => {
    vi.stubEnv(name, "");
    const res = await GET(new Request(`${app}/api/ai/publishing-provider-connections/tiktok/refresh`));
    expect(res.status).toBe(503); expect(mocks.admin).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it("availability fails safely for metadata errors", async () => {
    mocks.metadata.mockRejectedValue(new Error("private-token"));
    const res = await GET(new Request(`${app}/api/ai/publishing-provider-connections/tiktok/refresh`));
    expect(await res.json()).toEqual({ error: "refresh_availability_unavailable" });
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private-token");
    expect(mocks.admin).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it("uses session organization and passes trusted server dependencies; returns safe metadata", async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ refresh: { connectionVersion: 8, accessTokenExpiresAt: "2026-10-04T15:00:00Z" } });
    expect(mocks.metadata).toHaveBeenCalledExactlyOnceWith("get_publishing_provider_connections", { p_organization_id: org, p_provider: "tiktok" });
    const [args, deps] = mocks.coordinate.mock.calls[0];
    expect(args).toMatchObject({ organizationId: org, connectionId: id, expectedConnectionVersion: 7, clientKey: "client" });
    expect(deps.fetchImpl).toBe(fetch);
    await deps.rpc("claim_tiktok_creator_refresh", { p_organization_id: org });
    expect(mocks.adminRpc).toHaveBeenCalledExactlyOnceWith("claim_tiktok_creator_refresh", { p_organization_id: org });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([401, 403])("preserves auth denial %s and prevents mutations", async (status) => {
    mocks.context.mockResolvedValue({ error: Response.json({ error: "denied" }, { status }) });
    await denied(request(), status, "denied");
    expect(mocks.metadata).not.toHaveBeenCalled();
  });
  it.each([
    ["TIKTOK_CREATOR_REFRESH_ENABLED", ""], ["TIKTOK_CREATOR_REFRESH_ENABLED", "false"],
    ["VERCEL_ENV", "production"], ["VERCEL_ENV", "development"],
    ["NEXT_PUBLIC_SUPABASE_URL", "https://mxjzdqakwuecfugkbsim.supabase.co"],
  ])("blocks activation outside staging gate %s=%s", async (key, value) => {
    vi.stubEnv(key, value); await denied(request(), 403, "refresh_disabled");
    expect(mocks.metadata).not.toHaveBeenCalled();
  });
  it.each([{ origin: "https://evil.test" }, { origin: "null" }, { origin: "" },
    { url: "https://other.test" }, { site: "cross-site" }, { site: "same-site" }])("rejects origin mismatch %j", async (options) => {
    await denied(request(options), 403, "request_origin_invalid");
    expect(mocks.metadata).not.toHaveBeenCalled();
  });
  it.each([{ body: { ...body, consent: false } }, { body: { ...body, organizationId: "other" } },
    { body: { ...body, expectedConnectionVersion: "7" } }, { body: { ...body, connectionId: "wrong" } },
    { raw: "{" }, { raw: "x".repeat(1025) }, { contentType: "text/plain" }])("rejects malformed or oversized request %j", async (options) => {
    await denied(request(options), 400, "refresh_request_invalid");
    expect(mocks.metadata).not.toHaveBeenCalled();
  });
  it.each(["LAKUVO_APP_URL", "TIKTOK_CREATOR_CLIENT_KEY", "TIKTOK_CREATOR_CLIENT_SECRET",
    "PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS", "PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_ACTIVE_VERSION"])("rejects missing %s", async (key) => {
    vi.stubEnv(key, ""); await denied(request(), 503, "refresh_configuration_invalid");
  });
  it.each([{ data: [] }, { data: [{ ...row, credential_expires_at: "2026-10-04T00:00:00Z" }] },
    { data: [{ ...row, authorization_status: "reauthorization_required" }] }, { data: [row, { ...row, id: "44444444-4444-4444-8444-444444444444" }] }])("rejects absent/healthy/reauth/ambiguous connections", async ({ data }) => {
    mocks.metadata.mockResolvedValue({ data, error: null }); await denied(request(), 409, "refresh_not_available");
  });
  it.each([{ ...row, organization_id: "44444444-4444-4444-8444-444444444444" },
    { ...row, access_token_ciphertext: "private-token" }])("rejects invalid metadata without secrets", async (invalid) => {
    mocks.metadata.mockResolvedValue({ data: [invalid], error: null }); await denied(request(), 502, "connection_metadata_invalid");
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private-token");
  });
  it.each([{ ...body, expectedConnectionVersion: 6 }, { ...body, connectionId: "44444444-4444-4444-8444-444444444444" }])("rejects stale or different connection", async (body) => {
    await denied(request({ body }), 409, "refresh_connection_conflict");
  });
  it("allows the expiring-soon window", async () => {
    mocks.metadata.mockResolvedValue({ data: [{ ...row, credential_expires_at: "2026-10-03T15:05:00Z" }], error: null });
    expect((await POST(request())).status).toBe(200);
  });
  it("does not expose raw thrown errors", async () => {
    mocks.metadata.mockRejectedValue(new Error("private-token"));
    await denied(request(), 503, "refresh_unavailable");
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private-token");
  });
  it.each(["refresh_recovery_required", "reauthorization_required", "refresh_claim_unavailable"])("returns safe coordinator failure %s", async (code) => {
    mocks.coordinate.mockResolvedValue({ ok: false, code });
    const res = await POST(request()); expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: code });
    expect(mocks.coordinate).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });
});
