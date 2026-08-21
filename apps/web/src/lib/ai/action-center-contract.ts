import type {
  ControlledActionApiRecord,
} from "./controlled-action-api";

export const ACTION_CENTER_LIFECYCLE_BUCKETS = [
  "needs_review",
  "ready_to_execute",
  "in_progress",
  "completed",
  "needs_attention",
  "cancelled",
] as const;

export type ActionCenterLifecycleBucket =
  (typeof ACTION_CENTER_LIFECYCLE_BUCKETS)[number];

export type ActionCenterMutationField =
  | "description"
  | "name"
  | "status"
  | "price";

export type ActionCenterRisk =
  | "low"
  | "medium"
  | "high"
  | null;

export type ActionCenterItem = {
  id: string;

  contractVersion: 1;

  actionType:
    ControlledActionApiRecord["actionType"];

  status:
    ControlledActionApiRecord["status"];

  lifecycleBucket:
    ActionCenterLifecycleBucket;

  target: {
    resource: "product";
    id: string;
  };

  mutation: {
    field:
      ActionCenterMutationField;

    before:
      string | null;

    after:
      string;
  };

  timestamps: {
    createdAt:
      string;

    confirmedAt:
      string | null;

    executionStartedAt:
      string | null;

    finalizedAt:
      string | null;
  };

  errorMessage:
    string | null;

  /*
   * Do not fabricate these values.
   *
   * They remain null until a trustworthy
   * persisted or policy-derived source exists.
   */
  risk:
    ActionCenterRisk;

  rationale:
    string | null;
};

export function actionCenterLifecycleBucket(
  status: ControlledActionApiRecord["status"],
): ActionCenterLifecycleBucket {
  switch (status) {
    case "proposed":
      return "needs_review";

    case "confirmed":
      return "ready_to_execute";

    case "executing":
      return "in_progress";

    case "executed":
      return "completed";

    case "stale":
    case "failed":
      return "needs_attention";

    case "cancelled":
      return "cancelled";
  }

  const exhaustive:
    never = status;

  return exhaustive;
}

function actionCenterMutation(
  action: ControlledActionApiRecord,
): ActionCenterItem["mutation"] {
  switch (action.actionType) {
    case "product.update_description":
      return {
        field:
          "description",

        before:
          action.expectedDescription,

        after:
          action.proposedDescription,
      };

    case "product.update_name":
      return {
        field:
          action.mutationField,

        before:
          action.expectedName,

        after:
          action.proposedName,
      };

    case "product.update_status":
      return {
        field:
          action.mutationField,

        before:
          action.expectedStatus,

        after:
          action.proposedStatus,
      };

    case "product.update_price":
      return {
        field:
          action.mutationField,

        before:
          action.expectedPrice,

        after:
          action.proposedPrice,
      };
  }

  const exhaustive:
    never = action;

  return exhaustive;
}

export function projectActionCenterItem(
  action: ControlledActionApiRecord,
): ActionCenterItem {
  return {
    id:
      action.id,

    contractVersion:
      action.contractVersion,

    actionType:
      action.actionType,

    status:
      action.status,

    lifecycleBucket:
      actionCenterLifecycleBucket(
        action.status,
      ),

    target: {
      resource:
        action.targetResource,

      id:
        action.targetId,
    },

    mutation:
      actionCenterMutation(
        action,
      ),

    timestamps: {
      createdAt:
        action.createdAt,

      confirmedAt:
        action.confirmedAt,

      executionStartedAt:
        action.executionStartedAt,

      finalizedAt:
        action.finalizedAt,
    },

    errorMessage:
      action.errorMessage,

    risk:
      null,

    rationale:
      null,
  };
}
