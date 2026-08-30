import {
  NextResponse,
} from "next/server";

import {
  logServerError,
} from "@/lib/observability/server-logger";

import {
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

import {
  getTikTokCreatorPostStatusForOrganization,
  type TikTokCreatorPostStatusErrorCode,
} from "@/lib/ai/tiktok-creator-direct-post-init-server";

function errorStatus(
  code: TikTokCreatorPostStatusErrorCode,
): number {
  switch (code) {
    case "invalid_publish_id":
      return 400;

    case "connection_unavailable":
      return 404;

    case "connection_ambiguous":
    case "scope_missing":
    case "access_token_expired":
      return 409;

    case "post_status_request_failed":
    case "post_status_provider_error":
    case "post_status_response_invalid":
      return 502;

    default:
      return 503;
  }
}

export async function POST(
  request: Request,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );
  const context =
    await getControlledActionRequestContext();

  if ("error" in context) {
    if (context.error) {
      return context.error;
    }

    logServerError({
      event:
        "ai_tiktok_direct_post_status_auth_context_unavailable",
      requestId,
      route:
        "/api/ai/publishing-provider-connections/tiktok/direct-post/status",
      method:
        "POST",
      provider:
        "tiktok",
      operation:
        "resolve_authentication_context",
    });

    return NextResponse.json(
      { error: "authentication_context_unavailable" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const publishId =
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    typeof (body as Record<string, unknown>).publishId === "string"
      ? (body as Record<string, string>).publishId
      : "";

  const result =
    await getTikTokCreatorPostStatusForOrganization({
      organizationId: context.organizationId,
      publishId,
    });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.code,
        ...(result.providerCode
          ? { providerCode: result.providerCode }
          : {}),
      },
      {
        status: errorStatus(result.code),
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return NextResponse.json(
    {
      postStatus: result.value.status,
      failReason: result.value.failReason,
      uploadedBytes: result.value.uploadedBytes,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}