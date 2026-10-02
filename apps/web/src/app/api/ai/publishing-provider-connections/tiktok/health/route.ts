import { NextResponse } from "next/server";
import { getControlledActionRequestContext } from "@/lib/ai/controlled-action-server";
import { assessTikTokConnectionMetadata } from "@/lib/ai/tiktok-creator-connection-health";
import { logServerError } from "@/lib/observability/server-logger";

const ROUTE = "/api/ai/publishing-provider-connections/tiktok/health";
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id");
  const fail = (code: string, status: number) => {
    logServerError({
      event: "ai_tiktok_connection_health_failed", requestId,
      route: ROUTE, method: "GET", provider: "tiktok",
      operation: "read_connection_metadata", error: { code },
    });
    return NextResponse.json({ error: code }, { status, headers });
  };

  try {
    const context = await getControlledActionRequestContext();
    if ("error" in context) {
      if (!context.error) return fail("authentication_context_unavailable", 503);
      // Keep authentication status/body while preventing personalized caching.
      const response = new NextResponse(context.error.body, context.error);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    const { data, error } = await context.supabase.rpc(
      "get_publishing_provider_connections",
      { p_organization_id: context.organizationId, p_provider: "tiktok" },
    );
    if (error) return fail("connection_metadata_unavailable", 503);
    const result = assessTikTokConnectionMetadata(data, context.organizationId);
    if (!result.ok) return fail(result.code, 502);
    return NextResponse.json({ health: result.health }, { headers });
  } catch {
    return fail("connection_metadata_unavailable", 503);
  }
}
