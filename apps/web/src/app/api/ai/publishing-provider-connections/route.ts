import {
  NextResponse,
} from "next/server";

import {
  controlledActionRpcErrorResponse,
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

import {
  projectPublishingProviderConnectionList,
} from "@/lib/ai/publishing-provider-connection-runtime";

export async function GET() {
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