import type {
  TodayIssue,
  TodayRecommendation,
} from "./today-contract";

export function buildTodayRecommendations(
  issues:
    readonly TodayIssue[],
): TodayRecommendation[] {
  const recommendations:
    TodayRecommendation[] = [];

  if (
    issues.some(
      (issue) =>
        issue.id ===
        "inventory-out-of-stock",
    )
  ) {
    recommendations.push({
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
    });
  }

  const marketplaceIssues =
    issues.filter(
      (issue) =>
        issue.category ===
        "marketplace",
    );

  if (
    marketplaceIssues.length > 0
  ) {
    recommendations.push({
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

      sourceIssueIds:
        marketplaceIssues.map(
          (issue) =>
            issue.id,
        ),

      action:
        null,
    });
  }

  if (
    issues.some(
      (issue) =>
        issue.id ===
        "inventory-low-stock",
    )
  ) {
    recommendations.push({
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
    });
  }

  return recommendations;
}