import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildProactiveInsights,
  type ProactiveInsightSnapshot,
} from "./proactive-insights";

type SnapshotOverrides = {
  products?: Partial<
    ProactiveInsightSnapshot["products"]
  >;
  orders?: Partial<
    ProactiveInsightSnapshot["orders"]
  >;
  priceMonitoring?: Partial<
    ProactiveInsightSnapshot["priceMonitoring"]
  >;
};

function makeSnapshot(
  overrides: SnapshotOverrides = {},
): ProactiveInsightSnapshot {
  return {
    products: {
      totalCount: 0,
      nonpositiveStockCount: 0,
      nonpositivePriceCount: 0,
      ...overrides.products,
    },
    orders: {
      totalCount: 0,
      ...overrides.orders,
    },
    priceMonitoring: {
      activeTargetCount: 0,
      observationCount: 0,
      thresholdTriggeredCount: 0,
      ...overrides.priceMonitoring,
    },
  };
}

describe("buildProactiveInsights", () => {
  it("returns no insight for an empty business snapshot", () => {
    const insights =
      buildProactiveInsights(
        makeSnapshot(),
      );

    expect(insights).toEqual([]);
  });

  it("detects catalog readiness problems", () => {
    const insights =
      buildProactiveInsights(
        makeSnapshot({
          products: {
            totalCount: 3,
            nonpositiveStockCount: 1,
            nonpositivePriceCount: 1,
          },
          orders: {
            totalCount: 1,
          },
        }),
      );

    expect(
      insights.map(
        (insight) => insight.code,
      ),
    ).toContain(
      "catalog_readiness",
    );

    const insight =
      insights.find(
        (item) =>
          item.code ===
          "catalog_readiness",
      );

    expect(insight).toMatchObject({
      severity: "high",
      category: "catalog",
      source:
        "deterministic_rule_engine",
    });
  });

  it("detects competitor threshold alerts", () => {
    const insights =
      buildProactiveInsights(
        makeSnapshot({
          priceMonitoring: {
            activeTargetCount: 2,
            observationCount: 2,
            thresholdTriggeredCount: 1,
          },
        }),
      );

    expect(
      insights.map(
        (insight) => insight.code,
      ),
    ).toContain(
      "competitor_threshold_alert",
    );

    const insight =
      insights.find(
        (item) =>
          item.code ===
          "competitor_threshold_alert",
      );

    expect(insight).toMatchObject({
      severity: "high",
      category: "pricing",
      source:
        "deterministic_rule_engine",
    });
  });

  it("detects products with no orders", () => {
    const insights =
      buildProactiveInsights(
        makeSnapshot({
          products: {
            totalCount: 5,
          },
          orders: {
            totalCount: 0,
          },
        }),
      );

    expect(
      insights.map(
        (insight) => insight.code,
      ),
    ).toContain("no_orders");

    const insight =
      insights.find(
        (item) =>
          item.code ===
          "no_orders",
      );

    expect(insight).toMatchObject({
      severity: "medium",
      category: "sales",
      source:
        "deterministic_rule_engine",
    });
  });

  it("detects active price monitoring without observations", () => {
    const insights =
      buildProactiveInsights(
        makeSnapshot({
          priceMonitoring: {
            activeTargetCount: 3,
            observationCount: 0,
            thresholdTriggeredCount: 0,
          },
        }),
      );

    expect(
      insights.map(
        (insight) => insight.code,
      ),
    ).toContain(
      "price_monitoring_no_observations",
    );

    const insight =
      insights.find(
        (item) =>
          item.code ===
          "price_monitoring_no_observations",
      );

    expect(insight).toMatchObject({
      severity: "medium",
      category: "pricing",
      source:
        "deterministic_rule_engine",
    });
  });

  it("orders insights by deterministic priority", () => {
    const insights =
      buildProactiveInsights(
        makeSnapshot({
          products: {
            totalCount: 2,
            nonpositiveStockCount: 1,
          },
          orders: {
            totalCount: 0,
          },
          priceMonitoring: {
            activeTargetCount: 1,
            observationCount: 0,
            thresholdTriggeredCount: 0,
          },
        }),
      );

    expect(
      insights.map(
        (insight) => insight.code,
      ),
    ).toEqual([
      "catalog_readiness",
      "no_orders",
      "price_monitoring_no_observations",
    ]);
  });

  it("limits returned insights deterministically", () => {
    const insights =
      buildProactiveInsights(
        makeSnapshot({
          products: {
            totalCount: 2,
            nonpositiveStockCount: 1,
            nonpositivePriceCount: 1,
          },
          orders: {
            totalCount: 0,
          },
          priceMonitoring: {
            activeTargetCount: 1,
            observationCount: 0,
            thresholdTriggeredCount: 0,
          },
        }),
        {
          limit: 2,
        },
      );

    expect(insights).toHaveLength(2);

    expect(
      insights.map(
        (insight) => insight.code,
      ),
    ).toEqual([
      "catalog_readiness",
      "no_orders",
    ]);
  });
});
