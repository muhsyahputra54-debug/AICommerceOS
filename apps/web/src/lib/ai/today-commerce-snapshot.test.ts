import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildLakuvoTodayReadModel,
  buildTodayCommerceSummary,
} from "./today-read-model";

describe(
  "LAKUVO TODAY commerce snapshot",
  () => {
    it(
      "projects the complete canonical completed-sales summary",
      () => {
        const result =
          buildTodayCommerceSummary({
            completed_orders:
              "12",

            units_sold:
              "18",

            products_sold:
              "5",

            revenue:
              "1500000.00",

            cost:
              "1100000.00",

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
          result.unitsSold,
        ).toEqual({
          status:
            "available",

          value:
            18,
        });

        expect(
          result.productsSold,
        ).toEqual({
          status:
            "available",

          value:
            5,
        });

        expect(
          result.revenue,
        ).toEqual({
          status:
            "available",

          value:
            "1500000.00",
        });

        expect(
          result.cost,
        ).toEqual({
          status:
            "available",

          value:
            "1100000.00",
        });

        expect(
          result.grossProfit,
        ).toEqual({
          status:
            "available",

          value:
            "400000.00",
        });

        expect(
          result.grossMargin,
        ).toEqual({
          status:
            "available",

          value:
            "26.67",
        });

        expect(
          result.averageOrderValue,
        ).toEqual({
          status:
            "available",

          value:
            "125000.00",
        });
      },
    );

    it(
      "does not fabricate zero when new canonical metrics are missing",
      () => {
        const result =
          buildTodayCommerceSummary({
            completed_orders:
              3,

            revenue:
              300000,

            profit:
              90000,

            margin:
              30,

            average_order_value:
              100000,
          });

        expect(
          result.unitsSold.status,
        ).toBe(
          "unavailable",
        );

        expect(
          result.productsSold.status,
        ).toBe(
          "unavailable",
        );

        expect(
          result.cost.status,
        ).toBe(
          "unavailable",
        );

        expect(
          result.unitsSold.value,
        ).toBeNull();

        expect(
          result.productsSold.value,
        ).toBeNull();

        expect(
          result.cost.value,
        ).toBeNull();
      },
    );

    it(
      "normalizes count metrics without changing monetary serialization",
      () => {
        const result =
          buildTodayCommerceSummary({
            completed_orders:
              "4.9",

            units_sold:
              "7.8",

            products_sold:
              "-2",

            revenue:
              "800000.00",

            cost:
              "500000.00",

            profit:
              "300000.00",

            margin:
              "37.50",

            average_order_value:
              "200000.00",
          });

        expect(
          result.completedOrders,
        ).toEqual({
          status:
            "available",

          value:
            4,
        });

        expect(
          result.unitsSold,
        ).toEqual({
          status:
            "available",

          value:
            7,
        });

        expect(
          result.productsSold,
        ).toEqual({
          status:
            "available",

          value:
            0,
        });

        expect(
          result.cost,
        ).toEqual({
          status:
            "available",

          value:
            "500000.00",
        });
      },
    );

    it(
      "exposes extended commerce metrics through the TODAY snapshot",
      () => {
        const snapshot =
          buildLakuvoTodayReadModel({
            organizationId:
              "org-1",

            generatedAt:
              "2026-08-22T06:00:00.000Z",

            salesSummary: {
              completed_orders:
                8,

              units_sold:
                11,

              products_sold:
                4,

              revenue:
                "800000.00",

              cost:
                "600000.00",

              profit:
                "200000.00",

              margin:
                "25.00",

              average_order_value:
                "100000.00",
            },

            inventoryIntelligence:
              null,

            inventoryAlerts:
              null,

            marketplaceAccounts:
              [],
          });

        expect(
          snapshot.commerce.unitsSold,
        ).toEqual({
          status:
            "available",

          value:
            11,
        });

        expect(
          snapshot.commerce.productsSold,
        ).toEqual({
          status:
            "available",

          value:
            4,
        });

        expect(
          snapshot.commerce.cost,
        ).toEqual({
          status:
            "available",

          value:
            "600000.00",
        });
      },
    );
  },
);