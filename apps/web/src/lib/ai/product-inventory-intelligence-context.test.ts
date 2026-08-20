import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildProductInventoryIntelligenceContext,
} from "./product-inventory-intelligence-context";

function product(
  overrides: Record<string, unknown> = {},
) {
  return {
    product_id:
      "product-a",

    product_name:
      "Product A",

    sku:
      "SKU-A",

    stock:
      10,

    total_units_sold:
      5,

    revenue:
      500,

    cost:
      300,

    profit:
      200,

    margin:
      40,

    ...overrides,
  };
}

describe(
  "buildProductInventoryIntelligenceContext",
  () => {
    it(
      "returns explicit unavailable state when both sources are unavailable",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance:
              null,
          });

        expect(
          result.available,
        ).toBe(false);

        expect(
          result.catalog_available,
        ).toBe(false);

        expect(
          result.product_performance_available,
        ).toBe(false);

        expect(
          result.catalog,
        ).toBeNull();

        expect(
          result.product_performance,
        ).toBeNull();
      },
    );

    it(
      "projects the authoritative catalog snapshot",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics: {
              generated_at:
                "2026-08-20T09:00:00Z",

              catalog: {
                products:
                  "12",

                active_products:
                  10,

                base_stock_units:
                  "100",

                base_retail_value:
                  "2500.50",

                base_cost_value:
                  "1400.25",

                variants:
                  8,

                variant_stock_units:
                  "44",

                variant_retail_value:
                  "1200",

                variant_cost_value:
                  "700",
              },
            },

            productPerformance:
              null,
          });

        expect(
          result.catalog_generated_at,
        ).toBe(
          "2026-08-20T09:00:00Z",
        );

        expect(
          result.catalog,
        ).toEqual({
          products:
            12,

          active_products:
            10,

          base_stock_units:
            100,

          base_retail_value:
            2500.5,

          base_cost_value:
            1400.25,

          variants:
            8,

          variant_stock_units:
            44,

          variant_retail_value:
            1200,

          variant_cost_value:
            700,
        });
      },
    );

    it(
      "keeps base and variant inventory values explicitly separate",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics: {
              catalog: {
                base_stock_units:
                  10,

                variant_stock_units:
                  20,
              },
            },

            productPerformance:
              [],
          });

        expect(
          result.inventory_value_semantics,
        ).toBe(
          "base_and_variant_values_reported_separately",
        );

        expect(
          result,
        ).not.toHaveProperty(
          "combined_stock_units",
        );

        expect(
          result,
        ).not.toHaveProperty(
          "combined_inventory_value",
        );
      },
    );

    it(
      "treats a successful empty product result as available",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance:
              [],
          });

        expect(
          result.available,
        ).toBe(true);

        expect(
          result.product_performance_available,
        ).toBe(true);

        expect(
          result.product_performance
            ?.product_count,
        ).toBe(0);
      },
    );

    it(
      "normalizes product performance numeric strings",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance: [
              product({
                stock:
                  "7",

                total_units_sold:
                  "9",

                revenue:
                  "123.50",

                cost:
                  "80.25",

                profit:
                  "43.25",

                margin:
                  "35.02",
              }),
            ],
          });

        const top =
          result.product_performance
            ?.top_by_revenue[0];

        expect(
          top,
        ).toMatchObject({
          stock:
            7,

          total_units_sold:
            9,

          revenue:
            123.5,

          cost:
            80.25,

          profit:
            43.25,

          margin:
            35.02,
        });
      },
    );

    it(
      "ranks top revenue deterministically",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance: [
              product({
                product_id:
                  "b",

                product_name:
                  "Beta",

                revenue:
                  500,
              }),

              product({
                product_id:
                  "a",

                product_name:
                  "Alpha",

                revenue:
                  500,
              }),

              product({
                product_id:
                  "c",

                product_name:
                  "Gamma",

                revenue:
                  900,
              }),
            ],
          });

        expect(
          result.product_performance
            ?.top_by_revenue
            .map(
              (row) =>
                row.product_name,
            ),
        ).toEqual([
          "Gamma",
          "Alpha",
          "Beta",
        ]);
      },
    );

    it(
      "ranks profit and units sold independently",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance: [
              product({
                product_id:
                  "a",

                product_name:
                  "A",

                profit:
                  100,

                total_units_sold:
                  50,
              }),

              product({
                product_id:
                  "b",

                product_name:
                  "B",

                profit:
                  300,

                total_units_sold:
                  10,
              }),
            ],
          });

        expect(
          result.product_performance
            ?.top_by_profit[0]
            ?.product_name,
        ).toBe("B");

        expect(
          result.product_performance
            ?.top_by_units_sold[0]
            ?.product_name,
        ).toBe("A");
      },
    );

    it(
      "finds the lowest-profit products only among products with completed sales",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance: [
              product({
                product_id:
                  "unsold",

                product_name:
                  "Unsold",

                total_units_sold:
                  0,

                profit:
                  -999,
              }),

              product({
                product_id:
                  "sold-low",

                product_name:
                  "Sold Low",

                total_units_sold:
                  2,

                profit:
                  -20,
              }),

              product({
                product_id:
                  "sold-high",

                product_name:
                  "Sold High",

                total_units_sold:
                  4,

                profit:
                  100,
              }),
            ],
          });

        expect(
          result.product_performance
            ?.lowest_profit_sold_products
            .map(
              (row) =>
                row.product_name,
            ),
        ).toEqual([
          "Sold Low",
          "Sold High",
        ]);
      },
    );

    it(
      "detects products with completed sales and nonpositive current stock",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance: [
              product({
                product_id:
                  "sold-out",

                product_name:
                  "Sold Out",

                stock:
                  0,

                total_units_sold:
                  20,
              }),

              product({
                product_id:
                  "never-sold",

                product_name:
                  "Never Sold",

                stock:
                  0,

                total_units_sold:
                  0,
              }),
            ],
          });

        expect(
          result.product_performance
            ?.out_of_stock_with_completed_sales
            .map(
              (row) =>
                row.product_name,
            ),
        ).toEqual([
          "Sold Out",
        ]);
      },
    );

    it(
      "detects negative base-product stock",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance: [
              product({
                product_id:
                  "minus-one",

                product_name:
                  "Minus One",

                stock:
                  -1,
              }),

              product({
                product_id:
                  "minus-five",

                product_name:
                  "Minus Five",

                stock:
                  -5,
              }),

              product({
                product_id:
                  "positive",

                product_name:
                  "Positive",

                stock:
                  5,
              }),
            ],
          });

        expect(
          result.product_performance
            ?.negative_stock_products
            .map(
              (row) =>
                row.product_name,
            ),
        ).toEqual([
          "Minus Five",
          "Minus One",
        ]);
      },
    );

    it(
      "detects stocked products without completed sales without calling them slow-moving",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance: [
              product({
                product_id:
                  "stock-a",

                product_name:
                  "Stock A",

                stock:
                  50,

                total_units_sold:
                  0,
              }),

              product({
                product_id:
                  "stock-b",

                product_name:
                  "Stock B",

                stock:
                  10,

                total_units_sold:
                  0,
              }),

              product({
                product_id:
                  "sold",

                product_name:
                  "Sold",

                stock:
                  80,

                total_units_sold:
                  1,
              }),
            ],
          });

        expect(
          result.product_performance
            ?.stocked_without_completed_sales
            .map(
              (row) =>
                row.product_name,
            ),
        ).toEqual([
          "Stock A",
          "Stock B",
        ]);
      },
    );

    it(
      "detects loss-making sold products",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance: [
              product({
                product_id:
                  "loss",

                product_name:
                  "Loss",

                total_units_sold:
                  5,

                profit:
                  -40,
              }),

              product({
                product_id:
                  "profit",

                product_name:
                  "Profit",

                total_units_sold:
                  5,

                profit:
                  80,
              }),
            ],
          });

        expect(
          result.product_performance
            ?.loss_making_products
            .map(
              (row) =>
                row.product_name,
            ),
        ).toEqual([
          "Loss",
        ]);
      },
    );

    it(
      "bounds ranking and exposure lists",
      () => {
        const rows =
          Array.from(
            {
              length:
                20,
            },
            (
              _,
              index,
            ) =>
              product({
                product_id:
                  `p-${index}`,

                product_name:
                  `Product ${index}`,

                stock:
                  0,

                total_units_sold:
                  index + 1,

                revenue:
                  index * 100,

                profit:
                  -index,
              }),
          );

        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance:
              rows,
          });

        expect(
          result.product_performance
            ?.top_by_revenue,
        ).toHaveLength(5);

        expect(
          result.product_performance
            ?.out_of_stock_with_completed_sales,
        ).toHaveLength(10);

        expect(
          result.product_performance
            ?.loss_making_products,
        ).toHaveLength(10);
      },
    );

    it(
      "drops malformed product rows rather than inventing identifiers",
      () => {
        const result =
          buildProductInventoryIntelligenceContext({
            analytics:
              null,

            productPerformance: [
              null,
              "bad",
              {},
              {
                product_id:
                  "missing-name",
              },
              product(),
            ],
          });

        expect(
          result.product_performance
            ?.product_count,
        ).toBe(1);
      },
    );

    it(
      "does not mutate either input source",
      () => {
        const analytics = {
          catalog: {
            products:
              "10",
          },
        };

        const performance = [
          product({
            stock:
              "5",
          }),
        ];

        const analyticsSnapshot =
          JSON.stringify(
            analytics,
          );

        const performanceSnapshot =
          JSON.stringify(
            performance,
          );

        buildProductInventoryIntelligenceContext({
          analytics,
          productPerformance:
            performance,
        });

        expect(
          JSON.stringify(
            analytics,
          ),
        ).toBe(
          analyticsSnapshot,
        );

        expect(
          JSON.stringify(
            performance,
          ),
        ).toBe(
          performanceSnapshot,
        );
      },
    );
  },
);
