import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import EditCustomerForm from "@/components/customers/EditCustomerForm";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type EditCustomerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Customer
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

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("id", id)
    .eq("organization_id", currentOrganization.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!customer) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Customer
          </h1>
          <p className="mt-2 text-muted-foreground">
            Perbarui informasi pelanggan pada organization aktif.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <EditCustomerForm
            organizationId={currentOrganization.organizationId}
            customer={customer}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}