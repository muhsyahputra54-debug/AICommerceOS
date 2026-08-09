import DashboardLayout from "@/components/layout/DashboardLayout";
import AddCustomerForm from "@/components/customers/AddCustomerForm";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";

export default async function NewCustomerPage() {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add Customer
          </h1>
          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add Customer
          </h1>
          <p className="mt-2 text-muted-foreground">
            Tambahkan pelanggan baru ke organization aktif.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <AddCustomerForm
            organizationId={currentOrganization.organizationId}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}