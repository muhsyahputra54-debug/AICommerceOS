import {
  assessPublishingProviderCompatibility,
  type PublishingContentCapability,
  type PublishingProviderCompatibilityResult,
  type PublishingProviderConnection,
  type PublishingProviderExecutionResult,
} from "./publishing-provider-connection";

export const TIKTOK_CREATOR_PROVIDER = "tiktok" as const;

export const TIKTOK_CREATOR_REQUIRED_SCOPE = "video.publish" as const;

export const TIKTOK_CREATOR_DIRECT_POST_CAPABILITIES = [
  "publish_image",
  "publish_video",
] as const satisfies readonly PublishingContentCapability[];

export type TikTokCreatorDirectPostCapability =
  (typeof TIKTOK_CREATOR_DIRECT_POST_CAPABILITIES)[number];

export const TIKTOK_CREATOR_ENDPOINTS = {
  authorize: "https://www.tiktok.com/v2/auth/authorize/",
  token: "https://open.tiktokapis.com/v2/oauth/token/",
  creatorInfo:
    "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
  videoInit:
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
  photoInit:
    "https://open.tiktokapis.com/v2/post/publish/content/init/",
  statusFetch:
    "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
} as const;

export const TIKTOK_PRIVACY_LEVELS = [
  "PUBLIC_TO_EVERYONE",
  "FOLLOWER_OF_CREATOR",
  "MUTUAL_FOLLOW_FRIENDS",
  "SELF_ONLY",
] as const;

export type TikTokPrivacyLevel =
  (typeof TIKTOK_PRIVACY_LEVELS)[number];

export type TikTokCreatorInfoSnapshot = Readonly<{
  checkedAt: string;
  creatorUsername: string;
  creatorNickname: string;
  privacyLevelOptions: readonly TikTokPrivacyLevel[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number;
}>;

export type TikTokCreatorInfoValidationResult =
  | Readonly<{
      ok: true;
      value: TikTokCreatorInfoSnapshot;
    }>
  | Readonly<{
      ok: false;
      code:
        | "invalid_object"
        | "invalid_checked_at"
        | "invalid_creator_identity"
        | "invalid_privacy_options"
        | "invalid_interaction_flags"
        | "invalid_max_video_duration";
    }>;

export type TikTokCreatorConnectionCompatibilityResult =
  | PublishingProviderCompatibilityResult
  | Readonly<{
      compatible: false;
      code: "tiktok_text_only_unsupported";
      missingScopes: readonly [];
    }>;

export type TikTokCreatorDirectPostAssessmentResult =
  | Readonly<{
      ok: true;
    }>
  | Readonly<{
      ok: false;
      code:
        | "explicit_user_consent_required"
        | "creator_info_stale"
        | "creator_identity_mismatch"
        | "privacy_level_unavailable"
        | "comments_not_allowed"
        | "duet_not_allowed"
        | "stitch_not_allowed"
        | "invalid_video_duration"
        | "video_too_long";
    }>;

const PRIVACY_LEVEL_SET =
  new Set<string>(TIKTOK_PRIVACY_LEVELS);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isIsoDateTime(
  value: unknown,
): value is string {
  return (
    isNonEmptyString(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function normalizePrivacyLevels(
  value: unknown,
): readonly TikTokPrivacyLevel[] | null {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every(
      (item) =>
        isNonEmptyString(item) &&
        PRIVACY_LEVEL_SET.has(item),
    )
  ) {
    return null;
  }

  const normalized =
    [...new Set(value as string[])] as TikTokPrivacyLevel[];

  return normalized;
}

export function parseTikTokCreatorInfoSnapshot(
  value: unknown,
): TikTokCreatorInfoValidationResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      code: "invalid_object",
    };
  }

  if (!isIsoDateTime(value.checkedAt)) {
    return {
      ok: false,
      code: "invalid_checked_at",
    };
  }

  if (
    !isNonEmptyString(value.creatorUsername) ||
    !isNonEmptyString(value.creatorNickname)
  ) {
    return {
      ok: false,
      code: "invalid_creator_identity",
    };
  }

  const privacyLevelOptions =
    normalizePrivacyLevels(
      value.privacyLevelOptions,
    );

  if (!privacyLevelOptions) {
    return {
      ok: false,
      code: "invalid_privacy_options",
    };
  }

  if (
    typeof value.commentDisabled !== "boolean" ||
    typeof value.duetDisabled !== "boolean" ||
    typeof value.stitchDisabled !== "boolean"
  ) {
    return {
      ok: false,
      code: "invalid_interaction_flags",
    };
  }

  if (
    typeof value.maxVideoPostDurationSec !== "number" ||
    !Number.isInteger(value.maxVideoPostDurationSec) ||
    value.maxVideoPostDurationSec <= 0
  ) {
    return {
      ok: false,
      code: "invalid_max_video_duration",
    };
  }

  return {
    ok: true,
    value: {
      checkedAt: value.checkedAt,
      creatorUsername:
        value.creatorUsername.trim(),
      creatorNickname:
        value.creatorNickname.trim(),
      privacyLevelOptions,
      commentDisabled:
        value.commentDisabled,
      duetDisabled:
        value.duetDisabled,
      stitchDisabled:
        value.stitchDisabled,
      maxVideoPostDurationSec:
        value.maxVideoPostDurationSec,
    },
  };
}

