import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import DeleteProductVariantButton from "@/components/products/DeleteProductVariantButton";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type ProductVariantsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ProductVariantsPage({
  params,
}: ProductVariantsPageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product Variants
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

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, sku")
    .eq("id", id)
    .eq("organization_id", currentOrganization.organizationId)
    .maybeSingle();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!product) {
    notFound();
  }

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select(
      "id, sku, name, price, cost_price, stock, status, created_at",
    )
    .eq("organization_id", currentOrganization.organizationId)
    .eq("product_id", product.id)
    .order("created_at", { ascending: false });

  if (variantsError) {
    throw new Error(variantsError.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <Link
              href="/products"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to Products
            </Link>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Product Variants
            </h1>

            <p className="mt-2 text-muted-foreground">
              Kelola variant untuk{" "}
              <span className="font-medium text-foreground">
                {product.name}
              </span>
              {product.sku ? ` (${product.sku})` : ""}.
            </p>
          </div>

          <Link
            href={`/products/${product.id}/variants/new`}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Add Variant
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">Variant Management</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {variants.length} variant ditemukan.
            </p>
          </div>

          {variants.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium">Belum ada product variant</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Variant yang ditambahkan nanti akan tampil di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">Variant</th>
                    <th className="px-6 py-3 font-medium">SKU</th>
                    <th className="px-6 py-3 font-medium">
                      Selling Price
                    </th>
                    <th className="px-6 py-3 font-medium">
                      Cost Price
                    </th>
                    <th className="px-6 py-3 font-medium">Stock</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {variants.map((variant) => (
                    <tr key={variant.id}>
                      <td className="px-6 py-4 font-medium">
                        {variant.name}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {variant.sku}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {formatCurrency(Number(variant.price))}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {formatCurrency(Number(variant.cost_price))}
                      </td>

                      <td className="px-6 py-4">
                        {variant.stock}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                          {variant.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <Link
                            href={`/products/${product.id}/variants/${variant.id}/edit`}
                            className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                          >
                            Edit
                          </Link>

                          <DeleteProductVariantButton
                            organizationId={
                              currentOrganization.organizationId
                            }
                            productId={product.id}
                            variantId={variant.id}
                            variantName={variant.name}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}