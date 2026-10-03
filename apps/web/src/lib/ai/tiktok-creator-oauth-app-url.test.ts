import { describe, expect, it } from "vitest";
import { resolveTikTokOAuthAppUrl } from "./tiktok-creator-oauth-app-url";

describe("TikTok OAuth application origin", () => {
  it.each([undefined, "", "  "])("rejects missing configuration (%s)", (value) => {
    expect(resolveTikTokOAuthAppUrl(value)).toEqual({ ok: false, error: "LAKUVO application URL is unavailable." });
  });
  it.each([
    "invalid", "http://example.test", "ftp://localhost", "javascript:alert(1)",
    "https://user:secret@example.test", "https://example.test/growth",
    "https://example.test?code=private", "https://example.test/#fragment",
  ])("rejects unsafe or non-origin destinations (%s)", (value) => {
    expect(resolveTikTokOAuthAppUrl(value)).toEqual({ ok: false, error: "LAKUVO application URL is invalid." });
  });
  it.each([" https://staging.example.test ", "https://staging.example.test/", "http://localhost:3000"])("accepts configured HTTPS origins or local HTTP (%s)", (value) => {
    const result = resolveTikTokOAuthAppUrl(value);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url.pathname).toBe("/");
  });
});
