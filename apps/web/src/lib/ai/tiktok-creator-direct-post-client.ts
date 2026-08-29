import type {
  TikTokPrivacyLevel,
} from "./tiktok-creator-publishing";

import type {
  TikTokVideoUploadPlan,
} from "./tiktok-creator-video-upload";

export const TIKTOK_DIRECT_POST_INIT_API =
  "/api/ai/publishing-provider-connections/tiktok/direct-post/init";

export const TIKTOK_DIRECT_POST_STATUS_API =
  "/api/ai/publishing-provider-connections/tiktok/direct-post/status";

export type TikTokDirectPostClientInitInput =
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

export type TikTokDirectPostClientProgress =
  | Readonly<{
      stage: "initializing";
    }>
  | Readonly<{
      stage: "uploading";
      uploadedBytes: number;
      totalBytes: number;
      completedChunks: number;
      totalChunks: number;
    }>
  | Readonly<{
      stage: "processing";
      attempt: number;
      maxAttempts: number;
      providerStatus: string;
    }>;

export type TikTokDirectPostClientResult =
  | Readonly<{
      ok: true;
      status: "complete";
    }>
  | Readonly<{
      ok: true;
      status: "processing";
      publishId: string;
      providerStatus: string;
    }>
  | Readonly<{
      ok: false;
      stage:
        | "init"
        | "upload"
        | "status";
      code: string;
      providerCode?: string;
      failReason?: string;
      publishId?: string;
    }>;

type InitSuccess =
  Readonly<{
    publishId: string;
    uploadUrl: string;
    uploadPlan: TikTokVideoUploadPlan;
  }>;

type StatusSuccess =
  Readonly<{
    postStatus: string;
    failReason: string | null;
    uploadedBytes: number | null;
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

function safeNonNegativeInteger(
  value: unknown,
): number | null {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  )
    ? value
    : null;
}

export function isAllowedTikTokUploadUrl(
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
    parsed.hostname.endsWith(
      ".tiktokapis.com",
    )
  );
}

function parseUploadPlan(
  value: unknown,
): TikTokVideoUploadPlan | null {
  if (
    !isRecord(value) ||
    typeof value.mimeType !== "string" ||
    !Number.isSafeInteger(value.videoSize) ||
    (value.videoSize as number) <= 0 ||
    !Number.isSafeInteger(value.chunkSize) ||
    (value.chunkSize as number) <= 0 ||
    !Number.isSafeInteger(value.totalChunkCount) ||
    (value.totalChunkCount as number) <= 0 ||
    !Array.isArray(value.chunks)
  ) {
    return null;
  }

  const videoSize =
    value.videoSize as number;

  const chunkSize =
    value.chunkSize as number;

  const totalChunkCount =
    value.totalChunkCount as number;

  if (
    value.chunks.length !==
    totalChunkCount
  ) {
    return null;
  }

  const chunks =
    value.chunks.map(
      (chunk) => {
        if (
          !isRecord(chunk) ||
          !Number.isSafeInteger(chunk.index) ||
          !Number.isSafeInteger(chunk.firstByte) ||
          !Number.isSafeInteger(chunk.lastByte) ||
          !Number.isSafeInteger(chunk.byteLength) ||
          typeof chunk.contentRange !== "string"
        ) {
          return null;
        }

        return {
          index:
            chunk.index as number,
          firstByte:
            chunk.firstByte as number,
          lastByte:
            chunk.lastByte as number,
          byteLength:
            chunk.byteLength as number,
          contentRange:
            chunk.contentRange,
        };
      },
    );

  if (
    chunks.some(
      (chunk) =>
        chunk === null,
    )
  ) {
    return null;
  }

  return {
    mimeType:
      value.mimeType as TikTokVideoUploadPlan["mimeType"],
    videoSize,
    chunkSize,
    totalChunkCount,
    chunks:
      chunks as TikTokVideoUploadPlan["chunks"],
  };
}

function parseInitSuccess(
  value: unknown,
): InitSuccess | null {
  if (!isRecord(value)) {
    return null;
  }

  const publishId =
    nonEmptyString(
      value.publishId,
    );

  const uploadUrl =
    nonEmptyString(
      value.uploadUrl,
    );

  const uploadPlan =
    parseUploadPlan(
      value.uploadPlan,
    );

  if (
    !publishId ||
    !uploadUrl ||
    !isAllowedTikTokUploadUrl(
      uploadUrl,
    ) ||
    !uploadPlan
  ) {
    return null;
  }

  return {
    publishId,
    uploadUrl,
    uploadPlan,
  };
}

function parseErrorResponse(
  value: unknown,
): Readonly<{
  code: string;
  providerCode?: string;
}> {
  if (!isRecord(value)) {
    return {
      code:
        "invalid_error_response",
    };
  }

  const code =
    nonEmptyString(
      value.error,
    ) ??
    "provider_request_failed";

  const providerCode =
    nonEmptyString(
      value.providerCode,
    );

  return {
    code,
    ...(providerCode
      ? {
          providerCode,
        }
      : {}),
  };
}

