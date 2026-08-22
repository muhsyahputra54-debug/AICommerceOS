import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildLakuvoTodayReadModel,
  buildTodayCommerceSummary,
  buildTodayInventorySummary,
  buildTodayMarketplaceSummary,
  type TodayMarketplaceAccountInput,
} from "./today-read-model";

const GENERATED_AT =
  "2026-08-22T06:00:00.000Z";

function activeMarketplace(
  overrides:
    Partial<TodayMarketplaceAccountInput> = {},
): TodayMarketplaceAccountInput {
  return {
    id:
      "marketplace-1",

    provider:
      "tiktok_shop",

    name:
      "Main Store",

    status:
      "active",

    last_synced_at:
      "2026-08-22T05:00:00.000Z",

    recent_failed_sync_count:
      0,

    ...overrides,
  };
}

describe(
  "LAKUVO Today read model",
  () => {
    it(
      "projects canonical completed-sales metrics",
      () => {
        const result =
          buildTodayCommerceSummary({
            completed_orders:
              "12",

            revenue:
              "1500000.00",

            profit:
              "400000.00",

            margin:
              "26.67",

            average_order_value:
              "125000.00",
          });

        expect(
          result.source,
        ).toBe(
          "get_sales_performance_summary",
        );

        expect(
          result.semantics,
        ).toBe(
          "completed_orders_only",
        );

        expect(
          result.completedOrders,
        ).toEqual({
          status:
            "available",

          value:
            12,
        });

        expect(
          result.revenue,
        ).toEqual({
          status:
            "available",

          value:
            "1500000.00",
        });
      },
    );

    it(
      "does not turn missing sales data into zero",
      () => {
        const result =
          buildTodayCommerceSummary(
            null,
          );

        expect(
          result.revenue.status,
        ).toBe(
          "unavailable",
        );

        expect(
          result.grossMargin.status,
        ).toBe(
          "unavailable",
        );

        expect(
          result.completedOrders.status,
        ).toBe(
          "unavailable",
        );
      },
    );

    it(
      "preserves real inventory zero values",
      () => {
        const result =
          buildTodayInventorySummary(
            {
              products: {
                low_stock:
                  0,

                out_of_stock:
                  0,
              },

              variants: {
                low_stock:
                  2,

                out_of_stock:
                  0,
              },
            },
            [],
          );

        expect(
          result.products.outOfStockCount,
        ).toEqual({
          status:
            "available",

          value:
            0,
        });

        expect(
          result.variants.lowStockCount,
        ).toEqual({
          status:
            "available",

          value:
            2,
        });

        expect(
          result.alertCount,
        ).toEqual({
          status:
            "available",

          value:
            0,
        });
      },
    );

    it(
      "marks an active recently synced marketplace healthy",
      () => {
        const result =
          buildTodayMarketplaceSummary({
            accounts: [
              activeMarketplace(),
            ],

            generatedAt:
              GENERATED_AT,
          });

        expect(
          result.channels[0],
        ).toMatchObject({
          health:
            "healthy",

          reasons:
            [],
        });

        expect(
          result.connectedCount,
        ).toBe(1);

        expect(
          result.attentionRequiredCount,
        ).toBe(0);
      },
    );

    it(
      "marks never-synced and inactive marketplaces for attention",
      () => {
        const result =
          buildTodayMarketplaceSummary({
            accounts: [
              activeMarketplace({
                status:
                  "inactive",

                last_synced_at:
                  null,
              }),
            ],

            generatedAt:
              GENERATED_AT,
          });

        expect(
          result.channels[0]
            .health,
        ).toBe(
          "attention",
        );

        expect(
          result.channels[0]
            .reasons,
        ).toEqual([
          "marketplace_account_not_active",
          "never_synced",
        ]);

        expect(
          result.connectedCount,
        ).toBe(0);
      },
    );

    it(
      "detects stale sync deterministically",
      () => {
        const result =
          buildTodayMarketplaceSummary({
            accounts: [
              activeMarketplace({
                last_synced_at:
                  "2026-08-20T05:00:00.000Z",
              }),
            ],

            generatedAt:
              GENERATED_AT,

            syncMaxAgeHours:
              24,
          });

        expect(
          result.channels[0]
            .health,
        ).toBe(
          "attention",
        );

        expect(
          result.channels[0]
            .reasons,
        ).toContain(
          "sync_stale",
        );
      },
    );

    it(
      "builds deterministic urgent issues and top recommendations",
      () => {
        const snapshot =
          buildLakuvoTodayReadModel({
            organizationId:
              "org-1",

            generatedAt:
              GENERATED_AT,

            salesSummary: {
              completed_orders:
                8,

              revenue:
                800000,

              profit:
                200000,

              margin:
                25,

              average_order_value:
                100000,
            },

            inventoryIntelligence: {
              products: {
                low_stock:
                  2,

                out_of_stock:
                  1,
              },

              variants: {
                low_stock:
                  1,

                out_of_stock:
                  0,
              },
            },

            inventoryAlerts: [
              {
                id:
                  "alert-1",
              },
            ],

            marketplaceAccounts: [
              activeMarketplace({
                recent_failed_sync_count:
                  2,
              }),
            ],
          });

        expect(
          snapshot.urgentIssues.map(
            (issue) =>
              issue.id,
          ),
        ).toEqual([
          "inventory-out-of-stock",
          "inventory-low-stock",
          "marketplace-marketplace-1-attention",
        ]);

        expect(
          snapshot.recommendations.map(
            (recommendation) =>
              recommendation.id,
          ),
        ).toEqual([
          "review-out-of-stock-inventory",
          "review-marketplace-health",
          "review-low-stock-inventory",
        ]);

        expect(
          snapshot.recommendations,
        ).toHaveLength(3);
      },
    );

    it(
      "never grants direct controlled execution from TODAY recommendations",
      () => {
        const snapshot =
          buildLakuvoTodayReadModel({
            organizationId:
              "org-1",

            generatedAt:
              GENERATED_AT,

            salesSummary:
              null,

            inventoryIntelligence: {
              products: {
                low_stock:
                  3,

                out_of_stock:
                  1,
              },

              variants: {
                low_stock:
                  0,

                out_of_stock:
                  0,
              },
            },

            inventoryAlerts:
              [],

            marketplaceAccounts:
              [],
          });

        expect(
          snapshot.recommendations
            .every(
              (recommendation) =>
                recommendation.action ===
                null ||
                recommendation.action
                  .directExecutionAllowed ===
                  false,
            ),
        ).toBe(true);

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
  },
);
