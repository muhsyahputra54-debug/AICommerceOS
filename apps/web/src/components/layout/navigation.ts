import {
  BarChart3,
  Bot,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Sun,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

import type {
  Dictionary,
} from "@/lib/i18n/dictionaries";

export type NavigationItemKey =
  keyof Dictionary["navigation"]["items"];

export type NavigationChildKey =
  | NavigationItemKey
  | "aiActionCenter";

export type NavigationChild = {
  key: NavigationChildKey;
  href: string;
};

export type NavigationItem = {
  key: NavigationItemKey;
  icon: LucideIcon;
  href: string;
  children?: NavigationChild[];
};

export type NavigationSectionKey =
  | "main"
  | "aiAutomation"
  | "operations"
  | "analytics";

export type NavigationSection = {
  key: NavigationSectionKey;
  items: NavigationItem[];
};

export const navigationSections: NavigationSection[] = [
  {
    key: "main",
    items: [
      {
        key: "today",
        icon: Sun,
        href: "/today",
      },
      {
        key: "dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
    ],
  },
  {
    key: "aiAutomation",
    items: [
      {
        key: "lakuvoAi",
        icon: Bot,
        href: "/ai",
        children: [
          {
            key: "aiAssistant",
            href: "/ai",
          },
          {
            key: "aiAgents",
            href: "/agents",
          },
          {
            key: "aiActionCenter",
            href: "/ai/action-center",
          },
        ],
      },
    ],
  },
  {
    key: "operations",
    items: [
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
    ],
  },
  {
    key: "analytics",
    items: [
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
    ],
  },
];

export const settingsNavigationItem: NavigationItem = {
  key: "settings",
  icon: Settings,
  href: "/settings",
};

export function getNavigationSectionLabel(
  section: NavigationSectionKey,
  locale: string,
) {
  const labels =
    locale === "id"
      ? {
          main: "UTAMA",
          aiAutomation: "AI & OTOMASI",
          operations: "OPERASIONAL",
          analytics: "ANALITIK",
        }
      : {
          main: "MAIN",
          aiAutomation: "AI & AUTOMATION",
          operations: "OPERATIONS",
          analytics: "ANALYTICS",
        };

  return labels[section];
}

export function getNavigationChildLabel(
  dictionary: Dictionary,
  key: NavigationChildKey,
) {
  if (key === "aiActionCenter") {
    return "Action Center";
  }

  return dictionary.navigation.items[key];
}

export function isNavigationHrefActive(
  pathname: string,
  href: string,
) {
  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

export function isNavigationChildActive(
  pathname: string,
  parent: NavigationItem,
  child: NavigationChild,
) {
  if (child.href === parent.href) {
    return pathname === child.href;
  }

  return isNavigationHrefActive(
    pathname,
    child.href,
  );
}

export function isNavigationItemActive(
  pathname: string,
  item: NavigationItem,
) {
  if (item.children?.length) {
    return item.children.some(
      (child) =>
        isNavigationChildActive(
          pathname,
          item,
          child,
        ),
    );
  }

  return isNavigationHrefActive(
    pathname,
    item.href,
  );
}
