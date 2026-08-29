import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  executeTikTokCreatorDirectPost,
  isAllowedTikTokUploadUrl,
  uploadTikTokVideoChunks,
} from "./tiktok-creator-direct-post-client";

import type {
  TikTokVideoUploadPlan,
} from "./tiktok-creator-video-upload";

function response(
  status: number,
  body: unknown = {},
): Response {
  return new Response(
    JSON.stringify(
      body,
    ),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
      },
    },
  );
}

const oneChunkPlan:
  TikTokVideoUploadPlan = {
    mimeType:
      "video/mp4",
    videoSize:
      4,
    chunkSize:
      4,
    totalChunkCount:
      1,
    chunks: [
      {
        index:
          0,
        firstByte:
          0,
        lastByte:
          3,
        byteLength:
          4,
        contentRange:
          "bytes 0-3/4",
      },
    ],
  };

describe(
  "TikTok Creator Direct Post client",
  () => {
    it(
      "allows only HTTPS TikTok upload hosts",
      () => {
        expect(
          isAllowedTikTokUploadUrl(
            "https://open-upload-sg.tiktokapis.com/video/?upload_id=1",
          ),
        ).toBe(true);

        expect(
          isAllowedTikTokUploadUrl(
            "https://example.com/upload",
          ),
        ).toBe(false);

        expect(
          isAllowedTikTokUploadUrl(
            "http://open-upload.tiktokapis.com/video/",
          ),
        ).toBe(false);
      },
    );

    it(
      "uploads a whole small video and requires HTTP 201",
      async () => {
        const fetchImpl =
          vi.fn(
            async (
              ..._args: Parameters<typeof fetch>
            ) =>
              new Response(
                null,
                {
                  status:
                    201,
                },
              ),
          );

        const progress =
          vi.fn();

        const result =
          await uploadTikTokVideoChunks(
            {
              file:
                new Blob(
                  [
                    new Uint8Array(
                      [
                        1,
                        2,
                        3,
                        4,
                      ],
                    ),
                  ],
                  {
                    type:
                      "video/mp4",
                  },
                ),
              uploadUrl:
                "https://open-upload-sg.tiktokapis.com/video/?upload_id=1",
              uploadPlan:
                oneChunkPlan,
              onProgress:
                progress,
            },
            fetchImpl as unknown as typeof fetch,
          );

        expect(
          result,
        ).toEqual({
          ok: true,
        });

        expect(
          fetchImpl,
        ).toHaveBeenCalledTimes(
          1,
        );

        const options =
          fetchImpl.mock.calls[0]?.[1] as
            RequestInit;

        expect(
          options.method,
        ).toBe(
          "PUT",
        );

        expect(
          options.headers,
        ).toEqual({
          "Content-Type":
            "video/mp4",
          "Content-Range":
            "bytes 0-3/4",
        });

        expect(
          progress,
        ).toHaveBeenLastCalledWith({
          stage:
            "uploading",
          uploadedBytes:
            4,
          totalBytes:
            4,
          completedChunks:
            1,
          totalChunks:
            1,
        });
      },
    );

    it(
      "rejects a final upload response that is not HTTP 201",
      async () => {
        const result =
          await uploadTikTokVideoChunks(
            {
              file:
                new Blob(
                  [
                    new Uint8Array(
                      [
                        1,
                        2,
                        3,
                        4,
                      ],
                    ),
                  ],
                ),
              uploadUrl:
                "https://open-upload.tiktokapis.com/video/?upload_id=1",
              uploadPlan:
                oneChunkPlan,
            },
            async () =>
              new Response(
                null,
                {
                  status:
                    206,
                },
              ),
          );

        expect(
          result,
        ).toEqual({
          ok: false,
          code:
            "upload_final_chunk_rejected",
        });
      },
    );

    it(
      "stops at init when the server is fail-closed",
      async () => {
        const fetchImpl =
          vi.fn(
            async () =>
              response(
                503,
                {
                  error:
                    "direct_post_init_disabled",
                },
              ),
          );

        const result =
          await executeTikTokCreatorDirectPost(
            {
              request: {
                creatorInfoCheckedAt:
                  "2026-08-29T00:00:00.000Z",
                expectedCreatorUsername:
                  "creator",
                title:
                  "Test",
                selectedPrivacyLevel:
                  "SELF_ONLY",
                explicitUserConsent:
                  true,
                allowComment:
                  false,
                allowDuet:
                  false,
                allowStitch:
                  false,
                videoDurationSec:
                  36,
                fileName:
                  "test.mp4",
                mimeType:
                  "video/mp4",
                videoSize:
                  4,
                ownBrand:
                  false,
                brandedContent:
                  false,
                isAigc:
                  false,
              },
              file:
                new Blob(
                  [
                    new Uint8Array(
                      [
                        1,
                        2,
                        3,
                        4,
                      ],
                    ),
                  ],
                ),
            },
            {
              fetchImpl:
                fetchImpl as unknown as typeof fetch,
            },
          );

        expect(
          result,
        ).toEqual({
          ok: false,
          stage:
            "init",
          code:
            "direct_post_init_disabled",
        });

        expect(
          fetchImpl,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "runs init, upload, and status polling to completion",
      async () => {
        const fetchImpl =
          vi.fn();

        fetchImpl
          .mockResolvedValueOnce(
            response(
              200,
              {
                publishId:
                  "pub-1",
                uploadUrl:
                  "https://open-upload-sg.tiktokapis.com/video/?upload_id=1",
                uploadPlan:
                  oneChunkPlan,
              },
            ),
          )
          .mockResolvedValueOnce(
            new Response(
              null,
              {
                status:
                  201,
              },
            ),
          )
          .mockResolvedValueOnce(
            response(
              200,
              {
                postStatus:
                  "PROCESSING_UPLOAD",
                failReason:
                  null,
                uploadedBytes:
                  4,
              },
            ),
          )
          .mockResolvedValueOnce(
            response(
              200,
              {
                postStatus:
                  "PUBLISH_COMPLETE",
                failReason:
                  null,
                uploadedBytes:
                  null,
              },
            ),
          );

        const sleepImpl =
          vi.fn(
            async () => {},
          );

        const progress =
          vi.fn();

        const result =
          await executeTikTokCreatorDirectPost(
            {
              request: {
                creatorInfoCheckedAt:
                  "2026-08-29T00:00:00.000Z",
                expectedCreatorUsername:
                  "creator",
                title:
                  "Test",
                selectedPrivacyLevel:
                  "SELF_ONLY",
                explicitUserConsent:
                  true,
                allowComment:
                  false,
                allowDuet:
                  false,
                allowStitch:
                  false,
                videoDurationSec:
                  36,
                fileName:
                  "test.mp4",
                mimeType:
                  "video/mp4",
                videoSize:
                  4,
                ownBrand:
                  false,
                brandedContent:
                  false,
                isAigc:
                  false,
              },
              file:
                new Blob(
                  [
                    new Uint8Array(
                      [
                        1,
                        2,
                        3,
                        4,
                      ],
                    ),
                  ],
                  {
                    type:
                      "video/mp4",
                  },
                ),
              maxStatusAttempts:
                2,
              statusIntervalMs:
                3000,
              onProgress:
                progress,
            },
            {
              fetchImpl:
                fetchImpl as unknown as typeof fetch,
              sleepImpl,
            },
          );

        expect(
          result,
        ).toEqual({
          ok: true,
          status:
            "complete",
        });

        expect(
          fetchImpl,
        ).toHaveBeenCalledTimes(
          4,
        );

        expect(
          sleepImpl,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          progress,
        ).toHaveBeenCalledWith({
          stage:
            "initializing",
        });

        expect(
          progress,
        ).toHaveBeenCalledWith({
          stage:
            "processing",
          attempt:
            1,
          maxAttempts:
            2,
          providerStatus:
            "PROCESSING_UPLOAD",
        });
      },
    );
  },
);