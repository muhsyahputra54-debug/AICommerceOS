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

function priceRow(
  overrides: Record<string, unknown> = {},
) {
  return {
    id:
      ACTION_ID,
    contract_version:
      1,
    action_type:
      "product.update_price",
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
      "price",
    expected_value:
      "99999.00",
    proposed_value:
      "105000.00",

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
  "controlled product price action",
  () => {
    it(
      "registers the price action",
      () => {
        expect(
          CONTROLLED_ACTION_TYPES,
        ).toContain(
          "product.update_price",
        );
      },
    );

    it(
      "parses canonical decimal price text",
      () => {
        expect(
          parseControlledActionProposalInput({
            actionType:
              "product.update_price",
            productId:
              PRODUCT_ID,
            expectedPrice:
              "0.00",
            proposedPrice:
              "1.25",
            idempotencyKey:
              "price-action-1",
          }),
        ).toEqual({
          ok: true,
          value: {
            actionType:
              "product.update_price",
            productId:
              PRODUCT_ID,
            expectedPrice:
              "0.00",
            proposedPrice:
              "1.25",
            idempotencyKey:
              "price-action-1",
          },
        });
      },
    );

    it(
      "accepts the numeric 12,2 upper bound",
      () => {
        expect(
          parseControlledActionProposalInput({
            actionType:
              "product.update_price",
            productId:
              PRODUCT_ID,
            expectedPrice:
              "0.00",
            proposedPrice:
              "9999999999.99",
            idempotencyKey:
              "price-action-2",
          }).ok,
        ).toBe(true);
      },
    );

    it(
      "rejects JavaScript numbers for price snapshots",
      () => {
        expect(
          parseControlledActionProposalInput({
            actionType:
              "product.update_price",
            productId:
              PRODUCT_ID,
            expectedPrice:
              99999,
            proposedPrice:
              "105000.00",
            idempotencyKey:
              "price-action-3",
          }).ok,
        ).toBe(false);
      },
    );

    it.each([
      "1",
      "1.0",
      "1.000",
      "01.00",
      "1,00",
      "1e2",
      " 1.00",
      "1.00 ",
      "10000000000.00",
      "-1.00",
      "+1.00",
    ])(
      "rejects non-canonical price text %s",
      (invalidPrice) => {
        expect(
          parseControlledActionProposalInput({
            actionType:
              "product.update_price",
            productId:
              PRODUCT_ID,
            expectedPrice:
              invalidPrice,
            proposedPrice:
              "105000.00",
            idempotencyKey:
              "price-action-invalid",
          }).ok,
        ).toBe(false);
      },
    );

    it(
      "rejects a price no-op",
      () => {
        expect(
          parseControlledActionProposalInput({
            actionType:
              "product.update_price",
            productId:
              PRODUCT_ID,
            expectedPrice:
              "99999.00",
            proposedPrice:
              "99999.00",
            idempotencyKey:
              "price-action-4",
          }).ok,
        ).toBe(false);
      },
    );

    it(
      "rejects mixed status fields on a price proposal",
      () => {
        expect(
          parseControlledActionProposalInput({
            actionType:
              "product.update_price",
            productId:
              PRODUCT_ID,
            expectedPrice:
              "99999.00",
            proposedPrice:
              "105000.00",
            expectedStatus:
              "active",
            idempotencyKey:
              "price-action-5",
          }).ok,
        ).toBe(false);
      },
    );

    it(
      "projects a persisted canonical price snapshot",
      () => {
        const result =
          projectControlledActionRecord(
            priceRow(),
          );

        expect(result?.actionType).toBe(
          "product.update_price",
        );

        if (
          !result ||
          result.actionType !==
            "product.update_price"
        ) {
          throw new Error(
            "Expected product.update_price projection.",
          );
        }

        expect(
          result.mutationField,
        ).toBe("price");

        expect(
          result.expectedPrice,
        ).toBe("99999.00");

        expect(
          result.proposedPrice,
        ).toBe("105000.00");
      },
    );

    it(
      "rejects invalid persisted price payloads",
      () => {
        expect(
          projectControlledActionRecord(
            priceRow({
              proposed_value:
                "105000.0",
            }),
          ),
        ).toBeNull();

        expect(
          projectControlledActionRecord(
            priceRow({
              proposed_value:
                "99999.00",
            }),
          ),
        ).toBeNull();

        expect(
          projectControlledActionRecord(
            priceRow({
              expected_description:
                "must stay null",
            }),
          ),
        ).toBeNull();
      },
    );

    it(
      "maps product price concurrency conflicts to 409",
      () => {
        expect(
          controlledActionRpcErrorStatus(
            "Product price changed before proposal creation",
          ),
        ).toBe(409);

        expect(
          controlledActionRpcErrorStatus(
            "proposed product price does not change the current price",
          ),
        ).toBe(409);
      },
    );
  },
);