function parseStatusSuccess(
  value: unknown,
): StatusSuccess | null {
  if (!isRecord(value)) {
    return null;
  }

  const postStatus =
    nonEmptyString(
      value.postStatus,
    );

  if (!postStatus) {
    return null;
  }

  const failReason =
    value.failReason === null ||
    value.failReason === undefined ||
    value.failReason === ""
      ? null
      : nonEmptyString(
          value.failReason,
        );

  if (
    value.failReason !== null &&
    value.failReason !== undefined &&
    value.failReason !== "" &&
    !failReason
  ) {
    return null;
  }

  const uploadedBytes =
    value.uploadedBytes === null ||
    value.uploadedBytes === undefined
      ? null
      : safeNonNegativeInteger(
          value.uploadedBytes,
        );

  if (
    value.uploadedBytes !== null &&
    value.uploadedBytes !== undefined &&
    uploadedBytes === null
  ) {
    return null;
  }

  return {
    postStatus,
    failReason,
    uploadedBytes,
  };
}

export async function uploadTikTokVideoChunks(
  input: Readonly<{
    file: Blob;
    uploadUrl: string;
    uploadPlan: TikTokVideoUploadPlan;
    onProgress?: (
      progress: TikTokDirectPostClientProgress,
    ) => void;
  }>,
  fetchImpl: typeof fetch = fetch,
): Promise<
  | Readonly<{
      ok: true;
    }>
  | Readonly<{
      ok: false;
      code: string;
    }>
> {
  if (
    input.file.size !==
      input.uploadPlan.videoSize ||
    !isAllowedTikTokUploadUrl(
      input.uploadUrl,
    )
  ) {
    return {
      ok: false,
      code:
        "upload_preflight_failed",
    };
  }

  let uploadedBytes =
    0;

  for (
    let index = 0;
    index <
      input.uploadPlan.chunks.length;
    index += 1
  ) {
    const chunk =
      input.uploadPlan.chunks[index];

    const body =
      input.file.slice(
        chunk.firstByte,
        chunk.lastByte + 1,
        input.uploadPlan.mimeType,
      );

    if (
      body.size !==
      chunk.byteLength
    ) {
      return {
        ok: false,
        code:
          "upload_chunk_size_mismatch",
      };
    }

    let response:
      Response;

    try {
      response =
        await fetchImpl(
          input.uploadUrl,
          {
            method:
              "PUT",
            headers: {
              "Content-Type":
                input.uploadPlan.mimeType,
              "Content-Range":
                chunk.contentRange,
            },
            body,
          },
        );
    } catch {
      return {
        ok: false,
        code:
          "upload_request_failed",
      };
    }

    const finalChunk =
      index ===
      input.uploadPlan.chunks.length - 1;

    const expectedStatus =
      finalChunk
        ? 201
        : 206;

    if (
      response.status !==
      expectedStatus
    ) {
      return {
        ok: false,
        code:
          finalChunk
            ? "upload_final_chunk_rejected"
            : "upload_chunk_rejected",
      };
    }

    uploadedBytes +=
      chunk.byteLength;

    input.onProgress?.({
      stage:
        "uploading",
      uploadedBytes,
      totalBytes:
        input.uploadPlan.videoSize,
      completedChunks:
        index + 1,
      totalChunks:
        input.uploadPlan.totalChunkCount,
    });
  }

  return {
    ok: true,
  };
}

export async function fetchTikTokDirectPostStatus(
  publishId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<
  | Readonly<{
      ok: true;
      value: StatusSuccess;
    }>
  | Readonly<{
      ok: false;
      code: string;
      providerCode?: string;
    }>
> {
  let response:
    Response;

  try {
    response =
      await fetchImpl(
        TIKTOK_DIRECT_POST_STATUS_API,
        {
          method:
            "POST",
          credentials:
            "same-origin",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body:
            JSON.stringify({
              publishId,
            }),
        },
      );
  } catch {
    return {
      ok: false,
      code:
        "status_request_failed",
    };
  }

  let body:
    unknown;

  try {
    body =
      await response.json();
  } catch {
    return {
      ok: false,
      code:
        "status_response_invalid",
    };
  }

  if (!response.ok) {
    const error =
      parseErrorResponse(
        body,
      );

    return {
      ok: false,
      ...error,
    };
  }

  const parsed =
    parseStatusSuccess(
      body,
    );

  if (!parsed) {
    return {
      ok: false,
      code:
        "status_response_invalid",
    };
  }

  return {
    ok: true,
    value:
      parsed,
  };
}

export type TikTokDirectPostStatusCheckResult =
  | Readonly<{
      ok: true;
      status: "complete";
    }>
  | Readonly<{
      ok: true;
      status: "processing";
      providerStatus: string;
    }>
  | Readonly<{
      ok: false;
      code: string;
      providerCode?: string;
      failReason?: string;
    }>;

export async function checkTikTokDirectPostStatusOnce(
  publishId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<TikTokDirectPostStatusCheckResult> {
  const status =
    await fetchTikTokDirectPostStatus(
      publishId,
      fetchImpl,
    );

  if (!status.ok) {
    return {
      ok: false,
      code:
        status.code,
      ...(status.providerCode
        ? {
            providerCode:
              status.providerCode,
          }
        : {}),
    };
  }

  if (
    status.value.postStatus ===
    "PUBLISH_COMPLETE"
  ) {
    return {
      ok: true,
      status:
        "complete",
    };
  }

  if (
    status.value.postStatus ===
    "FAILED"
  ) {
    return {
      ok: false,
      code:
        "publish_failed",
      ...(status.value.failReason
        ? {
            failReason:
              status.value.failReason,
          }
        : {}),
    };
  }

  return {
    ok: true,
    status:
      "processing",
    providerStatus:
      status.value.postStatus,
  };
}

function delay(
  milliseconds: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds,
      );
    },
  );
}

