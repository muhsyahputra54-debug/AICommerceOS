import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  decryptPublishingProviderToken,
  parsePublishingProviderTokenKeyring,
} from "./tiktok-creator-oauth-server";

import {
  assessTikTokCreatorDirectPost,

  TIKTOK_CREATOR_ENDPOINTS,
  TIKTOK_CREATOR_REQUIRED_SCOPE,
  TIKTOK_PRIVACY_LEVELS,
  type TikTokCreatorInfoSnapshot,
  type TikTokPrivacyLevel,
} from "./tiktok-creator-publishing";

import {
  getTikTokCreatorInfoForOrganization,
  type TikTokCreatorInfoServerErrorCode,
} from "./tiktok-creator-publishing-server";

import {
  planTikTokVideoFileUpload,
  type TikTokVideoUploadPlan,
} from "./tiktok-creator-video-upload";

const DIRECT_POST_INIT_ENABLED_VALUE =
  "true";

const DIRECT_POST_ALL_ORGANIZATIONS_VALUE =
  "*";

const DIRECT_POST_ALLOWED_ORGANIZATION_IDS_ENV =
  "TIKTOK_CREATOR_DIRECT_POST_ALLOWED_ORGANIZATION_IDS";

export function isTikTokCreatorDirectPostEnabledForOrganization(
  organizationId: string,
): boolean {
  if (
    process.env
      .TIKTOK_CREATOR_DIRECT_POST_INIT_ENABLED !==
    DIRECT_POST_INIT_ENABLED_VALUE
  ) {
    return false;
  }

  const normalizedOrganizationId =
    organizationId.trim();

  if (!normalizedOrganizationId) {
    return false;
  }

  const configuredAllowlist =
    process.env[
      DIRECT_POST_ALLOWED_ORGANIZATION_IDS_ENV
    ]?.trim();

  if (!configuredAllowlist) {
    return false;
  }

  const allowedOrganizationIds =
    configuredAllowlist
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

  return (
    allowedOrganizationIds.includes(
      DIRECT_POST_ALL_ORGANIZATIONS_VALUE,
    ) ||
    allowedOrganizationIds.includes(
      normalizedOrganizationId,
    )
  );
}

const MAX_TITLE_LENGTH =
  2200;

export type TikTokCreatorDirectPostInitRequest =
  Readonly<{
    creatorInfoCheckedAt: string;
    expectedCreatorUsername: string;
    title: string;
    selectedPrivacyLevel: TikTokPrivacyLevel;
    explicitUserConsent: boolean;
    allowComment: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    videoDurationSec: number;
    fileName: string;
    mimeType: string;
    videoSize: number;
    ownBrand: boolean;
    brandedContent: boolean;
    isAigc: boolean;
  }>;

export type TikTokCreatorDirectPostInitSuccess =
  Readonly<{
    publishId: string;
    uploadUrl: string;
    creatorInfo: TikTokCreatorInfoSnapshot;
    uploadPlan: TikTokVideoUploadPlan;
  }>;

export type TikTokCreatorDirectPostInitErrorCode =
  | "direct_post_init_disabled"
  | "invalid_request"
  | "commercial_disclosure_invalid"
  | "connection_unavailable"
  | "connection_ambiguous"
  | "scope_missing"
  | "credential_unavailable"
  | "credential_invalid"
  | "token_keyring_unavailable"
  | "token_decryption_failed"
  | "access_token_expired"
  | "creator_info_request_failed"
  | "creator_info_provider_error"
  | "creator_info_response_invalid"
  | "explicit_user_consent_required"
  | "creator_info_stale"
  | "creator_identity_mismatch"
  | "privacy_level_unavailable"
  | "comments_not_allowed"
  | "duet_not_allowed"
  | "stitch_not_allowed"
  | "invalid_video_duration"
  | "video_too_long"
  | "upload_plan_invalid"
  | "direct_post_init_request_failed"
  | "direct_post_init_provider_error"
  | "direct_post_init_response_invalid";

