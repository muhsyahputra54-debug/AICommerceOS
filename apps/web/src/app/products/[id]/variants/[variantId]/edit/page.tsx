import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import EditProductVariantForm from "@/components/products/EditProductVariantForm";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type EditProductVariantPageProps = {
  params: Promise<{
    id: string;
    variantId: string;
  }>;
};

export default async function EditProductVariantPage({
  params,
}: EditProductVariantPageProps) {
  const locale = await getLocale();
  const productsCopy =
    getDictionary(locale).products;
  const variantsCopy =
    productsCopy.variants;

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {variantsCopy.edit.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {productsCopy.noOrganization}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const {
    id,
    variantId,
  } = await params;

  const supabase = await createClient();

  const {
    data: product,
    error: productError,
  } = await supabase
    .from("products")
    .select("id, name, sku")
    .eq("id", id)
    .eq(
      "organization_id",
      currentOrganization.organizationId,
    )
    .maybeSingle();

  if (productError) {
    throw new Error(
      productError.message,
    );
  }

  if (!product) {
    notFound();
  }

  const {
    data: variant,
    error: variantError,
  } = await supabase
    .from("product_variants")
    .select(
      "id, name, sku, price, cost_price, stock, status",
    )
    .eq("id", variantId)
    .eq(
      "product_id",
      product.id,
    )
    .eq(
      "organization_id",
      currentOrganization.organizationId,
    )
    .maybeSingle();

  if (variantError) {
    throw new Error(
      variantError.message,
    );
  }

  if (!variant) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {variantsCopy.edit.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {
              variantsCopy.edit
                .descriptionPrefix
            }{" "}
            <span className="font-medium text-foreground">
              {product.name}
            </span>
            {product.sku
              ? ` (${product.sku})`
              : ""}
            .
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <EditProductVariantForm
            organizationId={
              currentOrganization.organizationId
            }
            productId={product.id}
            variant={variant}
            copy={variantsCopy}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
