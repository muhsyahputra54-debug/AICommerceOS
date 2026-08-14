import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProductResearchDetailManager from "@/components/research/ProductResearchDetailManager";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type ProductResearchDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductResearchDetailPage({
  params,
}: ProductResearchDetailPageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product Research
          </h1>
          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const organizationId = currentOrganization.organizationId;
  const { id } = await params;
  const supabase = await createClient();

  const [itemResult, productsResult, observationsResult] =
    await Promise.all([
      supabase
        .from("product_research_items")
        .select(
          "id, linked_product_id, name, category, source_marketplace, source_url, observed_price, estimated_cost, demand_score, competition_score, opportunity_score, status, notes, created_at, updated_at",
        )
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle(),

      supabase
        .from("products")
        .select("id, name, sku, status")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true }),

      supabase
        .from("product_research_observations")
        .select(
          "id, source_name, source_url, observed_price, sold_count, rating, review_count, notes, observed_at, created_at",
        )
        .eq("organization_id", organizationId)
        .eq("research_item_id", id)
        .order("observed_at", { ascending: false }),
    ]);

  if (itemResult.error) {
    throw new Error(itemResult.error.message);
  }

  if (!itemResult.data) {
    notFound();
  }

  if (productsResult.error) {
    throw new Error(productsResult.error.message);
  }

  if (observationsResult.error) {
    throw new Error(observationsResult.error.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/research"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Back to Product Research
          </Link>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {itemResult.data.name}
          </h1>

          <p className="mt-2 text-muted-foreground">
            Research candidate detail and observation history.
          </p>
        </div>

        <ProductResearchDetailManager
          organizationId={organizationId}
          item={itemResult.data}
          products={productsResult.data ?? []}
          observations={observationsResult.data ?? []}
        />
      </div>
    </DashboardLayout>
  );
}
