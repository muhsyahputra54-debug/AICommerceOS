import type {
  TodayInventorySummary,
  TodayIssue,
  TodayMarketplaceSummary,
  TodayMetric,
} from "./today-contract";

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
