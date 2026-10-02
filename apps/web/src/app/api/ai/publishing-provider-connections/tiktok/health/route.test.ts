import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ context: vi.fn(), rpc: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/ai/controlled-action-server", () => ({ getControlledActionRequestContext: mocks.context }));
vi.mock("@/lib/observability/server-logger", () => ({ logServerError: mocks.log }));
import { GET } from "./route";

const organizationId = "22222222-2222-4222-8222-222222222222";
const request = () => new Request("https://example.test/api/ai/publishing-provider-connections/tiktok/health", {
  headers: { "x-request-id": "health-test-1" },
});
const row = {
  id: "11111111-1111-4111-8111-111111111111", organization_id: organizationId,
  provider: "tiktok", external_account_id: "private-creator-id",
  authorization_status: "authorized", granted_scopes: ["video.publish"],
  supported_capabilities: ["publish_video"],
  credential_reference_id: "33333333-3333-4333-8333-333333333333",
  credential_expires_at: "2026-10-03T00:00:00Z",
  credential_updated_at: "2026-10-01T00:00:00Z", revoked_at: null,
  version: 1, updated_at: "2026-10-01T00:00:00Z",
};

describe("TikTok metadata-only health GET", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T00:00:00Z"));
    mocks.context.mockResolvedValue({ organizationId, supabase: { rpc: mocks.rpc } });
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Provider HTTP forbidden in this test"); }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it.each([{ rows: [] }, { rows: [row] }])("reads only authenticated connection metadata", async ({ rows }) => {
    mocks.rpc.mockResolvedValue({ data: rows, error: null });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ health: {
      status: rows.length ? "metadata_ready_unverified" : "not_connected",
      checkedAt: "2026-10-02T00:00:00.000Z",
      expiresAt: rows.length ? "2026-10-03T00:00:00.000Z" : null,
      providerVerified: false, credentialVerified: false,
    } });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("get_publishing_provider_connections", {
      p_organization_id: organizationId, p_provider: "tiktok",
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.log).not.toHaveBeenCalled();
  });

  it.each([401, 403])("denies unauthenticated/unauthorized reads (%s)", async (status) => {
    mocks.context.mockResolvedValue({ error: Response.json({ error: "denied" }, { status }) });
    const response = await GET(request());
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: "denied" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [{ data: null, error: { message: "Bearer private-token" } }, "connection_metadata_unavailable", 503],
    [{ data: [{ ...row, organization_id: "other-organization" }], error: null }, "connection_metadata_invalid", 502],
    [{ data: [{ ...row, access_token_ciphertext: "private-token" }], error: null }, "connection_metadata_invalid", 502],
  ])("fails safely for database/metadata errors", async (rpcResult, code, status) => {
    mocks.rpc.mockResolvedValue(rpcResult);
    const response = await GET(request());
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: code });
    expect(mocks.log).toHaveBeenCalledWith(expect.objectContaining({
      requestId: "health-test-1", error: { code }, operation: "read_connection_metadata",
    }));
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private-token");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not retry thrown RPC failures", async () => {
    mocks.rpc.mockRejectedValue(new Error("private-token"));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "connection_metadata_unavailable" });
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private-token");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([undefined, new Error("private-token")])("handles missing or thrown authentication context", async (failure) => {
    if (failure) mocks.context.mockRejectedValue(failure);
    else mocks.context.mockResolvedValue({ error: undefined });
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private-token");
  });
});
