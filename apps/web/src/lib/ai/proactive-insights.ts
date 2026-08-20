export type ProactiveInsightSeverity =
  | "high"
  | "medium";

export type ProactiveInsightCategory =
  | "catalog"
  | "sales"
  | "pricing";

export type ProactiveInsightCode =
  | "catalog_readiness"
  | "competitor_threshold_alert"
  | "no_orders"
  | "price_monitoring_no_observations";

export type ProactiveInsightEvidenceValue =
  | string
  | number
  | boolean
  | null;

export type ProactiveInsight = {
  code: ProactiveInsightCode;
  category: ProactiveInsightCategory;
  severity: ProactiveInsightSeverity;
  priority: number;
  source: "deterministic_rule_engine";

  evidence: Record<
    string,
    ProactiveInsightEvidenceValue
  >;
};

export type ProactiveInsightSnapshot = {
  products: {
    totalCount: number;
    nonpositiveStockCount: number;
    nonpositivePriceCount: number;
  };

  orders: {
    totalCount: number;
  };

  priceMonitoring: {
    activeTargetCount: number;
    observationCount: number;
    thresholdTriggeredCount: number;
  };
};

export type BuildProactiveInsightsOptions = {
  limit?: number;
};

const DEFAULT_INSIGHT_LIMIT = 3;

function normalizeCount(
  value: number,
) {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 0;
  }

  return Math.floor(value);
}

function normalizeLimit(
  value: number | undefined,
) {
  if (value === undefined) {
    return DEFAULT_INSIGHT_LIMIT;
  }

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 0;
  }

  return Math.floor(value);
}

export function buildProactiveInsights(
  snapshot: ProactiveInsightSnapshot,
  options: BuildProactiveInsightsOptions = {},
): ProactiveInsight[] {
  const totalProducts =
    normalizeCount(
      snapshot.products.totalCount,
    );

  const nonpositiveStockCount =
    Math.min(
      totalProducts,
      normalizeCount(
        snapshot.products
          .nonpositiveStockCount,
      ),
    );

  const nonpositivePriceCount =
    Math.min(
      totalProducts,
      normalizeCount(
        snapshot.products
          .nonpositivePriceCount,
      ),
    );

  const totalOrders =
    normalizeCount(
      snapshot.orders.totalCount,
    );

  const activeTargetCount =
    normalizeCount(
      snapshot.priceMonitoring
        .activeTargetCount,
    );

  const observationCount =
    normalizeCount(
      snapshot.priceMonitoring
        .observationCount,
    );

  const thresholdTriggeredCount =
    Math.min(
      observationCount,
      normalizeCount(
        snapshot.priceMonitoring
          .thresholdTriggeredCount,
      ),
    );

  const insights:
    ProactiveInsight[] = [];

  if (
    totalProducts > 0 &&
    (
      nonpositiveStockCount > 0 ||
      nonpositivePriceCount > 0
    )
  ) {
    insights.push({
      code:
        "catalog_readiness",

      category:
        "catalog",

      severity:
        "high",

      priority:
        100,

      source:
        "deterministic_rule_engine",

      evidence: {
        total_products:
          totalProducts,

        nonpositive_stock_count:
          nonpositiveStockCount,

        nonpositive_price_count:
          nonpositivePriceCount,
      },
    });
  }

  if (
    thresholdTriggeredCount > 0
  ) {
    insights.push({
      code:
        "competitor_threshold_alert",

      category:
        "pricing",

      severity:
        "high",

      priority:
        90,

      source:
        "deterministic_rule_engine",

      evidence: {
        threshold_triggered_count:
          thresholdTriggeredCount,

        observation_count:
          observationCount,

        active_target_count:
          activeTargetCount,
      },
    });
  }

  if (
    totalProducts > 0 &&
    totalOrders === 0
  ) {
    insights.push({
      code:
        "no_orders",

      category:
        "sales",

      severity:
        "medium",

      priority:
        70,

      source:
        "deterministic_rule_engine",

      evidence: {
        total_products:
          totalProducts,

        total_orders:
          totalOrders,
      },
    });
  }

  if (
    activeTargetCount > 0 &&
    observationCount === 0
  ) {
    insights.push({
      code:
        "price_monitoring_no_observations",

      category:
        "pricing",

      severity:
        "medium",

      priority:
        60,

      source:
        "deterministic_rule_engine",

      evidence: {
        active_target_count:
          activeTargetCount,

        observation_count:
          observationCount,
      },
    });
  }

  const limit =
    normalizeLimit(
      options.limit,
    );

  return insights
    .sort(
      (left, right) =>
        right.priority -
          left.priority ||
        left.code.localeCompare(
          right.code,
        ),
    )
    .slice(
      0,
      limit,
    );
}