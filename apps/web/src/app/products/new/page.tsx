import DashboardLayout from "@/components/layout/DashboardLayout";
import AddProductForm from "@/components/products/AddProductForm";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const locale = await getLocale();
  const productsCopy =
    getDictionary(locale).products;

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {productsCopy.workflow.add.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {productsCopy.noOrganization}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();

  const { data: categories, error } =
    await supabase
      .from("categories")
      .select("id, name")
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .order("name", {
        ascending: true,
      });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {productsCopy.workflow.add.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {productsCopy.workflow.add.description}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <AddProductForm
            organizationId={
              currentOrganization.organizationId
            }
            categories={categories}
            copy={productsCopy.workflow}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