export type TikTokCreatorDirectPostInitResult =
  | Readonly<{
      ok: true;
      value: TikTokCreatorDirectPostInitSuccess;
    }>
  | Readonly<{
      ok: false;
      code: TikTokCreatorDirectPostInitErrorCode;
      providerCode?: string;
    }>;

export type TikTokCreatorDirectPostInitParseResult =
  | Readonly<{
      ok: true;
      value: TikTokCreatorDirectPostInitRequest;
    }>
  | Readonly<{
      ok: false;
      code: "invalid_request";
    }>;

type TikTokDirectPostInitBody =
  Readonly<{
    post_info: Readonly<{
      title: string;
      privacy_level: TikTokPrivacyLevel;
      disable_duet: boolean;
      disable_comment: boolean;
      disable_stitch: boolean;
      brand_content_toggle: boolean;
      brand_organic_toggle: boolean;
      is_aigc: boolean;
    }>;
    source_info: Readonly<{
      source: "FILE_UPLOAD";
      video_size: number;
      chunk_size: number;
      total_chunk_count: number;
    }>;
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

function nonEmptyString(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return null;
  }

  return value.trim();
}

function booleanValue(
  value: unknown,
): boolean | null {
  return typeof value === "boolean"
    ? value
    : null;
}

function finitePositiveNumber(
  value: unknown,
): number | null {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  )
    ? value
    : null;
}

function safePositiveInteger(
  value: unknown,
): number | null {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  )
    ? value
    : null;
}

function privacyLevel(
  value: unknown,
): TikTokPrivacyLevel | null {
  if (
    typeof value !== "string" ||
    !TIKTOK_PRIVACY_LEVELS.includes(
      value as TikTokPrivacyLevel,
    )
  ) {
    return null;
  }

  return value as TikTokPrivacyLevel;
}

function providerErrorCode(
  payload: unknown,
): string | null {
  if (
    !isRecord(payload) ||
    !isRecord(payload.error)
  ) {
    return null;
  }

  return nonEmptyString(
    payload.error.code,
  );
}

function isAllowedUploadUrl(
  value: string,
): boolean {
  let parsed:
    URL;

  try {
    parsed =
      new URL(value);
  } catch {
    return false;
  }

  return (
    parsed.protocol === "https:" &&
    parsed.username === "" &&
    parsed.password === "" &&
    (
      parsed.hostname ===
        "open-upload.tiktokapis.com" ||
      parsed.hostname.endsWith(
        ".tiktokapis.com",
      )
    )
  );
}

export function parseTikTokCreatorDirectPostInitRequest(
  value: unknown,
): TikTokCreatorDirectPostInitParseResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      code: "invalid_request",
    };
  }

  const creatorInfoCheckedAt =
    nonEmptyString(
      value.creatorInfoCheckedAt,
    );

  const expectedCreatorUsername =
    nonEmptyString(
      value.expectedCreatorUsername,
    );

  const title =
    typeof value.title === "string"
      ? value.title.trim()
      : null;

  const selectedPrivacyLevel =
    privacyLevel(
      value.selectedPrivacyLevel,
    );

  const explicitUserConsent =
    booleanValue(
      value.explicitUserConsent,
    );

  const allowComment =
    booleanValue(
      value.allowComment,
    );

  const allowDuet =
    booleanValue(
      value.allowDuet,
    );

  const allowStitch =
    booleanValue(
      value.allowStitch,
    );

  const videoDurationSec =
    finitePositiveNumber(
      value.videoDurationSec,
    );

  const fileName =
    nonEmptyString(
      value.fileName,
    );

  const mimeType =
    typeof value.mimeType === "string"
      ? value.mimeType.trim()
      : null;

  const videoSize =
    safePositiveInteger(
      value.videoSize,
    );

  const ownBrand =
    booleanValue(
      value.ownBrand,
    );

  const brandedContent =
    booleanValue(
      value.brandedContent,
    );

  const isAigc =
    booleanValue(
      value.isAigc,
    );

  if (
    !creatorInfoCheckedAt ||
    Number.isNaN(
      Date.parse(
        creatorInfoCheckedAt,
      ),
    ) ||
    !expectedCreatorUsername ||
    title === null ||
    title.length >
      MAX_TITLE_LENGTH ||
    !selectedPrivacyLevel ||
    explicitUserConsent === null ||
    allowComment === null ||
    allowDuet === null ||
    allowStitch === null ||
    videoDurationSec === null ||
    !fileName ||
    mimeType === null ||
    videoSize === null ||
    ownBrand === null ||
    brandedContent === null ||
    isAigc === null
  ) {
    return {
      ok: false,
      code: "invalid_request",
    };
  }

  return {
    ok: true,
    value: {
      creatorInfoCheckedAt,
      expectedCreatorUsername,
      title,
      selectedPrivacyLevel,
      explicitUserConsent,
      allowComment,
      allowDuet,
      allowStitch,
      videoDurationSec,
      fileName,
      mimeType,
      videoSize,
      ownBrand,
      brandedContent,
      isAigc,
    },
  };
}

