import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ context: vi.fn(), config: vi.fn(), issue: vi.fn(), build: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/ai/controlled-action-server", () => ({ getControlledActionRequestContext: mocks.context }));
vi.mock("@/lib/observability/server-logger", () => ({ logServerError: mocks.log }));
vi.mock("@/lib/ai/tiktok-creator-oauth-server", () => ({
  resolveTikTokCreatorOAuthConfig: mocks.config, issueTikTokCreatorOAuthState: mocks.issue,
  buildTikTokCreatorAuthorizeUrl: mocks.build, TIKTOK_CREATOR_OAUTH_COOKIE_NAME: "test-oauth",
  TIKTOK_CREATOR_OAUTH_TTL_SECONDS: 600,
}));
import { GET } from "./route";
const request = () => new Request("https://staging.example.test/api/authorize");

describe("TikTok authorize app URL preflight", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.context.mockResolvedValue({ user: { id: "user" }, organizationId: "org" });
    mocks.config.mockReturnValue({ clientKey: "key", redirectUri: "https://staging.example.test/callback", oauthStateSecret: "state-secret" });
    mocks.issue.mockReturnValue({ state: "state", cookieValue: "cookie" });
    mocks.build.mockReturnValue("https://www.tiktok.com/v2/auth/authorize/?state=state");
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Live HTTP forbidden"); }));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it.each([undefined, "http://remote.example", "https://user:private@example.test", "ftp://localhost"])("stops before state issuance with invalid app URL (%s)", async (value) => {
    vi.stubEnv("LAKUVO_APP_URL", value);
    const response = await GET(request());
    if (!response) throw new Error("Expected response");
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(JSON.stringify(await response.json())).not.toContain("private");
    expect(mocks.config).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
    expect(mocks.build).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private");
  });
  it("preserves the valid authorize redirect and state cookie", async () => {
    vi.stubEnv("LAKUVO_APP_URL", "https://staging.example.test");
    const response = await GET(request());
    if (!response) throw new Error("Expected response");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("https://www.tiktok.com/");
    expect(response.cookies.get("test-oauth")?.value).toBe("cookie");
    expect(mocks.issue).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("preserves authentication failure before checking configuration", async () => {
    const denied = Response.json({ error: "unauthorized" }, { status: 401 });
    mocks.context.mockResolvedValue({ error: denied });
    expect(await GET(request())).toBe(denied);
    expect(mocks.issue).not.toHaveBeenCalled();
  });
});
