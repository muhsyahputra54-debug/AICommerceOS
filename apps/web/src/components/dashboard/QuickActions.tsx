import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  PackagePlus,
  ShoppingCart,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionaries";

type QuickActionCopy =
  Dictionary["dashboard"]["quickActions"];

type QuickActionKey =
  keyof QuickActionCopy["items"];

type QuickAction = {
  key: QuickActionKey;
  icon: LucideIcon;
  href: string;
};

const actions = [
  {
    key: "addProduct",
    icon: PackagePlus,
    href: "/products/new",
  },
  {
    key: "viewOrders",
    icon: ShoppingCart,
    href: "/orders",
  },
  {
    key: "customers",
    icon: Users,
    href: "/customers",
  },
  {
    key: "settings",
    icon: Settings,
    href: "/settings",
  },
] satisfies QuickAction[];

export default function QuickActions({
  copy,
}: {
  copy: QuickActionCopy;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>

        <p className="text-sm text-muted-foreground">
          {copy.description}
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const itemCopy =
              copy.items[action.key];

            return (
              <Link
                key={action.key}
                href={action.href}
                className="group flex items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <p className="font-medium">
                    {itemCopy.title}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {itemCopy.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
