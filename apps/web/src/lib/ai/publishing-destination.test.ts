import { describe, expect, it } from "vitest";

import {
  PUBLISHING_DESTINATION_CAPABILITIES,
  PUBLISHING_DESTINATION_RESOURCE,
  PUBLISHING_EXTERNAL_EXECUTION_ENABLED,
  normalizePublishingProvider,
  parsePublishingDestinationRecord,
  publishingDestinationCanExecuteInSg5B1,
  publishingDestinationSupports,
} from "./publishing-destination";

const validRow = {
  id:
    "11111111-1111-4111-8111-111111111111",
  organization_id:
    "22222222-2222-4222-8222-222222222222",
  provider:
    "tiktok",
  destination_type:
    "account",
  external_destination_id:
    "creator-123",
  display_name:
    "LAKUVO Creator",
  status:
    "active",
  capabilities: [
    "publish_video",
  ],
  is_selected:
    true,
  created_at:
    "2026-08-27T00:00:00.000Z",
  updated_at:
    "2026-08-27T00:00:00.000Z",
};

describe(
  "publishing destination foundation",
  () => {
    it(
      "keeps the provider-neutral resource identity stable",
      () => {
        expect(
          PUBLISHING_DESTINATION_RESOURCE,
        ).toBe(
          "publishing_channel_destination",
        );
      },
    );

    it(
      "keeps external execution disabled in SG5-B1",
      () => {
        expect(
          PUBLISHING_EXTERNAL_EXECUTION_ENABLED,
        ).toBe(false);
      },
    );

    it(
      "normalizes safe provider identity",
      () => {
        expect(
          normalizePublishingProvider(
            " TikTok ",
          ),
        ).toBe("tiktok");

        expect(
          normalizePublishingProvider(
            "bad provider!",
          ),
        ).toBeNull();
      },
    );

    it(
      "projects a safe destination record",
      () => {
        const parsed =
          parsePublishingDestinationRecord(
            validRow,
          );

        expect(parsed.ok).toBe(true);

        if (!parsed.ok) {
          return;
        }

        expect(
          parsed.value.provider,
        ).toBe("tiktok");

        expect(
          parsed.value.externalDestinationId,
        ).toBe("creator-123");
      },
    );

    it(
      "rejects duplicate or unknown capabilities",
      () => {
        expect(
          parsePublishingDestinationRecord(
            {
              ...validRow,
              capabilities: [
                "publish_video",
                "publish_video",
              ],
            },
          ).ok,
        ).toBe(false);

        expect(
          parsePublishingDestinationRecord(
            {
              ...validRow,
              capabilities: [
                "publish_everything",
              ],
            },
          ).ok,
        ).toBe(false);
      },
    );

    it(
      "treats capability support as active-and-explicit",
      () => {
        const parsed =
          parsePublishingDestinationRecord(
            validRow,
          );

        if (!parsed.ok) {
          throw new Error(
            parsed.error,
          );
        }

        expect(
          publishingDestinationSupports(
            parsed.value,
            "publish_video",
          ),
        ).toBe(true);

        expect(
          publishingDestinationSupports(
            parsed.value,
            "publish_text",
          ),
        ).toBe(false);

        expect(
          PUBLISHING_DESTINATION_CAPABILITIES,
        ).toEqual([
          "publish_text",
          "publish_image",
          "publish_video",
        ]);
      },
    );

    it(
      "never exposes an executor from the B1 destination contract",
      () => {
        const parsed =
          parsePublishingDestinationRecord(
            validRow,
          );

        if (!parsed.ok) {
          throw new Error(
            parsed.error,
          );
        }

        expect(
          publishingDestinationCanExecuteInSg5B1(
            parsed.value,
          ),
        ).toBe(false);
      },
    );
  },
);