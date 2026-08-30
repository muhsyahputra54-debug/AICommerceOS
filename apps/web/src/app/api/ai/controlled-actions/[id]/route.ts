import { NextResponse } from "next/server";

import {
  logServerError,
} from "@/lib/observability/server-logger";

import {
  parseControlledActionId,
} from "@/lib/ai/controlled-action-api";
import {
  getControlledActionRequestContext,
  readControlledAction,
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
    supabase,
    organizationId,
  } = context;

  const {
    id,
  } =
    await params;

  const actionId =
    parseControlledActionId(
      id,
    );

  if (!actionId) {
    return NextResponse.json(
      {
        error:
          "Controlled action ID tidak valid.",
      },
      {
        status: 400,
      },
    );
  }

  const loaded =
    await readControlledAction(
      supabase,
      organizationId,
      actionId,
    );

  if ("error" in loaded) {
    logServerError({
      event:
        "ai_controlled_action_detail_load_failed",
      requestId,
      route:
        "/api/ai/controlled-actions/[id]",
      method:
        "GET",
      operation:
        "read_controlled_action",
    });

    return loaded.error;
  }

  if ("notFound" in loaded) {
    return NextResponse.json(
      {
        error:
          "Controlled action tidak ditemukan.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    action:
      loaded.action,
  });
}