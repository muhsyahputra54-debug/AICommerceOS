import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AIProductResearchPanel from "@/components/research/AIProductResearchPanel";
import ProductResearchDetailManager from "@/components/research/ProductResearchDetailManager";
import {
  LOCALE_COOKIE,
  normalizeLocale,
} from "@/lib/i18n/config";
import { getProductResearchCopy } from "@/lib/i18n/product-research";
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
  const cookieStore = await cookies();
  const locale = normalizeLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
  );
  const copy = getProductResearchCopy(locale);

  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.page.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {copy.page.organizationMissing}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const organizationId =
    currentOrganization.organizationId;

  const { id } = await params;
  const supabase = await createClient();

  const [
    itemResult,
    productsResult,
    observationsResult,
    aiRunsResult,
  ] = await Promise.all([
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

    supabase
      .from("product_research_ai_runs")
      .select(
        "id, provider, model, status, ai_demand_score, ai_competition_score, ai_opportunity_score, confidence_score, recommendation, summary, rationale, risks, next_actions, error_message, created_at, completed_at",
      )
      .eq("organization_id", organizationId)
      .eq("research_item_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
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

  if (aiRunsResult.error) {
    throw new Error(aiRunsResult.error.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/research"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {copy.page.back}
          </Link>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {itemResult.data.name}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {copy.page.detailDescription}
          </p>
        </div>

        <AIProductResearchPanel
          researchItemId={itemResult.data.id}
          runs={aiRunsResult.data ?? []}
        />

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
