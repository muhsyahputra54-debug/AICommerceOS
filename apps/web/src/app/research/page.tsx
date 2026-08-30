import { cookies } from "next/headers";

import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  LOCALE_COOKIE,
  normalizeLocale,
} from "@/lib/i18n/config";
import { getProductResearchCopy } from "@/lib/i18n/product-research";
import ProductResearchManager from "@/components/research/ProductResearchManager";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function ProductResearchPage() {
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
            {copy.page.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {copy.page.description}
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
