"use client";

import * as React from "react";

export type ThemeValue =
  | "light"
  | "dark"
  | "system";

export type ResolvedTheme =
  | "light"
  | "dark";

type ThemeSnapshot =
  `${ThemeValue}:${ResolvedTheme}`;

type ThemeContextValue = {
  theme: ThemeValue;
  resolvedTheme: ResolvedTheme;
  setTheme: (
    theme: ThemeValue,
  ) => void;
};

const STORAGE_KEY =
  "lakuvo-theme";

const THEME_CHANGE_EVENT =
  "lakuvo-theme-change";

const SYSTEM_DARK_QUERY =
  "(prefers-color-scheme: dark)";

const ThemeContext =
  React.createContext<
    ThemeContextValue | undefined
  >(undefined);

function normalizeTheme(
  value: string | null,
): ThemeValue {
  if (
    value === "light" ||
    value === "dark" ||
    value === "system"
  ) {
    return value;
  }

  return "system";
}

function readStoredTheme(): ThemeValue {
  if (
    typeof window === "undefined"
  ) {
    return "system";
  }

  try {
    return normalizeTheme(
      window.localStorage.getItem(
        STORAGE_KEY,
      ),
    );
  } catch {
    return "system";
  }
}

function resolveTheme(
  theme: ThemeValue,
): ResolvedTheme {
  if (
    theme === "light" ||
    theme === "dark"
  ) {
    return theme;
  }

  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia ===
      "function" &&
    window.matchMedia(
      SYSTEM_DARK_QUERY,
    ).matches
  ) {
    return "dark";
  }

  return "light";
}

function syncDocumentTheme(
  theme: ThemeValue,
) {
  if (
    typeof document === "undefined"
  ) {
    return;
  }

  const resolved =
    resolveTheme(
      theme,
    );

  const root =
    document.documentElement;

  root.classList.remove(
    "light",
    "dark",
  );

  root.classList.add(
    resolved,
  );

  root.style.colorScheme =
    resolved;
}

function writeTheme(
  theme: ThemeValue,
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      theme,
    );
  } catch {
    // Theme application still works when
    // storage is unavailable.
  }

  syncDocumentTheme(
    theme,
  );

  window.dispatchEvent(
    new Event(
      THEME_CHANGE_EVENT,
    ),
  );
}

function getSnapshot(): ThemeSnapshot {
  const theme =
    readStoredTheme();

  const resolved =
    resolveTheme(
      theme,
    );

  return `${theme}:${resolved}`;
}

function getServerSnapshot(): ThemeSnapshot {
  return "system:light";
}

function subscribe(
  callback: () => void,
) {
  if (
    typeof window === "undefined"
  ) {
    return () => undefined;
  }

  const media =
    typeof window.matchMedia ===
      "function"
      ? window.matchMedia(
          SYSTEM_DARK_QUERY,
        )
      : null;

  const synchronize = () => {
    syncDocumentTheme(
      readStoredTheme(),
    );

    callback();
  };

  window.addEventListener(
    "storage",
    synchronize,
  );

  window.addEventListener(
    THEME_CHANGE_EVENT,
    callback,
  );

  media?.addEventListener(
    "change",
    synchronize,
  );

  return () => {
    window.removeEventListener(
      "storage",
      synchronize,
    );

    window.removeEventListener(
      THEME_CHANGE_EVENT,
      callback,
    );

    media?.removeEventListener(
      "change",
      synchronize,
    );
  };
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const snapshot =
    React.useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot,
    );

  const [
    theme,
    resolvedTheme,
  ] =
    snapshot.split(
      ":",
    ) as [
      ThemeValue,
      ResolvedTheme,
    ];

  const setTheme =
    React.useCallback(
      (
        nextTheme: ThemeValue,
      ) => {
        writeTheme(
          nextTheme,
        );
      },
      [],
    );

  const value =
    React.useMemo(
      () => ({
        theme,
        resolvedTheme,
        setTheme,
      }),
      [
        theme,
        resolvedTheme,
        setTheme,
      ],
    );

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    React.useContext(
      ThemeContext,
    );

  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider.",
    );
  }

  return context;
}
