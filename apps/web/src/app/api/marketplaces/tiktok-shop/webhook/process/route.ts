import { NextResponse } from "next/server";

import {
  decryptMarketplaceSecret,
} from "@/lib/marketplaces/crypto";
import {
  getOrderDetails,
  hasOrderInfoScope,
  isTikTokShopProvider,
  TIKTOK_SHOP_PROVIDER,
} from "@/lib/marketplaces/tiktok-shop";
import {
  getValidTikTokShopAccessToken,
} from "@/lib/marketplaces/token-manager";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type ClaimedWebhookEvent = {
  id: string;
  notification_id: string | null;
  notification_type: number | null;
  external_entity_id: string | null;
  external_status: string | null;
  external_update_time: string | null;
  authorized_shop_id: string;
  attempt_count: number;
};

type OrderSyncContextRow = {
  provider: string;
  connection_status: string;
  authorized_shop_id: string;
  external_shop_id: string;
  shop_cipher_ciphertext: string;
};

function toStoredOrder(
  order: Awaited<
    ReturnType<typeof getOrderDetails>
  >["orders"][number],
) {
  return {
    external_order_id: order.externalOrderId,
    status: order.status,
    create_time: order.createTime,
    update_time: order.updateTime,
    is_sample_order: order.isSampleOrder,
    fulfillment_type: order.fulfillmentType,
    delivery_option_name:
      order.deliveryOptionName,
    payment: {
      currency: order.payment.currency,
      sub_total: order.payment.subTotal,
      shipping_fee:
        order.payment.shippingFee,
      original_shipping_fee:
        order.payment.originalShippingFee,
      seller_discount:
        order.payment.sellerDiscount,
      platform_discount:
        order.payment.platformDiscount,
      total_amount:
        order.payment.totalAmount,
    },
    line_items: order.lineItems.map(
      (item) => ({
        external_line_item_id:
          item.externalLineItemId,
        external_product_id:
          item.externalProductId,
        product_name: item.productName,
        external_sku_id:
          item.externalSkuId,
        sku_name: item.skuName,
        seller_sku: item.sellerSku,
        quantity: item.quantity,
        original_price:
          item.originalPrice,
        sale_price: item.salePrice,
      }),
    ),
  };
}

