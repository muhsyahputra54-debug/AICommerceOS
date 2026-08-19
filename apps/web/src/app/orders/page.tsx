import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import OrderStatusActions from "@/components/orders/OrderStatusActions";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getCustomerName(
  customer: { name: string } | { name: string }[] | null,
) {
  if (Array.isArray(customer)) {
    return customer[0]?.name ?? "\u2014";
  }

  return customer?.name ?? "\u2014";
}
export default async function OrdersPage() {
  const locale = await getLocale();
  const copy = getDictionary(locale).orders;
  const localeTag =
    locale === "id" ? "id-ID" : "en-US";

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.list.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {copy.list.noOrganization}
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
    throw new Error(copy.errors.loadFailed);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {copy.list.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {copy.list.description}
            </p>
          </div>

          <Link
            href="/orders/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {copy.list.addOrder}
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              {copy.list.managementTitle}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length} {copy.list.managementCountSuffix}
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="font-medium">
                {copy.list.emptyTitle}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                {copy.list.emptyDescription}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.list.columns.order}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.list.columns.customer}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.list.columns.total}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.list.columns.status}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.list.columns.created}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.list.columns.actions}
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
                        {formatCurrency(Number(order.total), localeTag)}
                      </td>

                      <td className="px-6 py-4 capitalize">
                        {
                          copy.statuses[
                            order.status as keyof typeof copy.statuses
                          ] ?? order.status
                        }
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(order.created_at, localeTag)}
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