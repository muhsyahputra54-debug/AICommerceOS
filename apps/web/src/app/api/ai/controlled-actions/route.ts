import { NextResponse } from "next/server";

import {
  parseActionCenterListQuery,
} from "@/lib/ai/action-center-api";
import {
  projectActionCenterItem,
} from "@/lib/ai/action-center-contract";
import {
  extractControlledActionId,
  parseControlledActionProposalInput,
} from "@/lib/ai/controlled-action-api";
import {
  controlledActionRpcErrorResponse,
  getControlledActionRequestContext,
  listControlledActions,
  readControlledAction,
} from "@/lib/ai/controlled-action-server";
import {
  logControlledActionFailure,
} from "@/lib/ai/controlled-action-observability";

export async function GET(
  request: Request,
) {
  const context =
    await getControlledActionRequestContext();

  if ("error" in context) {
    return context.error;
  }

  const {
    supabase,
    organizationId,
  } = context;

  const parsed =
    parseActionCenterListQuery(
      new URL(
        request.url,
      ).searchParams,
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

  const loaded =
    await listControlledActions(
      supabase,
      organizationId,
      parsed.value,
    );

  if ("error" in loaded) {
    return loaded.error;
  }

  const actions =
    loaded.actions.map(
      (action) =>
        projectActionCenterItem(
          action,
        ),
    );

  return NextResponse.json({
    actions,

    pagination: {
      limit:
        parsed.value.limit,

      offset:
        parsed.value.offset,

      status:
        parsed.value.status,

      returned:
        actions.length,
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

  const {
    supabase,
    organizationId,
  } = context;

  const rawBody =
    await request
      .json()
      .catch(
        () => null,
      );

  const parsed =
    parseControlledActionProposalInput(
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
    productId,
    idempotencyKey,
  } = parsed.value;

  const proposalResult =
    parsed.value.actionType ===
    "product.update_name"
      ? await supabase.rpc(
          "propose_ai_controlled_product_name_action",
          {
            p_organization_id:
              organizationId,

            p_product_id:
              productId,

            p_expected_name:
              parsed.value.expectedName,

            p_proposed_name:
              parsed.value.proposedName,

            p_idempotency_key:
              idempotencyKey,
          },
        )
      : parsed.value.actionType ===
          "product.update_status"
        ? await supabase.rpc(
            "propose_ai_controlled_product_status_action",
            {
              p_organization_id:
                organizationId,

              p_product_id:
                productId,

              p_expected_status:
                parsed.value.expectedStatus,

              p_proposed_status:
                parsed.value.proposedStatus,

              p_idempotency_key:
                idempotencyKey,
            },
          )
        : parsed.value.actionType ===
            "product.update_price"
          ? await supabase.rpc(
              "propose_ai_controlled_product_price_action",
              {
                p_organization_id:
                  organizationId,

                p_product_id:
                  productId,

                p_expected_price:
                  parsed.value.expectedPrice,

                p_proposed_price:
                  parsed.value.proposedPrice,

                p_idempotency_key:
                  idempotencyKey,
              },
            )
          : await supabase.rpc(
              "propose_ai_controlled_product_description_action",
              {
                p_organization_id:
                  organizationId,

                p_product_id:
                  productId,

                p_expected_description:
                  parsed.value.expectedDescription,

                p_proposed_description:
                  parsed.value.proposedDescription,

                p_idempotency_key:
                  idempotencyKey,
              },
            );

  const {
    data,
    error,
  } =
    proposalResult;

  if (error) {
    logControlledActionFailure({
      operation:
        "propose",
      requestId,
      error,
    });

    return controlledActionRpcErrorResponse(
      error.message,
    );
  }

  const actionId =
    extractControlledActionId(
      data,
    );

  if (!actionId) {
    return NextResponse.json(
      {
        error:
          "Controlled action proposal response tidak valid.",
      },
      {
        status: 502,
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
    return loaded.error;
  }

  if ("notFound" in loaded) {
    return NextResponse.json(
      {
        error:
          "Controlled action yang baru dibuat tidak dapat dimuat.",
      },
      {
        status: 502,
      },
    );
  }

  return NextResponse.json(
    {
      action:
        loaded.action,
    },
    {
      status: 201,
    },
  );
}
