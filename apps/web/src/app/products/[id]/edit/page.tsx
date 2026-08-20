import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import EditProductForm from "@/components/products/EditProductForm";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
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
            {productsCopy.workflow.edit.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {productsCopy.noOrganization}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { id } = await params;
  const supabase = await createClient();

  const [
    {
      data: product,
      error: productError,
    },
    {
      data: categories,
      error: categoriesError,
    },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, description, sku, category_id, price, cost_price, stock, status",
      )
      .eq("id", id)
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .maybeSingle(),

    supabase
      .from("categories")
      .select("id, name")
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .order("name", {
        ascending: true,
      }),
  ]);

  if (productError) {
    throw new Error(productError.message);
  }

  if (categoriesError) {
    throw new Error(
      categoriesError.message,
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {productsCopy.workflow.edit.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {productsCopy.workflow.edit.description}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <EditProductForm
            organizationId={
              currentOrganization.organizationId
            }
            product={product}
            categories={categories}
            copy={productsCopy.workflow}
            canUseControlledActions={
              currentOrganization.role ===
                "owner" ||
              currentOrganization.role ===
                "admin"
            }
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
