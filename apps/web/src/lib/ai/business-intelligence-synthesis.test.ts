import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildBusinessIntelligenceSynthesis,
} from "./business-intelligence-synthesis";

function product(
  overrides: Record<string, unknown> = {},
) {
  return {
    product_id:
      "p-1",

    product_name:
      "Product 1",

    sku:
      "SKU-1",

    stock:
      10,

    total_units_sold:
      5,

    revenue:
      500,

    profit:
      200,

    margin:
      40,

    ...overrides,
  };
}

function sales(
  overrides: Record<string, unknown> = {},
) {
  return {
    available:
      true,

    period_days:
      30,

    period_basis:
      "orders.created_at",

    sales: {
      completed_orders:
        10,

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

      ...overrides,
    },
  };
}

function inventory(
  overrides: Record<string, unknown> = {},
) {
  return {
    available:
      true,

    catalog_available:
      true,

    product_performance_available:
      true,

    catalog: {
      products:
        10,

      base_stock_units:
        100,

      variant_stock_units:
        40,
    },

    product_performance: {
      sales_scope:
        "all_completed_orders",

      stock_scope:
        "current_base_product_stock",

      products_with_completed_sales:
        4,

      top_by_profit: [
        product(),
      ],

      negative_stock_products:
        [],

      out_of_stock_with_completed_sales:
        [],

      loss_making_products:
        [],

      stocked_without_completed_sales:
        [],

      ...overrides,
    },
  };
}

