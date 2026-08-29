import {
  NextResponse,
} from "next/server";

import {
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

import {
  initializeTikTokCreatorDirectPost,
  parseTikTokCreatorDirectPostInitRequest,
  type TikTokCreatorDirectPostInitErrorCode,
} from "@/lib/ai/tiktok-creator-direct-post-init-server";

function errorStatus(
  code: TikTokCreatorDirectPostInitErrorCode,
): number {
  switch (code) {
    case "invalid_request":
      return 400;

    case "connection_unavailable":
      return 404;

    case "direct_post_init_disabled":
      return 503;

    case "connection_ambiguous":
    case "scope_missing":
    case "access_token_expired":
    case "explicit_user_consent_required":
    case "creator_info_stale":
    case "creator_identity_mismatch":
    case "privacy_level_unavailable":
    case "comments_not_allowed":
    case "duet_not_allowed":
    case "stitch_not_allowed":
    case "invalid_video_duration":
    case "video_too_long":
    case "upload_plan_invalid":
    case "commercial_disclosure_invalid":
      return 409;

    case "creator_info_request_failed":
    case "creator_info_provider_error":
    case "creator_info_response_invalid":
    case "direct_post_init_request_failed":
    case "direct_post_init_provider_error":
    case "direct_post_init_response_invalid":
      return 502;

    default:
      return 503;
  }
}

export async function POST(
  request: Request,
) {
  const context =
    await getControlledActionRequestContext();

  if ("error" in context) {
    if (context.error) {
      return context.error;
    }

    return NextResponse.json(
      {
        error:
          "authentication_context_unavailable",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  let body:
    unknown;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "invalid_request",
      },
      {
        status: 400,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const parsed =
    parseTikTokCreatorDirectPostInitRequest(
      body,
    );

  if (!parsed.ok) {
    return NextResponse.json(
      {
        error:
          parsed.code,
      },
      {
        status: 400,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const result =
    await initializeTikTokCreatorDirectPost(
      {
        organizationId:
          context.organizationId,
        request:
          parsed.value,
      },
    );

  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.code,
        ...(result.providerCode
          ? {
              providerCode:
                result.providerCode,
            }
          : {}),
      },
      {
        status:
          errorStatus(
            result.code,
          ),
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    {
      publishId:
        result.value.publishId,
      uploadUrl:
        result.value.uploadUrl,
      creatorInfo:
        result.value.creatorInfo,
      uploadPlan:
        result.value.uploadPlan,
    },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}