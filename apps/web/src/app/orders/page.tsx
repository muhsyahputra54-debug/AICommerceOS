import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import OrderStatusActions from "@/components/orders/OrderStatusActions";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getCustomerName(
  customer: { name: string } | { name: string }[] | null,
) {
  if (Array.isArray(customer)) {
    return customer[0]?.name ?? "—";
  }

  return customer?.name ?? "—";
}
export default async function OrdersPage() {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Orders
          </h1>
          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total,
      created_at,
      customer:customers (
        name
      )
    `)
    .eq("organization_id", currentOrganization.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Orders
            </h1>
            <p className="mt-2 text-muted-foreground">
              Kelola dan pantau seluruh pesanan bisnis Anda.
            </p>
          </div>

          <Link
            href="/orders/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Add Order
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              Order Management
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length} pesanan pada organization aktif.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="font-medium">
                Belum ada pesanan
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Pesanan yang dibuat nanti akan tampil di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">
                      Order
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-6 py-4 font-medium">
                        {order.id.slice(0, 8)}
                      </td>

                      <td className="px-6 py-4">
                        {getCustomerName(order.customer)}
                      </td>

                      <td className="px-6 py-4">
                        {formatCurrency(Number(order.total))}
                      </td>

                      <td className="px-6 py-4 capitalize">
                        {order.status}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <OrderStatusActions
                          organizationId={
                            currentOrganization.organizationId
                          }
                          orderId={order.id}
                          status={
                            order.status as
                              | "pending"
                              | "processing"
                              | "completed"
                              | "cancelled"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}