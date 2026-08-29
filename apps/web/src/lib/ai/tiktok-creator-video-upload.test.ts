import {
  describe,
  expect,
  it,
} from "vitest";

import {
  planTikTokVideoFileUpload,
  TIKTOK_VIDEO_UPLOAD_MAX_BYTES,
} from "./tiktok-creator-video-upload";

describe(
  "TikTok FILE_UPLOAD planner",
  () => {
    it(
      "plans a small file as one whole chunk",
      () => {
        expect(
          planTikTokVideoFileUpload({
            videoSize:
              4_194_304,
            mimeType:
              "video/mp4",
            fileName:
              "demo.mp4",
          }),
        ).toEqual({
          ok: true,
          value: {
            mimeType:
              "video/mp4",
            videoSize:
              4_194_304,
            chunkSize:
              4_194_304,
            totalChunkCount:
              1,
            chunks: [
              {
                index:
                  0,
                firstByte:
                  0,
                lastByte:
                  4_194_303,
                byteLength:
                  4_194_304,
                contentRange:
                  "bytes 0-4194303/4194304",
              },
            ],
          },
        });
      },
    );

    it(
      "plans a larger file into sequential chunks",
      () => {
        const result =
          planTikTokVideoFileUpload({
            videoSize:
              100_000_123,
            mimeType:
              "video/mp4",
            fileName:
              "large.mp4",
          });

        expect(
          result.ok,
        ).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.value.chunkSize,
        ).toBe(
          32_000_000,
        );

        expect(
          result.value.totalChunkCount,
        ).toBe(3);

        expect(
          result.value.chunks.map(
            (chunk) =>
              chunk.byteLength,
          ),
        ).toEqual([
          32_000_000,
          32_000_000,
          36_000_123,
        ]);
      },
    );

    it(
      "accepts MOV by extension when MIME is blank",
      () => {
        const result =
          planTikTokVideoFileUpload({
            videoSize:
              8_000_000,
            mimeType:
              "",
            fileName:
              "demo.mov",
          });

        expect(
          result.ok &&
            result.value.mimeType,
        ).toBe(
          "video/quicktime",
        );
      },
    );

    it(
      "rejects unsupported types",
      () => {
        expect(
          planTikTokVideoFileUpload({
            videoSize:
              8_000_000,
            mimeType:
              "video/x-msvideo",
            fileName:
              "demo.avi",
          }),
        ).toEqual({
          ok: false,
          code:
            "unsupported_media_type",
        });
      },
    );

    it(
      "rejects files above 4 GB",
      () => {
        expect(
          planTikTokVideoFileUpload({
            videoSize:
              TIKTOK_VIDEO_UPLOAD_MAX_BYTES +
              1,
            mimeType:
              "video/mp4",
            fileName:
              "too-large.mp4",
          }),
        ).toEqual({
          ok: false,
          code:
            "video_too_large",
        });
      },
    );
  },
);