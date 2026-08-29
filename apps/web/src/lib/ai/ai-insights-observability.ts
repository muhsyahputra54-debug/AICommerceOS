import {
  logServerError,
} from "@/lib/observability/server-logger";

export type AiInsightsFailureOperation =
  | "insight_snapshot_load"
  | "insight_price_observations_load";

type AiInsightsFailureInput = {
  operation:
    AiInsightsFailureOperation;
  requestId?: string | null;
  error: unknown;
};

const FAILURE_METADATA:
  Record<
    AiInsightsFailureOperation,
    {
      event: string;
      route: string;
    }
  > = {
    insight_snapshot_load: {
      event:
        "ai_insight_snapshot_load_failed",
      route:
        "/api/ai/insights",
    },
    insight_price_observations_load: {
      event:
        "ai_insight_price_observations_load_failed",
      route:
        "/api/ai/insights",
    },
  };

export function logAiInsightsFailure({
  operation,
  requestId = null,
  error,
}: AiInsightsFailureInput) {
  const metadata =
    FAILURE_METADATA[operation];

  logServerError({
    event:
      metadata.event,
    requestId,
    route:
      metadata.route,
    method:
      "GET",
    provider:
      "supabase",
    operation,
    error,
  });
}