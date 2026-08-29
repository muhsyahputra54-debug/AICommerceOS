import {
  logServerError,
} from "@/lib/observability/server-logger";

type ControlledActionFailureOperation =
  | "propose"
  | "confirm"
  | "execute";

type ControlledActionFailureInput = {
  operation:
    ControlledActionFailureOperation;
  requestId?: string | null;
  error: unknown;
};

const FAILURE_METADATA = {
  propose: {
    event:
      "ai_controlled_action_proposal_failed",
    route:
      "/api/ai/controlled-actions",
    operation:
      "propose_controlled_action",
  },
  confirm: {
    event:
      "ai_controlled_action_confirmation_failed",
    route:
      "/api/ai/controlled-actions/[id]/confirm",
    operation:
      "confirm_controlled_action",
  },
  execute: {
    event:
      "ai_controlled_action_execution_failed",
    route:
      "/api/ai/controlled-actions/[id]/execute",
    operation:
      "execute_controlled_action",
  },
} as const;

export function logControlledActionFailure({
  operation,
  requestId = null,
  error,
}: ControlledActionFailureInput) {
  const metadata =
    FAILURE_METADATA[operation];

  logServerError({
    event:
      metadata.event,
    requestId,
    route:
      metadata.route,
    method:
      "POST",
    provider:
      "supabase",
    operation:
      metadata.operation,
    error,
  });
}