import {
  NextResponse,
} from "next/server";

import {
  logServerError,
} from "@/lib/observability/server-logger";

import {
  loadLakuvoTodayWithDailyBriefFromServer,
} from "@/lib/ai/today-daily-brief-runtime";

export async function POST(
  request: Request,
) {
  const requestId =
    request.headers.get(
      "x-request-id",
    );
  try {
    const snapshot =
      await loadLakuvoTodayWithDailyBriefFromServer();

    if (!snapshot) {
      return NextResponse.json(
        {
          error:
            "Authentication and an active organization are required.",
        },
        {
          status:
            401,
        },
      );
    }

    return NextResponse.json({
      dailyBrief:
        snapshot.dailyBrief,
    });
  } catch (error) {
    logServerError({
      event:
        "ai_today_daily_brief_load_failed",
      requestId,
      route:
        "/api/ai/today/daily-brief",
      method:
        "POST",
      operation:
        "load_today_daily_brief",
      error,
    });

    return NextResponse.json(
      {
        error:
          "AI Daily Brief is temporarily unavailable.",
      },
      {
        status:
          502,
      },
    );
  }
}