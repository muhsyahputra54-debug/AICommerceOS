import DashboardLayout from "@/components/layout/DashboardLayout";
import PriceMonitoringManager from "@/components/price-monitoring/PriceMonitoringManager";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function PriceMonitoringPage() {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Price Monitoring
          </h1>

          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const organizationId =
    currentOrganization.organizationId;

  const supabase = await createClient();

  const [
    targetsResult,
    observationsResult,
    productsResult,
    variantsResult,
  ] = await Promise.all([
    supabase
      .from("price_monitor_targets")
      .select(
        "id, organization_id, product_id, variant_id, name, source_name, source_url, currency, comparison_basis, direction, threshold_percent, is_active, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),

    supabase
      .from("price_observations")
      .select(
        "id, target_id, observed_price, internal_price_snapshot, previous_price, change_amount, change_percent, difference_from_internal, difference_from_internal_percent, threshold_percent_snapshot, comparison_basis_snapshot, direction_snapshot, threshold_triggered, source_name, notes, observed_at",
      )
      .eq("organization_id", organizationId)
      .order("observed_at", { ascending: false })
      .limit(200),

    supabase
      .from("products")
      .select("id, name, sku, price")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),

    supabase
      .from("product_variants")
      .select(
        "id, product_id, name, sku, price",
      )
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
  ]);

  if (targetsResult.error) {
    throw new Error(targetsResult.error.message);
  }

  if (observationsResult.error) {
    throw new Error(
      observationsResult.error.message,
    );
  }

  if (productsResult.error) {
    throw new Error(productsResult.error.message);
  }

  if (variantsResult.error) {
    throw new Error(variantsResult.error.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Price Monitoring
          </h1>

          <p className="mt-2 text-muted-foreground">
            Track external prices, compare them with
            internal commerce prices, and detect meaningful
            movements without automatically repricing
            products.
          </p>
        </div>

        <PriceMonitoringManager
          organizationId={organizationId}
          targets={targetsResult.data ?? []}
          observations={
            observationsResult.data ?? []
          }
          products={productsResult.data ?? []}
          variants={variantsResult.data ?? []}
        />
      </div>
    </DashboardLayout>
  );
}
