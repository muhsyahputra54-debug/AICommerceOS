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
  generateTodayDailyBrief,
  resolveTodayDailyBriefOpenAIConfig,
  TODAY_DAILY_BRIEF_DEFAULT_MODEL,
  TODAY_DAILY_BRIEF_RESPONSE_FORMAT,
  type TodayDailyBriefTransport,
} from "./today-daily-brief-server";

const GENERATED_AT =
  "2026-08-22T12:00:00.000Z";

function todaySnapshot() {
  return buildLakuvoTodayReadModel({
    organizationId:
      "org-private-1",

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

describe(
  "LAKUVO TODAY Daily Brief server adapter",
  () => {
    it(
      "resolves explicit OpenAI config before environment fallback",
      () => {
        expect(
          resolveTodayDailyBriefOpenAIConfig({
            apiKey:
              " explicit-key ",

            model:
              " explicit-model ",

            environment: {
              OPENAI_API_KEY:
                "environment-key",

              OPENAI_MODEL:
                "environment-model",
            },
          }),
        ).toEqual({
          apiKey:
            "explicit-key",

          model:
            "explicit-model",
        });
      },
    );

    it(
      "uses environment config and deterministic model fallback",
      () => {
        expect(
          resolveTodayDailyBriefOpenAIConfig({
            environment: {
              OPENAI_API_KEY:
                " environment-key ",
            },
          }),
        ).toEqual({
          apiKey:
            "environment-key",

          model:
            TODAY_DAILY_BRIEF_DEFAULT_MODEL,
        });

        expect(
          resolveTodayDailyBriefOpenAIConfig({
            environment: {
              OPENAI_API_KEY:
                "environment-key",

              OPENAI_MODEL:
                " environment-model ",
            },
          }),
        ).toEqual({
          apiKey:
            "environment-key",

          model:
            "environment-model",
        });
      },
    );

    it(
      "fails closed without an API key and never calls transport",
      async () => {
        const transport =
          vi.fn();

        await expect(
          generateTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            environment:
              {},

            transport:
              transport as TodayDailyBriefTransport,
          }),
        ).resolves.toEqual({
          status:
            "unavailable",

          source:
            null,

          reason:
            "OpenAI is not configured for AI Daily Brief.",
        });

        expect(
          transport,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "sends isolated messages and strict structured response format",
      async () => {
        const transport:
          TodayDailyBriefTransport =
          vi.fn(
            async () => ({
              response: {
                ok:
                  true,
              },

              data: {
                choices: [
                  {
                    message: {
                      content:
                        JSON.stringify({
                          headline:
                            "Inventory needs attention",

                          summary:
                            "Verified TODAY evidence contains an out-of-stock issue.",

                          highlights: [
                            "Review the out-of-stock inventory issue.",
                          ],
                        }),
                    },
                  },
                ],
              },
            }),
          );

        const result =
          await generateTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            apiKey:
              "test-key",

            model:
              "test-model",

            environment:
              {},

            transport,
          });

        expect(
          result.status,
        ).toBe(
          "ready",
        );

        expect(
          transport,
        ).toHaveBeenCalledTimes(
          1,
        );

        const call =
          vi.mocked(
            transport,
          ).mock.calls[0]?.[0];

        expect(
          call?.apiKey,
        ).toBe(
          "test-key",
        );

        expect(
          call?.model,
        ).toBe(
          "test-model",
        );

        expect(
          call?.messages.map(
            (message) =>
              message.role,
          ),
        ).toEqual([
          "system",
          "user",
        ]);

        expect(
          call?.responseFormat,
        ).toEqual(
          TODAY_DAILY_BRIEF_RESPONSE_FORMAT,
        );
      },
    );

    it(
      "maps HTTP failure to unavailable without trusting error prose",
      async () => {
        const transport:
          TodayDailyBriefTransport =
          async () => ({
            response: {
              ok:
                false,
            },

            data: {
              error: {
                message:
                  "provider-specific-error",
              },
            },
          });

        await expect(
          generateTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            apiKey:
              "test-key",

            environment:
              {},

            transport,
          }),
        ).resolves.toEqual({
          status:
            "unavailable",

          source:
            null,

          reason:
            "AI Daily Brief request failed.",
        });
      },
    );

    it(
      "maps thrown transport failure to unavailable",
      async () => {
        const transport:
          TodayDailyBriefTransport =
          async () => {
            throw new Error(
              "network-secret-detail",
            );
          };

        await expect(
          generateTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            apiKey:
              "test-key",

            environment:
              {},

            transport,
          }),
        ).resolves.toEqual({
          status:
            "unavailable",

          source:
            null,

          reason:
            "AI Daily Brief transport is unavailable.",
        });
      },
    );

    it(
      "fails closed when successful transport returns no completion content",
      async () => {
        const transport:
          TodayDailyBriefTransport =
          async () => ({
            response: {
              ok:
                true,
            },

            data: {
              choices:
                [],
            },
          });

        await expect(
          generateTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            apiKey:
              "test-key",

            environment:
              {},

            transport,
          }),
        ).resolves.toEqual({
          status:
            "unavailable",

          source:
            null,

          reason:
            "AI Daily Brief response is empty.",
        });
      },
    );

    it(
      "fails closed when completion JSON violates the Daily Brief contract",
      async () => {
        const transport:
          TodayDailyBriefTransport =
          async () => ({
            response: {
              ok:
                true,
            },

            data: {
              choices: [
                {
                  message: {
                    content:
                      JSON.stringify({
                        headline:
                          "Headline",

                        summary:
                          "Summary",

                        highlights:
                          [],

                        execute:
                          true,
                      }),
                  },
                },
              ],
            },
          });

        await expect(
          generateTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            apiKey:
              "test-key",

            environment:
              {},

            transport,
          }),
        ).resolves.toEqual({
          status:
            "unavailable",

          source:
            null,

          reason:
            "AI Daily Brief response is malformed.",
        });
      },
    );

    it(
      "returns ready only after transport success and strict parsing",
      async () => {
        const transport:
          TodayDailyBriefTransport =
          async () => ({
            response: {
              ok:
                true,
            },

            data: {
              choices: [
                {
                  message: {
                    content:
                      JSON.stringify({
                        headline:
                          "Inventory review",

                        summary:
                          "Verified inventory evidence requires review.",

                        highlights: [
                          "An out-of-stock issue is present.",
                          "Use the existing recommendation ranking.",
                        ],
                      }),
                  },
                },
              ],
            },
          });

        await expect(
          generateTodayDailyBrief({
            snapshot:
              todaySnapshot(),

            apiKey:
              "test-key",

            model:
              "test-model",

            environment:
              {},

            transport,
          }),
        ).resolves.toEqual({
          status:
            "ready",

          source:
            "ai_synthesis",

          headline:
            "Inventory review",

          summary:
            "Verified inventory evidence requires review.",

          highlights: [
            "An out-of-stock issue is present.",
            "Use the existing recommendation ranking.",
          ],
        });
      },
    );
  },
);