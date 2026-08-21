import {
  describe,
  expect,
  it,
} from "vitest";

import {
  actionCenterWorkflowOperation,
  actionCenterWorkflowPath,
} from "./action-center-workflow";

const ACTION_ID =
  "22222222-2222-4222-8222-222222222222";

describe(
  "Action Center workflow",
  () => {
    it(
      "allows confirmation only for proposed actions",
      () => {
        expect(
          actionCenterWorkflowOperation(
            "proposed",
          ),
        ).toBe(
          "confirm",
        );

        expect(
          actionCenterWorkflowPath(
            ACTION_ID,
            "proposed",
          ),
        ).toBe(
          `/api/ai/controlled-actions/${ACTION_ID}/confirm`,
        );
      },
    );

    it(
      "allows execution only for confirmed actions",
      () => {
        expect(
          actionCenterWorkflowOperation(
            "confirmed",
          ),
        ).toBe(
          "execute",
        );

        expect(
          actionCenterWorkflowPath(
            ACTION_ID,
            "confirmed",
          ),
        ).toBe(
          `/api/ai/controlled-actions/${ACTION_ID}/execute`,
        );
      },
    );

    it.each([
      "executing",
      "executed",
      "stale",
      "failed",
      "cancelled",
    ] as const)(
      "does not expose a mutation operation for %s",
      (status) => {
        expect(
          actionCenterWorkflowOperation(
            status,
          ),
        ).toBeNull();

        expect(
          actionCenterWorkflowPath(
            ACTION_ID,
            status,
          ),
        ).toBeNull();
      },
    );
  },
);
