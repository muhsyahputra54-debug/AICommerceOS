import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (process.env.VERCEL_ENV !== "production") {
    return NextResponse.json(
      { error: "Not found." },
      { status: 404 },
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

  const eventId = Sentry.captureEvent({
    message:
      "LAKUVO controlled production observability verification",
    level: "error",
    tags: {
      controlled_test: "true",
      component: "observability",
    },
    extra: {
      purpose:
        "Verify production Sentry runtime ingestion.",
    },
  });

  const flushed = await Sentry.flush(2000);

  return NextResponse.json({
    status: "sent",
    eventId,
    flushed,
  });
}
