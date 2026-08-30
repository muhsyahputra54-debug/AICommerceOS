import {
  NextResponse,
} from "next/server";

import {
  logServerError,
} from "@/lib/observability/server-logger";

import {
  controlledActionRpcErrorResponse,
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

import {
  projectPublishingProviderConnectionList,
} from "@/lib/ai/publishing-provider-connection-runtime";

export async function GET(
  request: Request,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );
  const context =
    await getControlledActionRequestContext();

  if ("error" in context) {
    return context.error;
  }

  const {
    data,
    error,
  } =
    await context.supabase.rpc(
      "get_publishing_provider_connections",
      {
        p_organization_id:
          context.organizationId,

        p_provider:
          null,
      },
    );

  if (error) {
    logServerError({
      event:
        "ai_publishing_provider_connections_load_failed",
      requestId,
      route:
        "/api/ai/publishing-provider-connections",
      method:
        "GET",
      provider:
        "supabase",
      operation:
        "get_publishing_provider_connections",
      error,
    });

    return controlledActionRpcErrorResponse(
      error.message,
    );
  }

  const connections =
    projectPublishingProviderConnectionList(
      data,
    );

  if (!connections) {
    return NextResponse.json(
      {
        error:
          "Publishing provider connection response tidak valid.",
      },
      {
        status:
          502,
      },
    );
  }

  return NextResponse.json({
    connections,
  });
}