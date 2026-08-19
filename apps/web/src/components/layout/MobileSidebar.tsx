"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  Bot,
  LayoutDashboard,
  Package,
  Search,
  Store,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  getDictionary,
  type Dictionary,
} from "@/lib/i18n/dictionaries";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
};

type NavigationItemKey =
  keyof Dictionary["navigation"]["items"];

type NavigationItem = {
  key: NavigationItemKey;
  icon: LucideIcon;
  href: string;
  children?: Array<{
    key: NavigationItemKey;
    href: string;
  }>;
};

const menus = [
  {
    key: "dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    key: "aiAssistant",
    icon: Bot,
    href: "/ai",
  },
  {
    key: "products",
    icon: Package,
    href: "/products",
  },
  {
    key: "marketplaces",
    icon: Store,
    href: "/marketplaces",
  },
  {
    key: "productResearch",
    icon: Search,
    href: "/research",
  },
  {
    key: "orders",
    icon: ShoppingCart,
    href: "/orders",
  },
  {
    key: "customers",
    icon: Users,
    href: "/customers",
  },
  {
    key: "suppliers",
    icon: Truck,
    href: "/suppliers",
  },
  {
    key: "analytics",
    icon: BarChart3,
    href: "/analytics",
    children: [
      {
        key: "analyticsOverview",
        href: "/analytics",
      },
      {
        key: "analyticsIntelligence",
        href: "/analytics/intelligence",
      },
    ],
  },
  {
    key: "settings",
    icon: Settings,
    href: "/settings",
  },
] satisfies NavigationItem[];

export default function MobileSidebar({
  open,
  onClose,
}: MobileSidebarProps) {
  const pathname = usePathname();

  const { locale } = useLanguage();
  const dictionary = getDictionary(locale);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label={dictionary.navigation.closeNavigation}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl">
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link
            href="/"
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {dictionary.navigation.sections.navigation}
          </p>

          {menus.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(
                    item.href,
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
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                      isActive
                        ? "text-sidebar-foreground"
                        : "text-sidebar-foreground/70"
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
                          child.href ===
                          "/analytics"
                            ? pathname ===
                              "/analytics"
                            : pathname ===
                                child.href ||
                              pathname.startsWith(
                                `${child.href}/`,
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
                            {
                              dictionary.navigation
                                .items[
                                child.key
                              ]
                            }
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
          })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 flex justify-end">
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
