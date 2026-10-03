import { NextResponse } from "next/server";
import { getControlledActionRequestContext } from "@/lib/ai/controlled-action-server";
import { coordinateTikTokCreatorRefresh } from "@/lib/ai/tiktok-creator-refresh-coordinator";
import { parsePublishingProviderTokenKeyring } from "@/lib/ai/tiktok-creator-oauth-server";
import { resolveTikTokOAuthAppUrl } from "@/lib/ai/tiktok-creator-oauth-app-url";
import { assessTikTokConnectionMetadata } from "@/lib/ai/tiktok-creator-connection-health";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerError } from "@/lib/observability/server-logger";

export const runtime = "nodejs";
const ROUTE = "/api/ai/publishing-provider-connections/tiktok/refresh";
const headers = { "Cache-Control": "no-store" };
const STAGING_URL = "https://ogqsmnurtbexpvbyrvtn.supabase.co";
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

// Bound streamed input even when Content-Length is absent or dishonest.
async function readBody(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("invalid_body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > 1024) { await reader.cancel(); throw new Error("invalid_body"); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function POST(request: Request) {
  const fail = (code: string, status: number) => {
    logServerError({ event: "ai_tiktok_refresh_failed", requestId: request.headers.get("x-request-id"),
      route: ROUTE, method: "POST", provider: "tiktok", operation: "refresh_creator_credentials", error: { code } });
    return NextResponse.json({ error: code }, { status, headers });
  };
  try {
    const context = await getControlledActionRequestContext();
    if ("error" in context) {
      if (!context.error) return fail("authentication_context_unavailable", 503);
      const response = new NextResponse(context.error.body, context.error);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    // Explicit preview-only staging gate; defaults off, regardless of OAuth configuration.
    if (process.env.TIKTOK_CREATOR_REFRESH_ENABLED !== "true" || process.env.VERCEL_ENV !== "preview" ||
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() !== STAGING_URL) return fail("refresh_disabled", 403);

    const appUrl = resolveTikTokOAuthAppUrl(process.env.LAKUVO_APP_URL);
    if (!appUrl.ok) return fail("refresh_configuration_invalid", 503);
    const origin = appUrl.url.origin;
    const site = request.headers.get("sec-fetch-site");
    if (request.headers.get("origin") !== origin || new URL(request.url).origin !== origin ||
        (site !== null && site !== "same-origin")) return fail("request_origin_invalid", 403);
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return fail("refresh_request_invalid", 400);
    }
    let body: unknown;
    try { body = await readBody(request); } catch { return fail("refresh_request_invalid", 400); }
    if (!isRecord(body) || Object.keys(body).length !== 3 || body.consent !== true ||
        typeof body.connectionId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.connectionId) ||
        typeof body.expectedConnectionVersion !== "number" || !Number.isSafeInteger(body.expectedConnectionVersion) ||
        body.expectedConnectionVersion < 1 || body.expectedConnectionVersion >= Number.MAX_SAFE_INTEGER) {
      return fail("refresh_request_invalid", 400);
    }
    const clientKey = process.env.TIKTOK_CREATOR_CLIENT_KEY?.trim();
    const clientSecret = process.env.TIKTOK_CREATOR_CLIENT_SECRET?.trim();
    const keyring = parsePublishingProviderTokenKeyring(
      process.env.PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS ?? "",
      process.env.PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_ACTIVE_VERSION ?? "",
    );
    if (!clientKey || !clientSecret || !keyring) return fail("refresh_configuration_invalid", 503);

    // The authenticated metadata RPC enforces organization membership. Never take org from body.
    const { data, error } = await context.supabase.rpc("get_publishing_provider_connections", {
      p_organization_id: context.organizationId, p_provider: "tiktok",
    });
    if (error) return fail("connection_metadata_unavailable", 503);
    const assessment = assessTikTokConnectionMetadata(data, context.organizationId);
    if (!assessment.ok || !Array.isArray(data)) return fail("connection_metadata_invalid", 502);
    if (!["access_token_expired", "access_token_expiring_soon"].includes(assessment.health.status)) {
      return fail("refresh_not_available", 409);
    }
    const active = data.filter((row: unknown) => isRecord(row) && row.authorization_status === "authorized" && row.revoked_at === null);
    if (active.length !== 1 || active[0].id !== body.connectionId ||
        active[0].version !== body.expectedConnectionVersion) return fail("refresh_connection_conflict", 409);

    const admin = createAdminClient();
    const result = await coordinateTikTokCreatorRefresh({
      organizationId: context.organizationId, connectionId: body.connectionId,
      expectedConnectionVersion: body.expectedConnectionVersion, clientKey, clientSecret, keyring,
    }, {
      rpc: async (name, args) => {
        const { data, error } = await admin.rpc(name, args);
        return { data, error };
      }, fetchImpl: fetch, now: Date.now,
    });
    if (!result.ok) return fail(result.code, result.code === "refresh_configuration_invalid" ? 503 : 409);
    return NextResponse.json({ refresh: { connectionVersion: result.connectionVersion,
      accessTokenExpiresAt: result.accessTokenExpiresAt } }, { headers });
  } catch {
    return fail("refresh_unavailable", 503);
  }
}
