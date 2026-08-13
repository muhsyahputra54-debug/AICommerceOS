import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AdjustInventoryForm from "@/components/inventory/AdjustInventoryForm";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type ProductInventoryAdjustPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductInventoryAdjustPage({
  params,
}: ProductInventoryAdjustPageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Adjust Product Stock
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

  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, sku, stock")
    .eq("id", id)
    .eq("organization_id", currentOrganization.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!product) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Adjust Product Stock
          </h1>

          <p className="mt-2 text-muted-foreground">
            Buat perubahan stock yang tercatat pada inventory ledger.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <AdjustInventoryForm
            organizationId={currentOrganization.organizationId}
            targetType="product"
            targetId={product.id}
            targetName={
              product.sku
                ? `${product.name} (${product.sku})`
                : product.name
            }
            currentStock={product.stock}
            returnHref="/products"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}