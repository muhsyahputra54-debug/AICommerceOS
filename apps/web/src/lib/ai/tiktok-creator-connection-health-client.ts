import type { TikTokConnectionMetadataHealth, TikTokConnectionMetadataStatus } from "./tiktok-creator-connection-health";

type HealthCopy = Readonly<{ title: string; detail: string; warning: boolean }>;
const COPY: Record<TikTokConnectionMetadataStatus, readonly [string, string, string, string]> = {
  not_connected: ["Belum terhubung", "Hubungkan akun TikTok untuk memulai.", "Not connected", "Connect a TikTok account to get started."],
  revoked: ["Akses dicabut", "Hubungkan ulang untuk memberikan izin akses kembali.", "Access revoked", "Reconnect to grant access again."],
  reauthorization_required: ["Perlu otorisasi ulang", "Hubungkan ulang akun TikTok Anda.", "Reauthorization required", "Reconnect your TikTok account."],
  connection_ambiguous: ["Akun tujuan belum pasti", "Ada beberapa koneksi aktif. Minta pengelola memeriksa akun tujuan.", "Destination account is unclear", "Multiple connections are active. Ask an administrator to check the destination account."],
  scope_missing: ["Izin publikasi belum lengkap", "Hubungkan ulang dan setujui izin publikasi yang diperlukan.", "Publishing permission is incomplete", "Reconnect and approve the required publishing permission."],
  capability_missing: ["Publikasi belum tersedia", "Minta pengelola memeriksa kemampuan publikasi akun ini.", "Publishing is unavailable", "Ask an administrator to check this account's publishing capabilities."],
  expiry_unknown: ["Masa berlaku belum diketahui", "Minta pengelola memeriksa masa berlaku akses sebelum publikasi.", "Access expiry is unknown", "Ask an administrator to check access expiry before publishing."],
  access_token_expired: ["Akses kedaluwarsa", "Hubungkan ulang akun TikTok sebelum menyiapkan publikasi.", "Access expired", "Reconnect your TikTok account before preparing a post."],
  access_token_expiring_soon: ["Akses segera kedaluwarsa", "Masa berlaku akses tersimpan kurang dari atau sama dengan 10 menit.", "Access expires soon", "The saved access expires within 10 minutes."],
  metadata_ready_unverified: ["Data koneksi tersedia", "Validitas akses belum diperiksa ke TikTok. Publikasi tetap memerlukan persetujuan Anda.", "Connection metadata is available", "Access validity has not been checked with TikTok. Publishing still requires your consent."],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

export function parseTikTokConnectionHealthResponse(payload: unknown): TikTokConnectionMetadataHealth | null {
  if (!isRecord(payload) || Object.keys(payload).length !== 1 || !isRecord(payload.health)) return null;
  const health = payload.health;
  const keys = ["status", "checkedAt", "expiresAt", "providerVerified", "credentialVerified"];
  if (
    Object.keys(health).length !== keys.length || !Object.keys(health).every((key) => keys.includes(key)) ||
    typeof health.status !== "string" || !Object.hasOwn(COPY, health.status) ||
    !isDate(health.checkedAt) || !(health.expiresAt === null || isDate(health.expiresAt)) ||
    health.providerVerified !== false || health.credentialVerified !== false
  ) return null;
  return {
    status: health.status as TikTokConnectionMetadataStatus,
    checkedAt: new Date(health.checkedAt).toISOString(),
    expiresAt: health.expiresAt === null ? null : new Date(health.expiresAt).toISOString(),
    providerVerified: false, credentialVerified: false,
  };
}

export function tikTokConnectionHealthCopy(status: TikTokConnectionMetadataStatus, isId: boolean): HealthCopy {
  const copy = COPY[status];
  return {
    title: copy[isId ? 0 : 2], detail: copy[isId ? 1 : 3],
    warning: status !== "not_connected" && status !== "metadata_ready_unverified",
  };
}

export async function loadTikTokConnectionHealth(
  signal: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<TikTokConnectionMetadataHealth | null> {
  try {
    const response = await fetchImpl("/api/ai/publishing-provider-connections/tiktok/health", {
      method: "GET", credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" }, signal,
    });
    if (!response.ok || signal.aborted) return null;
    const payload: unknown = await response.json();
    return signal.aborted ? null : parseTikTokConnectionHealthResponse(payload);
  } catch {
    return null;
  }
}
