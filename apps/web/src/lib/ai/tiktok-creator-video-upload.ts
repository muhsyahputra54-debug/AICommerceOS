export const TIKTOK_VIDEO_UPLOAD_MAX_BYTES =
  4_000_000_000;

export const TIKTOK_VIDEO_UPLOAD_MAX_CHUNK_BYTES =
  64_000_000;

export const TIKTOK_VIDEO_UPLOAD_PREFERRED_CHUNK_BYTES =
  32_000_000;

export const TIKTOK_VIDEO_UPLOAD_MAX_FINAL_CHUNK_BYTES =
  128_000_000;

export const TIKTOK_VIDEO_UPLOAD_MAX_CHUNKS =
  1000;

export const TIKTOK_VIDEO_UPLOAD_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export type TikTokVideoUploadMimeType =
  (typeof TIKTOK_VIDEO_UPLOAD_MIME_TYPES)[number];

export type TikTokVideoUploadChunk =
  Readonly<{
    index: number;
    firstByte: number;
    lastByte: number;
    byteLength: number;
    contentRange: string;
  }>;

export type TikTokVideoUploadPlan =
  Readonly<{
    mimeType: TikTokVideoUploadMimeType;
    videoSize: number;
    chunkSize: number;
    totalChunkCount: number;
    chunks: readonly TikTokVideoUploadChunk[];
  }>;

export type TikTokVideoUploadPlanResult =
  | Readonly<{
      ok: true;
      value: TikTokVideoUploadPlan;
    }>
  | Readonly<{
      ok: false;
      code:
        | "invalid_size"
        | "video_too_large"
        | "unsupported_media_type"
        | "invalid_chunk_plan";
    }>;

function resolveMimeType(
  mimeType: string,
  fileName: string,
): TikTokVideoUploadMimeType | null {
  const mime =
    mimeType.trim().toLowerCase();

  if (
    TIKTOK_VIDEO_UPLOAD_MIME_TYPES.includes(
      mime as TikTokVideoUploadMimeType,
    )
  ) {
    return mime as TikTokVideoUploadMimeType;
  }

  const name =
    fileName.trim().toLowerCase();

  if (name.endsWith(".mp4")) {
    return "video/mp4";
  }

  if (name.endsWith(".mov")) {
    return "video/quicktime";
  }

  if (name.endsWith(".webm")) {
    return "video/webm";
  }

  return null;
}

export function planTikTokVideoFileUpload(
  input: Readonly<{
    videoSize: number;
    mimeType: string;
    fileName: string;
  }>,
): TikTokVideoUploadPlanResult {
  if (
    !Number.isSafeInteger(input.videoSize) ||
    input.videoSize <= 0
  ) {
    return {
      ok: false,
      code: "invalid_size",
    };
  }

  if (
    input.videoSize >
    TIKTOK_VIDEO_UPLOAD_MAX_BYTES
  ) {
    return {
      ok: false,
      code: "video_too_large",
    };
  }

  const mimeType =
    resolveMimeType(
      input.mimeType,
      input.fileName,
    );

  if (!mimeType) {
    return {
      ok: false,
      code: "unsupported_media_type",
    };
  }

  const chunkSize =
    input.videoSize <=
    TIKTOK_VIDEO_UPLOAD_MAX_CHUNK_BYTES
      ? input.videoSize
      : TIKTOK_VIDEO_UPLOAD_PREFERRED_CHUNK_BYTES;

  const totalChunkCount =
    input.videoSize <=
    TIKTOK_VIDEO_UPLOAD_MAX_CHUNK_BYTES
      ? 1
      : Math.floor(
          input.videoSize /
            chunkSize,
        );

  if (
    totalChunkCount < 1 ||
    totalChunkCount >
      TIKTOK_VIDEO_UPLOAD_MAX_CHUNKS
  ) {
    return {
      ok: false,
      code: "invalid_chunk_plan",
    };
  }

  const chunks:
    TikTokVideoUploadChunk[] =
      [];

  for (
    let index = 0;
    index < totalChunkCount;
    index += 1
  ) {
    const firstByte =
      index * chunkSize;

    const byteLength =
      index ===
      totalChunkCount - 1
        ? input.videoSize -
          firstByte
        : chunkSize;

    if (
      byteLength <= 0 ||
      byteLength >
        TIKTOK_VIDEO_UPLOAD_MAX_FINAL_CHUNK_BYTES
    ) {
      return {
        ok: false,
        code: "invalid_chunk_plan",
      };
    }

    const lastByte =
      firstByte +
      byteLength -
      1;

    chunks.push({
      index,
      firstByte,
      lastByte,
      byteLength,
      contentRange:
        `bytes ${firstByte}-${lastByte}/${input.videoSize}`,
    });
  }

  return {
    ok: true,
    value: {
      mimeType,
      videoSize:
        input.videoSize,
      chunkSize,
      totalChunkCount,
      chunks,
    },
  };
}