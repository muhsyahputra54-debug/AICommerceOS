"use client";

import {
  Check,
  Monitor,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

import {
  useLanguage,
} from "@/components/i18n/LanguageProvider";
import {
  ThemeValue,
  useTheme,
} from "@/components/theme/ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeOption = {
  value: ThemeValue;
  icon: LucideIcon;
};

const themeOptions: ThemeOption[] = [
  {
    value: "light",
    icon: Sun,
  },
  {
    value: "dark",
    icon: Moon,
  },
  {
    value: "system",
    icon: Monitor,
  },
];

export function ThemeSwitcher() {
  const {
    locale,
  } =
    useLanguage();

  const {
    theme,
    setTheme,
  } =
    useTheme();

  const copy =
    locale === "id"
      ? {
          label:
            "Tema",
          light:
            "Terang",
          dark:
            "Gelap",
          system:
            "Sistem",
        }
      : {
          label:
            "Theme",
          light:
            "Light",
          dark:
            "Dark",
          system:
            "System",
        };

  const ActiveIcon =
    theme === "light"
      ? Sun
      : theme === "dark"
        ? Moon
        : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        title={copy.label}
        aria-label={copy.label}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent transition-colors hover:border-border/70 hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ActiveIcon className="h-5 w-5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-44"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {copy.label}
          </DropdownMenuLabel>

          {themeOptions.map(
            ({
              value,
              icon: Icon,
            }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => {
                  setTheme(
                    value,
                  );
                }}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />

                <span>
                  {copy[value]}
                </span>

                {theme === value ? (
                  <Check className="ml-auto h-4 w-4" />
                ) : null}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
