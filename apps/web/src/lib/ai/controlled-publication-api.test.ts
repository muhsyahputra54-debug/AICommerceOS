import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseControlledPublicationId,
  parseControlledPublicationListQuery,
  projectControlledPublicationList,
  projectControlledPublicationRpcResult,
} from "./controlled-publication-api";

const PUBLICATION_ID =
  "11111111-1111-4111-8111-111111111111";

const SHOP_ID =
  "22222222-2222-4222-8222-222222222222";

const USER_ID =
  "33333333-3333-4333-8333-333333333333";

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

describe(
  "controlled publication API contract",
  () => {
    it(
      "parses canonical publication ids",
      () => {
        expect(
          parseControlledPublicationId(
            PUBLICATION_ID.toUpperCase(),
          ),
        ).toBe(
          PUBLICATION_ID,
        );

        expect(
          parseControlledPublicationId(
            "invalid",
          ),
        ).toBeNull();
      },
    );

    it(
      "parses safe list defaults",
      () => {
        expect(
          parseControlledPublicationListQuery(
            new URLSearchParams(),
          ),
        ).toEqual({
          ok: true,
          value: {
            limit: 20,
            offset: 0,
            status: null,
          },
        });
      },
    );

    it(
      "parses supported status filter",
      () => {
        expect(
          parseControlledPublicationListQuery(
            new URLSearchParams({
              limit: "50",
              offset: "10",
              status: "confirmed",
            }),
          ),
        ).toEqual({
          ok: true,
          value: {
            limit: 50,
            offset: 10,
            status: "confirmed",
          },
        });
      },
    );

    it(
      "rejects unsafe pagination and status",
      () => {
        expect(
          parseControlledPublicationListQuery(
            new URLSearchParams({
              limit: "101",
            }),
          ).ok,
        ).toBe(
          false,
        );

        expect(
          parseControlledPublicationListQuery(
            new URLSearchParams({
              offset: "-1",
            }),
          ).ok,
        ).toBe(
          false,
        );

        expect(
          parseControlledPublicationListQuery(
            new URLSearchParams({
              status: "executed",
            }),
          ).ok,
        ).toBe(
          false,
        );
      },
    );

    it(
      "projects exactly one RPC result",
      () => {
        expect(
          projectControlledPublicationRpcResult(
            [
              row(),
            ],
          ),
        ).toMatchObject({
          id:
            PUBLICATION_ID,

          actionType:
            "content.publish_text",

          status:
            "proposed",
        });

        expect(
          projectControlledPublicationRpcResult(
            [],
          ),
        ).toBeNull();

        expect(
          projectControlledPublicationRpcResult(
            [
              row(),
              row({
                id:
                  "44444444-4444-4444-8444-444444444444",
              }),
            ],
          ),
        ).toBeNull();
      },
    );

    it(
      "fails closed on malformed list row",
      () => {
        expect(
          projectControlledPublicationList(
            [
              row(),
            ],
          ),
        ).toHaveLength(
          1,
        );

        expect(
          projectControlledPublicationList(
            [
              row(),
              row({
                action_type:
                  "product.update_name",
              }),
            ],
          ),
        ).toBeNull();
      },
    );
  },
);