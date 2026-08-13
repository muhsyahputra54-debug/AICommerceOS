import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AdjustInventoryForm from "@/components/inventory/AdjustInventoryForm";
import SetLowStockThresholdForm from "@/components/inventory/SetLowStockThresholdForm";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type VariantInventoryAdjustPageProps = {
  params: Promise<{
    id: string;
    variantId: string;
  }>;
};

export default async function VariantInventoryAdjustPage({
  params,
}: VariantInventoryAdjustPageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Adjust Variant Stock
          </h1>

          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { id, variantId } = await params;
  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", id)
    .eq("organization_id", currentOrganization.organizationId)
    .maybeSingle();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!product) {
    notFound();
  }

  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("id, name, sku, stock, low_stock_threshold")
    .eq("id", variantId)
    .eq("product_id", product.id)
    .eq("organization_id", currentOrganization.organizationId)
    .maybeSingle();

  if (variantError) {
    throw new Error(variantError.message);
  }

  if (!variant) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Variant Inventory
          </h1>

          <p className="mt-2 text-muted-foreground">
            Kelola stock dan low-stock intelligence untuk variant.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <AdjustInventoryForm
            organizationId={currentOrganization.organizationId}
            targetType="variant"
            targetId={variant.id}
            targetName={`${product.name} — ${variant.name} (${variant.sku})`}
            currentStock={variant.stock}
            returnHref={`/products/${product.id}/variants`}
          />
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <SetLowStockThresholdForm
            organizationId={currentOrganization.organizationId}
            targetType="variant"
            targetId={variant.id}
            currentThreshold={variant.low_stock_threshold}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}