"use client";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

import { useLanguage } from "./LanguageProvider";

type LanguageSwitcherProps = {
  tone?: "default" | "sidebar";
  className?: string;
};

const options: Array<{
  locale: Locale;
  label: string;
  title: string;
}> = [
  {
    locale: "id",
    label: "ID",
    title: "Bahasa Indonesia",
  },
  {
    locale: "en",
    label: "EN",
    title: "English",
  },
];

export function LanguageSwitcher({
  tone = "default",
  className,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  const sidebar = tone === "sidebar";

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={cn(
        "inline-flex items-center rounded-lg border p-0.5",
        sidebar
          ? "border-sidebar-border bg-sidebar-accent/30"
          : "border-border/80 bg-background/70",
        className
      )}
    >
      {options.map((option, index) => {
        const active = locale === option.locale;

        return (
          <div
            key={option.locale}
            className="flex items-center"
          >
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "px-0.5 text-xs",
                  sidebar
                    ? "text-sidebar-foreground/35"
                    : "text-muted-foreground/50"
                )}
              >
                |
              </span>
            ) : null}

            <button
              type="button"
              title={option.title}
              aria-pressed={active}
              onClick={() => setLocale(option.locale)}
              className={cn(
                "min-w-8 rounded-md px-2 py-1 text-xs font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                sidebar
                  ? active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  : active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
