"use client";

import {
  useState,
} from "react";
import {
  Bell,
  Menu,
  Search,
} from "lucide-react";

import {
  LanguageSwitcher,
} from "@/components/i18n/LanguageSwitcher";
import {
  useLanguage,
} from "@/components/i18n/LanguageProvider";
import {
  ThemeSwitcher,
} from "@/components/theme/ThemeSwitcher";
import {
  getDictionary,
} from "@/lib/i18n/dictionaries";

import MobileSidebar from "./MobileSidebar";
import UserProfile from "./UserProfile";

export default function Header() {
  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(false);

  const {
    locale,
  } =
    useLanguage();

  const dictionary =
    getDictionary(
      locale,
    );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-card/90 px-4 shadow-sm shadow-primary/5 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            aria-label={dictionary.header.openNavigation}
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent transition-colors hover:border-border/70 hover:bg-accent/70 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-border/80 bg-background/80 px-3 shadow-sm transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

              <input
                type="search"
                placeholder={dictionary.header.searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        <div className="ml-3 flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher className="hidden sm:inline-flex" />

          <ThemeSwitcher />

          <button
            type="button"
            title={dictionary.header.notifications}
            aria-label={dictionary.header.notifications}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent transition-colors hover:border-border/70 hover:bg-accent/70"
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <UserProfile />
        </div>
      </header>

      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
