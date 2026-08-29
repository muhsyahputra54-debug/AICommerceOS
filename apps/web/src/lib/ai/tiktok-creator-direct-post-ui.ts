import {
  parseTikTokCreatorInfoSnapshot,
  type TikTokCreatorInfoSnapshot,
  type TikTokPrivacyLevel,
} from "./tiktok-creator-publishing";

export type TikTokCreatorInfoApiParseResult =
  | Readonly<{
      ok: true;
      value: TikTokCreatorInfoSnapshot;
    }>
  | Readonly<{
      ok: false;
    }>;

export type TikTokCreatorPreparationResult =
  | Readonly<{
      ready: true;
    }>
  | Readonly<{
      ready: false;
      code:
        | "privacy_required"
        | "privacy_unavailable"
        | "comments_not_allowed"
        | "duet_not_allowed"
        | "stitch_not_allowed"
        | "commercial_disclosure_selection_required"
        | "explicit_consent_required";
    }>;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function parseTikTokCreatorInfoApiResponse(
  value: unknown,
): TikTokCreatorInfoApiParseResult {
  if (
    !isRecord(value) ||
    !("creatorInfo" in value)
  ) {
    return {
      ok: false,
    };
  }

  const parsed =
    parseTikTokCreatorInfoSnapshot(
      value.creatorInfo,
    );

  if (!parsed.ok) {
    return {
      ok: false,
    };
  }

  return {
    ok: true,
    value:
      parsed.value,
  };
}

export function assessTikTokCreatorPreparation(
  input: Readonly<{
    snapshot: TikTokCreatorInfoSnapshot;
    selectedPrivacyLevel: TikTokPrivacyLevel | "";
    allowComment: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    commercialDisclosureEnabled: boolean;
    ownBrand: boolean;
    brandedContent: boolean;
    explicitUserConsent: boolean;
  }>,
): TikTokCreatorPreparationResult {
  if (!input.selectedPrivacyLevel) {
    return {
      ready: false,
      code:
        "privacy_required",
    };
  }

  if (
    !input.snapshot.privacyLevelOptions.includes(
      input.selectedPrivacyLevel,
    )
  ) {
    return {
      ready: false,
      code:
        "privacy_unavailable",
    };
  }

  if (
    input.allowComment &&
    input.snapshot.commentDisabled
  ) {
    return {
      ready: false,
      code:
        "comments_not_allowed",
    };
  }

  if (
    input.allowDuet &&
    input.snapshot.duetDisabled
  ) {
    return {
      ready: false,
      code:
        "duet_not_allowed",
    };
  }

  if (
    input.allowStitch &&
    input.snapshot.stitchDisabled
  ) {
    return {
      ready: false,
      code:
        "stitch_not_allowed",
    };
  }

  if (
    input.commercialDisclosureEnabled &&
    !input.ownBrand &&
    !input.brandedContent
  ) {
    return {
      ready: false,
      code:
        "commercial_disclosure_selection_required",
    };
  }

  if (!input.explicitUserConsent) {
    return {
      ready: false,
      code:
        "explicit_consent_required",
    };
  }

  return {
    ready: true,
  };
}