import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildLakuvoTodayReadModel,
} from "./today-read-model";

import {
  buildTodayDailyBriefMessages,
  buildTodayDailyBriefSynthesisInput,
  parseTodayDailyBriefContent,
  TODAY_DAILY_BRIEF_SYSTEM_PROMPT,
  unavailableTodayDailyBrief,
} from "./today-daily-brief";

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
  "LAKUVO TODAY Daily Brief synthesis contract",
  () => {
    it(
      "projects only verified synthesis evidence",
      () => {
        const snapshot =
          todaySnapshot();

        const input =
          buildTodayDailyBriefSynthesisInput(
            snapshot,
          );

        expect(
          Object.prototype.hasOwnProperty.call(
            input,
            "organizationId",
          ),
        ).toBe(
          false,
        );

        expect(
          Object.prototype.hasOwnProperty.call(
            input,
            "dailyBrief",
          ),
        ).toBe(
          false,
        );

        expect(
          input.generatedAt,
        ).toBe(
          GENERATED_AT,
        );

        expect(
          input.urgentIssues.map(
            (issue) =>
              issue.id,
          ),
        ).toContain(
          "inventory-out-of-stock",
        );

        expect(
          input.recommendations.map(
            (recommendation) =>
              recommendation.id,
          ),
        ).toContain(
          "review-out-of-stock-inventory",
        );

        expect(
          input.recommendations.every(
            (recommendation) =>
              !Object.prototype
                .hasOwnProperty.call(
                  recommendation,
                  "action",
                ),
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "builds deterministic isolated system and user messages",
      () => {
        const snapshot =
          todaySnapshot();

        const first =
          buildTodayDailyBriefMessages(
            snapshot,
          );

        const second =
          buildTodayDailyBriefMessages(
            snapshot,
          );

        expect(
          first,
        ).toEqual(
          second,
        );

        expect(
          first,
        ).toHaveLength(
          2,
        );

        expect(
          first.map(
            (message) =>
              message.role,
          ),
        ).toEqual([
          "system",
          "user",
        ]);

        expect(
          first[0]?.content,
        ).toBe(
          TODAY_DAILY_BRIEF_SYSTEM_PROMPT,
        );
      },
    );

    it(
      "keeps AI prose behind a strict decision-support safety prompt",
      () => {
        expect(
          TODAY_DAILY_BRIEF_SYSTEM_PROMPT,
        ).toContain(
          "Do not create new urgent issues or recommendations.",
        );

        expect(
          TODAY_DAILY_BRIEF_SYSTEM_PROMPT,
        ).toContain(
          "Do not change issue severity, recommendation priorityScore, or ranking.",
        );

        expect(
          TODAY_DAILY_BRIEF_SYSTEM_PROMPT,
        ).toContain(
          "Do not authorize, confirm, or execute any action.",
        );

        expect(
          TODAY_DAILY_BRIEF_SYSTEM_PROMPT,
        ).toContain(
          "Do not invent facts, quantities, forecasts",
        );
      },
    );

    it(
      "returns a ready Daily Brief from exact valid JSON",
      () => {
        expect(
          parseTodayDailyBriefContent(
            JSON.stringify({
              headline:
                "Inventory needs attention",

              summary:
                "Verified TODAY evidence shows an out-of-stock inventory issue.",

              highlights: [
                "Review the out-of-stock inventory issue first.",
                "No marketplace issue is currently present.",
              ],
            }),
          ),
        ).toEqual({
          status:
            "ready",

          source:
            "ai_synthesis",

          headline:
            "Inventory needs attention",

          summary:
            "Verified TODAY evidence shows an out-of-stock inventory issue.",

          highlights: [
            "Review the out-of-stock inventory issue first.",
            "No marketplace issue is currently present.",
          ],
        });
      },
    );

    it(
      "normalizes whitespace in valid generated fields",
      () => {
        expect(
          parseTodayDailyBriefContent(
            JSON.stringify({
              headline:
                "  Inventory review  ",

              summary:
                "  Review verified inventory signals.  ",

              highlights: [
                "  Out-of-stock issue exists.  ",
              ],
            }),
          ),
        ).toEqual({
          status:
            "ready",

          source:
            "ai_synthesis",

          headline:
            "Inventory review",

          summary:
            "Review verified inventory signals.",

          highlights: [
            "Out-of-stock issue exists.",
          ],
        });
      },
    );

    it(
      "fails closed on malformed JSON",
      () => {
        expect(
          parseTodayDailyBriefContent(
            "{not-json",
          ),
        ).toEqual({
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
      "fails closed on invalid fields or unexpected properties",
      () => {
        expect(
          parseTodayDailyBriefContent(
            JSON.stringify({
              headline:
                "",

              summary:
                "Summary",

              highlights:
                [],
            }),
          ).status,
        ).toBe(
          "unavailable",
        );

        expect(
          parseTodayDailyBriefContent(
            JSON.stringify({
              headline:
                "Headline",

              summary:
                "Summary",

              highlights: [
                123,
              ],
            }),
          ).status,
        ).toBe(
          "unavailable",
        );

        expect(
          parseTodayDailyBriefContent(
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
          ).status,
        ).toBe(
          "unavailable",
        );
      },
    );

    it(
      "normalizes unavailable reasons without fabricating ready content",
      () => {
        expect(
          unavailableTodayDailyBrief(
            "  OpenAI transport unavailable.  ",
          ),
        ).toEqual({
          status:
            "unavailable",

          source:
            null,

          reason:
            "OpenAI transport unavailable.",
        });

        expect(
          unavailableTodayDailyBrief(
            "   ",
          ),
        ).toEqual({
          status:
            "unavailable",

          source:
            null,

          reason:
            "AI Daily Brief is unavailable.",
        });
      },
    );

    it(
      "does not mutate the deterministic TODAY snapshot",
      () => {
        const snapshot =
          todaySnapshot();

        const before =
          JSON.stringify(
            snapshot,
          );

        buildTodayDailyBriefSynthesisInput(
          snapshot,
        );

        buildTodayDailyBriefMessages(
          snapshot,
        );

        expect(
          JSON.stringify(
            snapshot,
          ),
        ).toBe(
          before,
        );
      },
    );
  },
);