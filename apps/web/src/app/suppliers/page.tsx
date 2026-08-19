import Link from "next/link";

import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteSupplierButton from "@/components/suppliers/DeleteSupplierButton";
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

export default async function SuppliersPage() {
  const locale = await getLocale();
  const copy = getDictionary(locale).suppliers.list;
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

  const { data: suppliers, error } = await supabase
    .from("suppliers")
    .select(
      "id, name, contact_name, email, phone, status, created_at",
    )
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
              {copy.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {copy.description}
            </p>
          </div>

          <Link
            href="/suppliers/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {copy.addSupplier}
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              {copy.managementTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {suppliers.length} {copy.managementCountSuffix}
            </p>
          </div>

          {suppliers.length === 0 ? (
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
                      {copy.columns.supplier}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.columns.contact}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.columns.emailPhone}
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      {copy.columns.status}
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
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-6 py-4 font-medium">
                        {supplier.name}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {supplier.contact_name ?? "—"}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        <div>{supplier.email ?? "—"}</div>
                        {supplier.phone ? (
                          <div className="mt-1 text-xs">
                            {supplier.phone}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            supplier.status === "active"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {supplier.status === "active"
                            ? copy.statuses.active
                            : supplier.status === "inactive"
                              ? copy.statuses.inactive
                              : supplier.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(supplier.created_at, localeTag)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <Link
                            href={`/suppliers/${supplier.id}/edit`}
                            className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                          >
                            {copy.edit}
                          </Link>

                          <DeleteSupplierButton
                            organizationId={
                              currentOrganization.organizationId
                            }
                            supplierId={supplier.id}
                            supplierName={supplier.name}
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
