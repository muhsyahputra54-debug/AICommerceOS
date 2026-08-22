import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildLakuvoTodayReadModel,
} from "./today-read-model";

import {
  TODAY_DAILY_BRIEF_METERING_FEATURE,
  TODAY_DAILY_BRIEF_METERING_SOURCE_KIND,
  generateMeteredTodayDailyBrief,
  loadLakuvoTodayWithDailyBriefFromServer,
  type TodayDailyBriefRuntimeDependencies,
} from "./today-daily-brief-runtime";

const ORGANIZATION_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const OTHER_ORGANIZATION_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const USER_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const GENERATED_AT =
  "2026-08-22T13:00:00.000Z";

function todaySnapshot(
  organizationId =
    ORGANIZATION_ID,
) {
  return buildLakuvoTodayReadModel({
    organizationId,

    generatedAt:
      GENERATED_AT,

    salesSummary: {
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

    inventoryAlerts:
      [],

    marketplaceAccounts:
      [],
  });
}

function successfulCompletion() {
  return {
    response:
      new Response(
        null,
        {
          status:
            200,

          headers: {
            "x-request-id":
              "req-today-1",
          },
        },
      ),

    data: {
      id:
        "chatcmpl-today-1",

      model:
        "test-model",

      choices: [
        {
          message: {
            content:
              JSON.stringify({
                headline:
                  "Inventory review",

                summary:
                  "Verified TODAY evidence contains an out-of-stock issue.",

                highlights: [
                  "Review the out-of-stock inventory issue.",
                ],
              }),
          },
        },
      ],

      usage: {
        prompt_tokens:
          100,

        completion_tokens:
          20,

        total_tokens:
          120,
      },
    },
  };
}

function runtimeDependencies(
  overrides:
    Partial<
      TodayDailyBriefRuntimeDependencies
    > = {},
): TodayDailyBriefRuntimeDependencies {
  return {
    getAuthenticatedUserId:
      vi.fn(
        async () =>
          USER_ID,
      ),

    getCurrentOrganizationId:
      vi.fn(
        async () =>
          ORGANIZATION_ID,
      ),

    loadSnapshot:
      vi.fn(
        async () =>
          todaySnapshot(),
      ),

    checkAllowance:
      vi.fn(
        async () => ({
          allowed:
            true,

          reason:
            "allowed",

          creditBalance:
            100,

          monthEstimatedCostUsd:
            1,

          monthlyCostLimitUsd:
            10,
        }),
      ),

    recordUsageSafely:
      vi.fn(
        async () =>
          null,
      ),

    createCompletion:
      vi.fn(
        async () =>
          successfulCompletion(),
      ),

    ...overrides,
  };
}

describe(
  "LAKUVO TODAY controlled Daily Brief runtime",
  () => {
    it(
      "fails closed before organization and AI work when authentication is unavailable",
      async () => {
        const dependencies =
          runtimeDependencies({
            getAuthenticatedUserId:
              vi.fn(
                async () =>
                  null,
              ),
          });

        await expect(
          loadLakuvoTodayWithDailyBriefFromServer({
            dailyBriefEnvironment:
              {},

            dependencies,
          }),
        ).resolves.toBeNull();

        expect(
          dependencies
            .getCurrentOrganizationId,
        ).not.toHaveBeenCalled();

        expect(
          dependencies
            .loadSnapshot,
        ).not.toHaveBeenCalled();

        expect(
          dependencies
            .checkAllowance,
        ).not.toHaveBeenCalled();

        expect(
          dependencies
            .createCompletion,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed when no current organization exists",
      async () => {
        const dependencies =
          runtimeDependencies({
            getCurrentOrganizationId:
              vi.fn(
                async () =>
                  null,
              ),
          });

        await expect(
          loadLakuvoTodayWithDailyBriefFromServer({
            dailyBriefEnvironment:
              {},

            dependencies,
          }),
        ).resolves.toBeNull();

        expect(
          dependencies
            .loadSnapshot,
        ).not.toHaveBeenCalled();

        expect(
          dependencies
            .checkAllowance,
        ).not.toHaveBeenCalled();

        expect(
          dependencies
            .createCompletion,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a snapshot from a different organization before allowance or AI",
      async () => {
        const dependencies =
          runtimeDependencies({
            loadSnapshot:
              vi.fn(
                async () =>
                  todaySnapshot(
                    OTHER_ORGANIZATION_ID,
                  ),
              ),
          });

        await expect(
          loadLakuvoTodayWithDailyBriefFromServer({
            dailyBriefEnvironment:
              {},

            dependencies,
          }),
        ).resolves.toBeNull();

        expect(
          dependencies
            .checkAllowance,
        ).not.toHaveBeenCalled();

        expect(
          dependencies
            .createCompletion,
        ).not.toHaveBeenCalled();

        expect(
          dependencies
            .recordUsageSafely,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "checks organization allowance before the OpenAI request",
      async () => {
        const events:
          string[] = [];

        const dependencies =
          runtimeDependencies({
            checkAllowance:
              vi.fn(
                async () => {
                  events.push(
                    "allowance",
                  );

                  return {
                    allowed:
                      true,

                    reason:
                      "allowed",

                    creditBalance:
                      100,

                    monthEstimatedCostUsd:
                      1,

                    monthlyCostLimitUsd:
                      10,
                  };
                },
              ),

            createCompletion:
              vi.fn(
                async () => {
                  events.push(
                    "openai",
                  );

                  return successfulCompletion();
                },
              ),
          });

        await generateMeteredTodayDailyBrief({
          snapshot:
            todaySnapshot(),

          organizationId:
            ORGANIZATION_ID,

          userId:
            USER_ID,

          apiKey:
            "test-key",

          model:
            "test-model",

          environment:
            {},

          dependencies,
        });

        expect(
          events,
        ).toEqual([
          "allowance",
          "openai",
        ]);
      },
    );

    it(
      "does not call OpenAI or metering when allowance is denied",
      async () => {
        const dependencies =
          runtimeDependencies({
            checkAllowance:
              vi.fn(
                async () => ({
                  allowed:
                    false,

                  reason:
                    "ai_credit_balance_exhausted",

                  creditBalance:
                    0,

                  monthEstimatedCostUsd:
                    1,

                  monthlyCostLimitUsd:
                    10,
                }),
              ),
          });

        const result =
          await generateMeteredTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            organizationId:
              ORGANIZATION_ID,

            userId:
              USER_ID,

            apiKey:
              "test-key",

            environment:
              {},

            dependencies,
          });

        expect(
          result,
        ).toEqual({
          status:
            "unavailable",

          source:
            null,

          reason:
            "AI credits organization sudah habis.",
        });

        expect(
          dependencies
            .createCompletion,
        ).not.toHaveBeenCalled();

        expect(
          dependencies
            .recordUsageSafely,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "does not call OpenAI when allowance infrastructure fails",
      async () => {
        const dependencies =
          runtimeDependencies({
            checkAllowance:
              vi.fn(
                async () => {
                  throw new Error(
                    "metering-secret",
                  );
                },
              ),
          });

        await expect(
          generateMeteredTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            organizationId:
              ORGANIZATION_ID,

            userId:
              USER_ID,

            apiKey:
              "test-key",

            environment:
              {},

            dependencies,
          }),
        ).resolves.toEqual({
          status:
            "unavailable",

          source:
            null,

          reason:
            "AI Daily Brief usage metering is unavailable.",
        });

        expect(
          dependencies
            .createCompletion,
        ).not.toHaveBeenCalled();

        expect(
          dependencies
            .recordUsageSafely,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "records completed usage after successful provider response",
      async () => {
        const dependencies =
          runtimeDependencies();

        const result =
          await generateMeteredTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            organizationId:
              ORGANIZATION_ID,

            userId:
              USER_ID,

            apiKey:
              "test-key",

            model:
              "test-model",

            environment:
              {},

            dependencies,
          });

        expect(
          result.status,
        ).toBe(
          "ready",
        );

        expect(
          dependencies
            .recordUsageSafely,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          dependencies
            .recordUsageSafely,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId:
              ORGANIZATION_ID,

            userId:
              USER_ID,

            feature:
              TODAY_DAILY_BRIEF_METERING_FEATURE,

            requestedModel:
              "test-model",

            sourceKind:
              TODAY_DAILY_BRIEF_METERING_SOURCE_KIND,

            requestIdHeader:
              "req-today-1",

            requestStatus:
              "completed",

            metadata:
              expect.objectContaining({
                http_status:
                  200,

                message_count:
                  2,

                daily_brief_status:
                  "ready",
              }),
          }),
        );
      },
    );

    it(
      "records failed usage for a non-success provider response",
      async () => {
        const dependencies =
          runtimeDependencies({
            createCompletion:
              vi.fn(
                async () => ({
                  response:
                    new Response(
                      null,
                      {
                        status:
                          429,

                        headers: {
                          "x-request-id":
                            "req-failed-1",
                        },
                      },
                    ),

                  data: {
                    error: {
                      message:
                        "provider-private-detail",
                    },
                  },
                }),
              ),
          });

        const result =
          await generateMeteredTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            organizationId:
              ORGANIZATION_ID,

            userId:
              USER_ID,

            apiKey:
              "test-key",

            model:
              "test-model",

            environment:
              {},

            dependencies,
          });

        expect(
          result.status,
        ).toBe(
          "unavailable",
        );

        expect(
          dependencies
            .recordUsageSafely,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            requestStatus:
              "failed",

            requestIdHeader:
              "req-failed-1",

            metadata:
              expect.objectContaining({
                http_status:
                  429,

                daily_brief_status:
                  "unavailable",
              }),
          }),
        );

        expect(
          result.status ===
            "unavailable" &&
          result.reason,
        ).not.toContain(
          "provider-private-detail",
        );
      },
    );

    it(
      "does not fabricate a usage record when transport throws before a provider response",
      async () => {
        const dependencies =
          runtimeDependencies({
            createCompletion:
              vi.fn(
                async () => {
                  throw new Error(
                    "network-secret",
                  );
                },
              ),
          });

        const result =
          await generateMeteredTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            organizationId:
              ORGANIZATION_ID,

            userId:
              USER_ID,

            apiKey:
              "test-key",

            environment:
              {},

            dependencies,
          });

        expect(
          result.status,
        ).toBe(
          "unavailable",
        );

        expect(
          dependencies
            .recordUsageSafely,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "keeps a valid brief when usage recording itself fails",
      async () => {
        const dependencies =
          runtimeDependencies({
            recordUsageSafely:
              vi.fn(
                async () => {
                  throw new Error(
                    "usage-write-failure",
                  );
                },
              ),
          });

        await expect(
          generateMeteredTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            organizationId:
              ORGANIZATION_ID,

            userId:
              USER_ID,

            apiKey:
              "test-key",

            model:
              "test-model",

            environment:
              {},

            dependencies,
          }),
        ).resolves.toEqual({
          status:
            "ready",

          source:
            "ai_synthesis",

          headline:
            "Inventory review",

          summary:
            "Verified TODAY evidence contains an out-of-stock issue.",

          highlights: [
            "Review the out-of-stock inventory issue.",
          ],
        });
      },
    );

    it(
      "does not call transport or usage recording when OpenAI is not configured",
      async () => {
        const dependencies =
          runtimeDependencies();

        const result =
          await generateMeteredTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            organizationId:
              ORGANIZATION_ID,

            userId:
              USER_ID,

            environment:
              {},

            dependencies,
          });

        expect(
          result,
        ).toEqual({
          status:
            "unavailable",

          source:
            null,

          reason:
            "OpenAI is not configured for AI Daily Brief.",
        });

        expect(
          dependencies
            .createCompletion,
        ).not.toHaveBeenCalled();

        expect(
          dependencies
            .recordUsageSafely,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns a new snapshot with Daily Brief while preserving deterministic facts",
      async () => {
        const snapshot =
          todaySnapshot();

        const deterministicBefore =
          JSON.stringify(
            snapshot,
          );

        const dependencies =
          runtimeDependencies({
            loadSnapshot:
              vi.fn(
                async () =>
                  snapshot,
              ),
          });

        const result =
          await loadLakuvoTodayWithDailyBriefFromServer({
            dailyBriefApiKey:
              "test-key",

            dailyBriefModel:
              "test-model",

            dailyBriefEnvironment:
              {},

            dependencies,
          });

        expect(
          result?.dailyBrief.status,
        ).toBe(
          "ready",
        );

        expect(
          JSON.stringify(
            snapshot,
          ),
        ).toBe(
          deterministicBefore,
        );

        expect(
          result,
        ).not.toBe(
          snapshot,
        );

        expect(
          result?.commerce,
        ).toBe(
          snapshot.commerce,
        );

        expect(
          result?.inventory,
        ).toBe(
          snapshot.inventory,
        );

        expect(
          result?.marketplaces,
        ).toBe(
          snapshot.marketplaces,
        );

        expect(
          result?.urgentIssues,
        ).toBe(
          snapshot.urgentIssues,
        );

        expect(
          result?.recommendations,
        ).toBe(
          snapshot.recommendations,
        );
      },
    );
  },
);