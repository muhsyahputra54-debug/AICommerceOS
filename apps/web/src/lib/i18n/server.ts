import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  normalizeLocale,
  type Locale,
} from "./config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;

  return value ? normalizeLocale(value) : DEFAULT_LOCALE;
}