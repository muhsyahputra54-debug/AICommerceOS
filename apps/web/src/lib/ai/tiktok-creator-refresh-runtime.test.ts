import { describe, expect, it, vi } from "vitest";
import { decryptPublishingProviderToken, parseTikTokCreatorTokenResponse } from "./tiktok-creator-oauth-server";
import { exchangeTikTokCreatorRefreshToken, prepareTikTokCreatorTokenRotation } from "./tiktok-creator-refresh-runtime";

const request = { clientKey: "app", clientSecret: "private-client", refreshToken: "old-refresh", externalAccountId: "creator" };
const payload = {
  open_id: "creator", access_token: "new-access", refresh_token: "new-refresh",
  token_type: "Bearer", expires_in: 86400, refresh_expires_in: 31536000,
  scope: "user.info.basic,video.publish",
};
const transport = (body: unknown, status = 200) => vi.fn<typeof fetch>(async () =>
  new Response(JSON.stringify(body), { status }));
const keyring = { activeVersion: "new", keys: new Map([["new", Buffer.alloc(32, 7)]]) };
const nowMs = Date.parse("2026-10-03T13:00:00Z");

describe("TikTok Creator refresh foundation (mock transport only)", () => {
  it("uses the fixed endpoint and refresh grant, retaining the replacement refresh token", async () => {
    const fetchImpl = transport(payload);
    const result = await exchangeTikTokCreatorRefreshToken(request, fetchImpl);
    expect(result).toMatchObject({ ok: true, value: { refreshToken: "new-refresh" } });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://open.tiktokapis.com/v2/oauth/token/");
    expect(init).toMatchObject({ method: "POST", cache: "no-store", redirect: "error" });
    expect(Object.fromEntries(init?.body as URLSearchParams)).toEqual({
      client_key: "app", client_secret: "private-client", refresh_token: "old-refresh", grant_type: "refresh_token",
    });
  });
  it.each(Object.keys(request))("rejects missing %s before transport", async (field) => {
    const fetchImpl = transport(payload);
    expect(await exchangeTikTokCreatorRefreshToken({ ...request, [field]: " " }, fetchImpl))
      .toEqual({ ok: false, code: "refresh_request_invalid" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("does not retry or disclose transport errors", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => { throw new Error("private-client old-refresh"); });
    expect(await exchangeTikTokCreatorRefreshToken(request, fetchImpl))
      .toEqual({ ok: false, code: "refresh_request_ambiguous" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("accepts an unchanged refresh token", async () => {
    expect(await exchangeTikTokCreatorRefreshToken(request, transport({ ...payload, refresh_token: request.refreshToken })))
      .toMatchObject({ ok: true, value: { refreshToken: "old-refresh" } });
  });
  it.each([
    [400, "invalid_grant", "reauthorization_required"],
    [400, "invalid_client", "refresh_rejected"],
    [429, "rate_limit_exceeded", "refresh_rejected"],
    [500, "invalid_grant", "refresh_rejected"],
    [200, "invalid_grant", "refresh_rejected"],
  ])("classifies HTTP %s / %s without exposing provider details", async (status, error, code) => {
    expect(await exchangeTikTokCreatorRefreshToken(request, transport({ error, error_description: "private-client" }, status as number)))
      .toEqual({ ok: false, code });
  });
  it("rejects malformed JSON", async () => {
    expect(await exchangeTikTokCreatorRefreshToken(request, vi.fn(async () => new Response("not-json"))))
      .toEqual({ ok: false, code: "refresh_response_invalid" });
  });
  it.each([
    [{ ...payload, open_id: "another-creator" }, "creator_identity_mismatch"],
    [{ ...payload, scope: "user.info.basic" }, "required_scope_missing"],
    [{ ...payload, refresh_token: "" }, "refresh_response_invalid"],
    [{ ...payload, refresh_expires_in: -1 }, "refresh_response_invalid"],
    [{ ...payload, expires_in: 0 }, "refresh_response_invalid"],
    [{ ...payload, token_type: "Basic" }, "refresh_response_invalid"],
  ])("rejects unsafe success payload %#", async (body, code) => {
    expect(await exchangeTikTokCreatorRefreshToken(request, transport(body))).toEqual({ ok: false, code });
  });
  it("encrypts both replacement tokens under the active key with correct expiry and identity binding", async () => {
    const token = parseTikTokCreatorTokenResponse(payload);
    if (!token.ok) throw new Error("fixture invalid");
    const result = prepareTikTokCreatorTokenRotation({ organizationId: "org", externalAccountId: "creator", token: token.value, keyring, nowMs });
    if (!result.ok) throw new Error("rotation invalid");
    expect(result.value.accessTokenExpiresAt).toBe("2026-10-04T13:00:00.000Z");
    expect(result.value.refreshTokenExpiresAt).toBe("2027-10-03T13:00:00.000Z");
    expect(JSON.stringify(result)).not.toContain("new-refresh");
    expect(JSON.stringify(result)).not.toContain("new-access");
    for (const kind of ["access", "refresh"] as const) {
      const input = {
        ciphertext: kind === "access" ? result.value.accessTokenCiphertext : result.value.refreshTokenCiphertext,
        organizationId: "org", externalAccountId: "creator", tokenKind: kind, keyVersion: "new", keyring,
      };
      expect(await decryptPublishingProviderToken(input)).toBe(kind === "access" ? "new-access" : "new-refresh");
      expect(await decryptPublishingProviderToken({ ...input, organizationId: "other-org" })).toBeNull();
      expect(await decryptPublishingProviderToken({ ...input, tokenKind: kind === "access" ? "refresh" : "access" })).toBeNull();
    }
  });
  it.each([NaN, -1, Number.MAX_SAFE_INTEGER])("rejects invalid clock %s without throwing", (clock) => {
    const token = parseTikTokCreatorTokenResponse(payload);
    if (!token.ok) throw new Error("fixture invalid");
    expect(prepareTikTokCreatorTokenRotation({ organizationId: "org", externalAccountId: "creator", token: token.value, keyring, nowMs: clock }))
      .toEqual({ ok: false, code: "credential_encryption_failed" });
  });
  it("rejects a missing encryption key and mismatched account before producing ciphertext", () => {
    const token = parseTikTokCreatorTokenResponse(payload);
    if (!token.ok) throw new Error("fixture invalid");
    for (const input of [
      { externalAccountId: "other-account", keyring },
      { externalAccountId: "creator", keyring: { ...keyring, keys: new Map() } },
    ]) {
      expect(prepareTikTokCreatorTokenRotation({ organizationId: "org", token: token.value, nowMs, ...input }))
        .toEqual({ ok: false, code: "credential_encryption_failed" });
    }
  });
});
