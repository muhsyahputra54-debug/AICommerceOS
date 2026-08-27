import {
  NextResponse,
} from "next/server";

import {
  parseControlledPublicationProposal,
} from "@/lib/ai/controlled-publication";

import {
  parseControlledPublicationListQuery,
  projectControlledPublicationList,
  projectControlledPublicationRpcResult,
} from "@/lib/ai/controlled-publication-api";

import {
  controlledActionRpcErrorResponse,
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

export async function GET(
  request: Request,
) {
  const context =
    await getControlledActionRequestContext();

  if ("error" in context) {
    return context.error;
  }

  const query =
    parseControlledPublicationListQuery(
      new URL(
        request.url,
      ).searchParams,
    );

  if (!query.ok) {
    return NextResponse.json(
      {
        error:
          query.error,
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
      "get_ai_controlled_publications",
      {
        p_organization_id:
          context.organizationId,

        p_limit:
          query.value.limit,

        p_offset:
          query.value.offset,

        p_status:
          query.value.status,
      },
    );

  if (error) {
    return controlledActionRpcErrorResponse(
      error.message,
    );
  }

  const publications =
    projectControlledPublicationList(
      data,
    );

  if (!publications) {
    return NextResponse.json(
      {
        error:
          "Controlled publication list response tidak valid.",
      },
      {
        status: 502,
      },
    );
  }

  return NextResponse.json({
    publications,

    pagination: {
      limit:
        query.value.limit,

      offset:
        query.value.offset,

      status:
        query.value.status,

      returned:
        publications.length,
    },
  });
}

export async function POST(
  request: Request,
) {
  const context =
    await getControlledActionRequestContext();

  if ("error" in context) {
    return context.error;
  }

  const rawBody =
    await request
      .json()
      .catch(
        () => null,
      );

  const parsed =
    parseControlledPublicationProposal(
      rawBody,
    );

  if (!parsed.ok) {
    return NextResponse.json(
      {
        error:
          parsed.error,
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
      "propose_ai_controlled_publication",
      {
        p_organization_id:
          context.organizationId,

        p_authorized_shop_id:
          parsed.value.authorizedShopId,

        p_proposed_content:
          parsed.value.content,

        p_idempotency_key:
          parsed.value.idempotencyKey,
      },
    );

  if (error) {
    return controlledActionRpcErrorResponse(
      error.message,
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
          "Controlled publication proposal response tidak valid.",
      },
      {
        status: 502,
      },
    );
  }

  return NextResponse.json(
    {
      publication,
    },
    {
      status: 201,
    },
  );
}