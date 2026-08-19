import DashboardLayout from "@/components/layout/DashboardLayout";
import AddOrderForm from "@/components/orders/AddOrderForm";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function NewOrderPage() {
  const locale = await getLocale();
  const copy =
    getDictionary(locale).orders.newOrder;

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

  const [
    customersResult,
    productsResult,
    variantsResult,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name")
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .order("name", { ascending: true }),

    supabase
      .from("products")
      .select("id, name, price, stock")
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .eq("status", "active")
      .order("name", { ascending: true }),

    supabase
      .from("product_variants")
      .select(
        "id, product_id, name, sku, price, stock",
      )
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  if (customersResult.error) {
    throw new Error(copy.errors.loadDependencies);
  }

  if (productsResult.error) {
    throw new Error(copy.errors.loadDependencies);
  }

  if (variantsResult.error) {
    throw new Error(copy.errors.loadDependencies);
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {copy.description}
          </p>
        </div>

        <AddOrderForm
          organizationId={
            currentOrganization.organizationId
          }
          customers={customersResult.data ?? []}
          products={productsResult.data ?? []}
          variants={variantsResult.data ?? []}
        />
      </div>
    </DashboardLayout>
  );
}