export function assessTikTokCreatorConnection(
  input: Readonly<{
    connection: PublishingProviderConnection;
    requiredCapability: PublishingContentCapability;
  }>,
): TikTokCreatorConnectionCompatibilityResult {
  if (input.requiredCapability === "publish_text") {
    return {
      compatible: false,
      code: "tiktok_text_only_unsupported",
      missingScopes: [],
    };
  }

  return assessPublishingProviderCompatibility({
    connection: input.connection,
    provider: TIKTOK_CREATOR_PROVIDER,
    requiredCapability: input.requiredCapability,
    requiredScopes: [
      TIKTOK_CREATOR_REQUIRED_SCOPE,
    ],
  });
}

export function assessTikTokCreatorDirectPost(
  input: Readonly<{
    snapshot: TikTokCreatorInfoSnapshot;
    minimumCreatorInfoCheckedAt: string;
    expectedCreatorUsername: string;
    selectedPrivacyLevel: TikTokPrivacyLevel;
    explicitUserConsent: boolean;
    capability: TikTokCreatorDirectPostCapability;
    allowComment: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    videoDurationSec: number | null;
  }>,
): TikTokCreatorDirectPostAssessmentResult {
  if (!input.explicitUserConsent) {
    return {
      ok: false,
      code: "explicit_user_consent_required",
    };
  }

  const checkedAt =
    Date.parse(input.snapshot.checkedAt);

  const minimumCheckedAt =
    Date.parse(input.minimumCreatorInfoCheckedAt);

  if (
    Number.isNaN(minimumCheckedAt) ||
    checkedAt < minimumCheckedAt
  ) {
    return {
      ok: false,
      code: "creator_info_stale",
    };
  }

  if (
    input.snapshot.creatorUsername !==
    input.expectedCreatorUsername
  ) {
    return {
      ok: false,
      code: "creator_identity_mismatch",
    };
  }

  if (
    !input.snapshot.privacyLevelOptions.includes(
      input.selectedPrivacyLevel,
    )
  ) {
    return {
      ok: false,
      code: "privacy_level_unavailable",
    };
  }

  if (
    input.allowComment &&
    input.snapshot.commentDisabled
  ) {
    return {
      ok: false,
      code: "comments_not_allowed",
    };
  }

  if (input.capability === "publish_video") {
    if (
      input.allowDuet &&
      input.snapshot.duetDisabled
    ) {
      return {
        ok: false,
        code: "duet_not_allowed",
      };
    }

    if (
      input.allowStitch &&
      input.snapshot.stitchDisabled
    ) {
      return {
        ok: false,
        code: "stitch_not_allowed",
      };
    }

    if (
      input.videoDurationSec === null ||
      !Number.isFinite(input.videoDurationSec) ||
      input.videoDurationSec <= 0
    ) {
      return {
        ok: false,
        code: "invalid_video_duration",
      };
    }

    if (
      input.videoDurationSec >
      input.snapshot.maxVideoPostDurationSec
    ) {
      return {
        ok: false,
        code: "video_too_long",
      };
    }
  }

  return {
    ok: true,
  };
}

export function normalizeTikTokPublishInitialization(
  publishId: string,
): PublishingProviderExecutionResult {
  if (!isNonEmptyString(publishId)) {
    return {
      status: "reconciliation_required",
      providerRequestId: null,
      providerPublicationId: null,
      errorCode: "missing_publish_id",
      submissionAmbiguous: true,
    };
  }

  return {
    status: "submitted",
    providerRequestId: publishId.trim(),
    providerPublicationId: null,
    errorCode: null,
    submissionAmbiguous: false,
  };
}
