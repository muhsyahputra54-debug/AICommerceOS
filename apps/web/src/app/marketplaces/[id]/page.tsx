import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import MarketplaceIntegrationManager from "@/components/marketplaces/MarketplaceIntegrationManager";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type MarketplaceAccountPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MarketplaceAccountPage({
  params,
}: MarketplaceAccountPageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Marketplace
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

  const { data: account, error: accountError } = await supabase
    .from("marketplace_accounts")
    .select("id, provider, name, external_shop_id, status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (accountError) {
    throw new Error(accountError.message);
  }

  if (!account) {
    notFound();
  }

  const {
    data: connectionRows,
    error: connectionError,
  } = await supabase.rpc(
    "get_marketplace_connection_status",
    {
      p_marketplace_account_id: account.id,
    },
  );

  if (connectionError) {
    throw new Error(connectionError.message);
  }

  const connection =
    Array.isArray(connectionRows) && connectionRows.length > 0
      ? connectionRows[0]
      : null;

  const {
    data: authorizedShops,
    error: authorizedShopsError,
  } = await supabase.rpc(
    "get_marketplace_authorized_shops",
    {
      p_marketplace_account_id: account.id,
    },
  );

  if (authorizedShopsError) {
    throw new Error(authorizedShopsError.message);
  }

  const [
    productsResult,
    variantsResult,
    listingsResult,
    ordersResult,
    orderLinksResult,
    logsResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, sku, status")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),

    supabase
      .from("product_variants")
      .select("id, product_id, name, sku, status")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),

    supabase
      .from("marketplace_listings")
      .select(
        "id, target_type, product_id, variant_id, external_listing_id, external_sku, listing_status, sync_enabled, last_synced_at, created_at",
      )
      .eq("organization_id", organizationId)
      .eq("marketplace_account_id", account.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("orders")
      .select("id, status, total, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(200),

    supabase
      .from("marketplace_order_links")
      .select(
        "id, order_id, external_order_id, external_status, last_synced_at, created_at",
      )
      .eq("organization_id", organizationId)
      .eq("marketplace_account_id", account.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("marketplace_sync_logs")
      .select(
        "id, direction, entity_type, operation, status, entity_id, external_id, message, created_at",
      )
      .eq("organization_id", organizationId)
      .eq("marketplace_account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const results = [
    productsResult,
    variantsResult,
    listingsResult,
    ordersResult,
    orderLinksResult,
    logsResult,
  ];

  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw new Error(failed.error.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/marketplaces"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to Marketplaces
          </Link>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {account.name}
          </h1>

          <p className="mt-2 text-muted-foreground">
            Provider:{" "}
            <span className="font-medium text-foreground">
              {account.provider}
            </span>
            {account.external_shop_id
              ? ` • Shop ${account.external_shop_id}`
              : ""}
          </p>
        </div>

        <MarketplaceIntegrationManager
          organizationId={organizationId}
          account={account}
          products={productsResult.data ?? []}
          variants={variantsResult.data ?? []}
          listings={listingsResult.data ?? []}
          orders={ordersResult.data ?? []}
          orderLinks={orderLinksResult.data ?? []}
          logs={logsResult.data ?? []}
          connection={connection}
          authorizedShops={authorizedShops ?? []}
        />
      </div>
    </DashboardLayout>
  );
}
