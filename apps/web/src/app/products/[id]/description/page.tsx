import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AIProductDescriptionPanel from "@/components/products/AIProductDescriptionPanel";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductDescriptionPage({
  params,
}: PageProps) {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Description Generator
          </h1>

          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { id } = await params;

  const organizationId =
    currentOrganization.organizationId;

  const supabase = await createClient();

  const [productResult, generationsResult] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, sku, description, status",
        )
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle(),

      supabase
        .from("product_description_generations")
        .select(
          "id, provider, model, status, tone, language, target_audience, generated_description, short_description, seo_title, meta_description, keywords, error_message, created_at, completed_at",
        )
        .eq("organization_id", organizationId)
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  if (productResult.error) {
    throw new Error(productResult.error.message);
  }

  if (!productResult.data) {
    notFound();
  }

  if (generationsResult.error) {
    throw new Error(
      generationsResult.error.message,
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/products"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Back to Products
          </Link>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            AI Description Generator
          </h1>

          <p className="mt-2 text-muted-foreground">
            {productResult.data.name}
            {productResult.data.sku
              ? ` • ${productResult.data.sku}`
              : ""}
          </p>
        </div>

        <AIProductDescriptionPanel
          product={productResult.data}
          generations={
            generationsResult.data ?? []
          }
        />
      </div>
    </DashboardLayout>
  );
}
