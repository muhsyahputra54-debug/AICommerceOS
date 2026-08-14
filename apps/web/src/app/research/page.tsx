import DashboardLayout from "@/components/layout/DashboardLayout";
import ProductResearchManager from "@/components/research/ProductResearchManager";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function ProductResearchPage() {
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
  const supabase = await createClient();

  const [researchResult, productsResult] = await Promise.all([
    supabase
      .from("product_research_items")
      .select(
        "id, linked_product_id, name, category, source_marketplace, source_url, observed_price, estimated_cost, demand_score, competition_score, opportunity_score, status, notes, created_at, updated_at",
      )
      .eq("organization_id", organizationId)
      .order("opportunity_score", {
        ascending: false,
        nullsFirst: false,
      })
      .order("created_at", { ascending: false }),

    supabase
      .from("products")
      .select("id, name, sku, status")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
  ]);

  if (researchResult.error) {
    throw new Error(researchResult.error.message);
  }

  if (productsResult.error) {
    throw new Error(productsResult.error.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product Research
          </h1>

          <p className="mt-2 text-muted-foreground">
            Riset kandidat produk, market signal, kompetisi, dan peluang
            sebelum produk masuk ke catalog.
          </p>
        </div>

        <ProductResearchManager
          organizationId={organizationId}
          items={researchResult.data ?? []}
          products={productsResult.data ?? []}
        />
      </div>
    </DashboardLayout>
  );
}
