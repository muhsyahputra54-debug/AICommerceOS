import { describe, expect, it } from "vitest";

import type { PublishingProviderConnection } from "./publishing-provider-connection";
import {
  TIKTOK_CREATOR_DIRECT_POST_CAPABILITIES,
  TIKTOK_CREATOR_ENDPOINTS,
  TIKTOK_CREATOR_PROVIDER,
  TIKTOK_CREATOR_REQUIRED_SCOPE,
  assessTikTokCreatorConnection,
  assessTikTokCreatorDirectPost,
  normalizeTikTokPublishInitialization,
  parseTikTokCreatorInfoSnapshot,
  type TikTokCreatorInfoSnapshot,
} from "./tiktok-creator-publishing";

const connection: PublishingProviderConnection = {
  version: 1,
  id: "connection-1",
  organizationId: "organization-1",
  provider: "tiktok",
  externalAccountId: "creator-1",
  authorizationStatus: "authorized",
  grantedScopes: ["video.publish"],
  supportedCapabilities: [
    "publish_image",
    "publish_video",
  ],
  credentialReference: {
    kind: "publishing_provider_oauth",
    storage: "server_encrypted",
    referenceId: "credential-reference-1",
    expiresAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
  },
  revokedAt: null,
};

const creatorInfo: TikTokCreatorInfoSnapshot = {
  checkedAt: "2026-08-27T16:00:00.000Z",
  creatorUsername: "creator-1",
  creatorNickname: "Creator One",
  privacyLevelOptions: [
    "PUBLIC_TO_EVERYONE",
    "SELF_ONLY",
  ],
  commentDisabled: false,
  duetDisabled: false,
  stitchDisabled: true,
  maxVideoPostDurationSec: 300,
};

describe("TikTok creator provider contract", () => {
  it("freezes the TikTok creator provider and required publishing scope", () => {
    expect(TIKTOK_CREATOR_PROVIDER).toBe("tiktok");
    expect(TIKTOK_CREATOR_REQUIRED_SCOPE).toBe(
      "video.publish",
    );
  });

  it("supports media capabilities only", () => {
    expect(
      TIKTOK_CREATOR_DIRECT_POST_CAPABILITIES,
    ).toEqual([
      "publish_image",
      "publish_video",
    ]);
  });

  it("freezes current TikTok OAuth and Content Posting endpoints", () => {
    expect(TIKTOK_CREATOR_ENDPOINTS).toEqual({
      authorize:
        "https://www.tiktok.com/v2/auth/authorize/",
      token:
        "https://open.tiktokapis.com/v2/oauth/token/",
      creatorInfo:
        "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
      videoInit:
        "https://open.tiktokapis.com/v2/post/publish/video/init/",
      photoInit:
        "https://open.tiktokapis.com/v2/post/publish/content/init/",
      statusFetch:
        "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
    });
  });
});

describe("parseTikTokCreatorInfoSnapshot", () => {
  it("accepts the provider creator-info fields required by the export flow", () => {
    expect(
      parseTikTokCreatorInfoSnapshot({
        ...creatorInfo,
        privacyLevelOptions: [
          "SELF_ONLY",
          "PUBLIC_TO_EVERYONE",
          "SELF_ONLY",
        ],
      }),
    ).toEqual({
      ok: true,
      value: {
        ...creatorInfo,
        privacyLevelOptions: [
          "SELF_ONLY",
          "PUBLIC_TO_EVERYONE",
        ],
      },
    });
  });

  it("rejects unknown privacy levels", () => {
    expect(
      parseTikTokCreatorInfoSnapshot({
        ...creatorInfo,
        privacyLevelOptions: [
          "PUBLIC_TO_EVERYONE",
          "EVERYONE_WITH_A_LINK",
        ],
      }),
    ).toEqual({
      ok: false,
      code: "invalid_privacy_options",
    });
  });

  it("rejects non-positive video duration privileges", () => {
    expect(
      parseTikTokCreatorInfoSnapshot({
        ...creatorInfo,
        maxVideoPostDurationSec: 0,
      }),
    ).toEqual({
      ok: false,
      code: "invalid_max_video_duration",
    });
  });
});

