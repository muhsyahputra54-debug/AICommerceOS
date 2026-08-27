import {
  NextResponse,
} from "next/server";

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
  _request: Request,
  {
    params,
  }: RouteContext,
) {
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