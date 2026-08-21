import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ControlledActionApiRecord,
} from "./controlled-action-api";
import {
  actionCenterLifecycleBucket,
  projectActionCenterItem,
} from "./action-center-contract";

const ACTION_ID =
  "11111111-1111-4111-8111-111111111111";

const PRODUCT_ID =
  "22222222-2222-4222-8222-222222222222";

function baseRecord(
  status: ControlledActionApiRecord["status"] = "proposed",
) {
  return {
    id:
      ACTION_ID,

    contractVersion:
      1 as const,

    status,

    targetResource:
      "product" as const,

    targetId:
      PRODUCT_ID,

    createdAt:
      "2026-08-21T08:00:00.000Z",

    confirmedAt:
      null,

    executionStartedAt:
      null,

    finalizedAt:
      null,

    errorMessage:
      null,
  };
}

describe(
  "actionCenterLifecycleBucket",
  () => {
    it.each([
      [
        "proposed",
        "needs_review",
      ],
      [
        "confirmed",
        "ready_to_execute",
      ],
      [
        "executing",
        "in_progress",
      ],
      [
        "executed",
        "completed",
      ],
      [
        "stale",
        "needs_attention",
      ],
      [
        "failed",
        "needs_attention",
      ],
      [
        "cancelled",
        "cancelled",
      ],
    ] as const)(
      "maps %s to %s",
      (
        status,
        expected,
      ) => {
        expect(
          actionCenterLifecycleBucket(
            status,
          ),
        ).toBe(
          expected,
        );
      },
    );
  },
);

describe(
  "projectActionCenterItem",
  () => {
    it(
      "projects product description action",
      () => {
        const action: ControlledActionApiRecord = {
          ...baseRecord(),

          actionType:
            "product.update_description",

          expectedDescription:
            "Old description",

          proposedDescription:
            "New description",
        };

        const result =
          projectActionCenterItem(
            action,
          );

        expect(
          result.mutation,
        ).toEqual({
          field:
            "description",

          before:
            "Old description",

          after:
            "New description",
        });

        expect(
          result.lifecycleBucket,
        ).toBe(
          "needs_review",
        );

        expect(
          result.risk,
        ).toBeNull();

        expect(
          result.rationale,
        ).toBeNull();
      },
    );

    it(
      "projects product name action",
      () => {
        const action: ControlledActionApiRecord = {
          ...baseRecord(),

          actionType:
            "product.update_name",

          mutationField:
            "name",

          expectedName:
            "Old Product",

          proposedName:
            "New Product",
        };

        expect(
          projectActionCenterItem(
            action,
          ).mutation,
        ).toEqual({
          field:
            "name",

          before:
            "Old Product",

          after:
            "New Product",
        });
      },
    );

    it(
      "projects product status action",
      () => {
        const action: ControlledActionApiRecord = {
          ...baseRecord(),

          actionType:
            "product.update_status",

          mutationField:
            "status",

          expectedStatus:
            "active",

          proposedStatus:
            "inactive",
        };

        expect(
          projectActionCenterItem(
            action,
          ).mutation,
        ).toEqual({
          field:
            "status",

          before:
            "active",

          after:
            "inactive",
        });
      },
    );

    it(
      "projects product price action",
      () => {
        const action: ControlledActionApiRecord = {
          ...baseRecord(),

          actionType:
            "product.update_price",

          mutationField:
            "price",

          expectedPrice:
            "10.00",

          proposedPrice:
            "12.50",
        };

        expect(
          projectActionCenterItem(
            action,
          ).mutation,
        ).toEqual({
          field:
            "price",

          before:
            "10.00",

          after:
            "12.50",
        });
      },
    );

    it(
      "preserves target, timestamps, and error state",
      () => {
        const action: ControlledActionApiRecord = {
          ...baseRecord(
            "failed",
          ),

          actionType:
            "product.update_price",

          mutationField:
            "price",

          expectedPrice:
            "10.00",

          proposedPrice:
            "12.50",

          confirmedAt:
            "2026-08-21T08:01:00.000Z",

          executionStartedAt:
            "2026-08-21T08:02:00.000Z",

          finalizedAt:
            "2026-08-21T08:03:00.000Z",

          errorMessage:
            "Execution failed",
        };

        const result =
          projectActionCenterItem(
            action,
          );

        expect(
          result.target,
        ).toEqual({
          resource:
            "product",

          id:
            PRODUCT_ID,
        });

        expect(
          result.timestamps,
        ).toEqual({
          createdAt:
            "2026-08-21T08:00:00.000Z",

          confirmedAt:
            "2026-08-21T08:01:00.000Z",

          executionStartedAt:
            "2026-08-21T08:02:00.000Z",

          finalizedAt:
            "2026-08-21T08:03:00.000Z",
        });

        expect(
          result.errorMessage,
        ).toBe(
          "Execution failed",
        );

        expect(
          result.lifecycleBucket,
        ).toBe(
          "needs_attention",
        );

        expect(
          result.risk,
        ).toBeNull();

        expect(
          result.rationale,
        ).toBeNull();
      },
    );
  },
);
