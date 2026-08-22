import {
  describe,
  expect,
  it,
} from "vitest";

import {
  selectTodayRecommendations,
  type TodayIssue,
} from "./today-contract";

import {
  buildTodayRecommendations,
} from "./today-recommendations";

const DETECTED_AT =
  "2026-08-22T12:00:00.000Z";

function issue(
  id:
    string,

  overrides:
    Partial<Omit<TodayIssue, "id">> = {},
): TodayIssue {
  return {
    id,

    severity:
      "medium",

    category:
      "inventory",

    title:
      id,

    explanation:
      id,

    source:
      "test",

    evidence:
      {},

    entity:
      null,

    detectedAt:
      DETECTED_AT,

    ...overrides,
  };
}

describe(
  "LAKUVO TODAY recommendations",
  () => {
    it(
      "returns no recommendation when there is no supported issue",
      () => {
        expect(
          buildTodayRecommendations(
            [],
          ),
        ).toEqual(
          [],
        );

        expect(
          buildTodayRecommendations([
            issue(
              "unrelated-issue",
              {
                category:
                  "commerce",
              },
            ),
          ]),
        ).toEqual(
          [],
        );
      },
    );

    it(
      "maps the verified out-of-stock issue to its established recommendation",
      () => {
        expect(
          buildTodayRecommendations([
            issue(
              "inventory-out-of-stock",
              {
                severity:
                  "high",
              },
            ),
          ]),
        ).toEqual([
          {
            id:
              "review-out-of-stock-inventory",

            title:
              "Review out-of-stock inventory",

            rationale:
              "Out-of-stock items can block sales and should be investigated first.",

            expectedImpact:
              "Reduce avoidable stock-related sales interruptions.",

            priorityScore:
              100,

            sourceIssueIds: [
              "inventory-out-of-stock",
            ],

            action:
              null,
          },
        ]);
      },
    );

    it(
      "aggregates marketplace issue ids into one established recommendation",
      () => {
        expect(
          buildTodayRecommendations([
            issue(
              "marketplace-b-attention",
              {
                category:
                  "marketplace",
              },
            ),

            issue(
              "marketplace-a-attention",
              {
                category:
                  "marketplace",

                severity:
                  "high",
              },
            ),
          ]),
        ).toEqual([
          {
            id:
              "review-marketplace-health",

            title:
              "Review marketplace health",

            rationale:
              "One or more marketplace channels have connection or synchronization signals that need attention.",

            expectedImpact:
              "Reduce the risk of stale catalog, order, or channel data.",

            priorityScore:
              90,

            sourceIssueIds: [
              "marketplace-b-attention",
              "marketplace-a-attention",
            ],

            action:
              null,
          },
        ]);
      },
    );

    it(
      "maps the verified low-stock issue to its established recommendation",
      () => {
        expect(
          buildTodayRecommendations([
            issue(
              "inventory-low-stock",
            ),
          ]),
        ).toEqual([
          {
            id:
              "review-low-stock-inventory",

            title:
              "Review low-stock inventory",

            rationale:
              "Low-stock items may become unavailable if replenishment is delayed.",

            expectedImpact:
              "Improve inventory readiness before stock reaches zero.",

            priorityScore:
              70,

            sourceIssueIds: [
              "inventory-low-stock",
            ],

            action:
              null,
          },
        ]);
      },
    );

    it(
      "preserves the established candidate scores",
      () => {
        const recommendations =
          buildTodayRecommendations([
            issue(
              "inventory-low-stock",
            ),

            issue(
              "marketplace-1-attention",
              {
                category:
                  "marketplace",
              },
            ),

            issue(
              "inventory-out-of-stock",
              {
                severity:
                  "high",
              },
            ),
          ]);

        expect(
          recommendations.map(
            (recommendation) => [
              recommendation.id,
              recommendation.priorityScore,
            ],
          ),
        ).toEqual([
          [
            "review-out-of-stock-inventory",
            100,
          ],

          [
            "review-marketplace-health",
            90,
          ],

          [
            "review-low-stock-inventory",
            70,
          ],
        ]);
      },
    );

    it(
      "remains compatible with the existing deterministic top-three selector",
      () => {
        const selected =
          selectTodayRecommendations(
            buildTodayRecommendations([
              issue(
                "inventory-low-stock",
              ),

              issue(
                "marketplace-1-attention",
                {
                  category:
                    "marketplace",
                },
              ),

              issue(
                "inventory-out-of-stock",
                {
                  severity:
                    "high",
                },
              ),
            ]),
          );

        expect(
          selected.map(
            (recommendation) =>
              recommendation.id,
          ),
        ).toEqual([
          "review-out-of-stock-inventory",
          "review-marketplace-health",
          "review-low-stock-inventory",
        ]);

        expect(
          selected,
        ).toHaveLength(
          3,
        );
      },
    );

    it(
      "never grants direct execution from generated recommendations",
      () => {
        const recommendations =
          buildTodayRecommendations([
            issue(
              "inventory-out-of-stock",
            ),

            issue(
              "marketplace-1-attention",
              {
                category:
                  "marketplace",
              },
            ),

            issue(
              "inventory-low-stock",
            ),
          ]);

        expect(
          recommendations.every(
            (recommendation) =>
              recommendation.action ===
              null,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "does not mutate supplied issue input",
      () => {
        const issues = [
          issue(
            "inventory-low-stock",
          ),

          issue(
            "marketplace-1-attention",
            {
              category:
                "marketplace",
            },
          ),
        ];

        const before =
          JSON.stringify(
            issues,
          );

        buildTodayRecommendations(
          issues,
        );

        expect(
          JSON.stringify(
            issues,
          ),
        ).toBe(
          before,
        );
      },
    );
  },
);