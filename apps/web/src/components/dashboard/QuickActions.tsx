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
} from "lucide-react";

const actions = [
  {
    title: "Add Product",
    description: "Tambah produk baru",
    icon: PackagePlus,
    href: "/products/new",
  },
  {
    title: "View Orders",
    description: "Kelola pesanan",
    icon: ShoppingCart,
    href: "/orders",
  },
  {
    title: "Customers",
    description: "Lihat pelanggan",
    icon: Users,
    href: "/customers",
  },
  {
    title: "Settings",
    description: "Pengaturan sistem",
    icon: Settings,
    href: "/settings",
  },
];

export default function QuickActions() {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>

        <p className="text-sm text-muted-foreground">
          Akses cepat ke fitur utama.
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <p className="font-medium">
                    {action.title}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {action.description}
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