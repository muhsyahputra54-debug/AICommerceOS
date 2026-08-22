import {
  NextResponse,
} from "next/server";

import {
  loadLakuvoTodayWithDailyBriefFromServer,
} from "@/lib/ai/today-daily-brief-runtime";

export async function POST() {
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
  } catch {
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