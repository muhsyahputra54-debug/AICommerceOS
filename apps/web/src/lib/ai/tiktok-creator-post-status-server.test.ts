import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseTikTokCreatorPostStatusResponse,
} from "./tiktok-creator-direct-post-init-server";

describe(
  "TikTok Creator post status response",
  () => {
    it(
      "parses a completed private Direct Post",
      () => {
        expect(
          parseTikTokCreatorPostStatusResponse({
            data: {
              status: "PUBLISH_COMPLETE",
              fail_reason: "",
              publicaly_available_post_id: [],
              uploaded_bytes: 340000,
            },
            error: { code: "ok" },
          }),
        ).toEqual({
          ok: true,
          value: {
            status: "PUBLISH_COMPLETE",
            failReason: null,
            uploadedBytes: 340000,
          },
        });
      },
    );

    it(
      "parses processing upload",
      () => {
        expect(
          parseTikTokCreatorPostStatusResponse({
            data: {
              status: "PROCESSING_UPLOAD",
              uploaded_bytes: 340000,
            },
            error: { code: "ok" },
          }),
        ).toEqual({
          ok: true,
          value: {
            status: "PROCESSING_UPLOAD",
            failReason: null,
            uploadedBytes: 340000,
          },
        });
      },
    );

    it(
      "preserves a safe failure reason",
      () => {
        expect(
          parseTikTokCreatorPostStatusResponse({
            data: {
              status: "FAILED",
              fail_reason: "file_format_check_failed",
              uploaded_bytes: 340000,
            },
            error: { code: "ok" },
          }),
        ).toEqual({
          ok: true,
          value: {
            status: "FAILED",
            failReason: "file_format_check_failed",
            uploadedBytes: 340000,
          },
        });
      },
    );

    it(
      "returns only provider code on upstream failure",
      () => {
        expect(
          parseTikTokCreatorPostStatusResponse({
            data: {},
            error: { code: "invalid_publish_id" },
          }),
        ).toEqual({
          ok: false,
          providerCode: "invalid_publish_id",
        });
      },
    );
  },
);