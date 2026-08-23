"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
} from "lucide-react";

import {
  LanguageSwitcher,
} from "@/components/i18n/LanguageSwitcher";
import {
  useLanguage,
} from "@/components/i18n/LanguageProvider";
import {
  getDictionary,
} from "@/lib/i18n/dictionaries";

import {
  getNavigationChildLabel,
  getNavigationSectionLabel,
  isNavigationChildActive,
  isNavigationItemActive,
  navigationSections,
  settingsNavigationItem,
  type NavigationItem,
} from "./navigation";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function MobileSidebar({
  open,
  onClose,
}: MobileSidebarProps) {
  const pathname =
    usePathname();

  const {
    locale,
  } =
    useLanguage();

  const dictionary =
    getDictionary(
      locale,
    );

  const SettingsIcon =
    settingsNavigationItem.icon;

  if (!open) {
    return null;
  }

  const renderMenu = (
    item: NavigationItem,
  ) => {
    const Icon =
      item.icon;

    const isActive =
      isNavigationItemActive(
        pathname,
        item,
      );

    if (item.children?.length) {
      return (
        <div
          key={item.key}
          className="space-y-1"
        >
          <Link
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />

            <span>
              {
                dictionary.navigation.items[
                  item.key
                ]
              }
            </span>
          </Link>

          <div className="ml-5 space-y-1 border-l border-sidebar-border pl-3">
            {item.children.map(
              (child) => {
                const childActive =
                  isNavigationChildActive(
                    pathname,
                    item,
                    child,
                  );

                return (
                  <Link
                    key={child.key}
                    href={child.href}
                    onClick={onClose}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      childActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    {getNavigationChildLabel(
                      dictionary,
                      child.key,
                    )}
                  </Link>
                );
              },
            )}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" />

        <span>
          {
            dictionary.navigation.items[
              item.key
            ]
          }
        </span>
      </Link>
    );
  };

  const settingsActive =
    isNavigationItemActive(
      pathname,
      settingsNavigationItem,
    );

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label={dictionary.navigation.closeNavigation}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link
            href="/today"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="leading-tight">
              <p className="text-sm font-bold">
                LAKUVO
              </p>

              <p className="text-[11px] text-sidebar-foreground/60">
                {dictionary.brand.tagline}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label={dictionary.navigation.closeSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          {navigationSections.map(
            (
              section,
              index,
            ) => (
              <section
                key={section.key}
                className={
                  index === 0
                    ? ""
                    : "mt-7"
                }
              >
                <p className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">
                  {getNavigationSectionLabel(
                    section.key,
                    locale,
                  )}
                </p>

                <nav className="space-y-1">
                  {section.items.map(
                    renderMenu,
                  )}
                </nav>
              </section>
            ),
          )}
        </div>

        <div className="space-y-3 border-t border-sidebar-border p-3">
          <Link
            href={settingsNavigationItem.href}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              settingsActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <SettingsIcon className="h-5 w-5 shrink-0" />

            <span>
              {
                dictionary.navigation.items[
                  settingsNavigationItem.key
                ]
              }
            </span>
          </Link>

          <div className="flex justify-end">
            <LanguageSwitcher tone="sidebar" />
          </div>

          <div className="rounded-xl bg-sidebar-accent/60 p-3">
            <p className="text-xs font-medium">
              LAKUVO
            </p>

            <p className="mt-1 text-[11px] text-sidebar-foreground/60">
              v0.1.0 / Development
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
