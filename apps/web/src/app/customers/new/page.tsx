import DashboardLayout from "@/components/layout/DashboardLayout";
import AddCustomerForm from "@/components/customers/AddCustomerForm";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";

export default async function NewCustomerPage() {
  const locale = await getLocale();
  const copy =
    getDictionary(locale).customers.newCustomer;

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
          <AddCustomerForm
            organizationId={currentOrganization.organizationId}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}