export async function POST(request: Request) {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return NextResponse.json(
      { error: "Organization aktif tidak ditemukan." },
      { status: 401 },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  let accountId = "";

  try {
    const body = (await request.json()) as {
      account_id?: string;
    };

    accountId = body.account_id?.trim() ?? "";
  } catch {
    return NextResponse.json(
      { error: "Request body tidak valid." },
      { status: 400 },
    );
  }

  if (!accountId) {
    return NextResponse.json(
      { error: "Marketplace account wajib diisi." },
      { status: 400 },
    );
  }

  const { data: account, error: accountError } =
    await supabase
      .from("marketplace_accounts")
      .select("id, provider, status")
      .eq("id", accountId)
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .maybeSingle();

  if (accountError) {
    return NextResponse.json(
      { error: accountError.message },
      { status: 500 },
    );
  }

  if (!account) {
    return NextResponse.json(
      { error: "Marketplace account tidak ditemukan." },
      { status: 404 },
    );
  }

  if (!isTikTokShopProvider(account.provider)) {
    return NextResponse.json(
      {
        error:
          "Provider account ini bukan Tokopedia & Shop connector.",
      },
      { status: 409 },
    );
  }

  const admin = createAdminClient();

  const {
    data: claimedRows,
    error: claimError,
  } = await admin.rpc(
    "claim_marketplace_webhook_events",
    {
      p_organization_id:
        currentOrganization.organizationId,
      p_marketplace_account_id: account.id,
      p_user_id: user.id,
      p_limit: 20,
    },
  );

  if (claimError) {
    return NextResponse.json(
      { error: claimError.message },
      { status: 500 },
    );
  }

  const claimedEvents = Array.isArray(claimedRows)
    ? (claimedRows as ClaimedWebhookEvent[])
    : [];

  if (claimedEvents.length === 0) {
    return NextResponse.json({
      ok: true,
      claimed: 0,
      processed: 0,
      ignored: 0,
      errors: 0,
    });
  }

  const organizationId =
    currentOrganization.organizationId;
  const marketplaceAccountId = account.id;
  const userId = user.id;

  async function complete(
    eventId: string,
    status: "processed" | "ignored" | "error",
    message: string,
  ) {
    const { error } = await admin.rpc(
      "complete_marketplace_webhook_event",
      {
        p_organization_id: organizationId,
        p_marketplace_account_id:
          marketplaceAccountId,
        p_user_id: userId,
        p_event_id: eventId,
        p_status: status,
        p_message: message,
      },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  let ignored = 0;
  let processed = 0;
  let errors = 0;

  // Official notification type 1 is Order Status Change.
  const orderEvents: ClaimedWebhookEvent[] = [];

  for (const event of claimedEvents) {
    if (
      event.notification_type !== 1 ||
      !event.external_entity_id
    ) {
      await complete(
        event.id,
        "ignored",
        "M6 processes only Order Status Change events with an order id.",
      );
      ignored += 1;
      continue;
    }

    orderEvents.push(event);
  }

  if (orderEvents.length === 0) {
    return NextResponse.json({
      ok: true,
      claimed: claimedEvents.length,
      processed,
      ignored,
      errors,
    });
  }

  const {
    data: contextRows,
    error: contextError,
  } = await admin.rpc(
    "get_marketplace_order_sync_context",
    {
      p_organization_id:
        currentOrganization.organizationId,
      p_marketplace_account_id: account.id,
      p_user_id: user.id,
    },
  );

  const context =
    !contextError &&
    Array.isArray(contextRows) &&
    contextRows.length > 0
      ? (contextRows[0] as OrderSyncContextRow)
      : null;

  if (
    !context ||
    context.connection_status !== "active"
  ) {
    for (const event of orderEvents) {
      await complete(
        event.id,
        "error",
        "Active selected shop connection is required for reconciliation.",
      );
      errors += 1;
    }

    return NextResponse.json({
      ok: false,
      claimed: claimedEvents.length,
      processed,
      ignored,
      errors,
      error:
        contextError?.message ??
        "Active selected shop connection is required.",
    });
  }

  let tokenContext: Awaited<
    ReturnType<
      typeof getValidTikTokShopAccessToken
    >
  >;

  try {
    tokenContext =
      await getValidTikTokShopAccessToken({
        organizationId,
        marketplaceAccountId,
        userId,
      });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "TikTok Shop token validation gagal.";

    for (const event of orderEvents) {
      await complete(
        event.id,
        "error",
        message,
      );
      errors += 1;
    }

    return NextResponse.json(
      {
        ok: false,
        claimed: claimedEvents.length,
        processed,
        ignored,
        errors,
        error: message,
      },
      { status: 409 },
    );
  }

  if (
    !hasOrderInfoScope(
      tokenContext.grantedScopes,
    )
  ) {
    for (const event of orderEvents) {
      await complete(
        event.id,
        "error",
        "seller.order.info scope is required.",
      );
      errors += 1;
    }

    return NextResponse.json({
      ok: false,
      claimed: claimedEvents.length,
      processed,
      ignored,
      errors,
      error:
        "seller.order.info scope is required.",
    });
  }

  try {
    const accessToken =
      tokenContext.accessToken;

    const shopCipher =
      decryptMarketplaceSecret(
        context.shop_cipher_ciphertext,
      );

    const eventByOrderId = new Map(
      orderEvents.map((event) => [
        event.external_entity_id as string,
        event,
      ]),
    );

    const result = await getOrderDetails({
      accessToken,
      shopCipher,
      orderIds: Array.from(eventByOrderId.keys()),
    });

    const returnedIds = new Set(
      result.orders.map(
        (order) => order.externalOrderId,
      ),
    );

    if (result.orders.length > 0) {
      const { error: syncError } =
        await admin.rpc(
          "upsert_marketplace_external_order_page",
          {
            p_organization_id:
              currentOrganization.organizationId,
            p_marketplace_account_id:
              account.id,
            p_authorized_shop_id:
              context.authorized_shop_id,
            p_user_id: user.id,
            p_provider: TIKTOK_SHOP_PROVIDER,
            p_orders:
              result.orders.map(toStoredOrder),
            p_request_id:
              result.requestId,
            p_total_count:
              result.orders.length,
            p_has_more: false,
          },
        );

      if (syncError) {
        throw new Error(syncError.message);
      }
    }

    for (const event of orderEvents) {
      if (
        event.external_entity_id &&
        returnedIds.has(event.external_entity_id)
      ) {
        await complete(
          event.id,
          "processed",
          "Order Status Change reconciled from Get Order Detail.",
        );
        processed += 1;
      } else {
        await complete(
          event.id,
          "error",
          "Get Order Detail did not return this order id.",
        );
        errors += 1;
      }
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Webhook reconciliation failed.";

    for (const event of orderEvents) {
      try {
        await complete(
          event.id,
          "error",
          message,
        );
        errors += 1;
      } catch {
        // Preserve original error response if completion fails.
      }
    }

    return NextResponse.json(
      {
        ok: false,
        claimed: claimedEvents.length,
        processed,
        ignored,
        errors,
        error: message,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    token_refreshed: tokenContext.refreshed,
    claimed: claimedEvents.length,
    processed,
    ignored,
    errors,
  });
}
