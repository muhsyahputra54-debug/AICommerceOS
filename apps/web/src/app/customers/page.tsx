import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteCustomerButton from "@/components/customers/DeleteCustomerButton";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function CustomersPage() {
  const locale = await getLocale();
  const copy = getDictionary(locale).customers.list;
  const localeTag =
    locale === "id" ? "id-ID" : "en-US";

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {copy.noOrganization}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, email, phone, created_at")
    .eq("organization_id", currentOrganization.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(copy.errors.loadFailed);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {copy.description}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {copy.managementTitle}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {customers.length} {copy.managementCountSuffix}
                </p>
              </div>

              <Link
                href="/customers/new"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                {copy.addCustomer}
              </Link>
            </div>
          </div>

          {customers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="font-medium">
                {copy.emptyTitle}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {copy.emptyDescription}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.columns.customer}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.columns.email}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.columns.phone}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.columns.added}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.columns.actions}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-6 py-4 font-medium">
                        {customer.name}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {customer.email ?? "\u2014"}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {customer.phone ?? "\u2014"}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(customer.created_at, localeTag)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <Link
                            href={`/customers/${customer.id}/edit`}
                            className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                          >
                            {copy.edit}
                          </Link>

                          <DeleteCustomerButton
                            organizationId={currentOrganization.organizationId}
                            customerId={customer.id}
                            customerName={customer.name}
                          />
                        </div>
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