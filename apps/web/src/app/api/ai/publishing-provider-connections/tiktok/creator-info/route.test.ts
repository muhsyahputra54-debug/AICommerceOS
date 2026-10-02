import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ context: vi.fn(), creatorInfo: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/ai/controlled-action-server", () => ({ getControlledActionRequestContext: mocks.context }));
vi.mock("@/lib/ai/tiktok-creator-publishing-server", () => ({ getTikTokCreatorInfoForOrganization: mocks.creatorInfo }));
vi.mock("@/lib/observability/server-logger", () => ({ logServerError: mocks.log }));

import { GET } from "./route";

const request = () => new Request("https://example.test/api/ai/publishing-provider-connections/tiktok/creator-info", {
  headers: { "x-request-id": "test-request-1" },
});

describe("creator-info GET diagnostics", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.context.mockResolvedValue({ organizationId: "test-organization" });
  });

  it.each([
    ["connection_unavailable", 404], ["access_token_expired", 409],
    ["scope_missing", 409], ["connection_ambiguous", 409],
    ["token_decryption_failed", 503], ["creator_info_request_failed", 502],
  ])("returns and logs %s without changing status semantics", async (code, status) => {
    mocks.creatorInfo.mockResolvedValue({ ok: false, code });
    const response = await GET(request());
    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: code });
    expect(mocks.log).toHaveBeenCalledWith(expect.objectContaining({
      event: "ai_tiktok_creator_info_failed", requestId: "test-request-1",
      provider: "tiktok", error: { code },
    }));
    expect(mocks.creatorInfo).toHaveBeenCalledWith({ organizationId: "test-organization" });
  });

  it("exposes and logs only a known provider diagnostic code", async () => {
    mocks.creatorInfo.mockResolvedValue({ ok: false, code: "creator_info_provider_error", providerCode: "access_token_invalid" });
    const response = await GET(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "creator_info_provider_error", providerCode: "access_token_invalid" });
    expect(mocks.log).toHaveBeenCalledWith(expect.objectContaining({ error: {
      code: "creator_info_provider_error", message: "TikTok provider code: access_token_invalid",
    } }));
  });

  it("discards unknown provider text from both response and logs", async () => {
    mocks.creatorInfo.mockResolvedValue({ ok: false, code: "creator_info_provider_error", providerCode: "Bearer secret" });
    const response = await GET(request());
    expect(await response.json()).toEqual({ error: "creator_info_provider_error" });
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("secret");
  });

  it("does not load credentials when authentication fails", async () => {
    const denied = Response.json({ error: "unauthorized" }, { status: 401 });
    mocks.context.mockResolvedValue({ error: denied });
    expect(await GET(request())).toBe(denied);
    expect(mocks.creatorInfo).not.toHaveBeenCalled();
  });

  it("preserves success without emitting an incident", async () => {
    mocks.creatorInfo.mockResolvedValue({ ok: true, value: { creatorUsername: "creator" } });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ creatorInfo: { creatorUsername: "creator" } });
    expect(mocks.log).not.toHaveBeenCalled();
  });
});
