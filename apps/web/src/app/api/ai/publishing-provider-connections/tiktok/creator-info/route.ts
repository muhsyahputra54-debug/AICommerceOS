import {
  NextResponse,
} from "next/server";

import {
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

import {
  getTikTokCreatorInfoForOrganization,
  type TikTokCreatorInfoServerErrorCode,
} from "@/lib/ai/tiktok-creator-publishing-server";

function errorStatus(
  code: TikTokCreatorInfoServerErrorCode,
): number {
  switch (code) {
    case "connection_unavailable":
      return 404;

    case "connection_ambiguous":
    case "scope_missing":
    case "access_token_expired":
      return 409;

    case "creator_info_provider_error":
    case "creator_info_request_failed":
    case "creator_info_response_invalid":
      return 502;

    default:
      return 503;
  }
}

export async function GET() {
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

  const result =
    await getTikTokCreatorInfoForOrganization(
      {
        organizationId:
          context.organizationId,
      },
    );

  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.code,
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
      creatorInfo:
        result.value,
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