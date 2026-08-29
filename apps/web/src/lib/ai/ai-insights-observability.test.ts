import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks =
  vi.hoisted(() => ({
    logServerError:
      vi.fn(),
  }));

vi.mock(
  "@/lib/observability/server-logger",
  () => ({
    logServerError:
      mocks.logServerError,
  }),
);

import {
  logAiInsightsFailure,
} from "./ai-insights-observability";

beforeEach(() => {
  mocks.logServerError
    .mockReset();
});

describe(
  "AI insights observability",
  () => {
    it.each([
      [
        "insight_snapshot_load" as const,
        "ai_insight_snapshot_load_failed",
      ],
      [
        "insight_price_observations_load" as const,
        "ai_insight_price_observations_load_failed",
      ],
    ])(
      "maps %s to bounded structured metadata",
      (
        operation,
        event,
      ) => {
        const error =
          new Error(
            "database failure",
          );

        logAiInsightsFailure({
          operation,
          requestId:
            "request-insight-123",
          error,
        });

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledWith({
          event,
          requestId:
            "request-insight-123",
          route:
            "/api/ai/insights",
          method:
            "GET",
          provider:
            "supabase",
          operation,
          error,
        });
      },
    );

    it(
      "does not include organization, user, or target identifiers",
      () => {
        const error =
          new Error(
            "failure",
          );

        logAiInsightsFailure({
          operation:
            "insight_price_observations_load",
          error,
        });

        const input =
          mocks.logServerError
            .mock.calls[0]?.[0];

        expect(
          input,
        ).toEqual(
          expect.objectContaining({
            requestId:
              null,
            error,
          }),
        );

        expect(
          input,
        ).not.toHaveProperty(
          "organizationId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "userId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "targetId",
        );
      },
    );
  },
);