export function buildTikTokCreatorDirectPostInitBody(
  input: Readonly<{
    request: TikTokCreatorDirectPostInitRequest;
    uploadPlan: TikTokVideoUploadPlan;
  }>,
): TikTokDirectPostInitBody {
  return {
    post_info: {
      title:
        input.request.title,
      privacy_level:
        input.request.selectedPrivacyLevel,
      disable_duet:
        !input.request.allowDuet,
      disable_comment:
        !input.request.allowComment,
      disable_stitch:
        !input.request.allowStitch,
      brand_content_toggle:
        input.request.brandedContent,
      brand_organic_toggle:
        input.request.ownBrand,
      is_aigc:
        input.request.isAigc,
    },
    source_info: {
      source:
        "FILE_UPLOAD",
      video_size:
        input.uploadPlan.videoSize,
      chunk_size:
        input.uploadPlan.chunkSize,
      total_chunk_count:
        input.uploadPlan.totalChunkCount,
    },
  };
}

export function parseTikTokCreatorDirectPostInitResponse(
  payload: unknown,
): (
  | Readonly<{
      ok: true;
      value: Readonly<{
        publishId: string;
        uploadUrl: string;
      }>;
    }>
  | Readonly<{
      ok: false;
      providerCode?: string;
    }>
) {
  const remoteErrorCode =
    providerErrorCode(
      payload,
    );

  if (
    remoteErrorCode !== "ok" ||
    !isRecord(payload) ||
    !isRecord(payload.data)
  ) {
    return {
      ok: false,
      ...(remoteErrorCode
        ? {
            providerCode:
              remoteErrorCode,
          }
        : {}),
    };
  }

  const publishId =
    nonEmptyString(
      payload.data.publish_id,
    );

  const uploadUrl =
    nonEmptyString(
      payload.data.upload_url,
    );

  if (
    !publishId ||
    publishId.length > 64 ||
    !uploadUrl ||
    uploadUrl.length > 256 ||
    !isAllowedUploadUrl(
      uploadUrl,
    )
  ) {
    return {
      ok: false,
    };
  }

  return {
    ok: true,
    value: {
      publishId,
      uploadUrl,
    },
  };
}

async function loadTikTokCreatorAccessToken(
  input: Readonly<{
    organizationId: string;
    nowMs?: number;
  }>,
): Promise<
  | Readonly<{
      ok: true;
      value: string;
    }>
  | Readonly<{
      ok: false;
      code:
        | "connection_unavailable"
        | "connection_ambiguous"
        | "scope_missing"
        | "credential_unavailable"
        | "credential_invalid"
        | "token_keyring_unavailable"
        | "token_decryption_failed"
        | "access_token_expired";
    }>
