import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildTodayInventoryRiskSummary,
  TODAY_INVENTORY_RISK_ITEM_LIMIT,
} from "./today-inventory-risk";

import { buildTodayInventorySummary } from "./today-read-model";

function alert(
  overrides:
    Record<string, unknown> = {},
) {
  return {
    target_type:
      "product",

    target_id:
      "product-a",

    product_id:
      "product-a",

    name:
      "Product A",

    sku:
      "SKU-A",

    stock:
      2,

    low_stock_threshold:
      5,

    stock_status:
      "low_stock",

    ...overrides,
  };
}

describe(
  "LAKUVO TODAY inventory risk summary",
  () => {
    it(
      "distinguishes unavailable alerts from an available empty result",
      () => {
        const unavailable =
          buildTodayInventoryRiskSummary(
            null,
          );

        expect(
          unavailable,
        ).toEqual({
          source:
            "get_inventory_alerts",

          semantics:
            "current_threshold_alert_sample",

          status:
            "unavailable",

          returnedAlertCount:
            null,

          normalizedAlertCount:
            null,

          items:
            [],

          reason:
            "Inventory alerts unavailable.",
        });

        const empty =
          buildTodayInventoryRiskSummary(
            [],
          );

        expect(
          empty,
        ).toEqual({
          source:
            "get_inventory_alerts",

          semantics:
            "current_threshold_alert_sample",

          status:
            "available",

          returnedAlertCount:
            0,

          normalizedAlertCount:
            0,

          items:
            [],

          reason:
            null,
        });
      },
    );

    it(
      "projects only verified inventory alert fields",
      () => {
        const result =
          buildTodayInventoryRiskSummary([
            alert({
              target_type:
                "variant",

              target_id:
                "variant-a",

              product_id:
                "product-a",

              name:
                "Product A / Large",

              sku:
                "VAR-A",

              stock:
                1,

              low_stock_threshold:
                4,

              stock_status:
                "low_stock",

              ignored_field:
                "must-not-leak",
            }),
          ]);

        expect(
          result.items,
        ).toEqual([
          {
            targetType:
              "variant",

            targetId:
              "variant-a",

            productId:
              "product-a",

            name:
              "Product A / Large",

            sku:
              "VAR-A",

            stock:
              1,

            lowStockThreshold:
              4,

            status:
              "low_stock",
          },
        ]);

        expect(
          result.items[0],
        ).not.toHaveProperty(
          "ignored_field",
        );
      },
    );

    it(
      "accepts finite numeric serialization without fabricating values",
      () => {
        const result =
          buildTodayInventoryRiskSummary([
            alert({
              stock:
                "-2",

              low_stock_threshold:
                "7",

              stock_status:
                "out_of_stock",
            }),
          ]);

        expect(
          result.items[0],
        ).toMatchObject({
          stock:
            -2,

          lowStockThreshold:
            7,

          status:
            "out_of_stock",
        });
      },
    );

    it(
      "fails closed for malformed alert rows",
      () => {
        const result =
          buildTodayInventoryRiskSummary([
            null,
            "bad",
            {},
            alert({
              target_type:
                "unknown",
            }),
            alert({
              stock:
                "not-a-number",
            }),
            alert({
              name:
                "   ",
            }),
            alert({
              target_id:
                "valid-product",
            }),
          ]);

        expect(
          result.returnedAlertCount,
        ).toBe(
          7,
        );

        expect(
          result.normalizedAlertCount,
        ).toBe(
          1,
        );

        expect(
          result.items,
        ).toHaveLength(
          1,
        );

        expect(
          result.items[0]
            .targetId,
        ).toBe(
          "valid-product",
        );
      },
    );

    it(
      "orders out-of-stock before low-stock without inventing demand priority",
      () => {
        const result =
          buildTodayInventoryRiskSummary([
            alert({
              target_id:
                "low-b",

              name:
                "B Low",

              stock_status:
                "low_stock",
            }),

            alert({
              target_id:
                "out-b",

              name:
                "B Out",

              stock:
                0,

              stock_status:
                "out_of_stock",
            }),

            alert({
              target_id:
                "low-a",

              name:
                "A Low",

              stock_status:
                "low_stock",
            }),

            alert({
              target_id:
                "out-a",

              name:
                "A Out",

              stock:
                0,

              stock_status:
                "out_of_stock",
            }),
          ]);

        expect(
          result.items.map(
            (item) =>
              item.targetId,
          ),
        ).toEqual([
          "out-a",
          "out-b",
          "low-a",
          "low-b",
        ]);
      },
    );

    it(
      "caps the detail sample without presenting it as the total risk count",
      () => {
        const alerts =
          Array.from(
            {
              length:
                12,
            },
            (
              _,
              index,
            ) =>
              alert({
                target_id:
                  `product-${String(
                    index,
                  ).padStart(
                    2,
                    "0",
                  )}`,

                product_id:
                  `product-${index}`,

                name:
                  `Product ${String(
                    index,
                  ).padStart(
                    2,
                    "0",
                  )}`,
              }),
          );

        const result =
          buildTodayInventoryRiskSummary(
            alerts,
          );

        expect(
          result.returnedAlertCount,
        ).toBe(
          12,
        );

        expect(
          result.normalizedAlertCount,
        ).toBe(
          12,
        );

        expect(
          result.items,
        ).toHaveLength(
          TODAY_INVENTORY_RISK_ITEM_LIMIT,
        );
      },
    );

    it(
      "does not mutate RPC alert input",
      () => {
        const input = [
          alert({
            target_id:
              "b",

            name:
              "B",
          }),

          alert({
            target_id:
              "a",

            name:
              "A",

            stock_status:
              "out_of_stock",

            stock:
              0,
          }),
        ];

        const before =
          JSON.stringify(
            input,
          );

        buildTodayInventoryRiskSummary(
          input,
        );

        expect(
          JSON.stringify(
            input,
          ),
        ).toBe(
          before,
        );
      },
    );
  },
);
describe(
  "TODAY inventory risk read-model integration",
  () => {
    it(
      "projects bounded verified alert details into the central inventory snapshot",
      () => {
        const summary =
          buildTodayInventorySummary(
            {
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
            [
              alert({
                target_type:
                  "variant",

                target_id:
                  "variant-risk",

                product_id:
                  "product-risk",

                name:
                  "Risk Variant",

                sku:
                  "RISK-VAR",

                stock:
                  0,

                low_stock_threshold:
                  3,

                stock_status:
                  "out_of_stock",
              }),
            ],
          );

        expect(
          summary.alertCount,
        ).toEqual({
          status:
            "available",

          value:
            1,
        });

        expect(
          summary.risk,
        ).toMatchObject({
          source:
            "get_inventory_alerts",

          semantics:
            "current_threshold_alert_sample",

          status:
            "available",

          returnedAlertCount:
            1,

          normalizedAlertCount:
            1,
        });

        expect(
          summary.risk.items,
        ).toEqual([
          {
            targetType:
              "variant",

            targetId:
              "variant-risk",

            productId:
              "product-risk",

            name:
              "Risk Variant",

            sku:
              "RISK-VAR",

            stock:
              0,

            lowStockThreshold:
              3,

            status:
              "out_of_stock",
          },
        ]);
      },
    );

    it(
      "keeps inventory risk explicitly unavailable when the alert RPC result is unavailable",
      () => {
        const summary =
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
                  0,

                out_of_stock:
                  0,
              },
            },
            null,
          );

        expect(
          summary.risk,
        ).toEqual({
          source:
            "get_inventory_alerts",

          semantics:
            "current_threshold_alert_sample",

          status:
            "unavailable",

          returnedAlertCount:
            null,

          normalizedAlertCount:
            null,

          items:
            [],

          reason:
            "Inventory alerts unavailable.",
        });
      },
    );
  },
);