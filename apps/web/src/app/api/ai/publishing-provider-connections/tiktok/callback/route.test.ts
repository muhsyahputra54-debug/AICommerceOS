import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ context: vi.fn(), config: vi.fn(), validate: vi.fn(), exchange: vi.fn(), prepare: vi.fn(), admin: vi.fn(), rpc: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/ai/controlled-action-server", () => ({ getControlledActionRequestContext: mocks.context }));
vi.mock("@/lib/observability/server-logger", () => ({ logServerError: mocks.log }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/lib/ai/tiktok-creator-oauth-runtime", () => ({ exchangeTikTokCreatorAuthorizationCode: mocks.exchange, prepareTikTokCreatorConnectionPersistence: mocks.prepare }));
vi.mock("@/lib/ai/tiktok-creator-oauth-server", () => ({
  resolveTikTokCreatorOAuthConfig: mocks.config, validateTikTokCreatorOAuthState: mocks.validate,
  TIKTOK_CREATOR_OAUTH_COOKIE_NAME: "test-oauth", TIKTOK_CREATOR_OAUTH_RETURN_TO: "/growth",
  TIKTOK_CREATOR_TOKEN_ENDPOINT: "https://provider.example/token",
}));
import { GET } from "./route";
const request = () => new NextRequest("https://request.example/callback?state=test&code=private-code", {
  headers: { cookie: "test-oauth=cookie", "x-forwarded-host": "untrusted.example" },
});

describe("TikTok callback app URL preflight", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.context.mockResolvedValue({ user: { id: "user" }, organizationId: "org" });
    mocks.config.mockReturnValue({ clientKey: "key", clientSecret: "secret", redirectUri: "https://staging.example/callback", oauthStateSecret: "secret", tokenKeyring: {} });
    mocks.validate.mockReturnValue({ ok: true });
    mocks.exchange.mockResolvedValue({ ok: true, value: {} });
    mocks.prepare.mockReturnValue({ ok: true, value: { test: true } });
    mocks.admin.mockReturnValue({ rpc: mocks.rpc });
    mocks.rpc.mockResolvedValue({ error: null, data: [{ connection_id: "connection", credential_reference_id: "credential" }] });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Live HTTP forbidden"); }));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it.each([undefined, "http://remote.example", "https://user:private@example.test", "ftp://localhost"])("stops before exchange, encryption or persistence (%s)", async (value) => {
    vi.stubEnv("LAKUVO_APP_URL", value);
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(JSON.stringify(await response.json())).not.toContain("private");
    for (const mock of [mocks.config, mocks.validate, mocks.exchange, mocks.prepare, mocks.admin, mocks.rpc]) expect(mock).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private");
  });
  it("redirects successful persistence to the captured origin even if env changes", async () => {
    vi.stubEnv("LAKUVO_APP_URL", "https://staging.example");
    mocks.exchange.mockImplementation(async () => {
      vi.stubEnv("LAKUVO_APP_URL", undefined);
      return { ok: true, value: {} };
    });
    const response = await GET(request());
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://staging.example/growth?publishingConnection=tiktok&status=connected");
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps invalid-state rejection ahead of code exchange", async () => {
    vi.stubEnv("LAKUVO_APP_URL", "https://staging.example");
    mocks.validate.mockReturnValue({ ok: false });
    const response = await GET(request());
    expect(response.headers.get("location")).toBe("https://staging.example/growth?publishingConnection=tiktok&status=state_invalid");
    expect(mocks.exchange).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