> {
  const organizationId =
    nonEmptyString(
      input.organizationId,
    );

  if (!organizationId) {
    return {
      ok: false,
      code: "connection_unavailable",
    };
  }

  let admin;

  try {
    admin =
      createAdminClient();
  } catch {
    return {
      ok: false,
      code: "credential_unavailable",
    };
  }

  const {
    data: rows,
    error,
  } =
    await admin.rpc(
      "get_publishing_provider_execution_credentials",
      {
        p_organization_id:
          organizationId,
        p_provider:
          "tiktok",
      },
    );

  if (
    error ||
    !Array.isArray(rows)
  ) {
    return {
      ok: false,
      code: "credential_unavailable",
    };
  }

  if (rows.length === 0) {
    return {
      ok: false,
      code: "connection_unavailable",
    };
  }

  if (rows.length !== 1) {
    return {
      ok: false,
      code: "connection_ambiguous",
    };
  }

  const row =
    rows[0] as
      Record<string, unknown>;

  const externalAccountId =
    nonEmptyString(
      row.external_account_id,
    );

  const ciphertext =
    nonEmptyString(
      row.access_token_ciphertext,
    );

  const keyVersion =
    nonEmptyString(
      row.encryption_key_version,
    );

  const accessTokenExpiresAt =
    nonEmptyString(
      row.access_token_expires_at,
    );

  const scopes =
    Array.isArray(
      row.granted_scopes,
    ) &&
    row.granted_scopes.every(
      (item) =>
        typeof item === "string",
    )
      ? row.granted_scopes
      : null;

  if (
    !externalAccountId ||
    !ciphertext ||
    !keyVersion ||
    !accessTokenExpiresAt ||
    !scopes
  ) {
    return {
      ok: false,
      code: "credential_invalid",
    };
  }

  if (
    !scopes.includes(
      TIKTOK_CREATOR_REQUIRED_SCOPE,
    )
  ) {
    return {
      ok: false,
      code: "scope_missing",
    };
  }

  const expiresAtMs =
    Date.parse(
      accessTokenExpiresAt,
    );

  const nowMs =
    input.nowMs ??
    Date.now();

  if (
    Number.isNaN(
      expiresAtMs,
    ) ||
    !Number.isFinite(
      nowMs,
    ) ||
    nowMs < 0
  ) {
    return {
      ok: false,
      code: "credential_invalid",
    };
  }

  if (
    expiresAtMs <=
    nowMs
  ) {
    return {
      ok: false,
      code: "access_token_expired",
    };
  }

  const keyring =
    parsePublishingProviderTokenKeyring(
      process.env
        .PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS ??
        "",
      process.env
        .PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_ACTIVE_VERSION ??
        "",
    );

  if (!keyring) {
    return {
      ok: false,
      code: "token_keyring_unavailable",
    };
  }

  const accessToken =
    await decryptPublishingProviderToken(
      {
        ciphertext,
        organizationId,
        externalAccountId,
        tokenKind:
          "access",
        keyVersion,
        keyring,
      },
    );

  if (!accessToken) {
    return {
      ok: false,
      code: "token_decryption_failed",
    };
  }

  return {
    ok: true,
    value:
      accessToken,
  };
}

function creatorInfoErrorCode(
  code: TikTokCreatorInfoServerErrorCode,
): TikTokCreatorDirectPostInitErrorCode {
  return code;
}