describe("assessTikTokCreatorConnection", () => {
  it("accepts a creator connection with video.publish and media capability", () => {
    expect(
      assessTikTokCreatorConnection({
        connection,
        requiredCapability: "publish_video",
      }),
    ).toEqual({
      compatible: true,
      missingScopes: [],
    });
  });

  it("rejects text-only direct posting even if a connection advertises it", () => {
    expect(
      assessTikTokCreatorConnection({
        connection: {
          ...connection,
          supportedCapabilities: [
            "publish_text",
            "publish_image",
            "publish_video",
          ],
        },
        requiredCapability: "publish_text",
      }),
    ).toEqual({
      compatible: false,
      code: "tiktok_text_only_unsupported",
      missingScopes: [],
    });
  });

  it("fails closed when video.publish is absent", () => {
    expect(
      assessTikTokCreatorConnection({
        connection: {
          ...connection,
          grantedScopes: [],
        },
        requiredCapability: "publish_image",
      }),
    ).toEqual({
      compatible: false,
      code: "missing_scopes",
      missingScopes: ["video.publish"],
    });
  });
});

describe("assessTikTokCreatorDirectPost", () => {
  const baseInput = {
    snapshot: creatorInfo,
    minimumCreatorInfoCheckedAt:
      "2026-08-27T15:59:00.000Z",
    expectedCreatorUsername: "creator-1",
    selectedPrivacyLevel:
      "PUBLIC_TO_EVERYONE" as const,
    explicitUserConsent: true,
    capability: "publish_video" as const,
    allowComment: true,
    allowDuet: true,
    allowStitch: false,
    videoDurationSec: 120,
  };

  it("accepts a compatible fresh video direct-post snapshot", () => {
    expect(
      assessTikTokCreatorDirectPost(
        baseInput,
      ),
    ).toEqual({
      ok: true,
    });
  });

  it("requires explicit user consent", () => {
    expect(
      assessTikTokCreatorDirectPost({
        ...baseInput,
        explicitUserConsent: false,
      }),
    ).toEqual({
      ok: false,
      code: "explicit_user_consent_required",
    });
  });

  it("rejects creator info older than the caller's required checkpoint", () => {
    expect(
      assessTikTokCreatorDirectPost({
        ...baseInput,
        minimumCreatorInfoCheckedAt:
          "2026-08-27T16:01:00.000Z",
      }),
    ).toEqual({
      ok: false,
      code: "creator_info_stale",
    });
  });

  it("enforces interaction restrictions returned by creator info", () => {
    expect(
      assessTikTokCreatorDirectPost({
        ...baseInput,
        allowStitch: true,
      }),
    ).toEqual({
      ok: false,
      code: "stitch_not_allowed",
    });
  });

  it("rejects videos above the creator's current duration privilege", () => {
    expect(
      assessTikTokCreatorDirectPost({
        ...baseInput,
        videoDurationSec: 301,
      }),
    ).toEqual({
      ok: false,
      code: "video_too_long",
    });
  });

  it("allows photo assessment without video duration or duet/stitch checks", () => {
    expect(
      assessTikTokCreatorDirectPost({
        ...baseInput,
        capability: "publish_image",
        allowDuet: true,
        allowStitch: true,
        videoDurationSec: null,
      }),
    ).toEqual({
      ok: true,
    });
  });
});

describe("normalizeTikTokPublishInitialization", () => {
  it("uses publish_id as the durable provider request identifier", () => {
    expect(
      normalizeTikTokPublishInitialization(
        "publish-id-1",
      ),
    ).toEqual({
      status: "submitted",
      providerRequestId: "publish-id-1",
      providerPublicationId: null,
      errorCode: null,
      submissionAmbiguous: false,
    });
  });

  it("requires reconciliation when publish_id is missing", () => {
    expect(
      normalizeTikTokPublishInitialization(
        "   ",
      ),
    ).toEqual({
      status: "reconciliation_required",
      providerRequestId: null,
      providerPublicationId: null,
      errorCode: "missing_publish_id",
      submissionAmbiguous: true,
    });
  });
});
