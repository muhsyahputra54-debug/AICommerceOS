import { NextResponse } from "next/server";

import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RunRequest = {
  objective?: string;
};

type AgentOutput = {
  summary: string;
  recommendation: string;
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

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unknown AI agent error";
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  const apiKey =
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY belum dikonfigurasi pada server.",
      },
      { status: 503 },
    );
  }

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return NextResponse.json(
      {
        error:
          "Organization aktif tidak ditemukan.",
      },
      { status: 401 },
    );
  }

  const organizationId =
    currentOrganization.organizationId;

  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        error: "Authentication required.",
      },
      { status: 401 },
    );
  }

  const body =
    (await request
      .json()
      .catch(() => ({}))) as RunRequest;

  const objective =
    String(body.objective ?? "").trim();

  if (!objective) {
    return NextResponse.json(
      {
        error: "Agent objective wajib diisi.",
      },
      { status: 400 },
    );
  }

  if (objective.length > 5000) {
    return NextResponse.json(
      {
        error: "Agent objective terlalu panjang.",
      },
      { status: 400 },
    );
  }

  const { id } = await params;

  const {
    data: agent,
    error: agentError,
  } = await supabase
    .from("ai_agents")
    .select(
      "id, name, purpose, provider, model, system_instructions, approved_contexts, is_active",
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (agentError) {
    return NextResponse.json(
      { error: agentError.message },
      { status: 500 },
    );
  }

  if (!agent) {
    return NextResponse.json(
      { error: "AI agent tidak ditemukan." },
      { status: 404 },
    );
  }

  if (!agent.is_active) {
    return NextResponse.json(
      { error: "AI agent sedang inactive." },
      { status: 409 },
    );
  }

  const approvedContexts =
    stringArray(agent.approved_contexts);

  function hasContext(name: string) {
    return approvedContexts.includes(name);
  }

  const [
    productsResult,
    researchResult,
    targetsResult,
    observationsResult,
    rulesResult,
    automationRunsResult,
    actionsResult,
  ] = await Promise.all([
    hasContext("products")
      ? supabase
          .from("products")
          .select(
            "id, name, sku, description, price, cost_price, stock, status",
          )
          .eq("organization_id", organizationId)
          .limit(30)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    hasContext("product_research")
      ? supabase
          .from("product_research_items")
          .select(
            "id, name, category, source_marketplace, observed_price, estimated_cost, demand_score, competition_score, opportunity_score, status, notes",
          )
          .eq("organization_id", organizationId)
          .limit(30)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    hasContext("price_monitoring")
      ? supabase
          .from("price_monitor_targets")
          .select(
            "id, name, product_id, variant_id, source_name, currency, comparison_basis, direction, threshold_percent, is_active",
          )
          .eq("organization_id", organizationId)
          .limit(30)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    hasContext("price_monitoring")
      ? supabase
          .from("price_observations")
          .select(
            "id, target_id, observed_price, internal_price_snapshot, previous_price, change_percent, difference_from_internal_percent, threshold_triggered, observed_at",
          )
          .eq("organization_id", organizationId)
          .order("observed_at", { ascending: false })
          .limit(50)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    hasContext("automation")
      ? supabase
          .from("automation_rules")
          .select(
            "id, name, price_monitor_target_id, pricing_strategy, adjustment_percent, minimum_price, maximum_price, execution_mode, is_active",
          )
          .eq("organization_id", organizationId)
          .limit(30)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    hasContext("automation")
      ? supabase
          .from("automation_runs")
          .select(
            "id, rule_id, status, observed_price_snapshot, internal_price_before, proposed_price, reason, error_message, created_at",
          )
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    hasContext("automation")
      ? supabase
          .from("automation_actions")
          .select(
            "id, rule_id, target_type, product_id, variant_id, before_price, requested_price, applied_price, status, error_message, created_at",
          )
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  const queryError =
    productsResult.error ??
    researchResult.error ??
    targetsResult.error ??
    observationsResult.error ??
    rulesResult.error ??
    automationRunsResult.error ??
    actionsResult.error;

  if (queryError) {
    return NextResponse.json(
      { error: queryError.message },
      { status: 500 },
    );
  }

  const model =
    agent.model?.trim() ||
    process.env.OPENAI_AGENT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-5.6-luna";

  const context = {
    objective,

    approved_contexts: approvedContexts,

    products:
      productsResult.data ?? [],

    product_research:
      researchResult.data ?? [],

    price_monitoring: {
      targets:
        targetsResult.data ?? [],

      observations:
        observationsResult.data ?? [],
    },

    automation: {
      rules:
        rulesResult.data ?? [],

      runs:
        automationRunsResult.data ?? [],

      actions:
        actionsResult.data ?? [],
    },
  };

  const {
    data: runId,
    error: runError,
  } = await supabase.rpc(
    "start_ai_agent_run",
    {
      p_agent_id: agent.id,
      p_objective: objective,
      p_input_context: context,
      p_provider: agent.provider,
      p_model: model,
    },
  );

  if (runError || !runId) {
    return NextResponse.json(
      {
        error:
          runError?.message ??
          "AI agent run tidak dapat dibuat.",
      },
      { status: 500 },
    );
  }

  const {
    error: contextStepError,
  } = await supabase.rpc(
    "append_ai_agent_step",
    {
      p_run_id: runId,
      p_step_type: "context",
      p_tool_name: null,

      p_input_data: {
        approved_contexts: approvedContexts,
      },

      p_output_data: {
        products:
          productsResult.data?.length ?? 0,

        product_research:
          researchResult.data?.length ?? 0,

        price_targets:
          targetsResult.data?.length ?? 0,

        price_observations:
          observationsResult.data?.length ?? 0,

        automation_rules:
          rulesResult.data?.length ?? 0,

        automation_runs:
          automationRunsResult.data?.length ?? 0,

        automation_actions:
          actionsResult.data?.length ?? 0,
      },

      p_status: "completed",
      p_error_message: null,
    },
  );

  if (contextStepError) {
    await supabase.rpc(
      "finish_ai_agent_run",
      {
        p_run_id: runId,
        p_status: "failed",
        p_output_data: null,
        p_summary: null,
        p_recommendation: null,
        p_risks: [],
        p_next_actions: [],
        p_error_message:
          contextStepError.message,
      },
    );

    return NextResponse.json(
      {
        error: contextStepError.message,
      },
      { status: 500 },
    );
  }

  try {
    const response =
      await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json",
          },

          cache: "no-store",

          body: JSON.stringify({
            model,

            messages: [
              {
                role: "system",

                content: [
                  "You are a commerce intelligence agent inside AICommerceOS.",
                  `Agent name: ${agent.name}.`,
                  `Purpose: ${agent.purpose}.`,

                  agent.system_instructions
                    ? `Additional instructions: ${agent.system_instructions}`
                    : "",

                  "",
                  "Analyze only the supplied organization context.",
                  "Do not invent external facts or data.",
                  "Do not claim that you executed any commerce action.",
                  "You have no permission to change products, prices, stock, inventory, orders, order items, automation rules, or automation actions.",
                  "Your role is analysis and recommendation only.",
                  "When a commerce action appears useful, recommend human review or the existing controlled workflow.",
                  "Highlight uncertainty and risks.",
                ]
                  .filter(Boolean)
                  .join("\n"),
              },

              {
                role: "user",
                content:
                  JSON.stringify(context),
              },
            ],

            response_format: {
              type: "json_schema",

              json_schema: {
                name:
                  "commerce_agent_result",

                strict: true,

                schema: {
                  type: "object",

                  additionalProperties:
                    false,

                  properties: {
                    summary: {
                      type: "string",
                    },

                    recommendation: {
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
                    "summary",
                    "recommendation",
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
      (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      throw new Error(
        responseData.error?.message ??
          `OpenAI request failed (${response.status})`,
      );
    }

    const content =
      responseData
        .choices?.[0]
        ?.message
        ?.content;

    if (!content) {
      throw new Error(
        "OpenAI returned no agent output.",
      );
    }

    const result =
      JSON.parse(content) as AgentOutput;

    if (
      !result.summary?.trim() ||
      !result.recommendation?.trim()
    ) {
      throw new Error(
        "AI agent returned incomplete output.",
      );
    }

    const {
      error: analysisStepError,
    } = await supabase.rpc(
      "append_ai_agent_step",
      {
        p_run_id: runId,
        p_step_type: "analysis",
        p_tool_name: null,

        p_input_data: {
          objective,
        },

        p_output_data: {
          summary: result.summary,
        },

        p_status: "completed",
        p_error_message: null,
      },
    );

    if (analysisStepError) {
      throw new Error(
        analysisStepError.message,
      );
    }

    const {
      error: recommendationStepError,
    } = await supabase.rpc(
      "append_ai_agent_step",
      {
        p_run_id: runId,
        p_step_type: "recommendation",
        p_tool_name: null,

        p_input_data: {},

        p_output_data: {
          recommendation:
            result.recommendation,

          risks:
            result.risks,

          next_actions:
            result.next_actions,
        },

        p_status: "completed",
        p_error_message: null,
      },
    );

    if (recommendationStepError) {
      throw new Error(
        recommendationStepError.message,
      );
    }

    const {
      error: finishError,
    } = await supabase.rpc(
      "finish_ai_agent_run",
      {
        p_run_id: runId,
        p_status: "completed",

        p_output_data:
          result,

        p_summary:
          result.summary,

        p_recommendation:
          result.recommendation,

        p_risks:
          result.risks,

        p_next_actions:
          result.next_actions,

        p_error_message:
          null,
      },
    );

    if (finishError) {
      throw new Error(
        finishError.message,
      );
    }

    return NextResponse.json({
      runId,
      status: "completed",
    });
  } catch (error) {
    const message =
      getErrorMessage(error);

    await supabase.rpc(
      "append_ai_agent_step",
      {
        p_run_id: runId,
        p_step_type: "system",
        p_tool_name: null,
        p_input_data: {},
        p_output_data: {},
        p_status: "failed",

        p_error_message:
          message.slice(0, 4000),
      },
    );

    await supabase.rpc(
      "finish_ai_agent_run",
      {
        p_run_id: runId,
        p_status: "failed",
        p_output_data: null,
        p_summary: null,
        p_recommendation: null,
        p_risks: [],
        p_next_actions: [],

        p_error_message:
          message.slice(0, 4000),
      },
    );

    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
