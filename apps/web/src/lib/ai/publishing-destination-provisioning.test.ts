import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PUBLISHING_DESTINATION_PROVISIONING_PROVIDER_CALLS_ENABLED,
  PUBLISHING_DESTINATION_PROVISIONING_RESOURCE,
  parsePublishingDestinationProvisionInput,
  parsePublishingDestinationSelectionInput,
  publishingDestinationProvisioningCanCallProvider,
} from "./publishing-destination-provisioning";

const validProvisionInput = {
  provider:
    " TikTok ",
  destinationType:
    "account",
  externalDestinationId:
    " creator-123 ",
  displayName:
    " LAKUVO Creator ",
  capabilities: [
    "publish_text",
    "publish_video",
  ],
};

describe(
  "publishing destination provisioning contract",
  () => {
    it(
      "keeps provisioning provider-neutral",
      () => {
        expect(
          PUBLISHING_DESTINATION_PROVISIONING_RESOURCE,
        ).toBe(
          "server_verified_destination_metadata",
        );
      },
    );

    it(
      "keeps provider calls disabled",
      () => {
        expect(
          PUBLISHING_DESTINATION_PROVISIONING_PROVIDER_CALLS_ENABLED,
        ).toBe(false);

        expect(
          publishingDestinationProvisioningCanCallProvider(),
        ).toBe(false);
      },
    );

    it(
      "normalizes safe server-verified destination metadata",
      () => {
        const parsed =
          parsePublishingDestinationProvisionInput(
            validProvisionInput,
          );

        expect(parsed.ok).toBe(true);

        if (!parsed.ok) {
          return;
        }

        expect(parsed.value).toEqual({
          provider:
            "tiktok",
          destinationType:
            "account",
          externalDestinationId:
            "creator-123",
          displayName:
            "LAKUVO Creator",
          capabilities: [
            "publish_text",
            "publish_video",
          ],
        });
      },
    );

    it(
      "rejects unknown fields so credentials and state cannot leak into the contract",
      () => {
        expect(
          parsePublishingDestinationProvisionInput(
            {
              ...validProvisionInput,
              accessToken:
                "secret",
            },
          ).ok,
        ).toBe(false);

        expect(
          parsePublishingDestinationProvisionInput(
            {
              ...validProvisionInput,
              isSelected:
                true,
            },
          ).ok,
        ).toBe(false);

        expect(
          parsePublishingDestinationProvisionInput(
            {
              ...validProvisionInput,
              status:
                "active",
            },
          ).ok,
        ).toBe(false);
      },
    );

    it(
      "rejects duplicate or unknown capabilities",
      () => {
        expect(
          parsePublishingDestinationProvisionInput(
            {
              ...validProvisionInput,
              capabilities: [
                "publish_text",
                "publish_text",
              ],
            },
          ).ok,
        ).toBe(false);

        expect(
          parsePublishingDestinationProvisionInput(
            {
              ...validProvisionInput,
              capabilities: [
                "publish_everything",
              ],
            },
          ).ok,
        ).toBe(false);
      },
    );

    it(
      "rejects invalid provider, destination type, identity, or name",
      () => {
        expect(
          parsePublishingDestinationProvisionInput(
            {
              ...validProvisionInput,
              provider:
                "bad provider!",
            },
          ).ok,
        ).toBe(false);

        expect(
          parsePublishingDestinationProvisionInput(
            {
              ...validProvisionInput,
              destinationType:
                "shop",
            },
          ).ok,
        ).toBe(false);

        expect(
          parsePublishingDestinationProvisionInput(
            {
              ...validProvisionInput,
              externalDestinationId:
                " ",
            },
          ).ok,
        ).toBe(false);

        expect(
          parsePublishingDestinationProvisionInput(
            {
              ...validProvisionInput,
              displayName:
                " ",
            },
          ).ok,
        ).toBe(false);
      },
    );

    it(
      "accepts only an exact destination id for user selection",
      () => {
        const parsed =
          parsePublishingDestinationSelectionInput(
            {
              publishingDestinationId:
                "11111111-1111-4111-8111-111111111111",
            },
          );

        expect(parsed.ok).toBe(true);

        expect(
          parsePublishingDestinationSelectionInput(
            {
              publishingDestinationId:
                "11111111-1111-4111-8111-111111111111",
              provider:
                "tiktok",
            },
          ).ok,
        ).toBe(false);
      },
    );

    it(
      "rejects invalid destination ids for selection",
      () => {
        expect(
          parsePublishingDestinationSelectionInput(
            {
              publishingDestinationId:
                "not-a-uuid",
            },
          ).ok,
        ).toBe(false);
      },
    );
  },
);
