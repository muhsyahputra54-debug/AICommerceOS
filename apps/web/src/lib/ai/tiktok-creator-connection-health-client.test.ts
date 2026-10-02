import { describe, expect, it, vi } from "vitest";
import { loadTikTokConnectionHealth, parseTikTokConnectionHealthResponse, tikTokConnectionHealthCopy } from "./tiktok-creator-connection-health-client";
import type { TikTokConnectionMetadataStatus } from "./tiktok-creator-connection-health";

const health = {
  status: "metadata_ready_unverified", checkedAt: "2026-10-02T12:00:00Z",
  expiresAt: "2026-10-03T12:00:00Z", providerVerified: false, credentialVerified: false,
};
const statuses: TikTokConnectionMetadataStatus[] = [
  "not_connected", "revoked", "reauthorization_required", "connection_ambiguous", "scope_missing",
  "capability_missing", "expiry_unknown", "access_token_expired", "access_token_expiring_soon", "metadata_ready_unverified",
];

describe("TikTok health dashboard client", () => {
  it.each(statuses)("accepts %s with bilingual copy", (status) => {
    expect(parseTikTokConnectionHealthResponse({ health: { ...health, status } })).toMatchObject({ status });
    const id = tikTokConnectionHealthCopy(status, true);
    const en = tikTokConnectionHealthCopy(status, false);
    expect(id.title).not.toEqual(en.title);
    expect(id.detail.length).toBeGreaterThan(10);
    expect(en.detail.length).toBeGreaterThan(10);
  });

  it.each([
    null, {}, { health: null }, { health: { ...health, status: "constructor" } },
    { health: { ...health, status: "__proto__" } }, { health: { ...health, status: "Bearer secret" } },
    { health: { ...health, providerVerified: true } }, { health: { ...health, credentialVerified: true } },
    { health: { ...health, checkedAt: "invalid" } }, { health: { ...health, expiresAt: "invalid" } },
    { health: { ...health, accessToken: "secret" } }, { health, accessToken: "secret" },
  ])("rejects untrusted, invalid, or unexpectedly verified responses", (payload) => {
    expect(parseTikTokConnectionHealthResponse(payload)).toBeNull();
  });

  it("accepts unknown expiry and normalizes timestamps", () => {
    expect(parseTikTokConnectionHealthResponse({ health: { ...health, expiresAt: null } })).toEqual({
      ...health, expiresAt: null, checkedAt: "2026-10-02T12:00:00.000Z",
    });
  });

  it("reads only the same-origin metadata endpoint once", async () => {
    const signal = new AbortController().signal;
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ health }));
    expect(await loadTikTokConnectionHealth(signal, fetchImpl)).toMatchObject({ status: "metadata_ready_unverified" });
    expect(fetchImpl).toHaveBeenCalledExactlyOnceWith(
      "/api/ai/publishing-provider-connections/tiktok/health",
      expect.objectContaining({ method: "GET", cache: "no-store", credentials: "same-origin", signal }),
    );
  });

  it.each([401, 403, 502, 503])("handles HTTP %s without reading or exposing error text", async (status) => {
    const response = new Response("Bearer secret", { status });
    const json = vi.spyOn(response, "json");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response);
    expect(await loadTikTokConnectionHealth(new AbortController().signal, fetchImpl)).toBeNull();
    expect(json).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("handles network/non-JSON failures without retrying", async () => {
    for (const fetchImpl of [
      vi.fn<typeof fetch>().mockRejectedValue(new Error("Bearer secret")),
      vi.fn<typeof fetch>().mockResolvedValue(new Response("<html>error</html>")),
    ]) {
      expect(await loadTikTokConnectionHealth(new AbortController().signal, fetchImpl)).toBeNull();
      expect(fetchImpl).toHaveBeenCalledOnce();
    }
  });

  it("discards a response aborted while JSON was loading", async () => {
    const controller = new AbortController();
    const response = Response.json({ health });
    vi.spyOn(response, "json").mockImplementation(async () => {
      controller.abort();
      return { health };
    });
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response);
    expect(await loadTikTokConnectionHealth(controller.signal, fetchImpl)).toBeNull();
  });
});
