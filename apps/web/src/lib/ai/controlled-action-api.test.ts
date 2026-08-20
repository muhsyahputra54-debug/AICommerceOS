import {
  describe,
  expect,
  it,
} from "vitest";

import {
  controlledActionRpcErrorStatus,
  extractControlledActionId,
  parseControlledActionId,
  parseControlledActionProposalInput,
  projectControlledActionRecord,
} from "./controlled-action-api";

const PRODUCT_ID =
  "11111111-1111-4111-8111-111111111111";

const ACTION_ID =
  "22222222-2222-4222-8222-222222222222";

describe(
  "controlled action API contract",
  () => {
    it(
      "accepts only the controlled description proposal fields",
      () => {
        expect(
          parseControlledActionProposalInput({
            productId:
              PRODUCT_ID,
            expectedDescription:
              "before",
            proposedDescription:
              "  after  ",
            idempotencyKey:
              "  request-1  ",
          }),
        ).toEqual({
          ok: true,
          value: {
            productId:
              PRODUCT_ID,
            expectedDescription:
              "before",
            proposedDescription:
              "after",
            idempotencyKey:
              "request-1",
          },
        });
      },
    );

    it(
      "preserves the exact nullable before snapshot",
      () => {
        const nullSnapshot =
          parseControlledActionProposalInput({
            productId:
              PRODUCT_ID,
            expectedDescription:
              null,
            proposedDescription:
              "after",
            idempotencyKey:
              "request-2",
          });

        expect(
          nullSnapshot,
        ).toMatchObject({
          ok: true,
          value: {
            expectedDescription:
              null,
          },
        });

        const whitespaceSnapshot =
          parseControlledActionProposalInput({
            productId:
              PRODUCT_ID,
            expectedDescription:
              "  before  ",
            proposedDescription:
              "after",
            idempotencyKey:
              "request-3",
          });

        expect(
          whitespaceSnapshot,
        ).toMatchObject({
          ok: true,
          value: {
            expectedDescription:
              "  before  ",
          },
        });
      },
    );

    it.each([
      {
        price: 100,
      },
      {
        stock: 10,
      },
      {
        confirmed: true,
      },
      {
        execute: true,
      },
      {
        organizationId:
          PRODUCT_ID,
      },
    ])(
      "fails closed on unsupported proposal fields",
      (unsupported) => {
        expect(
          parseControlledActionProposalInput({
            productId:
              PRODUCT_ID,
            expectedDescription:
              "before",
            proposedDescription:
              "after",
            idempotencyKey:
              "request-4",
            ...unsupported,
          }).ok,
        ).toBe(false);
      },
    );

    it(
      "rejects invalid IDs and blank proposals",
      () => {
        expect(
          parseControlledActionProposalInput({
            productId:
              "not-a-uuid",
            expectedDescription:
              null,
            proposedDescription:
              "after",
            idempotencyKey:
              "request-5",
          }).ok,
        ).toBe(false);

        expect(
          parseControlledActionProposalInput({
            productId:
              PRODUCT_ID,
            expectedDescription:
              null,
            proposedDescription:
              "   ",
            idempotencyKey:
              "request-6",
          }).ok,
        ).toBe(false);

        expect(
          parseControlledActionId(
            "invalid",
          ),
        ).toBeNull();
      },
    );

    it(
      "projects only the safe persisted action fields",
      () => {
        expect(
          projectControlledActionRecord({
            id:
              ACTION_ID,
            contract_version:
              1,
            organization_id:
              PRODUCT_ID,
            requested_by:
              PRODUCT_ID,
            idempotency_key:
              "secret-server-key",
            action_type:
              "product.update_description",
            status:
              "confirmed",
            target_resource:
              "product",
            target_id:
              PRODUCT_ID,
            expected_description:
              "before",
            proposed_description:
              "after",
            created_at:
              "2026-08-20T00:00:00Z",
            confirmed_at:
              "2026-08-20T00:01:00Z",
            execution_started_at:
              null,
            finalized_at:
              null,
            error_message:
              null,
          }),
        ).toEqual({
          id:
            ACTION_ID,
          contractVersion:
            1,
          actionType:
            "product.update_description",
          status:
            "confirmed",
          targetResource:
            "product",
          targetId:
            PRODUCT_ID,
          expectedDescription:
            "before",
          proposedDescription:
            "after",
          createdAt:
            "2026-08-20T00:00:00Z",
          confirmedAt:
            "2026-08-20T00:01:00Z",
          executionStartedAt:
            null,
          finalizedAt:
            null,
          errorMessage:
            null,
        });
      },
    );

    it(
      "extracts only a valid action id from RPC output",
      () => {
        expect(
          extractControlledActionId({
            action_id:
              ACTION_ID,
          }),
        ).toBe(
          ACTION_ID,
        );

        expect(
          extractControlledActionId({
            action_id:
              "bad",
          }),
        ).toBeNull();
      },
    );

    it(
      "maps authorization and lifecycle conflicts safely",
      () => {
        expect(
          controlledActionRpcErrorStatus(
            "Authentication required.",
          ),
        ).toBe(401);

        expect(
          controlledActionRpcErrorStatus(
            "Controlled actions require owner or admin.",
          ),
        ).toBe(403);

        expect(
          controlledActionRpcErrorStatus(
            "idempotency key conflict",
          ),
        ).toBe(409);

        expect(
          controlledActionRpcErrorStatus(
            "Explicit confirmation is required before execution.",
          ),
        ).toBe(409);

        expect(
          controlledActionRpcErrorStatus(
            "database unavailable",
          ),
        ).toBe(500);
      },
    );
  },
);