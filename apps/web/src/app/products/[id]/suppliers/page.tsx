import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProductSupplierManager from "@/components/suppliers/ProductSupplierManager";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type ProductSuppliersPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductSuppliersPage({
  params,
}: ProductSuppliersPageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product Suppliers
          </h1>
          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { id } = await params;
  const organizationId = currentOrganization.organizationId;
  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, sku")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!product) {
    notFound();
  }

  const [variantsResult, suppliersResult, productItemsResult] =
    await Promise.all([
      supabase
        .from("product_variants")
        .select("id, name, sku")
        .eq("organization_id", organizationId)
        .eq("product_id", product.id)
        .order("name", { ascending: true }),

      supabase
        .from("suppliers")
        .select("id, name, status")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true }),

      supabase
        .from("supplier_items")
        .select(
          "id, supplier_id, target_type, product_id, variant_id, supplier_sku, unit_cost, minimum_order_quantity, lead_time_days, is_preferred, notes, created_at",
        )
        .eq("organization_id", organizationId)
        .eq("target_type", "product")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false }),
    ]);

  if (variantsResult.error) {
    throw new Error(variantsResult.error.message);
  }

  if (suppliersResult.error) {
    throw new Error(suppliersResult.error.message);
  }

  if (productItemsResult.error) {
    throw new Error(productItemsResult.error.message);
  }

  const variants = variantsResult.data ?? [];
  let variantItems: typeof productItemsResult.data = [];

  if (variants.length > 0) {
    const { data, error } = await supabase
      .from("supplier_items")
      .select(
        "id, supplier_id, target_type, product_id, variant_id, supplier_sku, unit_cost, minimum_order_quantity, lead_time_days, is_preferred, notes, created_at",
      )
      .eq("organization_id", organizationId)
      .eq("target_type", "variant")
      .in(
        "variant_id",
        variants.map((variant) => variant.id),
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    variantItems = data ?? [];
  }

  const supplierItems = [
    ...(productItemsResult.data ?? []),
    ...(variantItems ?? []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/products"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to Products
          </Link>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Product Supplier Sourcing
          </h1>

          <p className="mt-2 text-muted-foreground">
            Kelola supplier untuk{" "}
            <span className="font-medium text-foreground">
              {product.name}
            </span>
            {product.sku ? ` (${product.sku})` : ""}.
          </p>
        </div>

        <ProductSupplierManager
          organizationId={organizationId}
          product={product}
          variants={variants}
          suppliers={suppliersResult.data ?? []}
          supplierItems={supplierItems}
        />
      </div>
    </DashboardLayout>
  );
}
