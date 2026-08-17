import { logServerError } from "@/lib/observability/server-logger";
import { createAdminClient } from "@/lib/supabase/admin";

export type OpenAIChatUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
    cache_write_tokens?: number;
  };
};

export type OpenAIChatResponseMetadata = {
  id?: string;
  model?: string;
  usage?: OpenAIChatUsage;
};

export type AiAllowance = {
  allowed: boolean;
  reason: string;
  creditBalance: number;
  monthEstimatedCostUsd: number;
  monthlyCostLimitUsd: number | null;
};

type AllowanceRow = {
  allowed?: boolean;
  reason?: string;
  credit_balance?: number | string | null;
  month_estimated_cost_usd?: number | string | null;
  monthly_cost_limit_usd?: number | string | null;
};

type RecordUsageRow = {
  usage_id?: string;
  estimated_cost_usd?: number | string | null;
  pricing_found?: boolean;
};

function nonNegativeInteger(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return 0;
  }

  return Math.floor(number);
}

function finiteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function nullableFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function checkAiAllowance(
  organizationId: string,
): Promise<AiAllowance> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc(
    "check_ai_allowance",
    {
      p_organization_id: organizationId,
    },
  );

  if (error) {
    throw new Error(
      `AI allowance check failed: ${error.message}`,
    );
  }

  const row = (
    Array.isArray(data) ? data[0] : data
  ) as AllowanceRow | null;

  if (!row) {
    throw new Error(
      "AI allowance check returned no result.",
    );
  }

  return {
    allowed: row.allowed === true,
    reason: String(row.reason ?? "unknown"),
    creditBalance: finiteNumber(row.credit_balance),
    monthEstimatedCostUsd:
      finiteNumber(row.month_estimated_cost_usd),
    monthlyCostLimitUsd:
      nullableFiniteNumber(row.monthly_cost_limit_usd),
  };
}

export function getAiAllowanceMessage(reason: string) {
  switch (reason) {
    case "ai_credit_balance_exhausted":
      return "AI credits organization sudah habis.";

    case "monthly_ai_cost_limit_reached":
      return "Batas biaya AI bulanan organization telah tercapai.";

    default:
      return "AI request tidak diizinkan oleh kebijakan penggunaan organization.";
  }
}

export function getAiAllowanceStatus(reason: string) {
  return reason === "monthly_ai_cost_limit_reached"
    ? 429
    : 402;
}

type RecordOpenAIChatUsageInput = {
  organizationId: string;
  userId: string;
  feature: string;
  requestedModel: string;
  sourceKind?: string | null;
  sourceId?: string | null;
  responseData: OpenAIChatResponseMetadata;
  requestIdHeader?: string | null;
  requestStatus: "completed" | "failed";
  creditsCharged?: number;
  metadata?: Record<string, unknown>;
};

export async function recordOpenAIChatUsage({
  organizationId,
  userId,
  feature,
  requestedModel,
  sourceKind = null,
  sourceId = null,
  responseData,
  requestIdHeader = null,
  requestStatus,
  creditsCharged = 0,
  metadata = {},
}: RecordOpenAIChatUsageInput) {
  const admin = createAdminClient();

  const usage = responseData.usage;

  const inputTokens =
    nonNegativeInteger(usage?.prompt_tokens);

  const cachedInputTokens =
    nonNegativeInteger(
      usage?.prompt_tokens_details?.cached_tokens,
    );

  const cacheWriteTokens =
    nonNegativeInteger(
      usage?.prompt_tokens_details?.cache_write_tokens,
    );

  const outputTokens =
    nonNegativeInteger(usage?.completion_tokens);

  const totalTokens =
    nonNegativeInteger(usage?.total_tokens) ||
    inputTokens + outputTokens;

  const providerRequestId =
    String(responseData.id ?? requestIdHeader ?? "").trim() ||
    null;

  const actualModel =
    String(responseData.model ?? requestedModel).trim() ||
    requestedModel;

  const { data, error } = await admin.rpc(
    "record_ai_usage",
    {
      p_organization_id: organizationId,
      p_user_id: userId,
      p_feature: feature,
      p_provider: "openai",
      p_model: actualModel,
      p_source_kind: sourceKind,
      p_source_id: sourceId,
      p_provider_request_id: providerRequestId,
      p_request_status: requestStatus,
      p_input_tokens: inputTokens,
      p_cached_input_tokens: cachedInputTokens,
      p_cache_write_tokens: cacheWriteTokens,
      p_output_tokens: outputTokens,
      p_total_tokens: totalTokens,
      p_credits_charged:
        nonNegativeInteger(creditsCharged),
      p_metadata: {
        ...metadata,
        requested_model: requestedModel,
        usage_present: Boolean(usage),
      },
    },
  );

  if (error) {
    throw new Error(
      `AI usage recording failed: ${error.message}`,
    );
  }

  const row = (
    Array.isArray(data) ? data[0] : data
  ) as RecordUsageRow | null;

  return {
    usageId:
      typeof row?.usage_id === "string"
        ? row.usage_id
        : null,

    estimatedCostUsd:
      finiteNumber(row?.estimated_cost_usd),

    pricingFound:
      row?.pricing_found === true,
  };
}

export async function recordOpenAIChatUsageSafely(
  input: RecordOpenAIChatUsageInput,
) {
  try {
    return await recordOpenAIChatUsage(input);
  } catch (error) {
    logServerError({
      event: "ai_metering_usage_recording_failed",
      requestId: input.requestIdHeader,
      provider: "openai",
      operation: "record_ai_usage",
      error,
    });

    return null;
  }
}
