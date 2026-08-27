import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const PUBLICATION_ID =
  "11111111-1111-4111-8111-111111111111";

const SHOP_ID =
  "22222222-2222-4222-8222-222222222222";

const USER_ID =
  "33333333-3333-4333-8333-333333333333";

const ORGANIZATION_ID =
  "44444444-4444-4444-8444-444444444444";

const mocks =
  vi.hoisted(
    () => ({
      getContext:
        vi.fn(),

      rpc:
        vi.fn(),
    }),
  );

vi.mock(
  "@/lib/ai/controlled-action-server",
  () => ({
    getControlledActionRequestContext:
      mocks.getContext,

    controlledActionRpcErrorResponse:
      (message: string) =>
        new Response(
          JSON.stringify({
            error:
              message,
          }),
          {
            status: 500,
            headers: {
              "content-type":
                "application/json",
            },
          },
        ),
  }),
);

import {
  GET as listPublications,
  POST as proposePublication,
} from "../../app/api/ai/controlled-publications/route";

import {
  GET as readPublication,
} from "../../app/api/ai/controlled-publications/[id]/route";

import {
  POST as confirmPublication,
} from "../../app/api/ai/controlled-publications/[id]/confirm/route";

function row(
  overrides: Record<string, unknown> = {},
) {
  return {
    id:
      PUBLICATION_ID,

    contract_version:
      1,

    action_type:
      "content.publish_text",

    target_resource:
      "marketplace_authorized_shop",

    target_id:
      SHOP_ID,

    mutation_field:
      "content",

    expected_value:
      null,

    proposed_value:
      "Draft yang telah ditinjau.",

    provider:
      "tiktok_shop",

    external_shop_id:
      "shop-1",

    destination_name:
      "LAKUVO Shop",

    requested_by_user_id:
      USER_ID,

    confirmed_by_user_id:
      null,

    status:
      "proposed",

    created_at:
      "2026-08-27T00:00:00.000Z",

    confirmed_at:
      null,

    finalized_at:
      null,

    error_message:
      null,

    ...overrides,
  };
}

beforeEach(
  () => {
    mocks.getContext.mockReset();
    mocks.rpc.mockReset();

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
  },
);

describe(
  "controlled publication routes",
  () => {
    it(
      "lists through persisted read RPC",
      async () => {
        mocks.rpc.mockResolvedValue({
          data: [
            row(),
          ],
          error: null,
        });

        const response =
          await listPublications(
            new Request(
              "http://localhost/api/ai/controlled-publications?limit=20&offset=0",
            ),
          );

        expect(
          response!.status,
        ).toBe(
          200,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "get_ai_controlled_publications",
          {
            p_organization_id:
              ORGANIZATION_ID,

            p_limit:
              20,

            p_offset:
              0,

            p_status:
              null,
          },
        );
      },
    );

    it(
      "rejects malformed proposal before RPC",
      async () => {
        const response =
          await proposePublication(
            new Request(
              "http://localhost/api/ai/controlled-publications",
              {
                method:
                  "POST",

                headers: {
                  "content-type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    actionType:
                      "content.publish_text",
                  }),
              },
            ),
          );

        expect(
          response!.status,
        ).toBe(
          400,
        );

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "creates proposal through proposal RPC only",
      async () => {
        mocks.rpc.mockResolvedValue({
          data:
            row(),

          error:
            null,
        });

        const response =
          await proposePublication(
            new Request(
              "http://localhost/api/ai/controlled-publications",
              {
                method:
                  "POST",

                headers: {
                  "content-type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    actionType:
                      "content.publish_text",

                    authorizedShopId:
                      SHOP_ID,

                    content:
                      "Draft yang telah ditinjau.",

                    idempotencyKey:
                      "publication:request-001",
                  }),
              },
            ),
          );

        expect(
          response!.status,
        ).toBe(
          201,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "propose_ai_controlled_publication",
          {
            p_organization_id:
              ORGANIZATION_ID,

            p_authorized_shop_id:
              SHOP_ID,

            p_proposed_content:
              "Draft yang telah ditinjau.",

            p_idempotency_key:
              "publication:request-001",
          },
        );
      },
    );

    it(
      "reads through detail RPC",
      async () => {
        mocks.rpc.mockResolvedValue({
          data:
            row(),

          error:
            null,
        });

        const response =
          await readPublication(
            new Request(
              `http://localhost/api/ai/controlled-publications/${PUBLICATION_ID}`,
            ),
            {
              params:
                Promise.resolve({
                  id:
                    PUBLICATION_ID,
                }),
            },
          );

        expect(
          response!.status,
        ).toBe(
          200,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "get_ai_controlled_publication",
          {
            p_organization_id:
              ORGANIZATION_ID,

            p_publication_id:
              PUBLICATION_ID,
          },
        );
      },
    );

    it(
      "confirms through confirmation RPC only",
      async () => {
        mocks.rpc.mockResolvedValue({
          data:
            row({
              status:
                "confirmed",

              confirmed_by_user_id:
                USER_ID,

              confirmed_at:
                "2026-08-27T00:01:00.000Z",
            }),

          error:
            null,
        });

        const response =
          await confirmPublication(
            new Request(
              `http://localhost/api/ai/controlled-publications/${PUBLICATION_ID}/confirm`,
              {
                method:
                  "POST",
              },
            ),
            {
              params:
                Promise.resolve({
                  id:
                    PUBLICATION_ID,
                }),
            },
          );

        expect(
          response!.status,
        ).toBe(
          200,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledWith(
          "confirm_ai_controlled_publication",
          {
            p_publication_id:
              PUBLICATION_ID,
          },
        );
      },
    );

    it(
      "fails closed without authenticated controlled-action context",
      async () => {
        mocks.getContext.mockResolvedValue({
          error:
            new Response(
              JSON.stringify({
                error:
                  "Authentication required.",
              }),
              {
                status: 401,
              },
            ),
        });

        const response =
          await listPublications(
            new Request(
              "http://localhost/api/ai/controlled-publications",
            ),
          );

        expect(
          response!.status,
        ).toBe(
          401,
        );

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();
      },
    );
  },
);