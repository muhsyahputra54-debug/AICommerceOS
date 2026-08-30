import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  LakuvoTodaySnapshot,
  TodayDailyBrief,
} from "@/lib/ai/today-contract";

const mocks =
  vi.hoisted(
    () => ({
      loadToday:
        vi.fn<
          () => Promise<
            LakuvoTodaySnapshot | null
          >
        >(),
    }),
  );

vi.mock(
  "@/lib/ai/today-daily-brief-runtime",
  () => ({
    loadLakuvoTodayWithDailyBriefFromServer:
      mocks.loadToday,
  }),
);

import {
  POST,
} from "./route";

function snapshotWithBrief(
  dailyBrief:
    TodayDailyBrief,
): LakuvoTodaySnapshot {
  return {
    dailyBrief,
  } as unknown as LakuvoTodaySnapshot;
}

describe(
  "TODAY Daily Brief POST route",
  () => {
    beforeEach(
      () => {
        mocks.loadToday
          .mockReset();
      },
    );

    it(
      "returns 401 when authenticated TODAY context is unavailable",
      async () => {
        mocks.loadToday
          .mockResolvedValue(
            null,
          );

        const response =
          await POST(
          new Request(
            "http://localhost/api/ai/today/daily-brief",
          ),
        );

        expect(
          response.status,
        ).toBe(
          401,
        );

        const body =
          (await response.json()) as {
            error:
              string;
          };

        expect(
          body,
        ).toEqual({
          error:
            "Authentication and an active organization are required.",
        });

        expect(
          mocks.loadToday,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "returns only a ready Daily Brief from the controlled runtime",
      async () => {
        const dailyBrief =
          {
            status:
              "ready",

            source:
              "ai_synthesis",

            headline:
              "Inventory review",

            summary:
              "Verified inventory evidence requires attention.",

            highlights:
              [
                "Review out-of-stock inventory.",
              ],
          } satisfies TodayDailyBrief;

        mocks.loadToday
          .mockResolvedValue(
            snapshotWithBrief(
              dailyBrief,
            ),
          );

        const response =
          await POST(
          new Request(
            "http://localhost/api/ai/today/daily-brief",
          ),
        );

        expect(
          response.status,
        ).toBe(
          200,
        );

        const body =
          (await response.json()) as {
            dailyBrief:
              TodayDailyBrief;
          };

        expect(
          body,
        ).toEqual({
          dailyBrief,
        });
      },
    );

    it(
      "preserves an unavailable Daily Brief without inventing a successful result",
      async () => {
        const dailyBrief =
          {
            status:
              "unavailable",

            source:
              null,

            reason:
              "AI Daily Brief request failed.",
          } satisfies TodayDailyBrief;

        mocks.loadToday
          .mockResolvedValue(
            snapshotWithBrief(
              dailyBrief,
            ),
          );

        const response =
          await POST(
          new Request(
            "http://localhost/api/ai/today/daily-brief",
          ),
        );

        expect(
          response.status,
        ).toBe(
          200,
        );

        const body =
          (await response.json()) as {
            dailyBrief:
              TodayDailyBrief;
          };

        expect(
          body,
        ).toEqual({
          dailyBrief,
        });
      },
    );

    it(
      "does not expose private runtime errors",
      async () => {
        mocks.loadToday
          .mockRejectedValue(
            new Error(
              "provider-private-error",
            ),
          );

        const response =
          await POST(
          new Request(
            "http://localhost/api/ai/today/daily-brief",
          ),
        );

        expect(
          response.status,
        ).toBe(
          502,
        );

        const body =
          (await response.json()) as {
            error:
              string;
          };

        expect(
          body,
        ).toEqual({
          error:
            "AI Daily Brief is temporarily unavailable.",
        });

        expect(
          body.error,
        ).not.toContain(
          "provider-private-error",
        );
      },
    );
  },
);