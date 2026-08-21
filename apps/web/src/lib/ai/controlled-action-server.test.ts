import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  listControlledActions,
} from "./controlled-action-server";

const ORGANIZATION_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const PRODUCT_ID =
  "11111111-1111-4111-8111-111111111111";

const ACTION_ID =
  "22222222-2222-4222-8222-222222222222";

const SAFE_ROW = {
  id:
    ACTION_ID,

  contract_version:
    1,

  action_type:
    "product.update_description",

  status:
    "proposed",

  target_resource:
    "product",

  target_id:
    PRODUCT_ID,

  expected_description:
    "before",

  proposed_description:
    "after",

  mutation_field:
    null,

  expected_value:
    null,

  proposed_value:
    null,

  created_at:
    "2026-08-20T00:00:00Z",

  confirmed_at:
    null,

  execution_started_at:
    null,

  finalized_at:
    null,

  error_message:
    null,
};

function supabaseWithRpcResult(
  result: unknown,
) {
  const rpc =
    vi.fn().mockResolvedValue(
      result,
    );

  return {
    rpc,
    supabase: {
      rpc,
    } as never,
  };
}

describe(
  "listControlledActions",
  () => {
    it(
      "reads the organization-scoped safe list RPC and validates every row",
      async () => {
        const {
          rpc,
          supabase,
        } =
          supabaseWithRpcResult({
            data: [
              SAFE_ROW,
            ],
            error:
              null,
          });

        const result =
          await listControlledActions(
            supabase,
            ORGANIZATION_ID,
            {
              limit:
                25,

              offset:
                50,

              status:
                "proposed",
            },
          );

        expect(
          rpc,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          rpc,
        ).toHaveBeenCalledWith(
          "get_ai_controlled_actions",
          {
            p_organization_id:
              ORGANIZATION_ID,

            p_limit:
              25,

            p_offset:
              50,

            p_status:
              "proposed",
          },
        );

        if (
          !(
            "actions" in
            result
          )
        ) {
          throw new Error(
            "Expected validated actions.",
          );
        }

        expect(
          result.actions,
        ).toEqual([
          {
            id:
              ACTION_ID,

            contractVersion:
              1,

            actionType:
              "product.update_description",

            status:
              "proposed",

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
              null,

            executionStartedAt:
              null,

            finalizedAt:
              null,

            errorMessage:
              null,
          },
        ]);
      },
    );

    it(
      "maps RPC errors through the controlled-action error boundary",
      async () => {
        const {
          supabase,
        } =
          supabaseWithRpcResult({
            data:
              null,

            error: {
              message:
                "unexpected database failure",
            },
          });

        const result =
          await listControlledActions(
            supabase,
            ORGANIZATION_ID,
            {
              limit:
                50,

              offset:
                0,

              status:
                null,
            },
          );

        const error =
          "error" in result
            ? result.error
            : undefined;

        if (!error) {
          throw new Error(
            "Expected RPC error response.",
          );
        }

        expect(
          error.status,
        ).toBe(
          500,
        );

        await expect(
          error.json(),
        ).resolves.toEqual({
          error:
            "Controlled action tidak dapat diproses.",
        });
      },
    );

    it(
      "fails closed when the RPC payload is not an array",
      async () => {
        const {
          supabase,
        } =
          supabaseWithRpcResult({
            data:
              SAFE_ROW,

            error:
              null,
          });

        const result =
          await listControlledActions(
            supabase,
            ORGANIZATION_ID,
            {
              limit:
                50,

              offset:
                0,

              status:
                null,
            },
          );

        const error =
          "error" in result
            ? result.error
            : undefined;

        if (!error) {
          throw new Error(
            "Expected invalid list response.",
          );
        }

        expect(
          error.status,
        ).toBe(
          502,
        );

        await expect(
          error.json(),
        ).resolves.toEqual({
          error:
            "Controlled action list response tidak valid.",
        });
      },
    );

    it(
      "fails closed when any RPC row is malformed",
      async () => {
        const {
          supabase,
        } =
          supabaseWithRpcResult({
            data: [
              SAFE_ROW,
              {
                ...SAFE_ROW,

                id:
                  "not-a-uuid",
              },
            ],

            error:
              null,
          });

        const result =
          await listControlledActions(
            supabase,
            ORGANIZATION_ID,
            {
              limit:
                50,

              offset:
                0,

              status:
                null,
            },
          );

        const error =
          "error" in result
            ? result.error
            : undefined;

        if (!error) {
          throw new Error(
            "Expected malformed-row response.",
          );
        }

        expect(
          error.status,
        ).toBe(
          502,
        );

        await expect(
          error.json(),
        ).resolves.toEqual({
          error:
            "Controlled action list response tidak valid.",
        });
      },
    );
  },
);
