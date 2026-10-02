import { describe, expect, it } from "vitest";
import { assessTikTokConnectionMetadata } from "./tiktok-creator-connection-health";

const organizationId = "22222222-2222-4222-8222-222222222222";
const now = Date.parse("2026-10-02T00:00:00Z");
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

describe("TikTok metadata-only connection health", () => {
  it("distinguishes an empty organization from an unusable connection", () => {
    expect(assessTikTokConnectionMetadata([], organizationId, now)).toEqual({
      ok: true, health: {
        status: "not_connected", checkedAt: new Date(now).toISOString(), expiresAt: null,
        providerVerified: false, credentialVerified: false,
      },
    });
  });

  it.each([
    [{}, "metadata_ready_unverified"],
    [{ granted_scopes: ["user.info.basic"] }, "scope_missing"],
    [{ supported_capabilities: ["publish_text"] }, "capability_missing"],
    [{ supported_capabilities: ["publish_image"] }, "metadata_ready_unverified"],
    [{ credential_expires_at: null }, "expiry_unknown"],
    [{ credential_expires_at: "2026-10-02T00:00:00Z" }, "access_token_expired"],
    [{ credential_expires_at: "2026-10-01T23:59:59Z" }, "access_token_expired"],
    [{ credential_expires_at: "2026-10-02T00:10:00Z" }, "access_token_expiring_soon"],
    [{ credential_expires_at: "2026-10-02T00:10:01Z" }, "metadata_ready_unverified"],
    [{ authorization_status: "reauthorization_required" }, "reauthorization_required"],
    [{ authorization_status: "revoked", revoked_at: "2026-10-01T00:00:00Z" }, "revoked"],
  ])("classifies metadata as %s / %s", (changes, status) => {
    expect(assessTikTokConnectionMetadata([{ ...row, ...changes }], organizationId, now))
      .toMatchObject({ ok: true, health: { status, providerVerified: false, credentialVerified: false } });
  });

  it("does not select one of multiple authorized accounts", () => {
    expect(assessTikTokConnectionMetadata([row, { ...row, id: "another-id" }], organizationId, now))
      .toMatchObject({ ok: true, health: { status: "connection_ambiguous" } });
  });

  it("does not count revoked history as a second active account", () => {
    expect(assessTikTokConnectionMetadata([
      row, { ...row, authorization_status: "revoked", revoked_at: "2026-10-01T00:00:00Z" },
    ], organizationId, now)).toMatchObject({ ok: true, health: { status: "metadata_ready_unverified" } });
  });

  it.each([
    null, {}, [{ ...row, provider: "youtube" }], [{ ...row, organization_id: "other-org" }],
    [{ ...row, credential_expires_at: "invalid" }], [{ ...row, access_token_ciphertext: "sensitive" }],
    [{ ...row, authorization_status: "revoked" }],
  ].map((rows) => ({ rows })))("rejects malformed, cross-tenant, or secret-bearing metadata", ({ rows }) => {
    expect(assessTikTokConnectionMetadata(rows, organizationId, now))
      .toEqual({ ok: false, code: "connection_metadata_invalid" });
  });

  it.each([NaN, Infinity, -1, 9e15])("rejects invalid clocks (%s)", (nowMs) => {
    expect(assessTikTokConnectionMetadata([], organizationId, nowMs))
      .toEqual({ ok: false, code: "connection_metadata_invalid" });
  });

  it("does not project identities or credential references into the response", () => {
    const output = JSON.stringify(assessTikTokConnectionMetadata([row], organizationId, now));
    for (const value of [organizationId, row.external_account_id, row.credential_reference_id, row.id]) {
      expect(output).not.toContain(value);
    }
  });

  it("rejects an empty organization even without connections", () => {
    expect(assessTikTokConnectionMetadata([], " ", now))
      .toEqual({ ok: false, code: "connection_metadata_invalid" });
  });

  it("prioritizes reauthorization when all stored connections are inactive", () => {
    expect(assessTikTokConnectionMetadata([
      { ...row, authorization_status: "revoked", revoked_at: "2026-10-01T00:00:00Z" },
      { ...row, authorization_status: "reauthorization_required" },
    ], organizationId, now)).toMatchObject({ ok: true, health: { status: "reauthorization_required" } });
  });
});
