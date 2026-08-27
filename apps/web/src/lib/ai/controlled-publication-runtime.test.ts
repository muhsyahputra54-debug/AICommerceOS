import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const PUBLICATION_ID =
  "11111111-1111-4111-8111-111111111111";

const DESTINATION_ID =
  "22222222-2222-4222-8222-222222222222";

const USER_ID =
  "33333333-3333-4333-8333-333333333333";

const ORGANIZATION_ID =
  "44444444-4444-4444-8444-444444444444";

const LEGACY_SHOP_ID =
  "55555555-5555-4555-8555-555555555555";

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
  POST as proposePublication,
} from "../../app/api/ai/controlled-publications/route";

import {
  projectControlledPublicationList,
} from "./controlled-publication-api";

import {
  projectControlledPublicationApiRecord,
} from "./controlled-publication-runtime";

function channelRow(
  overrides: Record<string, unknown> = {},
) {
  return {
    id:
      PUBLICATION_ID,

    organization_id:
      ORGANIZATION_ID,

    contract_version:
      2,

    action_type:
      "content.publish_text",

    target_resource:
      "publishing_channel_destination",

    target_id:
      DESTINATION_ID,

    mutation_field:
      "content",

    expected_value:
      null,

    proposed_value:
      "Caption yang sudah direview.",

    provider:
      "example_social",

    external_shop_id:
      "page-123",

    destination_type:
      "page",

    destination_name:
      "LAKUVO Page",

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

function legacyRow() {
  return {
    id:
      "66666666-6666-4666-8666-666666666666",

    contract_version:
      1,

    action_type:
      "content.publish_text",

    target_resource:
      "marketplace_authorized_shop",

    target_id:
      LEGACY_SHOP_ID,

    mutation_field:
      "content",

    expected_value:
      null,

    proposed_value:
      "Legacy caption.",

    provider:
      "tiktok_shop",

    external_shop_id:
      "shop-1",

    destination_name:
      "Legacy Shop",

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
  "SG5 channel runtime integration",
  () => {
    it(
      "projects a full v2 lifecycle record without reinterpreting it as v1",
      () => {
        const projected =
          projectControlledPublicationApiRecord(
            channelRow(),
          );

        expect(projected).not.toBeNull();
        expect(
          projected?.contractVersion,
        ).toBe(2);

        if (
          !projected ||
          projected.contractVersion !==
            2
        ) {
          return;
        }

        expect(
          projected.destination
            .externalDestinationId,
        ).toBe(
          "page-123",
        );

        expect(
          projected.status,
        ).toBe(
          "proposed",
        );
      },
    );

    it(
      "keeps mixed v1 and v2 read results backward compatible",
      () => {
        const projected =
          projectControlledPublicationList([
            legacyRow(),
            channelRow(),
          ]);

        expect(projected).not.toBeNull();
        expect(
          projected?.map(
            (item) =>
              item.contractVersion,
          ),
        ).toEqual([
          1,
          2,
        ]);
      },
    );

    it(
      "routes publishingDestinationId only to the channel proposal RPC",
      async () => {
        mocks.rpc.mockResolvedValue({
          data:
            channelRow(),

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

                    publishingDestinationId:
                      DESTINATION_ID,

                    content:
                      "Caption yang sudah direview.",

                    idempotencyKey:
                      "growth.channel.12345678",
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
          "propose_ai_controlled_publication_channel",
          {
            p_organization_id:
              ORGANIZATION_ID,

            p_publishing_destination_id:
              DESTINATION_ID,

            p_proposed_content:
              "Caption yang sudah direview.",

            p_idempotency_key:
              "growth.channel.12345678",
          },
        );
      },
    );

    it(
      "rejects ambiguous payloads carrying seller and publishing identities",
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

                    authorizedShopId:
                      LEGACY_SHOP_ID,

                    publishingDestinationId:
                      DESTINATION_ID,

                    content:
                      "Caption",

                    idempotencyKey:
                      "growth.channel.12345678",
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
      "fails closed on malformed v2 lifecycle data",
      () => {
        expect(
          projectControlledPublicationApiRecord(
            channelRow({
              status:
                "confirmed",
              confirmed_by_user_id:
                null,
              confirmed_at:
                null,
            }),
          ),
        ).toBeNull();
      },
    );
  },
);