export async function executeTikTokCreatorDirectPost(
  input: Readonly<{
    request: TikTokDirectPostClientInitInput;
    file: Blob;
    maxStatusAttempts?: number;
    statusIntervalMs?: number;
    onProgress?: (
      progress: TikTokDirectPostClientProgress,
    ) => void;
  }>,
  dependencies: Readonly<{
    fetchImpl?: typeof fetch;
    sleepImpl?: (
      milliseconds: number,
    ) => Promise<void>;
  }> = {},
): Promise<TikTokDirectPostClientResult> {
  const fetchImpl =
    dependencies.fetchImpl ??
    fetch;

  const sleepImpl =
    dependencies.sleepImpl ??
    delay;

  const maxStatusAttempts =
    input.maxStatusAttempts ??
    20;

  const statusIntervalMs =
    input.statusIntervalMs ??
    3000;

  if (
    !Number.isSafeInteger(
      maxStatusAttempts,
    ) ||
    maxStatusAttempts < 1 ||
    maxStatusAttempts > 20 ||
    !Number.isSafeInteger(
      statusIntervalMs,
    ) ||
    statusIntervalMs < 3000
  ) {
    return {
      ok: false,
      stage:
        "status",
      code:
        "invalid_polling_configuration",
    };
  }

  input.onProgress?.({
    stage:
      "initializing",
  });

  let initResponse:
    Response;

  try {
    initResponse =
      await fetchImpl(
        TIKTOK_DIRECT_POST_INIT_API,
        {
          method:
            "POST",
          credentials:
            "same-origin",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body:
            JSON.stringify(
              input.request,
            ),
        },
      );
  } catch {
    return {
      ok: false,
      stage:
        "init",
      code:
        "init_request_failed",
    };
  }

  let initBody:
    unknown;

  try {
    initBody =
      await initResponse.json();
  } catch {
    return {
      ok: false,
      stage:
        "init",
      code:
        "init_response_invalid",
    };
  }

  if (!initResponse.ok) {
    const error =
      parseErrorResponse(
        initBody,
      );

    return {
      ok: false,
      stage:
        "init",
      ...error,
    };
  }

  const initialized =
    parseInitSuccess(
      initBody,
    );

  if (!initialized) {
    return {
      ok: false,
      stage:
        "init",
      code:
        "init_response_invalid",
    };
  }

  const upload =
    await uploadTikTokVideoChunks(
      {
        file:
          input.file,
        uploadUrl:
          initialized.uploadUrl,
        uploadPlan:
          initialized.uploadPlan,
        onProgress:
          input.onProgress,
      },
      fetchImpl,
    );

  if (!upload.ok) {
    return {
      ok: false,
      stage:
        "upload",
      code:
        upload.code,
    };
  }

  let lastStatus =
    "PROCESSING_UPLOAD";

  for (
    let attempt = 1;
    attempt <=
      maxStatusAttempts;
    attempt += 1
  ) {
    if (attempt > 1) {
      await sleepImpl(
        statusIntervalMs,
      );
    }

    const status =
      await fetchTikTokDirectPostStatus(
        initialized.publishId,
        fetchImpl,
      );

    if (!status.ok) {
      return {
        ok: false,
        stage:
          "status",
        code:
          status.code,
        publishId:
          initialized.publishId,
        ...(status.providerCode
          ? {
              providerCode:
                status.providerCode,
            }
          : {}),
      };
    }

    lastStatus =
      status.value.postStatus;

    if (
      lastStatus ===
      "PUBLISH_COMPLETE"
    ) {
      return {
        ok: true,
        status:
          "complete",
      };
    }

    if (
      lastStatus ===
      "FAILED"
    ) {
      return {
        ok: false,
        stage:
          "status",
        code:
          "publish_failed",
        ...(status.value.failReason
          ? {
              failReason:
                status.value.failReason,
            }
          : {}),
      };
    }

    input.onProgress?.({
      stage:
        "processing",
      attempt,
      maxAttempts:
        maxStatusAttempts,
      providerStatus:
        lastStatus,
    });
  }

  return {
    ok: true,
    status:
      "processing",
    publishId:
      initialized.publishId,
    providerStatus:
      lastStatus,
  };
}