export async function initializeTikTokCreatorDirectPost(
  input: Readonly<{
    organizationId: string;
    request: TikTokCreatorDirectPostInitRequest;
    nowMs?: number;
  }>,
  fetchImpl: typeof fetch = fetch,
): Promise<TikTokCreatorDirectPostInitResult> {
  if (
    !isTikTokCreatorDirectPostEnabledForOrganization(
      input.organizationId,
    )
  ) {
    return {
      ok: false,
      code:
        "direct_post_init_disabled",
    };
  }


  const creatorInfo =
    await getTikTokCreatorInfoForOrganization(
      {
        organizationId:
          input.organizationId,
        nowMs:
          input.nowMs,
      },
      fetchImpl,
    );

  if (!creatorInfo.ok) {
    return {
      ok: false,
      code:
        creatorInfoErrorCode(
          creatorInfo.code,
        ),
      ...(creatorInfo.providerCode
        ? {
            providerCode:
              creatorInfo.providerCode,
          }
        : {}),
    };
  }

  const assessment =
    assessTikTokCreatorDirectPost(
      {
        snapshot:
          creatorInfo.value,
        minimumCreatorInfoCheckedAt:
          input.request.creatorInfoCheckedAt,
        expectedCreatorUsername:
          input.request.expectedCreatorUsername,
        selectedPrivacyLevel:
          input.request.selectedPrivacyLevel,
        explicitUserConsent:
          input.request.explicitUserConsent,
        capability:
          "publish_video",
        allowComment:
          input.request.allowComment,
        allowDuet:
          input.request.allowDuet,
        allowStitch:
          input.request.allowStitch,
        videoDurationSec:
          input.request.videoDurationSec,
      },
    );

  if (!assessment.ok) {
    return {
      ok: false,
      code:
        assessment.code,
    };
  }

  const uploadPlan =
    planTikTokVideoFileUpload(
      {
        videoSize:
          input.request.videoSize,
        mimeType:
          input.request.mimeType,
        fileName:
          input.request.fileName,
      },
    );

  if (!uploadPlan.ok) {
    return {
      ok: false,
      code:
        "upload_plan_invalid",
    };
  }

  const accessToken =
    await loadTikTokCreatorAccessToken(
      {
        organizationId:
          input.organizationId,
        nowMs:
          input.nowMs,
      },
    );

  if (!accessToken.ok) {
    return accessToken;
  }

  const body =
    buildTikTokCreatorDirectPostInitBody(
      {
        request:
          input.request,
        uploadPlan:
          uploadPlan.value,
      },
    );

  let response:
    Response;

  try {
    response =
      await fetchImpl(
        TIKTOK_CREATOR_ENDPOINTS.videoInit,
        {
          method:
            "POST",
          headers: {
            Authorization:
              `Bearer ${accessToken.value}`,
            "Content-Type":
              "application/json; charset=UTF-8",
          },
          cache:
            "no-store",
          body:
            JSON.stringify(
              body,
            ),
        },
      );
  } catch {
    return {
      ok: false,
      code:
        "direct_post_init_request_failed",
    };
  }

  let payload:
    unknown;

  try {
    payload =
      await response.json();
  } catch {
    return {
      ok: false,
      code:
        "direct_post_init_response_invalid",
    };
  }

  const parsed =
    parseTikTokCreatorDirectPostInitResponse(
      payload,
    );

  if (!parsed.ok) {
    return {
      ok: false,
      code:
        parsed.providerCode
          ? "direct_post_init_provider_error"
          : "direct_post_init_response_invalid",
      ...(parsed.providerCode
        ? {
            providerCode:
              parsed.providerCode,
          }
        : {}),
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code:
        "direct_post_init_response_invalid",
    };
  }

  return {
    ok: true,
    value: {
      publishId:
        parsed.value.publishId,
      uploadUrl:
        parsed.value.uploadUrl,
      creatorInfo:
        creatorInfo.value,
      uploadPlan:
        uploadPlan.value,
    },
  };
}
export const TIKTOK_CREATOR_POST_STATUSES = [
  "PROCESSING_UPLOAD",
  "PROCESSING_DOWNLOAD",
  "SEND_TO_USER_INBOX",
  "PUBLISH_COMPLETE",
  "FAILED",
] as const;

export type TikTokCreatorPostStatus =
  (typeof TIKTOK_CREATOR_POST_STATUSES)[number];

export type TikTokCreatorPostStatusSnapshot =
  Readonly<{
    status: TikTokCreatorPostStatus;
    failReason: string | null;
    uploadedBytes: number | null;
  }>;

