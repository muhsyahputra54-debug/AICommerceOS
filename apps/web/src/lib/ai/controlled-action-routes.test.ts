import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks =
  vi.hoisted(() => ({
    getContext:
      vi.fn(),

    readAction:
      vi.fn(),

    listActions:
      vi.fn(),

    rpc:
      vi.fn(),

    rpcErrorResponse:
      vi.fn(
        () =>
          Response.json(
            {
              error:
                "rpc error",
            },
            {
              status: 500,
            },
          ),
      ),
  }));

vi.mock(
  "@/lib/ai/controlled-action-server",
  () => ({
    getControlledActionRequestContext:
      mocks.getContext,

    readControlledAction:
      mocks.readAction,

    listControlledActions:
      mocks.listActions,

    controlledActionRpcErrorResponse:
      mocks.rpcErrorResponse,
  }),
);

import {
  GET as listActionCenter,
  POST as proposeAction,
} from "../../app/api/ai/controlled-actions/route";

import {
  GET as readAction,
} from "../../app/api/ai/controlled-actions/[id]/route";

import {
  POST as confirmAction,
} from "../../app/api/ai/controlled-actions/[id]/confirm/route";

import {
  POST as executeAction,
} from "../../app/api/ai/controlled-actions/[id]/execute/route";

const ORGANIZATION_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const USER_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const PRODUCT_ID =
  "11111111-1111-4111-8111-111111111111";

const ACTION_ID =
  "22222222-2222-4222-8222-222222222222";

const ACTION = {
  id:
    ACTION_ID,

  contractVersion:
    1 as const,

  actionType:
    "product.update_description" as const,

  status:
    "proposed" as const,

  targetResource:
    "product" as const,

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
};

function routeContext(
  id = ACTION_ID,
) {
  return {
    params:
      Promise.resolve({
        id,
      }),
  };
}

function request(
  pathname: string,
  body?: unknown,
) {
  return new Request(
    `http://localhost${pathname}`,
    {
      method:
        body === undefined
          ? "GET"
          : "POST",

      headers:
        body === undefined
          ? undefined
          : {
              "content-type":
                "application/json",
            },

      body:
        body === undefined
          ? undefined
          : JSON.stringify(
              body,
            ),
    },
  );
}

