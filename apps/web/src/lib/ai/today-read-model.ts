import {
  availableTodayMetric,
  projectLakuvoTodaySnapshot,
  unavailableTodayMetric,
  type LakuvoTodaySnapshot,
  type TodayCommerceSummary,
  type TodayInventorySummary,
  type TodayIssue,
  type TodayMarketplaceChannel,
  type TodayMarketplaceSummary,
  type TodayMetric,
  type TodayMetricValue,
  type TodayRecommendation,
} from "./today-contract";

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
  };
}

function marketplaceChannelHealth({
  account,
  generatedAt,
  maxAgeHours,
}: {
  account:
    TodayMarketplaceAccountInput;

  generatedAt:
    string;

  maxAgeHours:
    number;
}): Pick<
  TodayMarketplaceChannel,
  "health" | "reasons"
> {
  const reasons:
    string[] = [];

  if (
    account.status !== "active"
  ) {
    reasons.push(
      "marketplace_account_not_active",
    );
  }

  const failedSyncCount =
    numericValue(
      account.recent_failed_sync_count,
    );

  if (
    failedSyncCount !== null &&
    failedSyncCount > 0
  ) {
    reasons.push(
      "recent_sync_failures",
    );
  }

  if (
    account.last_synced_at === null
  ) {
    reasons.push(
      "never_synced",
    );

    return {
      health:
        "attention",

      reasons,
    };
  }

  const generatedAtMs =
    Date.parse(
      generatedAt,
    );

  const lastSyncedAtMs =
    Date.parse(
      account.last_synced_at,
    );

  if (
    !Number.isFinite(
      generatedAtMs,
    ) ||
    !Number.isFinite(
      lastSyncedAtMs,
    )
  ) {
    return {
      health:
        "unavailable",

      reasons: [
        ...reasons,
        "sync_timestamp_unavailable",
      ],
    };
  }

  const ageHours =
    Math.max(
      0,
      generatedAtMs -
        lastSyncedAtMs,
    ) /
    3_600_000;

  if (
    ageHours >
    maxAgeHours
  ) {
    reasons.push(
      "sync_stale",
    );
  }

  return {
    health:
      reasons.length === 0
        ? "healthy"
        : "attention",

    reasons,
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

function metricCount(
  metric:
    TodayMetric<number>,
): number | null {
  return metric.status ===
    "available"
    ? metric.value
    : null;
}

export function buildTodayIssues({
  inventory,
  marketplaces,
  detectedAt,
}: {
  inventory:
    TodayInventorySummary;

  marketplaces:
    TodayMarketplaceSummary;

  detectedAt:
    string;
}): TodayIssue[] {
  const issues:
    TodayIssue[] = [];

  const productOutOfStock =
    metricCount(
      inventory.products
        .outOfStockCount,
    );

  const variantOutOfStock =
    metricCount(
      inventory.variants
        .outOfStockCount,
    );

  const totalOutOfStock =
    productOutOfStock === null ||
    variantOutOfStock === null
      ? null
      : productOutOfStock +
        variantOutOfStock;

  if (
    totalOutOfStock !== null &&
    totalOutOfStock > 0
  ) {
    issues.push({
      id:
        "inventory-out-of-stock",

      severity:
        "high",

      category:
        "inventory",

      title:
        "Out-of-stock inventory needs attention",

      explanation:
        "One or more product or variant inventory records are out of stock.",

      source:
        "get_inventory_intelligence",

      evidence: {
        product_out_of_stock:
          productOutOfStock,

        variant_out_of_stock:
          variantOutOfStock,

        total_out_of_stock:
          totalOutOfStock,
      },

      entity:
        null,

      detectedAt,
    });
  }

  const productLowStock =
    metricCount(
      inventory.products
        .lowStockCount,
    );

  const variantLowStock =
    metricCount(
      inventory.variants
        .lowStockCount,
    );

  const totalLowStock =
    productLowStock === null ||
    variantLowStock === null
      ? null
      : productLowStock +
        variantLowStock;

  if (
    totalLowStock !== null &&
    totalLowStock > 0
  ) {
    issues.push({
      id:
        "inventory-low-stock",

      severity:
        "medium",

      category:
        "inventory",

      title:
        "Low-stock inventory should be reviewed",

      explanation:
        "One or more product or variant inventory records are below their low-stock threshold.",

      source:
        "get_inventory_intelligence",

      evidence: {
        product_low_stock:
          productLowStock,

        variant_low_stock:
          variantLowStock,

        total_low_stock:
          totalLowStock,
      },

      entity:
        null,

      detectedAt,
    });
  }

  for (
    const channel
    of marketplaces.channels
  ) {
    if (
      channel.health !==
      "attention"
    ) {
      continue;
    }

    issues.push({
      id:
        `marketplace-${channel.id}-attention`,

      severity:
        channel.status ===
        "active"
          ? "medium"
          : "high",

      category:
        "marketplace",

      title:
        `${channel.name} needs attention`,

      explanation:
        "Marketplace operational health indicates a connection or synchronization issue that should be reviewed.",

      source:
        "marketplace_health_read_model",

      evidence: {
        provider:
          channel.provider,

        status:
          channel.status,

        last_synced_at:
          channel.lastSyncedAt,

        reasons:
          channel.reasons.join(
            ",",
          ),
      },

      entity: {
        type:
          "marketplace",

        id:
          channel.id,

        name:
          channel.name,
      },

      detectedAt,
    });
  }

  return issues;
}

export function buildTodayRecommendations(
  issues:
    readonly TodayIssue[],
): TodayRecommendation[] {
  const recommendations:
    TodayRecommendation[] = [];

  if (
    issues.some(
      (issue) =>
        issue.id ===
        "inventory-out-of-stock",
    )
  ) {
    recommendations.push({
      id:
        "review-out-of-stock-inventory",

      title:
        "Review out-of-stock inventory",

      rationale:
        "Out-of-stock items can block sales and should be investigated first.",

      expectedImpact:
        "Reduce avoidable stock-related sales interruptions.",

      priorityScore:
        100,

      sourceIssueIds: [
        "inventory-out-of-stock",
      ],

      action:
        null,
    });
  }

  const marketplaceIssues =
    issues.filter(
      (issue) =>
        issue.category ===
        "marketplace",
    );

  if (
    marketplaceIssues.length > 0
  ) {
    recommendations.push({
      id:
        "review-marketplace-health",

      title:
        "Review marketplace health",

      rationale:
        "One or more marketplace channels have connection or synchronization signals that need attention.",

      expectedImpact:
        "Reduce the risk of stale catalog, order, or channel data.",

      priorityScore:
        90,

      sourceIssueIds:
        marketplaceIssues.map(
          (issue) =>
            issue.id,
        ),

      action:
        null,
    });
  }

  if (
    issues.some(
      (issue) =>
        issue.id ===
        "inventory-low-stock",
    )
  ) {
    recommendations.push({
      id:
        "review-low-stock-inventory",

      title:
        "Review low-stock inventory",

      rationale:
        "Low-stock items may become unavailable if replenishment is delayed.",

      expectedImpact:
        "Improve inventory readiness before stock reaches zero.",

      priorityScore:
        70,

      sourceIssueIds: [
        "inventory-low-stock",
      ],

      action:
        null,
    });
  }

  return recommendations;
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
