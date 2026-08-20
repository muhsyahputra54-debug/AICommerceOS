import { NextResponse } from "next/server";

import {
  parseControlledActionId,
} from "@/lib/ai/controlled-action-api";
import {
  controlledActionRpcErrorResponse,
  getControlledActionRequestContext,
  readControlledAction,
} from "@/lib/ai/controlled-action-server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
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
    supabase,
    user,
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

  /*
   * Deliberately execute only.
   *
   * This route NEVER confirms an action.
   * The database executor itself also requires
   * an already-confirmed action by the same requester.
   */
  const {
    error,
  } =
    await supabase.rpc(
      "execute_ai_controlled_action",
      {
        p_action_id:
          actionId,
      },
    );

  if (error) {
    console.error(
      "Failed to execute controlled AI action.",
      {
        organizationId,
        userId:
          user.id,
        actionId,
        error,
      },
    );

    return controlledActionRpcErrorResponse(
      error.message,
    );
  }

  const loaded =
    await readControlledAction(
      supabase,
      organizationId,
      actionId,
    );

  if ("error" in loaded) {
    return loaded.error;
  }

  if ("notFound" in loaded) {
    return NextResponse.json(
      {
        error:
          "Controlled action tidak ditemukan setelah execution.",
      },
      {
        status: 502,
      },
    );
  }

  return NextResponse.json({
    action:
      loaded.action,
  });
}