"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Bot,
  ShoppingCart,
  Package,
  Users,
  Truck,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";

const mainMenus = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "AI Assistant",
    icon: Bot,
    href: "/ai",
  },
  {
    title: "Products",
    icon: Package,
    href: "/products",
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    href: "/orders",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers",
  },
  {
    title: "Suppliers",
    icon: Truck,
    href: "/suppliers",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
];

const systemMenus = [
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const renderMenu = (
    item: (typeof mainMenus)[number],
  ) => {
    const Icon = item.icon;

    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);

    return (
      <Link
        key={item.title}
        href={item.href}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Icon
          className={`h-5 w-5 shrink-0 transition-transform ${
            isActive ? "" : "group-hover:scale-105"
          }`}
        />

        <span>{item.title}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r bg-background md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center border-b px-5">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="leading-tight">
            <p className="text-sm font-bold">
              AI Commerce OS
            </p>

            <p className="text-[11px] text-muted-foreground">
              Business Intelligence
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-6">
        {/* Main */}
        <div>
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Main
          </p>

          <nav className="space-y-1">
            {mainMenus.map(renderMenu)}
          </nav>
        </div>

        {/* System */}
        <div className="mt-8">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            System
          </p>

          <nav className="space-y-1">
            {systemMenus.map(renderMenu)}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="text-xs font-medium">
            AI Commerce OS
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            v0.1.0 â€¢ Development
          </p>
        </div>
      </div>
    </aside>
  );
}
