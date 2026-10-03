export type TikTokOAuthAppUrlResult =
  | Readonly<{ ok: true; url: URL }>
  | Readonly<{ ok: false; error: string }>;

// Validate the return destination before issuing state or exchanging a code.
// Never derive this destination from request headers or callback parameters.
export function resolveTikTokOAuthAppUrl(value: string | undefined): TikTokOAuthAppUrlResult {
  if (!value?.trim()) {
    return { ok: false, error: "LAKUVO application URL is unavailable." };
  }
  try {
    const url = new URL(value.trim());
    if (
      !(url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost")) ||
      url.username || url.password || url.search || url.hash || url.pathname !== "/"
    ) {
      return { ok: false, error: "LAKUVO application URL is invalid." };
    }
    return { ok: true, url };
  } catch {
    return { ok: false, error: "LAKUVO application URL is invalid." };
  }
}
