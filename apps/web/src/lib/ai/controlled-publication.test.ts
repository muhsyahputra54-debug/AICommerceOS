import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CONTROLLED_PUBLICATION_ACTION_TYPE,
  CONTROLLED_PUBLICATION_EXTERNAL_EXECUTION_ENABLED,
  CONTROLLED_PUBLICATION_MAX_CONTENT_LENGTH,
  controlledPublicationCanExecute,
  controlledPublicationWorkflowOperation,
  normalizeControlledPublicationContent,
  parseControlledPublicationProposal,
  projectControlledPublicationRecord,
} from "./controlled-publication";

const PUBLICATION_ID =
  "11111111-1111-4111-8111-111111111111";

const SHOP_ID =
  "22222222-2222-4222-8222-222222222222";

const USER_ID =
  "33333333-3333-4333-8333-333333333333";

describe(
  "controlled publication foundation",
  () => {
    it(
      "parses an explicit publication proposal",
      () => {
        expect(
          parseControlledPublicationProposal({
            actionType:
              CONTROLLED_PUBLICATION_ACTION_TYPE,

            authorizedShopId:
              SHOP_ID,

            content:
              "  Baris pertama\r\nBaris kedua  ",

            idempotencyKey:
              "growth.caption:request-001",
          }),
        ).toEqual({
          ok: true,

          value: {
            actionType:
              "content.publish_text",

            authorizedShopId:
              SHOP_ID,

            content:
              "Baris pertama\nBaris kedua",

            idempotencyKey:
              "growth.caption:request-001",
          },
        });
      },
    );

    it(
      "rejects unsupported action types and invalid destinations",
      () => {
        expect(
          parseControlledPublicationProposal({
            actionType:
              "product.update_name",

            authorizedShopId:
              SHOP_ID,

            content:
              "Draft",

            idempotencyKey:
              "request-001",
          }).ok,
        ).toBe(
          false,
        );

        expect(
          parseControlledPublicationProposal({
            actionType:
              CONTROLLED_PUBLICATION_ACTION_TYPE,

            authorizedShopId:
              "not-a-uuid",

            content:
              "Draft",

            idempotencyKey:
              "request-001",
          }).ok,
        ).toBe(
          false,
        );
      },
    );

    it(
      "bounds publication content",
      () => {
        expect(
          normalizeControlledPublicationContent(
            "x".repeat(
              CONTROLLED_PUBLICATION_MAX_CONTENT_LENGTH +
                1,
            ),
          ),
        ).toBeNull();
      },
    );

    it(
      "projects a proposed persisted audit record",
      () => {
        expect(
          projectControlledPublicationRecord({
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
              "Gunakan produk ini minggu ini.",

            provider:
              "tiktok_shop",

            external_shop_id:
              "shop-external-1",

            destination_name:
              "LAKUVO Demo Shop",

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
          }),
        ).toMatchObject({
          id:
            PUBLICATION_ID,

          actionType:
            "content.publish_text",

          status:
            "proposed",

          targetResource:
            "marketplace_authorized_shop",

          targetId:
            SHOP_ID,

          mutationField:
            "content",

          proposedValue:
            "Gunakan produk ini minggu ini.",

          destination: {
            provider:
              "tiktok_shop",

            externalShopId:
              "shop-external-1",

            name:
              "LAKUVO Demo Shop",
          },
        });
      },
    );

    it(
      "enforces status-specific confirmation shape",
      () => {
        expect(
          projectControlledPublicationRecord({
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
              "Draft",

            provider:
              "tiktok_shop",

            external_shop_id:
              "shop-external-1",

            destination_name:
              "LAKUVO Demo Shop",

            requested_by_user_id:
              USER_ID,

            confirmed_by_user_id:
              USER_ID,

            status:
              "proposed",

            created_at:
              "2026-08-27T00:00:00.000Z",

            confirmed_at:
              "2026-08-27T00:01:00.000Z",

            finalized_at:
              null,

            error_message:
              null,
          }),
        ).toBeNull();
      },
    );

    it(
      "rejects fabricated expected content",
      () => {
        expect(
          projectControlledPublicationRecord({
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
              "old content",

            proposed_value:
              "new content",

            provider:
              "tiktok_shop",

            external_shop_id:
              "shop-external-1",

            destination_name:
              "LAKUVO Demo Shop",

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
          }),
        ).toBeNull();
      },
    );

    it(
      "allows only explicit confirmation in SG4",
      () => {
        expect(
          controlledPublicationWorkflowOperation(
            "proposed",
          ),
        ).toBe(
          "confirm",
        );

        expect(
          controlledPublicationWorkflowOperation(
            "confirmed",
          ),
        ).toBeNull();

        expect(
          controlledPublicationWorkflowOperation(
            "stale",
          ),
        ).toBeNull();
      },
    );

    it(
      "keeps external execution disabled for every SG4 state",
      () => {
        expect(
          CONTROLLED_PUBLICATION_EXTERNAL_EXECUTION_ENABLED,
        ).toBe(
          false,
        );

        for (const status of [
          "proposed",
          "confirmed",
          "stale",
        ] as const) {
          expect(
            controlledPublicationCanExecute(
              status,
            ),
          ).toBe(
            false,
          );
        }
      },
    );
  },
);