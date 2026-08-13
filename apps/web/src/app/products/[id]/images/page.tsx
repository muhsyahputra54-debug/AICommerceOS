import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProductImageManager from "@/components/products/ProductImageManager";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type ProductImagesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductImagesPage({
  params,
}: ProductImagesPageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product Images
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

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select(
      "id, storage_path, original_filename, mime_type, size_bytes, alt_text, sort_order, is_primary",
    )
    .eq("organization_id", currentOrganization.organizationId)
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (imagesError) {
    throw new Error(imagesError.message);
  }

  const imagesWithSignedUrls = await Promise.all(
    (images ?? []).map(async (image) => {
      const { data } = await supabase.storage
        .from("product-images")
        .createSignedUrl(
          image.storage_path,
          60 * 60,
        );

      return {
        ...image,
        signed_url: data?.signedUrl ?? null,
      };
    }),
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Product Images
            </h1>

            <p className="mt-2 text-muted-foreground">
              Manage private product images, primary image,
              dan display ordering.
            </p>

            <p className="mt-2 text-sm font-medium">
              {product.name}
              {product.sku
                ? ` (${product.sku})`
                : ""}
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Back to Products
          </Link>
        </div>

        <ProductImageManager
          organizationId={currentOrganization.organizationId}
          productId={product.id}
          productName={product.name}
          images={imagesWithSignedUrls}
        />
      </div>
    </DashboardLayout>
  );
}