import {
  NextResponse,
} from "next/server";

import {
  logServerError,
} from "@/lib/observability/server-logger";

import {
  parseControlledPublicationProposal,
} from "@/lib/ai/controlled-publication";

import {
  parseControlledPublicationChannelProposal,
} from "@/lib/ai/controlled-publication-channel-target";

import {
  parseControlledPublicationListQuery,
  projectControlledPublicationList,
  projectControlledPublicationRpcResult,
} from "@/lib/ai/controlled-publication-api";

import {
  controlledActionRpcErrorResponse,
  getControlledActionRequestContext,
} from "@/lib/ai/controlled-action-server";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

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
    logServerError({
      event:
        "ai_controlled_publication_list_failed",
      requestId,
      route:
        "/api/ai/controlled-publications",
      method:
        "GET",
      provider:
        "supabase",
      operation:
        "list_controlled_publications",
      error,
    });

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
  const requestId =
    request.headers.get(
      "x-request-id",
    );
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

  const hasLegacyIdentity =
    isRecord(rawBody) &&
    Object.prototype.hasOwnProperty.call(
      rawBody,
      "authorizedShopId",
    );

  const hasChannelIdentity =
    isRecord(rawBody) &&
    Object.prototype.hasOwnProperty.call(
      rawBody,
      "publishingDestinationId",
    );

  if (
    hasLegacyIdentity ===
    hasChannelIdentity
  ) {
    return NextResponse.json(
      {
        error:
          "Controlled publication harus memakai tepat satu jenis destination identity.",
      },
      {
        status: 400,
      },
    );
  }

  let data:
    unknown;

  if (hasChannelIdentity) {
    const parsed =
      parseControlledPublicationChannelProposal(
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

    const result =
      await context.supabase.rpc(
        "propose_ai_controlled_publication_channel",
        {
          p_organization_id:
            context.organizationId,

          p_publishing_destination_id:
            parsed.value
              .publishingDestinationId,

          p_proposed_content:
            parsed.value.content,

          p_idempotency_key:
            parsed.value.idempotencyKey,
        },
      );

    if (result.error) {
      logServerError({
        event:
          "ai_controlled_publication_proposal_failed",
        requestId,
        route:
          "/api/ai/controlled-publications",
        method:
          "POST",
        provider:
          "supabase",
        operation:
          "propose_controlled_publication",
        error:
          result.error,
      });

      return controlledActionRpcErrorResponse(
        result.error.message,
      );
    }

    data =
      result.data;
  } else {
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

    const result =
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

    if (result.error) {
      logServerError({
        event:
          "ai_controlled_publication_proposal_failed",
        requestId,
        route:
          "/api/ai/controlled-publications",
        method:
          "POST",
        provider:
          "supabase",
        operation:
          "propose_controlled_publication",
        error:
          result.error,
      });

      return controlledActionRpcErrorResponse(
        result.error.message,
      );
    }

    data =
      result.data;
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
