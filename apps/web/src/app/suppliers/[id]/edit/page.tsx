import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import EditSupplierForm from "@/components/suppliers/EditSupplierForm";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type EditSupplierPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditSupplierPage({
  params,
}: EditSupplierPageProps) {
  const locale = await getLocale();
  const copy =
    getDictionary(locale).suppliers.editSupplier;

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
    throw new Error(copy.errors.loadFailed);
  }

  if (!supplier) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {copy.description}
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
