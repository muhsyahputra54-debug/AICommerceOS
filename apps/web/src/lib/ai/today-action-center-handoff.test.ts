import {
  describe,
  expect,
  it,
} from "vitest";

import {
  TODAY_ACTION_CENTER_HANDOFF_RECOMMENDATION_IDS,
  buildTodayActionCenterHandoffUrl,
  parseTodayActionCenterHandoff,
} from "./today-action-center-handoff";

describe(
  "TODAY Action Center contextual handoff",
  () => {
    it.each(
      TODAY_ACTION_CENTER_HANDOFF_RECOMMENDATION_IDS,
    )(
      "builds a navigation-only URL for %s",
      (recommendationId) => {
        expect(
          buildTodayActionCenterHandoffUrl(
            recommendationId,
          ),
        ).toBe(
          `/ai/action-center?todayRecommendation=${recommendationId}`,
        );
      },
    );

    it(
      "fails closed for unknown recommendation ids",
      () => {
        expect(
          buildTodayActionCenterHandoffUrl(
            "unknown-recommendation",
          ),
        ).toBeNull();

        expect(
          buildTodayActionCenterHandoffUrl(
            null,
          ),
        ).toBeNull();
      },
    );

    it(
      "parses exactly one allowlisted recommendation",
      () => {
        expect(
          parseTodayActionCenterHandoff(
            new URLSearchParams(
              "todayRecommendation=review-marketplace-health",
            ),
          ),
        ).toEqual({
          recommendationId:
            "review-marketplace-health",
        });
      },
    );

    it(
      "fails closed for duplicate recommendation references",
      () => {
        expect(
          parseTodayActionCenterHandoff(
            new URLSearchParams(
              "todayRecommendation=review-marketplace-health&todayRecommendation=review-low-stock-inventory",
            ),
          ),
        ).toBeNull();
      },
    );

    it(
      "fails closed when additional query metadata is present",
      () => {
        expect(
          parseTodayActionCenterHandoff(
            new URLSearchParams(
              "todayRecommendation=review-marketplace-health&organizationId=browser-supplied",
            ),
          ),
        ).toBeNull();
      },
    );

    it(
      "fails closed for unsupported recommendation ids",
      () => {
        expect(
          parseTodayActionCenterHandoff(
            new URLSearchParams(
              "todayRecommendation=product.update_price",
            ),
          ),
        ).toBeNull();
      },
    );

    it(
      "fails closed for empty or oversized input",
      () => {
        expect(
          parseTodayActionCenterHandoff(
            new URLSearchParams(),
          ),
        ).toBeNull();

        expect(
          parseTodayActionCenterHandoff(
            new URLSearchParams({
              todayRecommendation:
                "x".repeat(300),
            }),
          ),
        ).toBeNull();
      },
    );

    it(
      "never puts authority or business values in generated URLs",
      () => {
        for (
          const recommendationId
          of TODAY_ACTION_CENTER_HANDOFF_RECOMMENDATION_IDS
        ) {
          const url =
            buildTodayActionCenterHandoffUrl(
              recommendationId,
            );

          expect(url).not.toBeNull();

          const parsed =
            new URL(
              url!,
              "https://lakuvo.local",
            );

          expect(
            Array.from(
              parsed.searchParams.keys(),
            ),
          ).toEqual([
            "todayRecommendation",
          ]);

          expect(
            parsed.searchParams.has(
              "organizationId",
            ),
          ).toBe(false);

          expect(
            parsed.searchParams.has(
              "userId",
            ),
          ).toBe(false);

          expect(
            parsed.searchParams.has(
              "productId",
            ),
          ).toBe(false);

          expect(
            parsed.searchParams.has(
              "actionType",
            ),
          ).toBe(false);

          expect(
            parsed.searchParams.has(
              "expected",
            ),
          ).toBe(false);

          expect(
            parsed.searchParams.has(
              "proposed",
            ),
          ).toBe(false);

          expect(
            parsed.searchParams.has(
              "confirm",
            ),
          ).toBe(false);

          expect(
            parsed.searchParams.has(
              "execute",
            ),
          ).toBe(false);
        }
      },
    );
  },
);