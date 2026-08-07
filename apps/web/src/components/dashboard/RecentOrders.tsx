import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

const orders = [
  {
    customer: "Andi Pratama",
    product: "Premium Store",
    amount: "$120.00",
    status: "Paid",
    date: "Hari ini",
  },
  {
    customer: "Budi Santoso",
    product: "Business Package",
    amount: "$85.00",
    status: "Pending",
    date: "Hari ini",
  },
  {
    customer: "Sinta Dewi",
    product: "AI Commerce Pro",
    amount: "$240.00",
    status: "Paid",
    date: "Kemarin",
  },
  {
    customer: "Rizky Maulana",
    product: "Starter Package",
    amount: "$49.00",
    status: "Paid",
    date: "Kemarin",
  },
  {
    customer: "Dina Putri",
    product: "Enterprise Package",
    amount: "$450.00",
    status: "Processing",
    date: "2 hari lalu",
  },
];

function getStatusVariant(status: string) {
  switch (status) {
    case "Paid":
      return "default";

    case "Pending":
      return "secondary";

    case "Processing":
      return "outline";

    default:
      return "outline";
  }
}

export default function RecentOrders() {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Transaksi terbaru
            </p>
          </div>

          <button className="text-sm font-medium text-primary hover:underline">
            Lihat semua
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 font-medium">
                  Customer
                </th>

                <th className="pb-3 font-medium">
                  Product
                </th>

                <th className="pb-3 font-medium">
                  Amount
                </th>

                <th className="pb-3 font-medium">
                  Status
                </th>

                <th className="pb-3 font-medium">
                  Date
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
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </td>

                  <td className="py-4 text-muted-foreground">
                    {order.date}
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