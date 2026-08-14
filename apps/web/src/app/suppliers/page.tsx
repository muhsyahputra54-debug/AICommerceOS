import Link from "next/link";

import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteSupplierButton from "@/components/suppliers/DeleteSupplierButton";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function SuppliersPage() {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Suppliers
          </h1>
          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
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
    throw new Error(error.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Suppliers
            </h1>
            <p className="mt-2 text-muted-foreground">
              Kelola supplier untuk organization aktif.
            </p>
          </div>

          <Link
            href="/suppliers/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Add Supplier
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              Supplier Management
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {suppliers.length} supplier pada organization aktif.
            </p>
          </div>

          {suppliers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="font-medium">
                Belum ada supplier
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Supplier yang ditambahkan nanti akan tampil di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">
                      Supplier
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Email / Phone
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Added
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Actions
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
                          {supplier.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(supplier.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <Link
                            href={`/suppliers/${supplier.id}/edit`}
                            className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                          >
                            Edit
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