describe(
  "controlled action server routes",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();

        mocks.getContext.mockResolvedValue({
          supabase: {
            rpc:
              mocks.rpc,
          },

          user: {
            id:
              USER_ID,
          },

          organizationId:
            ORGANIZATION_ID,

          role:
            "owner",
        });

        mocks.readAction.mockResolvedValue({
          action:
            ACTION,
        });

        mocks.listActions.mockResolvedValue({
          actions: [
            ACTION,
          ],
        });

        mocks.rpc.mockResolvedValue({
          data: {
            action_id:
              ACTION_ID,
          },

          error:
            null,
        });
      },
    );

    it(
      "lists Action Center items with safe defaults",
      async () => {
        const response =
          await listActionCenter(
            request(
              "/api/ai/controlled-actions",
            ),
          );

        expect(
          response!.status,
        ).toBe(200);

        expect(
          mocks.listActions,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.listActions,
        ).toHaveBeenCalledWith(
          expect.any(Object),
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

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();

        await expect(
          response!.json(),
        ).resolves.toEqual({
          actions: [
            {
              id:
                ACTION_ID,

              contractVersion:
                1,

              actionType:
                "product.update_description",

              status:
                "proposed",

              lifecycleBucket:
                "needs_review",

              target: {
                resource:
                  "product",

                id:
                  PRODUCT_ID,
              },

              mutation: {
                field:
                  "description",

                before:
                  "before",

                after:
                  "after",
              },

              timestamps: {
                createdAt:
                  "2026-08-20T00:00:00Z",

                confirmedAt:
                  null,

                executionStartedAt:
                  null,

                finalizedAt:
                  null,
              },

              errorMessage:
                null,

              risk:
                null,

              rationale:
                null,
            },
          ],

          pagination: {
            limit:
              50,

            offset:
              0,

            status:
              null,

            returned:
              1,
          },
        });
      },
    );

    it(
      "passes validated pagination and status to the list adapter",
      async () => {
        const response =
          await listActionCenter(
            request(
              "/api/ai/controlled-actions?limit=25&offset=50&status=failed",
            ),
          );

        expect(
          response!.status,
        ).toBe(200);

        expect(
          mocks.listActions,
        ).toHaveBeenCalledWith(
          expect.any(Object),
          ORGANIZATION_ID,
          {
            limit:
              25,

            offset:
              50,

            status:
              "failed",
          },
        );

        const body =
          await response!.json();

        expect(
          body.pagination,
        ).toEqual({
          limit:
            25,

          offset:
            50,

          status:
            "failed",

          returned:
            1,
        });
      },
    );

    it(
      "rejects unsupported list query parameters before list access",
      async () => {
        const response =
          await listActionCenter(
            request(
              "/api/ai/controlled-actions?organizationId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            ),
          );

        expect(
          response!.status,
        ).toBe(400);

        expect(
          mocks.listActions,
        ).not.toHaveBeenCalled();

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "propagates the authorization boundary before Action Center list access",
      async () => {
        mocks.getContext.mockResolvedValueOnce({
          error:
            Response.json(
              {
                error:
                  "Forbidden",
              },
              {
                status:
                  403,
              },
            ),
        });

        const response =
          await listActionCenter(
            request(
              "/api/ai/controlled-actions",
            ),
          );

        expect(
          response!.status,
        ).toBe(403);

        expect(
          mocks.listActions,
        ).not.toHaveBeenCalled();

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();
      },
    );
    it(
      "proposes only and then reloads the safe action",
      async () => {
        const response =
          await proposeAction(
            request(
              "/api/ai/controlled-actions",
              {
                productId:
                  PRODUCT_ID,

                expectedDescription:
                  "before",

                proposedDescription:
                  "after",

                idempotencyKey:
                  "route-characterization-1",
              },
            ),
          );

        expect(
          response!.status,
        ).toBe(201);

        expect(
          mocks.rpc,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "propose_ai_controlled_product_description_action",
          {
            p_organization_id:
              ORGANIZATION_ID,

            p_product_id:
              PRODUCT_ID,

            p_expected_description:
              "before",

            p_proposed_description:
              "after",

            p_idempotency_key:
              "route-characterization-1",
          },
        );

        expect(
          mocks.readAction,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.readAction,
        ).toHaveBeenCalledWith(
          expect.any(Object),
          ORGANIZATION_ID,
          ACTION_ID,
        );

        await expect(
          response!.json(),
        ).resolves.toEqual({
          action:
            ACTION,
        });
      },
    );

    it(
      "routes product price proposals through the price proposer",
      async () => {
        const response =
          await proposeAction(
            request(
              "/api/ai/controlled-actions",
              {
                actionType:
                  "product.update_price",

                productId:
                  PRODUCT_ID,

                expectedPrice:
                  "99999.00",

                proposedPrice:
                  "105000.00",

                idempotencyKey:
                  "route-price-1",
              },
            ),
          );

        expect(
          response!.status,
        ).toBe(201);

        expect(
          mocks.rpc,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "propose_ai_controlled_product_price_action",
          {
            p_organization_id:
              ORGANIZATION_ID,

            p_product_id:
              PRODUCT_ID,

            p_expected_price:
              "99999.00",

            p_proposed_price:
              "105000.00",

            p_idempotency_key:
              "route-price-1",
          },
        );

        expect(
          mocks.readAction,
        ).toHaveBeenCalledWith(
          expect.any(Object),
          ORGANIZATION_ID,
          ACTION_ID,
        );
      },
    );

    it(
      "fails closed when proposal tries to smuggle confirmation",
      async () => {
        const response =
          await proposeAction(
            request(
              "/api/ai/controlled-actions",
              {
                productId:
                  PRODUCT_ID,

                expectedDescription:
                  "before",

                proposedDescription:
                  "after",

                idempotencyKey:
                  "route-characterization-2",

                confirmed:
                  true,
              },
            ),
          );

        expect(
          response!.status,
        ).toBe(400);

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.readAction,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "reads through the narrow read adapter only",
      async () => {
        const response =
          await readAction(
            request(
              `/api/ai/controlled-actions/${ACTION_ID}`,
            ),
            routeContext(),
          );

        expect(
          response!.status,
        ).toBe(200);

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.readAction,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.readAction,
        ).toHaveBeenCalledWith(
          expect.any(Object),
          ORGANIZATION_ID,
          ACTION_ID,
        );
      },
    );

    it(
      "confirmation calls confirm RPC but never execute RPC",
      async () => {
        const response =
          await confirmAction(
            request(
              `/api/ai/controlled-actions/${ACTION_ID}/confirm`,
              {},
            ),
            routeContext(),
          );

        expect(
          response!.status,
        ).toBe(200);

        expect(
          mocks.rpc,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "confirm_ai_controlled_action",
          {
            p_action_id:
              ACTION_ID,
          },
        );

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalledWith(
          "execute_ai_controlled_action_dispatch",
          expect.anything(),
        );
      },
    );

    it(
      "execution calls execute RPC but never confirm RPC",
      async () => {
        const response =
          await executeAction(
            request(
              `/api/ai/controlled-actions/${ACTION_ID}/execute`,
              {},
            ),
            routeContext(),
          );

        expect(
          response!.status,
        ).toBe(200);

        expect(
          mocks.rpc,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "execute_ai_controlled_action_dispatch",
          {
            p_action_id:
              ACTION_ID,
          },
        );

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalledWith(
          "confirm_ai_controlled_action",
          expect.anything(),
        );
      },
    );

    it(
      "rejects invalid action ids before lifecycle RPC execution",
      async () => {
        const response =
          await executeAction(
            request(
              "/api/ai/controlled-actions/not-a-uuid/execute",
              {},
            ),
            routeContext(
              "not-a-uuid",
            ),
          );

        expect(
          response!.status,
        ).toBe(400);

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.readAction,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "propagates an authorization boundary response before RPC access",
      async () => {
        mocks.getContext.mockResolvedValueOnce({
          error:
            Response.json(
              {
                error:
                  "Forbidden",
              },
              {
                status: 403,
              },
            ),
        });

        const response =
          await proposeAction(
            request(
              "/api/ai/controlled-actions",
              {
                productId:
                  PRODUCT_ID,

                expectedDescription:
                  "before",

                proposedDescription:
                  "after",

                idempotencyKey:
                  "route-characterization-3",
              },
            ),
          );

        expect(
          response!.status,
        ).toBe(403);

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();

        expect(
          mocks.readAction,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
