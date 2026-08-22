import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildTodayMarketplaceChannelHealth,
  type TodayMarketplaceHealthAccountInput,
} from "./today-marketplace-health";

import { buildTodayMarketplaceSummary } from "./today-read-model";

const GENERATED_AT =
  "2026-08-22T12:00:00.000Z";

const MAX_AGE_HOURS =
  24;

function account(
  overrides:
    Partial<TodayMarketplaceHealthAccountInput> = {},
): TodayMarketplaceHealthAccountInput {
  return {
    status:
      "active",

    last_synced_at:
      "2026-08-22T11:00:00.000Z",

    recent_failed_sync_count:
      0,

    ...overrides,
  };
}

describe(
  "LAKUVO TODAY marketplace health",
  () => {
    it(
      "marks a fresh active marketplace with no recent failures as healthy",
      () => {
        expect(
          buildTodayMarketplaceChannelHealth({
            account:
              account(),

            generatedAt:
              GENERATED_AT,

            maxAgeHours:
              MAX_AGE_HOURS,
          }),
        ).toEqual({
          health:
            "healthy",

          reasons:
            [],
        });
      },
    );

    it(
      "preserves account and never-synced reasons together",
      () => {
        expect(
          buildTodayMarketplaceChannelHealth({
            account:
              account({
                status:
                  "inactive",

                last_synced_at:
                  null,
              }),

            generatedAt:
              GENERATED_AT,

            maxAgeHours:
              MAX_AGE_HOURS,
          }),
        ).toEqual({
          health:
            "attention",

          reasons: [
            "marketplace_account_not_active",
            "never_synced",
          ],
        });
      },
    );

    it(
      "accepts canonical numeric serialization for recent failed sync count",
      () => {
        expect(
          buildTodayMarketplaceChannelHealth({
            account:
              account({
                recent_failed_sync_count:
                  "2",
              }),

            generatedAt:
              GENERATED_AT,

            maxAgeHours:
              MAX_AGE_HOURS,
          }),
        ).toEqual({
          health:
            "attention",

          reasons: [
            "recent_sync_failures",
          ],
        });
      },
    );

    it(
      "marks sync older than the configured threshold as stale",
      () => {
        expect(
          buildTodayMarketplaceChannelHealth({
            account:
              account({
                last_synced_at:
                  "2026-08-21T11:59:59.000Z",
              }),

            generatedAt:
              GENERATED_AT,

            maxAgeHours:
              MAX_AGE_HOURS,
          }),
        ).toEqual({
          health:
            "attention",

          reasons: [
            "sync_stale",
          ],
        });
      },
    );

    it(
      "does not mark an exact threshold boundary as stale",
      () => {
        expect(
          buildTodayMarketplaceChannelHealth({
            account:
              account({
                last_synced_at:
                  "2026-08-21T12:00:00.000Z",
              }),

            generatedAt:
              GENERATED_AT,

            maxAgeHours:
              MAX_AGE_HOURS,
          }),
        ).toEqual({
          health:
            "healthy",

          reasons:
            [],
        });
      },
    );

    it(
      "fails closed when a synchronization timestamp cannot be evaluated",
      () => {
        expect(
          buildTodayMarketplaceChannelHealth({
            account:
              account({
                last_synced_at:
                  "not-a-timestamp",
              }),

            generatedAt:
              GENERATED_AT,

            maxAgeHours:
              MAX_AGE_HOURS,
          }),
        ).toEqual({
          health:
            "unavailable",

          reasons: [
            "sync_timestamp_unavailable",
          ],
        });
      },
    );

    it(
      "preserves verified reasons when timestamp evaluation is unavailable",
      () => {
        expect(
          buildTodayMarketplaceChannelHealth({
            account:
              account({
                status:
                  "inactive",

                recent_failed_sync_count:
                  1,

                last_synced_at:
                  "invalid",
              }),

            generatedAt:
              GENERATED_AT,

            maxAgeHours:
              MAX_AGE_HOURS,
          }),
        ).toEqual({
          health:
            "unavailable",

          reasons: [
            "marketplace_account_not_active",
            "recent_sync_failures",
            "sync_timestamp_unavailable",
          ],
        });
      },
    );

    it(
      "does not invent a stale condition when last sync is in the future",
      () => {
        expect(
          buildTodayMarketplaceChannelHealth({
            account:
              account({
                last_synced_at:
                  "2026-08-22T13:00:00.000Z",
              }),

            generatedAt:
              GENERATED_AT,

            maxAgeHours:
              MAX_AGE_HOURS,
          }),
        ).toEqual({
          health:
            "healthy",

          reasons:
            [],
        });
      },
    );

    it(
      "ignores malformed recent failure counts instead of fabricating an issue",
      () => {
        expect(
          buildTodayMarketplaceChannelHealth({
            account:
              account({
                recent_failed_sync_count:
                  "not-a-number",
              }),

            generatedAt:
              GENERATED_AT,

            maxAgeHours:
              MAX_AGE_HOURS,
          }),
        ).toEqual({
          health:
            "healthy",

          reasons:
            [],
        });
      },
    );
  },
);
describe(
  "TODAY marketplace health read-model integration",
  () => {
    function marketplaceAccount(
      overrides:
        Record<string, unknown> = {},
    ) {
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
          "2026-08-22T11:00:00.000Z",

        recent_failed_sync_count:
          0,

        ...overrides,
      };
    }

    it(
      "projects a fresh active marketplace as healthy",
      () => {
        const summary =
          buildTodayMarketplaceSummary({
            accounts: [
              marketplaceAccount(),
            ],

            generatedAt:
              GENERATED_AT,

            syncMaxAgeHours:
              MAX_AGE_HOURS,
          });

        expect(
          summary.channels,
        ).toHaveLength(
          1,
        );

        expect(
          summary.channels[0],
        ).toMatchObject({
          id:
            "marketplace-1",

          provider:
            "tiktok_shop",

          name:
            "Main Store",

          status:
            "active",

          lastSyncedAt:
            "2026-08-22T11:00:00.000Z",

          health:
            "healthy",

          reasons:
            [],
        });
      },
    );

    it(
      "preserves attention reasons through the central marketplace summary",
      () => {
        const summary =
          buildTodayMarketplaceSummary({
            accounts: [
              marketplaceAccount({
                status:
                  "inactive",

                recent_failed_sync_count:
                  2,

                last_synced_at:
                  null,
              }),
            ],

            generatedAt:
              GENERATED_AT,

            syncMaxAgeHours:
              MAX_AGE_HOURS,
          });

        expect(
          summary.channels[0],
        ).toMatchObject({
          health:
            "attention",

          reasons: [
            "marketplace_account_not_active",
            "recent_sync_failures",
            "never_synced",
          ],
        });
      },
    );

    it(
      "preserves unavailable timestamp semantics through the central summary",
      () => {
        const summary =
          buildTodayMarketplaceSummary({
            accounts: [
              marketplaceAccount({
                last_synced_at:
                  "not-a-timestamp",
              }),
            ],

            generatedAt:
              GENERATED_AT,

            syncMaxAgeHours:
              MAX_AGE_HOURS,
          });

        expect(
          summary.channels[0],
        ).toMatchObject({
          health:
            "unavailable",

          reasons: [
            "sync_timestamp_unavailable",
          ],
        });
      },
    );

    it(
      "keeps exact stale-threshold behavior after evaluator extraction",
      () => {
        const exactBoundary =
          buildTodayMarketplaceSummary({
            accounts: [
              marketplaceAccount({
                last_synced_at:
                  "2026-08-21T12:00:00.000Z",
              }),
            ],

            generatedAt:
              GENERATED_AT,

            syncMaxAgeHours:
              MAX_AGE_HOURS,
          });

        const beyondBoundary =
          buildTodayMarketplaceSummary({
            accounts: [
              marketplaceAccount({
                last_synced_at:
                  "2026-08-21T11:59:59.000Z",
              }),
            ],

            generatedAt:
              GENERATED_AT,

            syncMaxAgeHours:
              MAX_AGE_HOURS,
          });

        expect(
          exactBoundary.channels[0],
        ).toMatchObject({
          health:
            "healthy",

          reasons:
            [],
        });

        expect(
          beyondBoundary.channels[0],
        ).toMatchObject({
          health:
            "attention",

          reasons: [
            "sync_stale",
          ],
        });
      },
    );
  },
);