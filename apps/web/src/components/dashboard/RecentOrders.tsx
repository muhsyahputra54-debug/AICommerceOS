import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type RecentOrdersCopy =
  Dictionary["dashboard"]["recentOrders"];

type OrderStatus =
  keyof RecentOrdersCopy["statuses"];

type OrderDate =
  keyof RecentOrdersCopy["dates"];

type RecentOrder = {
  customer: string;
  product: string;
  amount: string;
  status: OrderStatus;
  date: OrderDate;
};

const orders = [
  {
    customer: "Andi Pratama",
    product: "Premium Store",
    amount: "$120.00",
    status: "paid",
    date: "today",
  },
  {
    customer: "Budi Santoso",
    product: "Business Package",
    amount: "$85.00",
    status: "pending",
    date: "today",
  },
  {
    customer: "Sinta Dewi",
    product: "AI Commerce Pro",
    amount: "$240.00",
    status: "paid",
    date: "yesterday",
  },
  {
    customer: "Rizky Maulana",
    product: "Starter Package",
    amount: "$49.00",
    status: "paid",
    date: "yesterday",
  },
  {
    customer: "Dina Putri",
    product: "Enterprise Package",
    amount: "$450.00",
    status: "processing",
    date: "twoDaysAgo",
  },
] satisfies RecentOrder[];

function getStatusVariant(
  status: OrderStatus
) {
  switch (status) {
    case "paid":
      return "default";

    case "pending":
      return "secondary";

    case "processing":
      return "outline";

    default:
      return "outline";
  }
}

export default function RecentOrders({
  copy,
}: {
  copy: RecentOrdersCopy;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{copy.title}</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {copy.description}
            </p>
          </div>

          <Link
            href="/orders"
            className="text-sm font-medium text-primary hover:underline"
          >
            {copy.viewAll}
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 font-medium">
                  {copy.columns.customer}
                </th>

                <th className="pb-3 font-medium">
                  {copy.columns.product}
                </th>

                <th className="pb-3 font-medium">
                  {copy.columns.amount}
                </th>

                <th className="pb-3 font-medium">
                  {copy.columns.status}
                </th>

                <th className="pb-3 font-medium">
                  {copy.columns.date}
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr
                  key={`${order.customer}-${order.product}`}
                  className="border-b last:border-0"
                >
                  <td className="py-4 font-medium">
                    {order.customer}
                  </td>

                  <td className="py-4 text-muted-foreground">
                    {order.product}
                  </td>

                  <td className="py-4 font-medium">
                    {order.amount}
                  </td>

                  <td className="py-4">
                    <Badge
                      variant={getStatusVariant(
                        order.status
                      )}
                    >
                      {copy.statuses[order.status]}
                    </Badge>
                  </td>

                  <td className="py-4 text-muted-foreground">
                    {copy.dates[order.date]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
