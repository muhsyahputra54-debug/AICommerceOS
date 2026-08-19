import DashboardLayout from "@/components/layout/DashboardLayout";
import MarketplaceAccountManager from "@/components/marketplaces/MarketplaceAccountManager";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";

export default async function MarketplacesPage() {
  const locale = await getLocale();
  const marketplaces =
    getDictionary(locale).marketplaces;

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {marketplaces.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {marketplaces.noOrganization}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();

  const { data: accounts, error } =
    await supabase
      .from("marketplace_accounts")
      .select(
        "id, provider, name, external_shop_id, status, last_synced_at, created_at",
      )
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {marketplaces.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {marketplaces.description}
          </p>
        </div>

        <MarketplaceAccountManager
          organizationId={
            currentOrganization.organizationId
          }
          accounts={accounts ?? []}
        />
      </div>
    </DashboardLayout>
  );
}
