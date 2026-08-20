import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildBusinessContext,
  type BusinessContextOrder,
} from "./business-context";

const GENERATED_AT =
  "2026-08-20T07:00:00.000Z";

const LIMITATIONS = [
  "Only the 30 selected product records are included as product details.",
  "Only the 30 most recent orders are included as order details.",
  "business_summary.orders.recent_value is only the sum of total from those recent order records. It is not official revenue, profit, or completed-sales value.",
  "The recent order value includes all order statuses in the recent window.",
  "nonpositive_stock_count means products where stock is less than or equal to zero.",
  "nonpositive_price_count means products where price is less than or equal to zero.",
  "Order item details are not included.",
  "Customer names, email addresses, and phone numbers are not included.",
  "Competitor prices come only from stored price monitoring observations.",
  "A price observation is a historical snapshot and may not represent the competitor price at this exact moment.",
];

function buildDefaultInput() {
  return {
    generatedAt:
      GENERATED_AT,

    products: [],

    productTotalCount:
      null,

    nonpositiveStockCount:
      null,

    nonpositivePriceCount:
      null,

    recentOrders:
      [] as BusinessContextOrder[],

    orderTotalCount:
      null,

    customerTotalCount:
      null,

    priceTargets: [],

    priceObservations: [],
  };
}

