import { projectPublishingProviderConnectionList } from "./publishing-provider-connection-runtime";

export type TikTokConnectionMetadataStatus =
  | "not_connected"
  | "revoked"
  | "reauthorization_required"
  | "connection_ambiguous"
  | "scope_missing"
  | "capability_missing"
  | "expiry_unknown"
  | "access_token_expired"
  | "access_token_expiring_soon"
  | "metadata_ready_unverified";

export type TikTokConnectionMetadataHealth = Readonly<{
  status: TikTokConnectionMetadataStatus;
  checkedAt: string;
  expiresAt: string | null;
  providerVerified: false;
  credentialVerified: false;
}>;

// This reads connection metadata only. It cannot prove a credential exists,
// decrypt a token, refresh it, or establish that TikTok accepts it.
export function assessTikTokConnectionMetadata(
  rows: unknown,
  organizationId: string,
  nowMs = Date.now(),
):
  | Readonly<{ ok: true; health: TikTokConnectionMetadataHealth }>
  | Readonly<{ ok: false; code: "connection_metadata_invalid" }> {
  const connections = projectPublishingProviderConnectionList(rows);
  const checkedAt = new Date(nowMs);
  if (
    !organizationId.trim() || !connections || nowMs < 0 ||
    Number.isNaN(checkedAt.getTime()) ||
    connections.some((c) => c.provider !== "tiktok" || c.organizationId !== organizationId)
  ) {
    return { ok: false, code: "connection_metadata_invalid" };
  }

  const result = (status: TikTokConnectionMetadataStatus, expiresAt: string | null = null) => ({
    ok: true as const,
    health: {
      status, checkedAt: checkedAt.toISOString(), expiresAt,
      providerVerified: false as const, credentialVerified: false as const,
    },
  });
  if (connections.length === 0) return result("not_connected");

  const active = connections.filter((c) => c.authorizationStatus === "authorized");
  if (active.length > 1) return result("connection_ambiguous");
  if (active.length === 0) {
    return result(connections.some((c) => c.authorizationStatus === "reauthorization_required")
      ? "reauthorization_required" : "revoked");
  }

  const connection = active[0];
  const storedExpiry = connection.credentialReference.expiresAt;
  const expiresAt = storedExpiry === null ? null : new Date(storedExpiry).toISOString();
  if (!connection.grantedScopes.includes("video.publish")) return result("scope_missing", expiresAt);
  if (!connection.supportedCapabilities.some((c) => c === "publish_video" || c === "publish_image")) {
    return result("capability_missing", expiresAt);
  }
  if (expiresAt === null) return result("expiry_unknown");
  const remainingMs = Date.parse(expiresAt) - nowMs;
  if (remainingMs <= 0) return result("access_token_expired", expiresAt);
  if (remainingMs <= 10 * 60 * 1000) return result("access_token_expiring_soon", expiresAt);
  return result("metadata_ready_unverified", expiresAt);
}
