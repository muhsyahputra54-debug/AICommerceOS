import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildTikTokCreatorDirectPostInitBody,
  initializeTikTokCreatorDirectPost,
  parseTikTokCreatorDirectPostInitRequest,
  parseTikTokCreatorDirectPostInitResponse,
} from "./tiktok-creator-direct-post-init-server";

import {
  planTikTokVideoFileUpload,
} from "./tiktok-creator-video-upload";

const request = {
  creatorInfoCheckedAt:
    "2026-08-29T04:34:29.000Z",
  expectedCreatorUsername:
    "creator_one",
  title:
    "LAKUVO TikTok Direct Post Sandbox Test",
  selectedPrivacyLevel:
    "SELF_ONLY" as const,
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
    "demo.mp4",
  mimeType:
    "video/mp4",
  videoSize:
    340_000,
  ownBrand:
    false,
  brandedContent:
    false,
  isAigc:
    false,
};

afterEach(
  () => {
    delete process.env
      .TIKTOK_CREATOR_DIRECT_POST_INIT_ENABLED;
  },
);

describe(
  "TikTok Creator Direct Post init server",
  () => {
    it(
      "parses a complete init request",
      () => {
        expect(
          parseTikTokCreatorDirectPostInitRequest(
            request,
          ),
        ).toEqual({
          ok: true,
          value:
            request,
        });
      },
    );

    it(
      "rejects a request without explicit boolean consent",
      () => {
        expect(
          parseTikTokCreatorDirectPostInitRequest({
            ...request,
            explicitUserConsent:
              "true",
          }),
        ).toEqual({
          ok: false,
          code:
            "invalid_request",
        });
      },
    );

    it(
      "builds FILE_UPLOAD Direct Post metadata",
      () => {
        const plan =
          planTikTokVideoFileUpload({
            videoSize:
              request.videoSize,
            mimeType:
              request.mimeType,
            fileName:
              request.fileName,
          });

        expect(
          plan.ok,
        ).toBe(true);

        if (!plan.ok) {
          return;
        }

        expect(
          buildTikTokCreatorDirectPostInitBody({
            request,
            uploadPlan:
              plan.value,
          }),
        ).toEqual({
          post_info: {
            title:
              request.title,
            privacy_level:
              "SELF_ONLY",
            disable_duet:
              true,
            disable_comment:
              true,
            disable_stitch:
              true,
            brand_content_toggle:
              false,
            brand_organic_toggle:
              false,
            is_aigc:
              false,
          },
          source_info: {
            source:
              "FILE_UPLOAD",
            video_size:
              request.videoSize,
            chunk_size:
              request.videoSize,
            total_chunk_count:
              1,
          },
        });
      },
    );

    it(
      "parses publish_id and an allowed TikTok upload_url",
      () => {
        expect(
          parseTikTokCreatorDirectPostInitResponse({
            data: {
              publish_id:
                "v_pub_file~v2-1.123",
              upload_url:
                "https://open-upload.tiktokapis.com/video/?upload_id=123&upload_token=test",
            },
            error: {
              code:
                "ok",
            },
          }),
        ).toEqual({
          ok: true,
          value: {
            publishId:
              "v_pub_file~v2-1.123",
            uploadUrl:
              "https://open-upload.tiktokapis.com/video/?upload_id=123&upload_token=test",
          },
        });
      },
    );

    it(
      "rejects a non-TikTok upload host",
      () => {
        expect(
          parseTikTokCreatorDirectPostInitResponse({
            data: {
              publish_id:
                "v_pub_file~v2-1.123",
              upload_url:
                "https://example.com/upload",
            },
            error: {
              code:
                "ok",
            },
          }),
        ).toEqual({
          ok: false,
        });
      },
    );

    it(
      "fails closed before DB or TikTok access while feature flag is off",
      async () => {
        delete process.env
          .TIKTOK_CREATOR_DIRECT_POST_INIT_ENABLED;

        const fetchImpl =
          vi.fn();

        const result =
          await initializeTikTokCreatorDirectPost(
            {
              organizationId:
                "00000000-0000-0000-0000-000000000001",
              request,
            },
            fetchImpl as unknown as typeof fetch,
          );

        expect(
          result,
        ).toEqual({
          ok: false,
          code:
            "direct_post_init_disabled",
        });

        expect(
          fetchImpl,
        ).not.toHaveBeenCalled();
      },
    );
  },
);