import type {
  ActionCenterItem,
} from "./action-center-contract";

export type ActionCenterWorkflowOperation =
  | "confirm"
  | "execute";

export function actionCenterWorkflowOperation(
  status: ActionCenterItem["status"],
): ActionCenterWorkflowOperation | null {
  switch (status) {
    case "proposed":
      return "confirm";

    case "confirmed":
      return "execute";

    case "executing":
    case "executed":
    case "stale":
    case "failed":
    case "cancelled":
      return null;
  }

  const exhaustive:
    never = status;

  return exhaustive;
}

export function actionCenterWorkflowPath(
  actionId: string,
  status: ActionCenterItem["status"],
) {
  const operation =
    actionCenterWorkflowOperation(
      status,
    );

  if (!operation) {
    return null;
  }

  return `/api/ai/controlled-actions/${actionId}/${operation}`;
}
