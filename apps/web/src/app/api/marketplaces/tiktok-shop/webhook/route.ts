import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  TIKTOK_SHOP_PROVIDER,
  verifyTikTokShopWebhookSignature,
} from "@/lib/marketplaces/tiktok-shop";
import { logServerError } from "@/lib/observability/server-logger";
import { createAdminClient } from "@/lib/supabase/admin";

type TikTokShopWebhookPayload = {
  type?: number;
  tts_notification_id?: string;
  shop_id?: string;
  timestamp?: number;
  data?: Record<string, unknown>;
};

function stringValue(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function integerUnixTime(
  value: unknown,
) {
  const numeric = Number(value);

  if (
    !Number.isFinite(numeric) ||
    numeric <= 0
  ) {
    return null;
  }

  return new Date(
    Math.trunc(numeric) * 1000,
  ).toISOString();
}

export async function POST(request: Request) {
  const requestId =
    request.headers.get("x-request-id");

  const rawBody = await request.text();

  let signatureValid = false;

  try {
    signatureValid =
      verifyTikTokShopWebhookSignature({
        rawBody,
        authorizationHeader:
          request.headers.get(
            "authorization",
          ),
      });
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    return new NextResponse(null, {
      status: 401,
    });
  }

  let payload: TikTokShopWebhookPayload;

  try {
    payload = JSON.parse(
      rawBody,
    ) as TikTokShopWebhookPayload;
  } catch {
    return new NextResponse(null, {
      status: 200,
    });
  }

  const shopId =
    stringValue(payload.shop_id);

  if (!shopId) {
    return new NextResponse(null, {
      status: 200,
    });
  }

  const data =
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
      ? payload.data
      : {};

  const notificationId =
    stringValue(
      payload.tts_notification_id,
    );

  const payloadSha256 =
    createHash("sha256")
      .update(rawBody)
      .digest("hex");

  const dedupeKey =
    notificationId || payloadSha256;

  const externalEntityId =
    stringValue(data.order_id) ||
    stringValue(data.product_id) ||
    stringValue(data.package_id) ||
    null;

  const externalStatus =
    stringValue(data.order_status) ||
    stringValue(data.product_status) ||
    stringValue(data.package_status) ||
    stringValue(data.status) ||
    null;

  const externalUpdateTime =
    integerUnixTime(data.update_time);

  const admin = createAdminClient();

  const {
    error: recordError,
  } = await admin.rpc(
    "record_marketplace_webhook_event",
    {
      p_provider:
        TIKTOK_SHOP_PROVIDER,
      p_external_shop_id:
        shopId,
      p_dedupe_key:
        dedupeKey,
      p_notification_id:
        notificationId || null,
      p_notification_type:
        Number.isInteger(payload.type)
          ? payload.type
          : null,
      p_external_entity_id:
        externalEntityId,
      p_external_status:
        externalStatus,
      p_external_update_time:
        externalUpdateTime,
      p_payload_sha256:
        payloadSha256,
      p_metadata: {
        push_timestamp:
          Number.isFinite(
            payload.timestamp,
          )
            ? Number(
                payload.timestamp,
              )
            : null,
      },
    },
  );

  if (recordError) {
    // A valid webhook is acknowledged quickly so provider retries
    // are not amplified by an internal persistence issue.
    logServerError({
      event:
        "marketplace_webhook_persistence_failed",
      requestId,
      route:
        "/api/marketplaces/tiktok-shop/webhook",
      method: "POST",
      provider:
        TIKTOK_SHOP_PROVIDER,
      operation:
        "record_marketplace_webhook_event",
      error: recordError,
    });
  }

  return new NextResponse(null, {
    status: 200,
  });
}
