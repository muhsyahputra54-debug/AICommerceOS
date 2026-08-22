import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildTodayInventorySummary,
  buildTodayMarketplaceSummary,
  type TodayMarketplaceAccountInput,
} from "./today-read-model";

import {
  buildTodayIssues,
} from "./today-urgent-issues";

const GENERATED_AT =
  "2026-08-22T06:00:00.000Z";

type InventoryOptions = {
  productLow?:
    number;

  productOut?:
    number;

  variantLow?:
    number;

  variantOut?:
    number;

  productsAvailable?:
    boolean;

  variantsAvailable?:
    boolean;
};

function inventory(
  options:
    InventoryOptions = {},
) {
  const products =
    options.productsAvailable === false
      ? null
      : {
          low_stock:
            options.productLow ?? 0,

          out_of_stock:
            options.productOut ?? 0,
        };

  const variants =
    options.variantsAvailable === false
      ? null
      : {
          low_stock:
            options.variantLow ?? 0,

          out_of_stock:
            options.variantOut ?? 0,
        };

  return buildTodayInventorySummary(
    {
      products,
      variants,
    },
    [],
  );
}

function marketplace(
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

function marketplaces(
  accounts:
    readonly TodayMarketplaceAccountInput[] = [],
) {
  return buildTodayMarketplaceSummary({
    accounts,

    generatedAt:
      GENERATED_AT,
  });
}

describe(
  "LAKUVO TODAY urgent issues engine",
  () => {
    it(
      "returns no issue when verified inventory and marketplace facts are healthy",
      () => {
        const issues =
          buildTodayIssues({
            inventory:
              inventory(),

            marketplaces:
              marketplaces(),

            detectedAt:
              GENERATED_AT,
          });

        expect(
          issues,
        ).toEqual(
          [],
        );
      },
    );

    it(
      "preserves deterministic out-of-stock and low-stock issues",
      () => {
        const issues =
          buildTodayIssues({
            inventory:
              inventory({
                productOut:
                  2,

                variantOut:
                  1,

                productLow:
                  4,

                variantLow:
                  2,
              }),

            marketplaces:
              marketplaces(),

            detectedAt:
              GENERATED_AT,
          });

        expect(
          issues.map(
            (issue) =>
              issue.id,
          ),
        ).toEqual([
          "inventory-out-of-stock",
          "inventory-low-stock",
        ]);

        expect(
          issues[0],
        ).toMatchObject({
          severity:
            "high",

          category:
            "inventory",

          source:
            "get_inventory_intelligence",

          evidence: {
            product_out_of_stock:
              2,

            variant_out_of_stock:
              1,

            total_out_of_stock:
              3,
          },

          entity:
            null,

          detectedAt:
            GENERATED_AT,
        });

        expect(
          issues[1],
        ).toMatchObject({
          severity:
            "medium",

          category:
            "inventory",

          evidence: {
            product_low_stock:
              4,

            variant_low_stock:
              2,

            total_low_stock:
              6,
          },
        });
      },
    );

    it(
      "fails closed instead of fabricating an aggregate when one inventory side is unavailable",
      () => {
        const issues =
          buildTodayIssues({
            inventory:
              inventory({
                productOut:
                  3,

                variantsAvailable:
                  false,
              }),

            marketplaces:
              marketplaces(),

            detectedAt:
              GENERATED_AT,
          });

        expect(
          issues.some(
            (issue) =>
              issue.id ===
              "inventory-out-of-stock",
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "maps active marketplace attention to medium severity",
      () => {
        const issues =
          buildTodayIssues({
            inventory:
              inventory(),

            marketplaces:
              marketplaces([
                marketplace({
                  recent_failed_sync_count:
                    2,
                }),
              ]),

            detectedAt:
              GENERATED_AT,
          });

        expect(
          issues,
        ).toHaveLength(
          1,
        );

        expect(
          issues[0],
        ).toMatchObject({
          id:
            "marketplace-marketplace-1-attention",

          severity:
            "medium",

          category:
            "marketplace",

          source:
            "marketplace_health_read_model",

          evidence: {
            provider:
              "tiktok_shop",

            status:
              "active",

            reasons:
              "recent_sync_failures",
          },

          entity: {
            type:
              "marketplace",

            id:
              "marketplace-1",

            name:
              "Main Store",
          },

          detectedAt:
            GENERATED_AT,
        });
      },
    );

    it(
      "maps an inactive marketplace attention issue to high severity",
      () => {
        const issues =
          buildTodayIssues({
            inventory:
              inventory(),

            marketplaces:
              marketplaces([
                marketplace({
                  status:
                    "inactive",
                }),
              ]),

            detectedAt:
              GENERATED_AT,
          });

        expect(
          issues,
        ).toHaveLength(
          1,
        );

        expect(
          issues[0],
        ).toMatchObject({
          severity:
            "high",

          category:
            "marketplace",

          evidence: {
            status:
              "inactive",

            reasons:
              "marketplace_account_not_active",
          },
        });
      },
    );

    it(
      "does not turn unavailable marketplace health into a fabricated urgent issue",
      () => {
        const summary =
          marketplaces([
            marketplace({
              last_synced_at:
                "not-a-timestamp",
            }),
          ]);

        expect(
          summary.channels[0]
            .health,
        ).toBe(
          "unavailable",
        );

        const issues =
          buildTodayIssues({
            inventory:
              inventory(),

            marketplaces:
              summary,

            detectedAt:
              GENERATED_AT,
          });

        expect(
          issues,
        ).toEqual(
          [],
        );
      },
    );

    it(
      "is deterministic and preserves the supplied detection timestamp",
      () => {
        const input = {
          inventory:
            inventory({
              productOut:
                1,
            }),

          marketplaces:
            marketplaces([
              marketplace({
                recent_failed_sync_count:
                  1,
              }),
            ]),

          detectedAt:
            GENERATED_AT,
        };

        const first =
          buildTodayIssues(
            input,
          );

        const second =
          buildTodayIssues(
            input,
          );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first.every(
            (issue) =>
              issue.detectedAt ===
              GENERATED_AT,
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);