describe(
  "buildBusinessIntelligenceSynthesis",
  () => {
    it(
      "returns unavailable when neither source is available",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              null,

            productInventoryIntelligence:
              null,
          });

        expect(
          result.available,
        ).toBe(false);

        expect(
          result.priorities,
        ).toEqual([]);

        expect(
          result.opportunities,
        ).toEqual([]);
      },
    );

    it(
      "builds a bounded business snapshot from authoritative contexts",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              sales(),

            productInventoryIntelligence:
              inventory(),
          });

        expect(
          result.snapshot,
        ).toEqual({
          revenue:
            1000,

          gross_profit:
            400,

          gross_margin_percent:
            40,

          average_order_value:
            100,

          completed_orders:
            10,

          catalog_products:
            10,

          base_stock_units:
            100,

          variant_stock_units:
            40,

          products_with_completed_sales:
            4,
        });
      },
    );

    it(
      "flags negative aggregate gross profit without inventing a threshold",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              sales({
                gross_profit:
                  -25,

                revenue:
                  500,

                cogs:
                  525,

                gross_margin_percent:
                  -5,
              }),

            productInventoryIntelligence:
              null,
          });

        expect(
          result.priorities[0],
        ).toMatchObject({
          code:
            "negative_gross_profit",

          urgency:
            "high",

          domain:
            "sales_profitability",
        });
      },
    );

    it(
      "flags negative stock as critical inventory integrity evidence",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              null,

            productInventoryIntelligence:
              inventory({
                negative_stock_products: [
                  product({
                    stock:
                      -3,
                  }),
                ],
              }),
          });

        expect(
          result.priorities[0],
        ).toMatchObject({
          code:
            "negative_stock",

          urgency:
            "critical",

          evidence_count:
            1,
        });
      },
    );

    it(
      "flags products that have completed sales but no current base stock",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              null,

            productInventoryIntelligence:
              inventory({
                out_of_stock_with_completed_sales: [
                  product({
                    stock:
                      0,

                    total_units_sold:
                      20,
                  }),
                ],
              }),
          });

        expect(
          result.priorities[0]
            ?.code,
        ).toBe(
          "out_of_stock_with_completed_sales",
        );
      },
    );

    it(
      "flags loss-making products from completed-sales evidence",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              null,

            productInventoryIntelligence:
              inventory({
                loss_making_products: [
                  product({
                    profit:
                      -50,
                  }),
                ],
              }),
          });

        expect(
          result.priorities[0],
        ).toMatchObject({
          code:
            "loss_making_products",

          urgency:
            "high",
        });
      },
    );

    it(
      "labels stocked products without completed sales as review rather than slow-moving",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              null,

            productInventoryIntelligence:
              inventory({
                stocked_without_completed_sales: [
                  product({
                    total_units_sold:
                      0,
                  }),
                ],
              }),
          });

        expect(
          result.priorities[0],
        ).toMatchObject({
          code:
            "stocked_without_completed_sales",

          urgency:
            "review",
        });

        expect(
          result.priorities[0]
            ?.suggested_focus,
        ).toContain(
          "does not prove",
        );
      },
    );

    it(
      "keeps deterministic rule ordering",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              sales({
                gross_profit:
                  -10,
              }),

            productInventoryIntelligence:
              inventory({
                negative_stock_products: [
                  product({
                    stock:
                      -1,
                  }),
                ],

                out_of_stock_with_completed_sales: [
                  product({
                    stock:
                      0,
                  }),
                ],

                loss_making_products: [
                  product({
                    profit:
                      -20,
                  }),
                ],

                stocked_without_completed_sales: [
                  product({
                    total_units_sold:
                      0,
                  }),
                ],
              }),
          });

        expect(
          result.priorities.map(
            (priority) =>
              priority.code,
          ),
        ).toEqual([
          "negative_gross_profit",
          "negative_stock",
          "out_of_stock_with_completed_sales",
          "loss_making_products",
          "stocked_without_completed_sales",
        ]);
      },
    );

    it(
      "surfaces a historically profitable product only when it has sales and positive current base stock",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              null,

            productInventoryIntelligence:
              inventory({
                top_by_profit: [
                  product({
                    product_id:
                      "sold-out",

                    product_name:
                      "Sold Out",

                    stock:
                      0,

                    profit:
                      500,
                  }),

                  product({
                    product_id:
                      "available",

                    product_name:
                      "Available",

                    stock:
                      5,

                    profit:
                      200,
                  }),
                ],
              }),
          });

        expect(
          result.opportunities[0]
            ?.product
            .product_name,
        ).toBe(
          "Available",
        );
      },
    );

    it(
      "does not create a growth opportunity from zero-profit or unsold products",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              null,

            productInventoryIntelligence:
              inventory({
                top_by_profit: [
                  product({
                    profit:
                      0,
                  }),

                  product({
                    total_units_sold:
                      0,

                    profit:
                      100,
                  }),
                ],
              }),
          });

        expect(
          result.opportunities,
        ).toEqual([]);
      },
    );

    it(
      "caps product evidence at five items",
      () => {
        const rows =
          Array.from(
            {
              length:
                12,
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
                  -index - 1,
              }),
          );

        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              null,

            productInventoryIntelligence:
              inventory({
                negative_stock_products:
                  rows,
              }),
          });

        expect(
          result.priorities[0]
            ?.products,
        ).toHaveLength(5);
      },
    );

    it(
      "drops malformed product evidence instead of inventing product identity",
      () => {
        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              null,

            productInventoryIntelligence:
              inventory({
                negative_stock_products: [
                  null,
                  "bad",
                  {},
                  product(),
                ],
              }),
          });

        expect(
          result.priorities[0]
            ?.products,
        ).toHaveLength(1);
      },
    );

    it(
      "does not mutate either source and preserves explicit safety limitations",
      () => {
        const salesInput =
          sales();

        const inventoryInput =
          inventory();

        const salesSnapshot =
          JSON.stringify(
            salesInput,
          );

        const inventorySnapshot =
          JSON.stringify(
            inventoryInput,
          );

        const result =
          buildBusinessIntelligenceSynthesis({
            salesIntelligence:
              salesInput,

            productInventoryIntelligence:
              inventoryInput,
          });

        expect(
          JSON.stringify(
            salesInput,
          ),
        ).toBe(
          salesSnapshot,
        );

        expect(
          JSON.stringify(
            inventoryInput,
          ),
        ).toBe(
          inventorySnapshot,
        );

        expect(
          result.limitations,
        ).toContain(
          "Suggested focus text is advisory context only and never authorizes a product, price, inventory, order, or automation mutation.",
        );

        expect(
          result.limitations,
        ).toContain(
          "Competitor threshold alerts remain governed by the separate deterministic proactive-insight engine and are not duplicated here.",
        );
      },
    );
  },
);
