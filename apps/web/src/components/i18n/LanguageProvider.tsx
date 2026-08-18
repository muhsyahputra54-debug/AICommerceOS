"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n/config";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LanguageContext =
  createContext<LanguageContextValue | null>(null);

const localeListeners = new Set<() => void>();

function subscribeToLocale(
  listener: () => void
): () => void {
  localeListeners.add(listener);

  return () => {
    localeListeners.delete(listener);
  };
}

function emitLocaleChange(): void {
  for (const listener of localeListeners) {
    listener();
  }
}

function readPersistedLocale(): Locale {
  if (typeof document === "undefined") {
    return DEFAULT_LOCALE;
  }

  const prefix = `${LOCALE_COOKIE}=`;

  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix));

  if (!entry) {
    return DEFAULT_LOCALE;
  }

  return normalizeLocale(
    decodeURIComponent(entry.slice(prefix.length))
  );
}

function getServerLocaleSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const locale = useSyncExternalStore(
    subscribeToLocale,
    readPersistedLocale,
    getServerLocaleSnapshot
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      const normalizedLocale =
        normalizeLocale(nextLocale);

      const secure =
        window.location.protocol === "https:"
          ? "; Secure"
          : "";

      document.cookie =
        `${LOCALE_COOKIE}=${normalizedLocale}; ` +
        `Path=/; Max-Age=31536000; SameSite=Lax${secure}`;

      document.documentElement.lang =
        normalizedLocale;

      emitLocaleChange();
      router.refresh();
    },
    [router]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}
