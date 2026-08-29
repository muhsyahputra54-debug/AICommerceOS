import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  TikTokCreatorInfoSnapshot,
} from "./tiktok-creator-publishing";

import {
  assessTikTokCreatorPreparation,
  parseTikTokCreatorInfoApiResponse,
} from "./tiktok-creator-direct-post-ui";

const snapshot: TikTokCreatorInfoSnapshot = {
  checkedAt:
    "2026-08-29T02:42:34.806Z",
  creatorUsername:
    "creator_one",
  creatorNickname:
    "Creator One",
  privacyLevelOptions: [
    "PUBLIC_TO_EVERYONE",
    "MUTUAL_FOLLOW_FRIENDS",
    "SELF_ONLY",
  ],
  commentDisabled:
    false,
  duetDisabled:
    false,
  stitchDisabled:
    false,
  maxVideoPostDurationSec:
    3600,
};

describe(
  "TikTok creator Direct Post preparation UI",
  () => {
    it(
      "parses the safe Creator Info API response",
      () => {
        expect(
          parseTikTokCreatorInfoApiResponse(
            {
              creatorInfo:
                snapshot,
            },
          ),
        ).toEqual(
          {
            ok: true,
            value:
              snapshot,
          },
        );
      },
    );

    it(
      "requires a manual privacy selection",
      () => {
        expect(
          assessTikTokCreatorPreparation(
            {
              snapshot,
              selectedPrivacyLevel:
                "",
              allowComment:
                false,
              allowDuet:
                false,
              allowStitch:
                false,
              commercialDisclosureEnabled:
                false,
              ownBrand:
                false,
              brandedContent:
                false,
              explicitUserConsent:
                true,
            },
          ),
        ).toEqual(
          {
            ready: false,
            code:
              "privacy_required",
          },
        );
      },
    );

    it(
      "requires an explicit TikTok music usage consent",
      () => {
        expect(
          assessTikTokCreatorPreparation(
            {
              snapshot,
              selectedPrivacyLevel:
                "SELF_ONLY",
              allowComment:
                false,
              allowDuet:
                false,
              allowStitch:
                false,
              commercialDisclosureEnabled:
                false,
              ownBrand:
                false,
              brandedContent:
                false,
              explicitUserConsent:
                false,
            },
          ),
        ).toEqual(
          {
            ready: false,
            code:
              "explicit_consent_required",
          },
        );
      },
    );

    it(
      "fails closed when an unavailable interaction is selected",
      () => {
        expect(
          assessTikTokCreatorPreparation(
            {
              snapshot: {
                ...snapshot,
                duetDisabled:
                  true,
              },
              selectedPrivacyLevel:
                "SELF_ONLY",
              allowComment:
                false,
              allowDuet:
                true,
              allowStitch:
                false,
              commercialDisclosureEnabled:
                false,
              ownBrand:
                false,
              brandedContent:
                false,
              explicitUserConsent:
                true,
            },
          ),
        ).toEqual(
          {
            ready: false,
            code:
              "duet_not_allowed",
          },
        );
      },
    );

    it(
      "requires a disclosure choice when commercial content is enabled",
      () => {
        expect(
          assessTikTokCreatorPreparation(
            {
              snapshot,
              selectedPrivacyLevel:
                "SELF_ONLY",
              allowComment:
                false,
              allowDuet:
                false,
              allowStitch:
                false,
              commercialDisclosureEnabled:
                true,
              ownBrand:
                false,
              brandedContent:
                false,
              explicitUserConsent:
                true,
            },
          ),
        ).toEqual(
          {
            ready: false,
            code:
              "commercial_disclosure_selection_required",
          },
        );
      },
    );

    it(
      "becomes ready without choosing interactions by default",
      () => {
        expect(
          assessTikTokCreatorPreparation(
            {
              snapshot,
              selectedPrivacyLevel:
                "SELF_ONLY",
              allowComment:
                false,
              allowDuet:
                false,
              allowStitch:
                false,
              commercialDisclosureEnabled:
                false,
              ownBrand:
                false,
              brandedContent:
                false,
              explicitUserConsent:
                true,
            },
          ),
        ).toEqual(
          {
            ready: true,
          },
        );
      },
    );
  },
);