describe(
  "buildBusinessContext",
  () => {
    it(
      "builds the current empty-context fallbacks and uses the supplied timestamp",
      () => {
        expect(
          buildBusinessContext(
            buildDefaultInput(),
          ),
        ).toEqual({
          generated_at:
            GENERATED_AT,

          business_summary: {
            products: {
              total_count:
                0,

              nonpositive_stock_count:
                0,

              nonpositive_price_count:
                0,
            },

            orders: {
              total_count:
                0,

              recent_count:
                0,

              recent_value:
                0,

              recent_by_status:
                {},

              recent_window_limit:
                30,
            },

            customers: {
              total_count:
                0,
            },
          },

          products:
            [],

          sales: {
            recent_orders:
              [],

            customer_count:
              0,
          },

          price_monitoring: {
            targets:
              [],

            observations:
              [],
          },

          limitations:
            LIMITATIONS,
        });
      },
    );

    it(
      "builds the current populated business context shape",
      () => {
        const products = [
          {
            id:
              "product-1",

            name:
              "Product A",
          },
        ];

        const recentOrders = [
          {
            status:
              "paid",

            total:
              150,

            created_at:
              "2026-08-20T06:00:00.000Z",
          },
        ];

        const targets = [
          {
            id:
              "target-1",
          },
        ];

        const observations = [
          {
            id:
              "observation-1",

            observed_price:
              125,
          },
        ];

        const result =
          buildBusinessContext({
            ...buildDefaultInput(),

            products,

            productTotalCount:
              12,

            nonpositiveStockCount:
              2,

            nonpositivePriceCount:
              1,

            recentOrders,

            orderTotalCount:
              20,

            customerTotalCount:
              7,

            priceTargets:
              targets,

            priceObservations:
              observations,
          });

        expect(
          result,
        ).toMatchObject({
          generated_at:
            GENERATED_AT,

          business_summary: {
            products: {
              total_count:
                12,

              nonpositive_stock_count:
                2,

              nonpositive_price_count:
                1,
            },

            orders: {
              total_count:
                20,

              recent_count:
                1,

              recent_value:
                150,

              recent_by_status: {
                paid:
                  1,
              },

              recent_window_limit:
                30,
            },

            customers: {
              total_count:
                7,
            },
          },

          products,

          sales: {
            recent_orders:
              recentOrders,

            customer_count:
              7,
          },

          price_monitoring: {
            targets,

            observations,
          },
        });
      },
    );

    it(
      "trims order statuses, groups duplicates, and maps blank or missing statuses to unknown",
      () => {
        const recentOrders:
          BusinessContextOrder[] = [
            {
              status:
                " paid ",
            },
            {
              status:
                "paid",
            },
            {
              status:
                "",
            },
            {
              status:
                "   ",
            },
            {
              status:
                null,
            },
            {},
          ];

        const result =
          buildBusinessContext({
            ...buildDefaultInput(),
            recentOrders,
          });

        expect(
          result.business_summary
            .orders
            .recent_by_status,
        ).toEqual({
          paid:
            2,

          unknown:
            4,
        });
      },
    );

    it(
      "sums finite numeric and numeric-string totals and ignores invalid or non-finite totals",
      () => {
        const recentOrders:
          BusinessContextOrder[] = [
            {
              total:
                10,
            },
            {
              total:
                "5.5",
            },
            {
              total:
                null,
            },
            {
              total:
                "invalid",
            },
            {
              total:
                Number.POSITIVE_INFINITY,
            },
            {
              total:
                -2,
            },
          ];

        const result =
          buildBusinessContext({
            ...buildDefaultInput(),
            recentOrders,
          });

        expect(
          result.business_summary
            .orders
            .recent_value,
        ).toBe(13.5);
      },
    );

    it(
      "preserves explicit zero counts instead of applying fallbacks",
      () => {
        const result =
          buildBusinessContext({
            ...buildDefaultInput(),

            products: [
              {
                id:
                  "product-1",
              },
            ],

            productTotalCount:
              0,

            nonpositiveStockCount:
              0,

            nonpositivePriceCount:
              0,

            recentOrders: [
              {
                status:
                  "paid",

                total:
                  10,
              },
            ],

            orderTotalCount:
              0,

            customerTotalCount:
              0,
          });

        expect(
          result.business_summary,
        ).toMatchObject({
          products: {
            total_count:
              0,

            nonpositive_stock_count:
              0,

            nonpositive_price_count:
              0,
          },

          orders: {
            total_count:
              0,
          },

          customers: {
            total_count:
              0,
          },
        });
      },
    );

    it(
      "uses product and recent-order lengths only for nullish total-count fallbacks",
      () => {
        const result =
          buildBusinessContext({
            ...buildDefaultInput(),

            products: [
              {},
              {},
            ],

            recentOrders: [
              {
                status:
                  "a",
              },
              {
                status:
                  "b",
              },
              {
                status:
                  "c",
              },
            ],
          });

        expect(
          result.business_summary
            .products
            .total_count,
        ).toBe(2);

        expect(
          result.business_summary
            .orders
            .total_count,
        ).toBe(3);
      },
    );

    it(
      "passes detail arrays through without cloning them",
      () => {
        const products = [
          {
            id:
              "product-1",
          },
        ];

        const recentOrders:
          BusinessContextOrder[] = [
            {
              status:
                "paid",
          },
        ];

        const priceTargets = [
          {
            id:
              "target-1",
          },
        ];

        const priceObservations = [
          {
            id:
              "observation-1",
          },
        ];

        const result =
          buildBusinessContext({
            ...buildDefaultInput(),
            products,
            recentOrders,
            priceTargets,
            priceObservations,
          });

        expect(
          result.products,
        ).toBe(products);

        expect(
          result.sales
            .recent_orders,
        ).toBe(recentOrders);

        expect(
          result.price_monitoring
            .targets,
        ).toBe(priceTargets);

        expect(
          result.price_monitoring
            .observations,
        ).toBe(
          priceObservations,
        );
      },
    );

    it(
      "mirrors the customer count in business summary and sales context",
      () => {
        const result =
          buildBusinessContext({
            ...buildDefaultInput(),

            customerTotalCount:
              11,
          });

        expect(
          result.business_summary
            .customers
            .total_count,
        ).toBe(11);

        expect(
          result.sales
            .customer_count,
        ).toBe(11);
      },
    );

    it(
      "keeps the exact current limitations contract",
      () => {
        const result =
          buildBusinessContext(
            buildDefaultInput(),
          );

        expect(
          result.limitations,
        ).toEqual(
          LIMITATIONS,
        );
      },
    );

    it(
      "does not mutate recent order records while aggregating",
      () => {
        const recentOrders:
          BusinessContextOrder[] = [
            {
              status:
                " paid ",

              total:
                "10",
            },
          ];

        const before =
          structuredClone(
            recentOrders,
          );

        buildBusinessContext({
          ...buildDefaultInput(),
          recentOrders,
        });

        expect(
          recentOrders,
        ).toEqual(
          before,
        );
      },
    );
  },
);
