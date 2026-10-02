// Only known diagnostic codes may cross the server/client boundary.
const ERROR_CODES = [
  "connection_unavailable", "connection_ambiguous", "scope_missing",
  "credential_unavailable", "credential_invalid", "token_keyring_unavailable",
  "token_decryption_failed", "access_token_expired", "creator_info_request_failed",
  "creator_info_provider_error", "creator_info_response_invalid",
  "authentication_context_unavailable", "unauthorized", "forbidden",
] as const;

const PROVIDER_CODES = [
  "access_token_invalid", "scope_not_authorized", "rate_limit_exceeded",
  "internal_error", "spam_risk_too_many_posts", "spam_risk_user_banned_from_posting",
  "reached_active_user_cap",
] as const;

export type TikTokCreatorInfoErrorCode = (typeof ERROR_CODES)[number];
export type TikTokCreatorInfoProviderCode = (typeof PROVIDER_CODES)[number];
export type TikTokCreatorInfoFailure = Readonly<{
  code: TikTokCreatorInfoErrorCode;
  providerCode?: TikTokCreatorInfoProviderCode;
}>;

export function safeTikTokCreatorInfoProviderCode(value: unknown): TikTokCreatorInfoProviderCode | undefined {
  return PROVIDER_CODES.find((code) => code === value);
}

export function parseTikTokCreatorInfoFailure(value: unknown, status: number): TikTokCreatorInfoFailure {
  const body = typeof value === "object" && value !== null
    ? value as Record<string, unknown> : {};
  const code = ERROR_CODES.find((candidate) => candidate === body.error)
    ?? (status === 401 ? "unauthorized" : status === 403 ? "forbidden" : "creator_info_request_failed");
  const providerCode = safeTikTokCreatorInfoProviderCode(body.providerCode);
  return { code, ...(providerCode ? { providerCode } : {}) };
}

export function tikTokCreatorInfoErrorMessage(failure: TikTokCreatorInfoFailure, isId: boolean): string {
  if (failure.code === "unauthorized" || failure.code === "authentication_context_unavailable") {
    return isId ? "Sesi LAKUVO tidak tersedia. Masuk kembali lalu coba lagi." : "Your LAKUVO session is unavailable. Sign in again and retry.";
  }
  if (failure.code === "forbidden") {
    return isId ? "Anda tidak memiliki akses untuk menyiapkan publikasi pada workspace ini." : "You do not have access to prepare publishing in this workspace.";
  }
  if (failure.code === "access_token_expired" || failure.providerCode === "access_token_invalid") {
    return isId ? "Akses TikTok sudah kedaluwarsa atau tidak valid. Hubungkan ulang TikTok untuk memperbarui izin." : "TikTok access has expired or is invalid. Reconnect TikTok to renew authorization.";
  }
  if (failure.code === "scope_missing" || failure.providerCode === "scope_not_authorized") {
    return isId ? "Izin publikasi TikTok belum tersedia. Hubungkan ulang TikTok dan berikan izin publikasi." : "TikTok publishing permission is unavailable. Reconnect TikTok and grant publishing permission.";
  }
  if (failure.code === "connection_unavailable") {
    return isId ? "Koneksi TikTok tidak tersedia. Hubungkan akun TikTok terlebih dahulu." : "No TikTok connection is available. Connect a TikTok account first.";
  }
  if (failure.providerCode === "rate_limit_exceeded") {
    return isId ? "Batas permintaan TikTok tercapai. Tunggu sebentar sebelum mencoba lagi." : "TikTok's request limit was reached. Wait before retrying.";
  }
  if (failure.code === "connection_ambiguous" || failure.code.startsWith("credential_") || failure.code.startsWith("token_")) {
    return isId ? "Konfigurasi koneksi TikTok perlu diperiksa oleh pengelola LAKUVO." : "The TikTok connection configuration needs attention from your LAKUVO administrator.";
  }
  return isId ? "Informasi kreator TikTok belum dapat dimuat. Coba lagi nanti; jika tetap gagal, hubungi pengelola LAKUVO." : "TikTok creator information could not be loaded. Retry later; if the problem persists, contact your LAKUVO administrator.";
}
