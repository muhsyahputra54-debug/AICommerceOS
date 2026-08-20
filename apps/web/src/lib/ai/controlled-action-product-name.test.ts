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

const ACTION_ID =
  "11111111-1111-4111-8111-111111111111";

const PRODUCT_ID =
  "22222222-2222-4222-8222-222222222222";

describe(
  "controlled product name action API",
  () => {
    it(
      "preserves the existing description proposal shape",
      () => {
        expect(
          parseControlledActionProposalInput({
            productId:
              PRODUCT_ID,
            expectedDescription:
              null,
            proposedDescription:
              "  New description  ",
            idempotencyKey:
              "description-key",
          }),
        ).toEqual({
          ok: true,
          value: {
            productId:
              PRODUCT_ID,
            expectedDescription:
              null,
            proposedDescription:
              "New description",
            idempotencyKey:
              "description-key",
          },
        });
      },
    );

    it(
      "parses an explicit product name proposal",
      () => {
        expect(
          parseControlledActionProposalInput({
            actionType:
              "product.update_name",
            productId:
              PRODUCT_ID,
            expectedName:
              "Old Product",
            proposedName:
              "  Better Product  ",
            idempotencyKey:
              "name-key",
          }),
        ).toEqual({
          ok: true,
          value: {
            actionType:
              "product.update_name",
            productId:
              PRODUCT_ID,
            expectedName:
              "Old Product",
            proposedName:
              "Better Product",
            idempotencyKey:
              "name-key",
          },
        });
      },
    );

    it(
      "rejects mixed name and description proposal fields",
      () => {
        const result =
          parseControlledActionProposalInput({
            actionType:
              "product.update_name",
            productId:
              PRODUCT_ID,
            expectedName:
              "Old Product",
            proposedName:
              "Better Product",
            proposedDescription:
              "must not be accepted",
            idempotencyKey:
              "name-key",
          });

        expect(result.ok)
          .toBe(false);
      },
    );

    it(
      "projects a product name action from generic persisted snapshots",
      () => {
        const result =
          projectControlledActionRecord({
            id:
              ACTION_ID,

            contract_version:
              1,

            action_type:
              "product.update_name",

            status:
              "confirmed",

            target_resource:
              "product",

            target_id:
              PRODUCT_ID,

            expected_description:
              null,

            proposed_description:
              null,

            mutation_field:
              "name",

            expected_value:
              "Old Product",

            proposed_value:
              "Better Product",

            created_at:
              "2026-08-21T00:00:00Z",

            confirmed_at:
              "2026-08-21T00:01:00Z",

            execution_started_at:
              null,

            finalized_at:
              null,

            error_message:
              null,
          });

        expect(result)
          .not.toBeNull();

        expect(result?.actionType)
          .toBe(
            "product.update_name",
          );

        if (
          !result ||
          result.actionType !==
            "product.update_name"
        ) {
          throw new Error(
            "Expected product.update_name projection.",
          );
        }

        expect(result.mutationField)
          .toBe("name");

        expect(result.expectedName)
          .toBe("Old Product");

        expect(result.proposedName)
          .toBe("Better Product");
      },
    );

    it(
      "rejects a name record that attempts to overload description snapshots",
      () => {
        expect(
          projectControlledActionRecord({
            id:
              ACTION_ID,

            contract_version:
              1,

            action_type:
              "product.update_name",

            status:
              "proposed",

            target_resource:
              "product",

            target_id:
              PRODUCT_ID,

            expected_description:
              "unexpected",

            proposed_description:
              null,

            mutation_field:
              "name",

            expected_value:
              "Old Product",

            proposed_value:
              "Better Product",

            created_at:
              "2026-08-21T00:00:00Z",

            confirmed_at:
              null,

            execution_started_at:
              null,

            finalized_at:
              null,

            error_message:
              null,
          }),
        ).toBeNull();
      },
    );

    it(
      "maps product-name concurrency errors to conflict",
      () => {
        expect(
          controlledActionRpcErrorStatus(
            "Product name changed before proposal creation",
          ),
        ).toBe(409);
      },
    );
  },
);
