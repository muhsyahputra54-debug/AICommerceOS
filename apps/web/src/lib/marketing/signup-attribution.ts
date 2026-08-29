export const TIKTOK_EARLY_ACCESS_SIGNUP_SOURCE =
  "tiktok_early_access" as const;

export type MarketingSignupSource =
  typeof TIKTOK_EARLY_ACCESS_SIGNUP_SOURCE;

export function normalizeMarketingSignupSource(
  value: unknown,
): MarketingSignupSource | null {
  return value ===
    TIKTOK_EARLY_ACCESS_SIGNUP_SOURCE
    ? TIKTOK_EARLY_ACCESS_SIGNUP_SOURCE
    : null;
}

export function buildMarketingSignupHref(
  source: MarketingSignupSource,
): string {
  return `/signup?source=${encodeURIComponent(
    source,
  )}`;
}