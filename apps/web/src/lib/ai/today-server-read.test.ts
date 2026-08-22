import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks =
  vi.hoisted(
    () => ({
      getCurrentOrganization:
        vi.fn(),

      createClient:
        vi.fn(),

      rpc:
        vi.fn(),

      from:
        vi.fn(),
    }),
  );

vi.mock(
  "@/lib/supabase/current-organization",
  () => ({
    getCurrentOrganization:
      mocks.getCurrentOrganization,
  }),
);

vi.mock(
  "@/lib/supabase/server",
  () => ({
    createClient:
      mocks.createClient,
  }),
);

import {
  countRecentMarketplaceFailures,
  loadLakuvoTodayFromServer,
  TODAY_RECENT_SYNC_FAILURE_HOURS,
  todaySyncFailureWindowStart,
} from "./today-server-read";

const ORGANIZATION_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const GENERATED_AT =
  "2026-08-22T06:00:00.000Z";

let accountsEq:
  ReturnType<
    typeof vi.fn
  >;

let logsEq:
  ReturnType<
    typeof vi.fn
  >;

let logsGte:
  ReturnType<
    typeof vi.fn
  >;

function marketplaceAccountsQuery() {
  const query = {
    select:
      vi.fn(),

    eq:
      vi.fn(),

    order:
      vi.fn(),
  };

  query.select.mockReturnValue(
    query,
  );

  query.eq.mockReturnValue(
    query,
  );

  query.order.mockResolvedValue({
    data: [
      {
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
      },
    ],

    error:
      null,
  });

  accountsEq =
    query.eq;

  return query;
}

function marketplaceLogsQuery() {
  const query = {
    select:
      vi.fn(),

    eq:
      vi.fn(),

    gte:
      vi.fn(),
  };

  query.select.mockReturnValue(
    query,
  );

  query.eq.mockReturnValue(
    query,
  );

  query.gte.mockResolvedValue({
    data: [
      {
        marketplace_account_id:
          "marketplace-1",

        status:
          "failed",

        created_at:
          "2026-08-22T04:00:00.000Z",
      },
      {
        marketplace_account_id:
          "marketplace-1",

        status:
          "success",

        created_at:
          "2026-08-22T05:00:00.000Z",
      },
    ],

    error:
      null,
  });

  logsEq =
    query.eq;

  logsGte =
    query.gte;

  return query;
}

describe(
  "LAKUVO Today server read adapter",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();

        mocks.getCurrentOrganization
          .mockResolvedValue({
            organizationId:
              ORGANIZATION_ID,
          });

        mocks.createClient
          .mockResolvedValue({
            rpc:
              mocks.rpc,

            from:
              mocks.from,
          });

        mocks.rpc
          .mockImplementation(
            (
              name:
                string,
            ) => {
              if (
                name ===
                "get_sales_performance_summary"
              ) {
                return Promise.resolve({
                  data: {
                    completed_orders:
                      8,

                    revenue:
                      "800000.00",

                    profit:
                      "200000.00",

                    margin:
                      "25.00",

                    average_order_value:
                      "100000.00",
                  },

                  error:
                    null,
                });
              }

              if (
                name ===
                "get_inventory_intelligence"
              ) {
                return Promise.resolve({
                  data: {
                    products: {
                      low_stock:
                        2,

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

                  error:
                    null,
                });
              }

              if (
                name ===
                "get_inventory_alerts"
              ) {
                return Promise.resolve({
                  data: [
                    {
                      id:
                        "alert-1",
                    },
                  ],

                  error:
                    null,
                });
              }

              throw new Error(
                `Unexpected RPC: ${name}`,
              );
            },
          );

        mocks.from
          .mockImplementation(
            (
              table:
                string,
            ) => {
              if (
                table ===
                "marketplace_accounts"
              ) {
                return marketplaceAccountsQuery();
              }

              if (
                table ===
                "marketplace_sync_logs"
              ) {
                return marketplaceLogsQuery();
              }

              throw new Error(
                `Unexpected table: ${table}`,
              );
            },
          );
      },
    );

    it(
      "uses a deterministic 24-hour sync failure window",
      () => {
        expect(
          TODAY_RECENT_SYNC_FAILURE_HOURS,
        ).toBe(24);

        expect(
          todaySyncFailureWindowStart(
            GENERATED_AT,
          ),
        ).toBe(
          "2026-08-21T06:00:00.000Z",
        );
      },
    );

    it(
      "counts only explicit failed sync statuses",
      () => {
        const counts =
          countRecentMarketplaceFailures([
            {
              marketplace_account_id:
                "one",

              status:
                "failed",

              created_at:
                GENERATED_AT,
            },

            {
              marketplace_account_id:
                "one",

              status:
                "FAILED",

              created_at:
                GENERATED_AT,
            },

            {
              marketplace_account_id:
                "one",

              status:
                "success",

              created_at:
                GENERATED_AT,
            },

            {
              marketplace_account_id:
                "one",

              status:
                "unknown_future_status",

              created_at:
                GENERATED_AT,
            },
          ]);

        expect(
          counts.get(
            "one",
          ),
        ).toBe(2);
      },
    );

    it(
      "returns null before database access when no organization is active",
      async () => {
        mocks.getCurrentOrganization
          .mockResolvedValueOnce(
            null,
          );

        await expect(
          loadLakuvoTodayFromServer({
            generatedAt:
              GENERATED_AT,
          }),
        ).resolves.toBeNull();

        expect(
          mocks.createClient,
        ).not.toHaveBeenCalled();

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.from,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "reads all TODAY sources with active organization scope",
      async () => {
        const snapshot =
          await loadLakuvoTodayFromServer({
            generatedAt:
              GENERATED_AT,
          });

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "get_sales_performance_summary",
          {
            p_organization_id:
              ORGANIZATION_ID,
          },
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "get_inventory_intelligence",
          {
            p_organization_id:
              ORGANIZATION_ID,
          },
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "get_inventory_alerts",
          {
            p_organization_id:
              ORGANIZATION_ID,

            p_limit:
              50,
          },
        );

        expect(
          accountsEq,
        ).toHaveBeenCalledWith(
          "organization_id",
          ORGANIZATION_ID,
        );

        expect(
          logsEq,
        ).toHaveBeenCalledWith(
          "organization_id",
          ORGANIZATION_ID,
        );

        expect(
          logsGte,
        ).toHaveBeenCalledWith(
          "created_at",
          "2026-08-21T06:00:00.000Z",
        );

        expect(
          snapshot?.organizationId,
        ).toBe(
          ORGANIZATION_ID,
        );
      },
    );

    it(
      "feeds canonical source data into the deterministic TODAY model",
      async () => {
        const snapshot =
          await loadLakuvoTodayFromServer({
            generatedAt:
              GENERATED_AT,
          });

        expect(
          snapshot?.commerce.revenue,
        ).toEqual({
          status:
            "available",

          value:
            "800000.00",
        });

        expect(
          snapshot?.inventory.products
            .outOfStockCount,
        ).toEqual({
          status:
            "available",

          value:
            1,
        });

        expect(
          snapshot?.marketplaces.channels[0],
        ).toMatchObject({
          id:
            "marketplace-1",

          health:
            "attention",

          reasons: [
            "recent_sync_failures",
          ],
        });

        expect(
          snapshot?.recommendations.map(
            (
              recommendation,
            ) =>
              recommendation.id,
          ),
        ).toEqual([
          "review-out-of-stock-inventory",
          "review-marketplace-health",
          "review-low-stock-inventory",
        ]);

        expect(
          snapshot?.dailyBrief,
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
