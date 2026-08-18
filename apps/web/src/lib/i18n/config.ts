export const SUPPORTED_LOCALES = ["id", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "id";

export const LOCALE_COOKIE = "lakuvo_locale";

export function normalizeLocale(value?: string | null): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}