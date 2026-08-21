import {
  describe,
  expect,
  it,
} from "vitest";

import {
  controlledActionRpcErrorStatus,
  parseControlledActionProposalInput,
  projectControlledActionRecord,
} from "./controlled-action-api";
import {
  CONTROLLED_ACTION_TYPES,
} from "./controlled-action-contract";

const PRODUCT_ID =
  "ebb19ae3-3bcb-4249-a032-285f2fb4948a";

const ACTION_ID =
  "11111111-1111-4111-8111-111111111111";

function statusRow(
  overrides: Record<string, unknown> = {},
) {
  return {
    id:
      ACTION_ID,
    contract_version:
      1,
    action_type:
      "product.update_status",
    status:
      "proposed",
    target_resource:
      "product",
    target_id:
      PRODUCT_ID,

    expected_description:
      null,
    proposed_description:
      null,

    mutation_field:
      "status",
    expected_value:
      "active",
    proposed_value:
      "inactive",

    created_at:
      "2026-08-21T00:00:00.000Z",
    confirmed_at:
      null,
    execution_started_at:
      null,
    finalized_at:
      null,
    error_message:
      null,

    ...overrides,
  };
}

describe(
  "controlled product status action",
  () => {
    it(
      "registers description, name, and status actions",
      () => {
        expect(
          CONTROLLED_ACTION_TYPES,
        ).toEqual([
          "product.update_description",
          "product.update_name",
          "product.update_status",
        ]);
      },
    );

    it(
      "parses an explicit active to inactive proposal",
      () => {
        const result =
          parseControlledActionProposalInput({
            actionType:
              "product.update_status",
            productId:
              PRODUCT_ID,
            expectedStatus:
              "active",
            proposedStatus:
              "inactive",
            idempotencyKey:
              "status-action-1",
          });

        expect(result).toEqual({
          ok: true,
          value: {
            actionType:
              "product.update_status",
            productId:
              PRODUCT_ID,
            expectedStatus:
              "active",
            proposedStatus:
              "inactive",
            idempotencyKey:
              "status-action-1",
          },
        });
      },
    );

    it(
      "parses an explicit inactive to active proposal",
      () => {
        const result =
          parseControlledActionProposalInput({
            actionType:
              "product.update_status",
            productId:
              PRODUCT_ID,
            expectedStatus:
              "inactive",
            proposedStatus:
              "active",
            idempotencyKey:
              "status-action-2",
          });

        expect(result.ok).toBe(true);
      },
    );

    it(
      "rejects unsupported status values",
      () => {
        const result =
          parseControlledActionProposalInput({
            actionType:
              "product.update_status",
            productId:
              PRODUCT_ID,
            expectedStatus:
              "active",
            proposedStatus:
              "archived",
            idempotencyKey:
              "status-action-3",
          });

        expect(result.ok).toBe(false);
      },
    );

    it(
      "rejects a status no-op",
      () => {
        const result =
          parseControlledActionProposalInput({
            actionType:
              "product.update_status",
            productId:
              PRODUCT_ID,
            expectedStatus:
              "active",
            proposedStatus:
              "active",
            idempotencyKey:
              "status-action-4",
          });

        expect(result.ok).toBe(false);
      },
    );

    it(
      "rejects mixed name fields on a status proposal",
      () => {
        const result =
          parseControlledActionProposalInput({
            actionType:
              "product.update_status",
            productId:
              PRODUCT_ID,
            expectedStatus:
              "active",
            proposedStatus:
              "inactive",
            expectedName:
              "Unexpected field",
            idempotencyKey:
              "status-action-5",
          });

        expect(result.ok).toBe(false);
      },
    );

    it(
      "projects a persisted product status snapshot",
      () => {
        const result =
          projectControlledActionRecord(
            statusRow(),
          );

        expect(result?.actionType).toBe(
          "product.update_status",
        );

        if (
          !result ||
          result.actionType !==
            "product.update_status"
        ) {
          throw new Error(
            "Expected product.update_status projection.",
          );
        }

        expect(
          result.mutationField,
        ).toBe("status");

        expect(
          result.expectedStatus,
        ).toBe("active");

        expect(
          result.proposedStatus,
        ).toBe("inactive");
      },
    );

    it(
      "rejects invalid persisted status payloads",
      () => {
        expect(
          projectControlledActionRecord(
            statusRow({
              proposed_value:
                "archived",
            }),
          ),
        ).toBeNull();

        expect(
          projectControlledActionRecord(
            statusRow({
              proposed_value:
                "active",
            }),
          ),
        ).toBeNull();

        expect(
          projectControlledActionRecord(
            statusRow({
              expected_description:
                "must stay null",
            }),
          ),
        ).toBeNull();
      },
    );

    it(
      "maps product status concurrency conflicts to 409",
      () => {
        expect(
          controlledActionRpcErrorStatus(
            "Product status changed before proposal creation",
          ),
        ).toBe(409);

        expect(
          controlledActionRpcErrorStatus(
            "proposed product status does not change the current status",
          ),
        ).toBe(409);
      },
    );
  },
);
