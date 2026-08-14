import { NextResponse } from "next/server";

import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AIAnalysis = {
  demand_score: number;
  competition_score: number;
  opportunity_score: number;
  confidence_score: number;
  recommendation: "watch" | "shortlist" | "approve" | "reject";
  summary: string;
  rationale: string;
  risks: string[];
  next_actions: string[];
};

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown AI error";
}

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY belum dikonfigurasi pada server.",
      },
      { status: 503 },
    );
  }

  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return NextResponse.json(
      { error: "Organization aktif tidak ditemukan." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const organizationId = currentOrganization.organizationId;
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

  const [itemResult, observationsResult] = await Promise.all([
    supabase
      .from("product_research_items")
      .select(
        "id, name, category, source_marketplace, source_url, observed_price, estimated_cost, demand_score, competition_score, opportunity_score, status, notes",
      )
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),

    supabase
      .from("product_research_observations")
      .select(
        "source_name, source_url, observed_price, sold_count, rating, review_count, notes, observed_at",
      )
      .eq("research_item_id", id)
      .eq("organization_id", organizationId)
      .order("observed_at", { ascending: false })
      .limit(20),
  ]);

  if (itemResult.error) {
    return NextResponse.json(
      { error: itemResult.error.message },
      { status: 500 },
    );
  }

  if (!itemResult.data) {
    return NextResponse.json(
      { error: "Research candidate tidak ditemukan." },
      { status: 404 },
    );
  }

  if (observationsResult.error) {
    return NextResponse.json(
      { error: observationsResult.error.message },
      { status: 500 },
    );
  }

  const model =
    process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna";

  const inputSnapshot = {
    candidate: itemResult.data,
    observations: observationsResult.data ?? [],
  };

  const { data: run, error: runError } = await supabase
    .from("product_research_ai_runs")
    .insert({
      organization_id: organizationId,
      research_item_id: id,
      provider: "openai",
      model,
      status: "running",
      input_snapshot: inputSnapshot,
      created_by: user.id,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (runError || !run) {
    return NextResponse.json(
      {
        error:
          runError?.message ??
          "AI research run tidak dapat dibuat.",
      },
      { status: 500 },
    );
  }

  try {
    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: [
                "You are an ecommerce product research analyst.",
                "Analyze only the supplied candidate and observation data.",
                "Do not invent external market facts.",
                "Demand score: 0 means weak evidence, 100 means very strong evidence.",
                "Competition score: 0 means low competition, 100 means extremely competitive.",
                "Opportunity score: 0 means poor opportunity, 100 means excellent opportunity.",
                "Confidence must reflect quality and completeness of supplied evidence.",
                "Recommendation must be watch, shortlist, approve, or reject.",
                "Recommendations are advisory only.",
                "Keep summary and rationale concise and commercially useful.",
                "Risks and next actions must contain concrete short items.",
              ].join("\n"),
            },
            {
              role: "user",
              content: JSON.stringify(inputSnapshot),
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "product_research_analysis",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  demand_score: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                  },
                  competition_score: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                  },
                  opportunity_score: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                  },
                  confidence_score: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                  },
                  recommendation: {
                    type: "string",
                    enum: [
                      "watch",
                      "shortlist",
                      "approve",
                      "reject",
                    ],
                  },
                  summary: {
                    type: "string",
                  },
                  rationale: {
                    type: "string",
                  },
                  risks: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  next_actions: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: [
                  "demand_score",
                  "competition_score",
                  "opportunity_score",
                  "confidence_score",
                  "recommendation",
                  "summary",
                  "rationale",
                  "risks",
                  "next_actions",
                ],
              },
            },
          },
        }),
      },
    );

    const responseData =
      (await aiResponse.json()) as OpenAIResponse;

    if (!aiResponse.ok) {
      throw new Error(
        responseData.error?.message ??
          `OpenAI request failed (${aiResponse.status})`,
      );
    }

    const content =
      responseData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI returned no analysis.");
    }

    const analysis = JSON.parse(content) as AIAnalysis;

    const { error: completionError } = await supabase
      .from("product_research_ai_runs")
      .update({
        status: "completed",
        output_data: analysis,

        ai_demand_score: analysis.demand_score,
        ai_competition_score:
          analysis.competition_score,
        ai_opportunity_score:
          analysis.opportunity_score,

        confidence_score: analysis.confidence_score,

        recommendation: analysis.recommendation,

        summary: analysis.summary,
        rationale: analysis.rationale,

        risks: analysis.risks,
        next_actions: analysis.next_actions,

        error_message: null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("organization_id", organizationId);

    if (completionError) {
      throw new Error(completionError.message);
    }

    return NextResponse.json({
      runId: run.id,
      status: "completed",
    });
  } catch (error) {
    const message = errorMessage(error);

    await supabase
      .from("product_research_ai_runs")
      .update({
        status: "failed",
        error_message: message.slice(0, 4000),
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("organization_id", organizationId);

    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
