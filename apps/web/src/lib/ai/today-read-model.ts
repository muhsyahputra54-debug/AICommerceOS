import {
  availableTodayMetric,
  projectLakuvoTodaySnapshot,
  unavailableTodayMetric,
  type LakuvoTodaySnapshot,
  type TodayCommerceSummary,
  type TodayInventorySummary,
  type TodayMarketplaceChannel,
  type TodayMarketplaceSummary,
  type TodayMetric,
  type TodayMetricValue,
} from "./today-contract";

import { buildTodayMarketplaceChannelHealth as marketplaceChannelHealth } from "./today-marketplace-health";

import { buildTodayInventoryRiskSummary } from "./today-inventory-risk";

import {
  buildTodayIssues,
} from "./today-urgent-issues";

import { buildTodayRecommendations } from "./today-recommendations";

export {
  buildTodayIssues,
};

const DEFAULT_MARKETPLACE_SYNC_MAX_AGE_HOURS =
  24;

type CanonicalNumeric =
  | number
  | string
  | null
  | undefined;

export type TodaySalesSummaryInput = {
  completed_orders:
    CanonicalNumeric;

  units_sold?:
    CanonicalNumeric;

  products_sold?:
    CanonicalNumeric;

  revenue:
    CanonicalNumeric;

  cost?:
    CanonicalNumeric;

  profit:
    CanonicalNumeric;

  margin:
    CanonicalNumeric;

  average_order_value:
    CanonicalNumeric;
};

export type TodayInventoryMetricsInput = {
  low_stock:
    CanonicalNumeric;

  out_of_stock:
    CanonicalNumeric;
};

export type TodayInventoryIntelligenceInput = {
  products:
    TodayInventoryMetricsInput | null;

  variants:
    TodayInventoryMetricsInput | null;
};

export type TodayMarketplaceAccountInput = {
  id:
    string;

  provider:
    string;

  name:
    string;

  status:
    string;

  last_synced_at:
    string | null;

  recent_failed_sync_count?:
    CanonicalNumeric;
};

export type BuildLakuvoTodayReadModelInput = {
  organizationId:
    string;

  generatedAt:
    string;

  salesSummary:
    TodaySalesSummaryInput | null;

  inventoryIntelligence:
    TodayInventoryIntelligenceInput | null;

  inventoryAlerts:
    readonly unknown[] | null;

  marketplaceAccounts:
    readonly TodayMarketplaceAccountInput[];

  marketplaceSyncMaxAgeHours?:
    number;
};

function numericValue(
  value:
    CanonicalNumeric,
): number | null {
  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    normalized.length === 0
  ) {
    return null;
  }

  const parsed =
    Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function canonicalMetric(
  value:
    CanonicalNumeric,
  reason:
    string,
): TodayMetric<TodayMetricValue> {
  if (
    numericValue(value) === null
  ) {
    return unavailableTodayMetric(
      reason,
    );
  }

  return availableTodayMetric(
    value as TodayMetricValue,
  );
}

function countMetric(
  value:
    CanonicalNumeric,
  reason:
    string,
): TodayMetric<number> {
  const parsed =
    numericValue(value);

  if (
    parsed === null
  ) {
    return unavailableTodayMetric(
      reason,
    );
  }

  return availableTodayMetric(
    Math.max(
      0,
      Math.trunc(parsed),
    ),
  );
}

export function buildTodayCommerceSummary(
  summary:
    TodaySalesSummaryInput | null,
): TodayCommerceSummary {
  if (!summary) {
    const reason =
      "Sales performance summary unavailable.";

    return {
      source:
        "get_sales_performance_summary",

      semantics:
        "completed_orders_only",

      completedOrders:
        unavailableTodayMetric(
          reason,
        ),

      unitsSold:
        unavailableTodayMetric(
          reason,
        ),

      productsSold:
        unavailableTodayMetric(
          reason,
        ),

      revenue:
        unavailableTodayMetric(
          reason,
        ),

      cost:
        unavailableTodayMetric(
          reason,
        ),

      grossProfit:
        unavailableTodayMetric(
          reason,
        ),

      grossMargin:
        unavailableTodayMetric(
          reason,
        ),

      averageOrderValue:
        unavailableTodayMetric(
          reason,
        ),
    };
  }

  return {
    source:
      "get_sales_performance_summary",

    semantics:
      "completed_orders_only",

    completedOrders:
      countMetric(
        summary.completed_orders,
        "Completed order count unavailable.",
      ),

    unitsSold:
      countMetric(
        summary.units_sold,
        "Units sold unavailable.",
      ),

    productsSold:
      countMetric(
        summary.products_sold,
        "Products sold unavailable.",
      ),

    revenue:
      canonicalMetric(
        summary.revenue,
        "Revenue unavailable.",
      ),

    cost:
      canonicalMetric(
        summary.cost,
        "Cost unavailable.",
      ),

    grossProfit:
      canonicalMetric(
        summary.profit,
        "Gross profit unavailable.",
      ),

    grossMargin:
      canonicalMetric(
        summary.margin,
        "Gross margin unavailable.",
      ),

    averageOrderValue:
      canonicalMetric(
        summary.average_order_value,
        "Average order value unavailable.",
      ),
  };
}

