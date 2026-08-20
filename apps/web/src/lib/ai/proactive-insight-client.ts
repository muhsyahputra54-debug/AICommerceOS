export const PROACTIVE_INSIGHT_CODES = [
  "catalog_readiness",
  "competitor_threshold_alert",
  "no_orders",
  "price_monitoring_no_observations",
] as const;

export type ProactiveInsightCode =
  (typeof PROACTIVE_INSIGHT_CODES)[number];

export type ProactiveInsight = {
  code: ProactiveInsightCode;
  severity:
    | "high"
    | "medium";
  source:
    "deterministic_rule_engine";
};

export type ProactiveInsightsResponse = {
  insights?: unknown;
};

export function isProactiveInsight(
  value: unknown,
): value is ProactiveInsight {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const insight =
    value as Record<
      string,
      unknown
    >;

  const code =
    insight.code;

  if (
    typeof code !== "string" ||
    !PROACTIVE_INSIGHT_CODES.includes(
      code as ProactiveInsightCode,
    )
  ) {
    return false;
  }

  if (
    insight.severity !== "high" &&
    insight.severity !== "medium"
  ) {
    return false;
  }

  return (
    insight.source ===
    "deterministic_rule_engine"
  );
}
