import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const requiredEnvironment = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
] as const;

export async function GET() {
  const ready = requiredEnvironment.every(
    (key) => Boolean(process.env[key]?.trim()),
  );

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "aicommerceos-web",
      checks: {
        environment: ready
          ? "ok"
          : "missing_configuration",
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
