import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildSalesIntelligenceContext,
} from "./sales-intelligence-context";

const limitations = [
  "This sales intelligence is sourced from the read-only get_commerce_analytics RPC.",
  "The analytics window is based on orders.created_at, not completed_at.",
  "Revenue and COGS include only orders whose current status is completed within the created_at analytics window.",
  "COGS uses order_items.cost_price_snapshot, preserving the recorded order-time cost snapshot.",
  "Gross profit is revenue minus COGS. It is not net profit and does not include operating expenses, fees, taxes, shipping, refunds, or other costs unless represented in the source data.",
  "Gross margin percent is derived as gross profit divided by revenue when revenue is greater than zero.",
  "Daily sales are grouped by orders.created_at date and include revenue only from orders whose current status is completed.",
  "If this context is unavailable, do not infer official revenue, COGS, profit, margin, or average order value from recent order samples.",
];

describe(
  "buildSalesIntelligenceContext",
  () => {
    it(
      "returns an explicit unavailable context for null analytics",
      () => {
        expect(
          buildSalesIntelligenceContext({
            analytics: null,
          }),
        ).toEqual({
          source:
            "get_commerce_analytics",

          available:
            false,

          generated_at:
            null,

          period_days:
            null,

          period_start:
            null,

          period_basis:
            "orders.created_at",

          sales:
            null,

          daily_sales:
            [],

          limitations,
        });
      },
    );

    it(
      "projects authoritative sales metrics",
      () => {
        const result =
          buildSalesIntelligenceContext({
            analytics: {
              generated_at:
                "2026-08-20T08:00:00Z",

              period_days:
                30,

              period_start:
                "2026-07-21T08:00:00Z",

              sales: {
                orders:
                  20,

                completed_orders:
                  10,

                pending_orders:
                  3,

                processing_orders:
                  4,

                cancelled_orders:
                  3,

                revenue:
                  1000,

                cogs:
                  600,

                gross_profit:
                  400,

                average_order_value:
                  100,
              },

              daily_sales:
                [],
            },
          });

        expect(
          result.sales,
        ).toEqual({
          orders:
            20,

          completed_orders:
            10,

          pending_orders:
            3,

          processing_orders:
            4,

          cancelled_orders:
            3,

          revenue:
            1000,

          cogs:
            600,

          gross_profit:
            400,

          gross_margin_percent:
            40,

          average_order_value:
            100,
        });
      },
    );

    it(
      "normalizes numeric strings from JSON payloads",
      () => {
        const result =
          buildSalesIntelligenceContext({
            analytics: {
              period_days:
                "30",

              sales: {
                orders:
                  "5",

                completed_orders:
                  "4",

                pending_orders:
                  "1",

                processing_orders:
                  "0",

                cancelled_orders:
                  "0",

                revenue:
                  "250.50",

                cogs:
                  "150.25",

                gross_profit:
                  "100.25",

                average_order_value:
                  "62.625",
              },

              daily_sales:
                [],
            },
          });

        expect(
          result.period_days,
        ).toBe(30);

        expect(
          result.sales?.revenue,
        ).toBe(250.5);

        expect(
          result.sales?.cogs,
        ).toBe(150.25);
      },
    );

    it(
      "derives gross margin percent from authoritative revenue and gross profit",
      () => {
        const result =
          buildSalesIntelligenceContext({
            analytics: {
              sales: {
                revenue:
                  300,

                gross_profit:
                  100,
              },
            },
          });

        expect(
          result.sales
            ?.gross_margin_percent,
        ).toBe(33.33);
      },
    );

    it(
      "does not claim a gross margin when revenue is zero",
      () => {
        const result =
          buildSalesIntelligenceContext({
            analytics: {
              sales: {
                revenue:
                  0,

                gross_profit:
                  0,
              },
            },
          });

        expect(
          result.sales
            ?.gross_margin_percent,
        ).toBeNull();
      },
    );

    it(
      "normalizes daily sales points",
      () => {
        const result =
          buildSalesIntelligenceContext({
            analytics: {
              sales: {},

              daily_sales: [
                {
                  date:
                    "2026-08-19",

                  orders:
                    3,

                  completed_orders:
                    2,

                  revenue:
                    "120.50",
                },

                {
                  date:
                    "2026-08-20",

                  orders:
                    4,

                  completed_orders:
                    4,

                  revenue:
                    220,
                },
              ],
            },
          });

        expect(
          result.daily_sales,
        ).toEqual([
          {
            date:
              "2026-08-19",

            orders:
              3,

            completed_orders:
              2,

            revenue:
              120.5,
          },

          {
            date:
              "2026-08-20",

            orders:
              4,

            completed_orders:
              4,

            revenue:
              220,
          },
        ]);
      },
    );

    it(
      "ignores malformed daily sales rows",
      () => {
        const result =
          buildSalesIntelligenceContext({
            analytics: {
              sales: {},

              daily_sales: [
                null,
                "bad",
                {},
                {
                  date:
                    "2026-08-20",

                  orders:
                    1,
                },
              ],
            },
          });

        expect(
          result.daily_sales,
        ).toEqual([
          {
            date:
              "2026-08-20",

            orders:
              1,

            completed_orders:
              null,

            revenue:
              null,
          },
        ]);
      },
    );

    it(
      "caps daily sales context at 30 points",
      () => {
        const dailySales =
          Array.from(
            {
              length:
                40,
            },

            (
              _,
              index,
            ) => ({
              date:
                `day-${index + 1}`,

              orders:
                index,
            }),
          );

        const result =
          buildSalesIntelligenceContext({
            analytics: {
              sales: {},

              daily_sales:
                dailySales,
            },
          });

        expect(
          result.daily_sales,
        ).toHaveLength(30);
      },
    );

    it(
      "preserves analytics period metadata without creating timestamps",
      () => {
        const result =
          buildSalesIntelligenceContext({
            analytics: {
              generated_at:
                "2026-08-20T10:11:12Z",

              period_days:
                30,

              period_start:
                "2026-07-21T10:11:12Z",

              sales: {},
            },
          });

        expect(
          result.generated_at,
        ).toBe(
          "2026-08-20T10:11:12Z",
        );

        expect(
          result.period_start,
        ).toBe(
          "2026-07-21T10:11:12Z",
        );

        expect(
          result.period_basis,
        ).toBe(
          "orders.created_at",
        );
      },
    );

    it(
      "does not expose unrelated commerce analytics sections",
      () => {
        const result =
          buildSalesIntelligenceContext({
            analytics: {
              sales: {},

              catalog: {
                secret:
                  "not projected",
              },

              research: {
                secret:
                  "not projected",
              },

              automation: {
                secret:
                  "not projected",
              },

              ai_activity: {
                secret:
                  "not projected",
              },
            },
          });

        expect(
          result,
        ).not.toHaveProperty(
          "catalog",
        );

        expect(
          result,
        ).not.toHaveProperty(
          "research",
        );

        expect(
          result,
        ).not.toHaveProperty(
          "automation",
        );

        expect(
          result,
        ).not.toHaveProperty(
          "ai_activity",
        );
      },
    );

    it(
      "does not mutate the analytics input",
      () => {
        const analytics = {
          sales: {
            revenue:
              "100",
          },

          daily_sales: [
            {
              date:
                "2026-08-20",

              revenue:
                "100",
            },
          ],
        };

        const snapshot =
          JSON.stringify(
            analytics,
          );

        buildSalesIntelligenceContext({
          analytics,
        });

        expect(
          JSON.stringify(
            analytics,
          ),
        ).toBe(snapshot);
      },
    );

    it(
      "keeps the exact safety limitations",
      () => {
        const result =
          buildSalesIntelligenceContext({
            analytics: null,
          });

        expect(
          result.limitations,
        ).toEqual(
          limitations,
        );
      },
    );
  },
);
