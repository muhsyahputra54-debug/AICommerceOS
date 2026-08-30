import {
  NextResponse,
} from "next/server";

import {
  logServerError,
} from "@/lib/observability/server-logger";

import {
  parseControlledPublicationId,
  projectControlledPublicationRpcResult,
} from "@/lib/ai/controlled-publication-api";

import {
  controlledActionRpcErrorResponse,
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  {
    params,
  }: RouteContext,
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
    id,
  } =
    await params;

  const publicationId =
    parseControlledPublicationId(
      id,
    );

  if (!publicationId) {
    return NextResponse.json(
      {
        error:
          "Controlled publication ID tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  const {
    data,
    error,
  } =
    await context.supabase.rpc(
      "get_ai_controlled_publication",
      {
        p_organization_id:
          context.organizationId,

        p_publication_id:
          publicationId,
      },
    );

  if (error) {
    logServerError({
      event:
        "ai_controlled_publication_detail_load_failed",
      requestId,
      route:
        "/api/ai/controlled-publications/[id]",
      method:
        "GET",
      provider:
        "supabase",
      operation:
        "get_controlled_publication",
      error,
    });

    return controlledActionRpcErrorResponse(
      error.message,
    );
  }

  if (
    data === null ||
    (
      Array.isArray(data) &&
      data.length === 0
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Controlled publication tidak ditemukan.",
      },
      {
        status: 404,
      },
    );
  }

  const publication =
    projectControlledPublicationRpcResult(
      data,
    );

  if (!publication) {
    return NextResponse.json(
      {
        error:
          "Controlled publication response tidak valid.",
      },
      {
        status: 502,
      },
    );
  }

  return NextResponse.json({
    publication,
  });
}