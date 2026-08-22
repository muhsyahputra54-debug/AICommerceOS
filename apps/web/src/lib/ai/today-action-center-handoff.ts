export const TODAY_ACTION_CENTER_HANDOFF_RECOMMENDATION_IDS = [
  "review-out-of-stock-inventory",
  "review-marketplace-health",
  "review-low-stock-inventory",
] as const;

export type TodayActionCenterHandoffRecommendationId =
  (typeof TODAY_ACTION_CENTER_HANDOFF_RECOMMENDATION_IDS)[number];

export type TodayActionCenterHandoff = {
  recommendationId:
    TodayActionCenterHandoffRecommendationId;
};

const TODAY_ACTION_CENTER_HANDOFF_QUERY_KEY =
  "todayRecommendation";

const MAX_TODAY_ACTION_CENTER_HANDOFF_QUERY_LENGTH =
  256;

const recommendationIds =
  new Set<string>(
    TODAY_ACTION_CENTER_HANDOFF_RECOMMENDATION_IDS,
  );

export function isTodayActionCenterHandoffRecommendationId(
  value: unknown,
): value is TodayActionCenterHandoffRecommendationId {
  return (
    typeof value === "string" &&
    recommendationIds.has(value)
  );
}

export function buildTodayActionCenterHandoffUrl(
  recommendationId: unknown,
) {
  if (
    !isTodayActionCenterHandoffRecommendationId(
      recommendationId,
    )
  ) {
    return null;
  }

  const params =
    new URLSearchParams({
      [TODAY_ACTION_CENTER_HANDOFF_QUERY_KEY]:
        recommendationId,
    });

  return `/ai/action-center?${params.toString()}`;
}

export function parseTodayActionCenterHandoff(
  searchParams: URLSearchParams,
): TodayActionCenterHandoff | null {
  const serialized =
    searchParams.toString();

  if (
    serialized.length >
    MAX_TODAY_ACTION_CENTER_HANDOFF_QUERY_LENGTH
  ) {
    return null;
  }

  const keys =
    Array.from(
      searchParams.keys(),
    );

  if (
    keys.length !== 1 ||
    keys[0] !==
      TODAY_ACTION_CENTER_HANDOFF_QUERY_KEY
  ) {
    return null;
  }

  const values =
    searchParams.getAll(
      TODAY_ACTION_CENTER_HANDOFF_QUERY_KEY,
    );

  if (values.length !== 1) {
    return null;
  }

  const recommendationId =
    values[0];

  if (
    !isTodayActionCenterHandoffRecommendationId(
      recommendationId,
    )
  ) {
    return null;
  }

  return {
    recommendationId,
  };
}