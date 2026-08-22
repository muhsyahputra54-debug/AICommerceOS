import {
  describe,
  expect,
  it,
} from "vitest";

import {
  availableTodayMetric,
  LAKUVO_TODAY_CONTRACT_VERSION,
  projectLakuvoTodaySnapshot,
  rankTodayIssues,
  selectTodayRecommendations,
  TODAY_ISSUE_SEVERITIES,
  unavailableTodayMetric,
  type TodayCommerceSummary,
  type TodayInventorySummary,
  type TodayIssue,
  type TodayMarketplaceSummary,
  type TodayRecommendation,
} from "./today-contract";

function commerce():
  TodayCommerceSummary {
  return {
    source:
      "get_sales_performance_summary",

    semantics:
      "completed_orders_only",

    completedOrders:
      availableTodayMetric(12),

    unitsSold:
      availableTodayMetric(18),

    productsSold:
      availableTodayMetric(5),

    revenue:
      availableTodayMetric(1500000),

    cost:
      availableTodayMetric(1100000),

    grossProfit:
      availableTodayMetric(400000),

    grossMargin:
      availableTodayMetric(26.67),

    averageOrderValue:
      availableTodayMetric(125000),
  };
}

function inventory():
  TodayInventorySummary {
  return {
    metricsSource:
      "get_inventory_intelligence",

    alertsSource:
      "get_inventory_alerts",

    products: {
      lowStockCount:
        availableTodayMetric(2),

      outOfStockCount:
        availableTodayMetric(1),
    },

    variants: {
      lowStockCount:
        availableTodayMetric(3),

      outOfStockCount:
        availableTodayMetric(0),
    },

    alertCount:
      availableTodayMetric(6),
  };
}

function marketplaces():
  TodayMarketplaceSummary {
  return {
    accountsSource:
      "marketplace_accounts",

    operationalSources: [
      "marketplace_listings",
      "marketplace_order_links",
      "marketplace_sync_logs",
    ],

    connectedCount:
      1,

    attentionRequiredCount:
      0,

    channels: [
      {
        id:
          "marketplace-1",

        provider:
          "tiktok_shop",

        name:
          "Main Store",

        status:
          "active",

        lastSyncedAt:
          "2026-08-22T05:00:00.000Z",

        health:
          "healthy",

        reasons:
          [],
      },
    ],
  };
}

function issue(
  id: string,
  severity:
    TodayIssue["severity"],
  detectedAt:
    string,
): TodayIssue {
  return {
    id,
    severity,

    category:
      "inventory",

    title:
      id,

    explanation:
      `Issue ${id}`,

    source:
      "deterministic_rule_engine",

    evidence:
      {},

    entity:
      null,

    detectedAt,
  };
}

function recommendation(
  id: string,
  priorityScore: number,
): TodayRecommendation {
  return {
    id,

    title:
      id,

    rationale:
      `Recommendation ${id}`,

    expectedImpact:
      null,

    priorityScore,

    sourceIssueIds:
      [],

    action:
      null,
  };
}

describe(
  "LAKUVO Today contract",
  () => {
    it(
      "locks contract version and issue severities",
      () => {
        expect(
          LAKUVO_TODAY_CONTRACT_VERSION,
        ).toBe(1);

        expect(
          TODAY_ISSUE_SEVERITIES,
        ).toEqual([
          "critical",
          "high",
          "medium",
          "low",
        ]);
      },
    );

    it(
      "preserves completed-order commerce semantics",
      () => {
        expect(
          commerce(),
        ).toMatchObject({
          source:
            "get_sales_performance_summary",

          semantics:
            "completed_orders_only",
        });
      },
    );

    it(
      "represents unavailable data without fabricating zero",
      () => {
        expect(
          unavailableTodayMetric<number>(
            "Margin source unavailable.",
          ),
        ).toEqual({
          status:
            "unavailable",

          value:
            null,

          reason:
            "Margin source unavailable.",
        });
      },
    );

    it(
      "ranks urgent issues deterministically",
      () => {
        expect(
          rankTodayIssues([
            issue(
              "low",
              "low",
              "2026-08-22T03:00:00.000Z",
            ),

            issue(
              "critical-later",
              "critical",
              "2026-08-22T04:00:00.000Z",
            ),

            issue(
              "high",
              "high",
              "2026-08-22T01:00:00.000Z",
            ),

            issue(
              "critical-earlier",
              "critical",
              "2026-08-22T02:00:00.000Z",
            ),
          ]).map(
            (item) => item.id,
          ),
        ).toEqual([
          "critical-earlier",
          "critical-later",
          "high",
          "low",
        ]);
      },
    );

    it(
      "selects at most three recommendations by deterministic score",
      () => {
        expect(
          selectTodayRecommendations([
            recommendation(
              "fourth",
              10,
            ),

            recommendation(
              "second",
              80,
            ),

            recommendation(
              "first",
              100,
            ),

            recommendation(
              "third",
              60,
            ),
          ]).map(
            (item) => item.id,
          ),
        ).toEqual([
          "first",
          "second",
          "third",
        ]);
      },
    );

    it(
      "defaults AI Daily Brief to not generated",
      () => {
        const snapshot =
          projectLakuvoTodaySnapshot({
            organizationId:
              "org-1",

            generatedAt:
              "2026-08-22T06:00:00.000Z",

            commerce:
              commerce(),

            inventory:
              inventory(),

            marketplaces:
              marketplaces(),

            urgentIssues:
              [],

            recommendations:
              [],
          });

        expect(
          snapshot.dailyBrief,
        ).toEqual({
          status:
            "not_generated",

          source:
            null,
        });
      },
    );

    it(
      "keeps controlled action handoff behind Action Center",
      () => {
        const item:
          TodayRecommendation = {
          ...recommendation(
            "price-review",
            90,
          ),

          action: {
            destination:
              "action_center",

            actionType:
              "product.update_price",

            supported:
              true,

            requiresExplicitHumanConfirmation:
              true,

            directExecutionAllowed:
              false,
          },
        };

        expect(
          item.action,
        ).toMatchObject({
          destination:
            "action_center",

          requiresExplicitHumanConfirmation:
            true,

          directExecutionAllowed:
            false,
        });
      },
    );

    it(
      "projects sorted issues and recommendations",
      () => {
        const snapshot =
          projectLakuvoTodaySnapshot({
            organizationId:
              "org-1",

            generatedAt:
              "2026-08-22T06:00:00.000Z",

            commerce:
              commerce(),

            inventory:
              inventory(),

            marketplaces:
              marketplaces(),

            urgentIssues: [
              issue(
                "medium",
                "medium",
                "2026-08-22T04:00:00.000Z",
              ),

              issue(
                "critical",
                "critical",
                "2026-08-22T05:00:00.000Z",
              ),
            ],

            recommendations: [
              recommendation(
                "low-value",
                10,
              ),

              recommendation(
                "highest",
                100,
              ),

              recommendation(
                "middle",
                50,
              ),

              recommendation(
                "second",
                80,
              ),
            ],
          });

        expect(
          snapshot.urgentIssues.map(
            (item) => item.id,
          ),
        ).toEqual([
          "critical",
          "medium",
        ]);

        expect(
          snapshot.recommendations.map(
            (item) => item.id,
          ),
        ).toEqual([
          "highest",
          "second",
          "middle",
        ]);
      },
    );
  },
);
