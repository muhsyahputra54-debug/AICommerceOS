import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import EditSupplierForm from "@/components/suppliers/EditSupplierForm";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type EditSupplierPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditSupplierPage({
  params,
}: EditSupplierPageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Supplier
          </h1>
          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: supplier, error } = await supabase
    .from("suppliers")
    .select(
      "id, name, contact_name, email, phone, address, notes, status",
    )
    .eq("id", id)
    .eq("organization_id", currentOrganization.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!supplier) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Supplier
          </h1>
          <p className="mt-2 text-muted-foreground">
            Perbarui informasi supplier pada organization aktif.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <EditSupplierForm
            organizationId={currentOrganization.organizationId}
            supplier={supplier}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
