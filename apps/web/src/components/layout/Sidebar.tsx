"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Bot,
  ShoppingCart,
  Package,
  Search,
  Store,
  Users,
  Truck,
  BarChart3,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  getDictionary,
  type Dictionary,
} from "@/lib/i18n/dictionaries";

type NavigationItemKey =
  keyof Dictionary["navigation"]["items"];

type NavigationItem = {
  key: NavigationItemKey;
  icon: LucideIcon;
  href: string;
};

const mainMenus = [
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
  },
] satisfies NavigationItem[];

const systemMenus = [
  {
    key: "settings",
    icon: Settings,
    href: "/settings",
  },
] satisfies NavigationItem[];

export default function Sidebar() {
  const pathname = usePathname();

  const { locale } = useLanguage();
  const dictionary = getDictionary(locale);

  const renderMenu = (
    item: NavigationItem
  ) => {
    const Icon = item.icon;

    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);

    return (
      <Link
        key={item.key}
        href={item.href}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-black/10"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <Icon
          className={`h-5 w-5 shrink-0 transition-transform ${
            isActive ? "" : "group-hover:scale-105"
          }`}
        />

        <span>
          {dictionary.navigation.items[item.key]}
        </span>
      </Link>
    );
  };

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center border-b px-5">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
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
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-6">
        <div>
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {dictionary.navigation.sections.main}
          </p>

          <nav className="space-y-1">
            {mainMenus.map(renderMenu)}
          </nav>
        </div>

        <div className="mt-8">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {dictionary.navigation.sections.system}
          </p>

          <nav className="space-y-1">
            {systemMenus.map(renderMenu)}
          </nav>
        </div>
      </div>

      <div className="border-t p-4">
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
  );
}