export type TikTokCreatorPostStatusErrorCode =
  | "invalid_publish_id"
  | "connection_unavailable"
  | "connection_ambiguous"
  | "scope_missing"
  | "credential_unavailable"
  | "credential_invalid"
  | "token_keyring_unavailable"
  | "token_decryption_failed"
  | "access_token_expired"
  | "post_status_request_failed"
  | "post_status_provider_error"
  | "post_status_response_invalid";

export function parseTikTokCreatorPostStatusResponse(
  payload: unknown,
):
  | Readonly<{
      ok: true;
      value: TikTokCreatorPostStatusSnapshot;
    }>
  | Readonly<{
      ok: false;
      providerCode?: string;
    }> {
  if (!isRecord(payload)) {
    return { ok: false };
  }

  const remoteErrorCode =
    providerErrorCode(payload);

  if (remoteErrorCode !== "ok") {
    return {
      ok: false,
      ...(remoteErrorCode
        ? { providerCode: remoteErrorCode }
        : {}),
    };
  }

  if (!isRecord(payload.data)) {
    return { ok: false };
  }

  const status =
    nonEmptyString(payload.data.status);

  if (
    !status ||
    !TIKTOK_CREATOR_POST_STATUSES.includes(
      status as TikTokCreatorPostStatus,
    )
  ) {
    return { ok: false };
  }

  const failReasonRaw =
    payload.data.fail_reason;

  const failReason =
    failReasonRaw === undefined ||
    failReasonRaw === null ||
    failReasonRaw === ""
      ? null
      : nonEmptyString(failReasonRaw);

  if (
    failReasonRaw !== undefined &&
    failReasonRaw !== null &&
    failReasonRaw !== "" &&
    !failReason
  ) {
    return { ok: false };
  }

  const uploadedBytesRaw =
    payload.data.uploaded_bytes;

  let uploadedBytes: number | null = null;

  if (
    uploadedBytesRaw !== undefined &&
    uploadedBytesRaw !== null
  ) {
    if (
      typeof uploadedBytesRaw !== "number" ||
      !Number.isSafeInteger(uploadedBytesRaw) ||
      uploadedBytesRaw < 0
    ) {
      return { ok: false };
    }

    uploadedBytes = uploadedBytesRaw;
  }

  return {
    ok: true,
    value: {
      status: status as TikTokCreatorPostStatus,
      failReason,
      uploadedBytes,
    },
  };
}

export async function getTikTokCreatorPostStatusForOrganization(
  input: Readonly<{
    organizationId: string;
    publishId: string;
    nowMs?: number;
  }>,
  fetchImpl: typeof fetch = fetch,
): Promise<
  | Readonly<{
      ok: true;
      value: TikTokCreatorPostStatusSnapshot;
    }>
  | Readonly<{
      ok: false;
      code: TikTokCreatorPostStatusErrorCode;
      providerCode?: string;
    }>
> {
  const publishId =
    nonEmptyString(input.publishId);

  if (!publishId || publishId.length > 64) {
    return {
      ok: false,
      code: "invalid_publish_id",
    };
  }

  const accessToken =
    await loadTikTokCreatorAccessToken({
      organizationId: input.organizationId,
      nowMs: input.nowMs,
    });

  if (!accessToken.ok) {
    return accessToken;
  }

  let response: Response;

  try {
    response = await fetchImpl(
      TIKTOK_CREATOR_ENDPOINTS.statusFetch,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        cache: "no-store",
        body: JSON.stringify({
          publish_id: publishId,
        }),
      },
    );
  } catch {
    return {
      ok: false,
      code: "post_status_request_failed",
    };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      code: "post_status_response_invalid",
    };
  }

  const parsed =
    parseTikTokCreatorPostStatusResponse(payload);

  if (!parsed.ok) {
    return {
      ok: false,
      code: parsed.providerCode
        ? "post_status_provider_error"
        : "post_status_response_invalid",
      ...(parsed.providerCode
        ? { providerCode: parsed.providerCode }
        : {}),
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code: "post_status_response_invalid",
    };
  }

  return {
    ok: true,
    value: parsed.value,
  };
}
