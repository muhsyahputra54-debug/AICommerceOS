import { describe, expect, it, vi } from "vitest";
import { loadTikTokCreatorInfo } from "./tiktok-creator-info-client";
import { parseTikTokCreatorInfoFailure, tikTokCreatorInfoErrorMessage } from "./tiktok-creator-info-error";

describe("TikTok creator-info diagnostics", () => {
  it.each(["access_token_expired", "token_decryption_failed", "scope_missing", "connection_unavailable"])(
    "preserves %s from a failed API response", async (code) => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: code }, { status: 409 }));
      expect(await loadTikTokCreatorInfo(fetchImpl)).toEqual({ ok: false, failure: { code } });
      expect(fetchImpl).toHaveBeenCalledOnce();
      expect(fetchImpl).toHaveBeenCalledWith(
        "/api/ai/publishing-provider-connections/tiktok/creator-info",
        expect.objectContaining({ method: "GET", credentials: "same-origin", cache: "no-store" }),
      );
    },
  );

  it("retains an allowed provider code but discards provider text and credential fields", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      error: "creator_info_provider_error", providerCode: "access_token_invalid",
      message: "Bearer sensitive-value", accessToken: "secret",
    }, { status: 502 }));
    expect(await loadTikTokCreatorInfo(fetchImpl)).toEqual({
      ok: false, failure: { code: "creator_info_provider_error", providerCode: "access_token_invalid" },
    });
  });

  it("never reflects arbitrary diagnostic strings", () => {
    const result = parseTikTokCreatorInfoFailure({ error: "Bearer secret", providerCode: "secret_value" }, 503);
    expect(result).toEqual({ code: "creator_info_request_failed" });
    expect(tikTokCreatorInfoErrorMessage(result, true)).not.toContain("secret");
  });

  it.each([401, 403])("handles non-JSON authentication failures (%s)", async (status) => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("<html>blocked</html>", { status }));
    expect(await loadTikTokCreatorInfo(fetchImpl)).toEqual({
      ok: false, failure: { code: status === 401 ? "unauthorized" : "forbidden" },
    });
  });

  it("handles network failure without retrying or exposing the thrown message", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new Error("Bearer secret"));
    expect(await loadTikTokCreatorInfo(fetchImpl)).toEqual({ ok: false, failure: { code: "creator_info_request_failed" } });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("rejects malformed success responses", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ creatorInfo: {} }));
    expect(await loadTikTokCreatorInfo(fetchImpl)).toEqual({ ok: false, failure: { code: "creator_info_response_invalid" } });
  });

  it("keeps valid creator information available", async () => {
    const creatorInfo = {
      checkedAt: "2026-10-02T00:00:00.000Z", creatorUsername: "creator", creatorNickname: "Creator",
      privacyLevelOptions: ["SELF_ONLY"], commentDisabled: false, duetDisabled: true,
      stitchDisabled: true, maxVideoPostDurationSec: 60,
    };
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ creatorInfo }));
    expect(await loadTikTokCreatorInfo(fetchImpl)).toEqual({ ok: true, value: creatorInfo });
  });

  it("distinguishes reconnection, permission, and configuration failures in both languages", () => {
    for (const isId of [true, false]) {
      const expired = tikTokCreatorInfoErrorMessage({ code: "access_token_expired" }, isId);
      expect(expired).toMatch(isId ? /Hubungkan ulang/ : /Reconnect/);
      expect(tikTokCreatorInfoErrorMessage({ code: "scope_missing" }, isId)).not.toEqual(expired);
      expect(tikTokCreatorInfoErrorMessage({ code: "token_decryption_failed" }, isId)).toMatch(isId ? /pengelola/ : /administrator/);
    }
  });
});
