import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CONTROLLED_PUBLICATION_CHANNEL_CONTRACT_VERSION,
  CONTROLLED_PUBLICATION_CHANNEL_EXECUTION_ENABLED,
  CONTROLLED_PUBLICATION_CHANNEL_TARGET_RESOURCE,
  controlledPublicationChannelCanExecuteInB2B1,
  controlledPublicationChannelDestinationIsCompatible,
  parseControlledPublicationChannelProposal,
  projectControlledPublicationChannelRecord,
} from "./controlled-publication-channel-target";

import {
  parsePublishingDestinationRecord,
} from "./publishing-destination";

const destinationRow = {
  id:
    "11111111-1111-4111-8111-111111111111",
  organization_id:
    "22222222-2222-4222-8222-222222222222",
  provider:
    "example_social",
  destination_type:
    "page",
  external_destination_id:
    "page-123",
  display_name:
    "LAKUVO Page",
  status:
    "active",
  capabilities: [
    "publish_text",
  ],
  is_selected:
    true,
  created_at:
    "2026-08-27T00:00:00.000Z",
  updated_at:
    "2026-08-27T00:00:00.000Z",
};

const channelPublicationRow = {
  id:
    "33333333-3333-4333-8333-333333333333",
  contract_version:
    2,
  action_type:
    "content.publish_text",
  target_resource:
    "publishing_channel_destination",
  target_id:
    "11111111-1111-4111-8111-111111111111",
  mutation_field:
    "content",
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
};

describe(
  "controlled publication channel target contract",
  () => {
    it(
      "uses a distinct v2 target without changing SG4 legacy identity",
      () => {
        expect(
          CONTROLLED_PUBLICATION_CHANNEL_CONTRACT_VERSION,
        ).toBe(2);

        expect(
          CONTROLLED_PUBLICATION_CHANNEL_TARGET_RESOURCE,
        ).toBe(
          "publishing_channel_destination",
        );
      },
    );

    it(
      "parses only publishingDestinationId proposal input",
      () => {
        const parsed =
          parseControlledPublicationChannelProposal(
            {
              actionType:
                "content.publish_text",
              publishingDestinationId:
                "11111111-1111-4111-8111-111111111111",
              content:
                "  Caption\r\nreviewed  ",
              idempotencyKey:
                "growth.channel.12345678",
            },
          );

        expect(parsed.ok).toBe(true);

        if (!parsed.ok) {
          return;
        }

        expect(
          parsed.value.content,
        ).toBe(
          "Caption\nreviewed",
        );
      },
    );

    it(
      "does not reinterpret authorizedShopId as channel identity",
      () => {
        expect(
          parseControlledPublicationChannelProposal(
            {
              actionType:
                "content.publish_text",
              authorizedShopId:
                "11111111-1111-4111-8111-111111111111",
              content:
                "Caption",
              idempotencyKey:
                "growth.channel.12345678",
            },
          ).ok,
        ).toBe(false);
      },
    );

    it(
      "requires explicit publish_text capability",
      () => {
        const parsedDestination =
          parsePublishingDestinationRecord(
            destinationRow,
          );

        expect(
          parsedDestination.ok,
        ).toBe(true);

        if (!parsedDestination.ok) {
          return;
        }

        expect(
          controlledPublicationChannelDestinationIsCompatible(
            parsedDestination.value,
          ),
        ).toBe(true);

        const noTextDestination =
          parsePublishingDestinationRecord(
            {
              ...destinationRow,
              capabilities: [
                "publish_video",
              ],
            },
          );

        expect(
          noTextDestination.ok,
        ).toBe(true);

        if (!noTextDestination.ok) {
          return;
        }

        expect(
          controlledPublicationChannelDestinationIsCompatible(
            noTextDestination.value,
          ),
        ).toBe(false);
      },
    );

    it(
      "projects a v2 channel publication snapshot",
      () => {
        const projected =
          projectControlledPublicationChannelRecord(
            channelPublicationRow,
          );

        expect(projected).not.toBeNull();

        expect(
          projected?.destination
            .externalDestinationId,
        ).toBe(
          "page-123",
        );

        expect(
          projected?.destination
            .destinationType,
        ).toBe(
          "page",
        );
      },
    );

    it(
      "rejects SG4 legacy publication rows in the channel projector",
      () => {
        expect(
          projectControlledPublicationChannelRecord(
            {
              ...channelPublicationRow,
              contract_version: 1,
              target_resource:
                "marketplace_authorized_shop",
            },
          ),
        ).toBeNull();
      },
    );

    it(
      "keeps channel execution disabled in B2B1",
      () => {
        const projected =
          projectControlledPublicationChannelRecord(
            channelPublicationRow,
          );

        if (!projected) {
          throw new Error(
            "expected channel publication projection",
          );
        }

        expect(
          CONTROLLED_PUBLICATION_CHANNEL_EXECUTION_ENABLED,
        ).toBe(false);

        expect(
          controlledPublicationChannelCanExecuteInB2B1(
            projected,
          ),
        ).toBe(false);
      },
    );
  },
);