export function buildTodayInventorySummary(
  intelligence:
    TodayInventoryIntelligenceInput | null,
  alerts:
    readonly unknown[] | null,
): TodayInventorySummary {
  const unavailableReason =
    "Inventory intelligence unavailable.";

  return {
    metricsSource:
      "get_inventory_intelligence",

    alertsSource:
      "get_inventory_alerts",

    products: {
      lowStockCount:
        intelligence?.products
          ? countMetric(
              intelligence.products.low_stock,
              "Product low-stock count unavailable.",
            )
          : unavailableTodayMetric(
              unavailableReason,
            ),

      outOfStockCount:
        intelligence?.products
          ? countMetric(
              intelligence.products.out_of_stock,
              "Product out-of-stock count unavailable.",
            )
          : unavailableTodayMetric(
              unavailableReason,
            ),
    },

    variants: {
      lowStockCount:
        intelligence?.variants
          ? countMetric(
              intelligence.variants.low_stock,
              "Variant low-stock count unavailable.",
            )
          : unavailableTodayMetric(
              unavailableReason,
            ),

      outOfStockCount:
        intelligence?.variants
          ? countMetric(
              intelligence.variants.out_of_stock,
              "Variant out-of-stock count unavailable.",
            )
          : unavailableTodayMetric(
              unavailableReason,
            ),
    },

    alertCount:
      alerts
        ? availableTodayMetric(
            alerts.length,
          )
        : unavailableTodayMetric(
            "Inventory alerts unavailable.",
          ),

    risk:
      buildTodayInventoryRiskSummary(
        alerts,
      ),
  };
}

export function buildTodayMarketplaceSummary({
  accounts,
  generatedAt,
  syncMaxAgeHours =
    DEFAULT_MARKETPLACE_SYNC_MAX_AGE_HOURS,
}: {
  accounts:
    readonly TodayMarketplaceAccountInput[];

  generatedAt:
    string;

  syncMaxAgeHours?:
    number;
}): TodayMarketplaceSummary {
  const normalizedMaxAge =
    Number.isFinite(
      syncMaxAgeHours,
    ) &&
    syncMaxAgeHours > 0
      ? syncMaxAgeHours
      : DEFAULT_MARKETPLACE_SYNC_MAX_AGE_HOURS;

  const channels =
    accounts.map(
      (
        account,
      ): TodayMarketplaceChannel => {
        const health =
          marketplaceChannelHealth({
            account,

            generatedAt,

            maxAgeHours:
              normalizedMaxAge,
          });

        return {
          id:
            account.id,

          provider:
            account.provider,

          name:
            account.name,

          status:
            account.status,

          lastSyncedAt:
            account.last_synced_at,

          health:
            health.health,

          reasons:
            health.reasons,
        };
      },
    );

  return {
    accountsSource:
      "marketplace_accounts",

    operationalSources: [
      "marketplace_listings",
      "marketplace_order_links",
      "marketplace_sync_logs",
    ],

    connectedCount:
      accounts.filter(
        (account) =>
          account.status ===
          "active",
      ).length,

    attentionRequiredCount:
      channels.filter(
        (channel) =>
          channel.health ===
          "attention",
      ).length,

    channels,
  };
}

export function buildLakuvoTodayReadModel(
  input:
    BuildLakuvoTodayReadModelInput,
): LakuvoTodaySnapshot {
  const commerce =
    buildTodayCommerceSummary(
      input.salesSummary,
    );

  const inventory =
    buildTodayInventorySummary(
      input.inventoryIntelligence,
      input.inventoryAlerts,
    );

  const marketplaces =
    buildTodayMarketplaceSummary({
      accounts:
        input.marketplaceAccounts,

      generatedAt:
        input.generatedAt,

      syncMaxAgeHours:
        input.marketplaceSyncMaxAgeHours,
    });

  const urgentIssues =
    buildTodayIssues({
      inventory,

      marketplaces,

      detectedAt:
        input.generatedAt,
    });

  const recommendations =
    buildTodayRecommendations(
      urgentIssues,
    );

  return projectLakuvoTodaySnapshot({
    organizationId:
      input.organizationId,

    generatedAt:
      input.generatedAt,

    commerce,

    inventory,

    marketplaces,

    urgentIssues,

    recommendations,
  });
}
