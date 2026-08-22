import {
  getAiAllowanceMessage,
  checkAiAllowance,
  recordOpenAIChatUsageSafely,
} from "./metering";

import {
  createOpenAIChatCompletion,
  type OpenAIChatCompletionResponse,
} from "./openai-chat";

import {
  generateTodayDailyBrief,
  type TodayDailyBriefEnvironment,
  type TodayDailyBriefTransportInput,
} from "./today-daily-brief-server";

import {
  unavailableTodayDailyBrief,
} from "./today-daily-brief";

import {
  loadLakuvoTodayFromServer,
  type LoadLakuvoTodayFromServerOptions,
} from "./today-server-read";

import type {
  LakuvoTodaySnapshot,
  TodayDailyBrief,
} from "./today-contract";

import {
  getCurrentOrganization,
} from "@/lib/supabase/current-organization";

import {
  createClient,
} from "@/lib/supabase/server";

export const TODAY_DAILY_BRIEF_METERING_FEATURE =
  "ai_assistant";

export const TODAY_DAILY_BRIEF_METERING_SOURCE_KIND =
  "today_daily_brief";

type TodayDailyBriefCompletionResult = {
  response:
    Response;

  data:
    OpenAIChatCompletionResponse;
};

export type TodayDailyBriefRuntimeDependencies = {
  getAuthenticatedUserId:
    () => Promise<string | null>;

  getCurrentOrganizationId:
    () => Promise<string | null>;

  loadSnapshot:
    (
      options:
        LoadLakuvoTodayFromServerOptions,
    ) => Promise<
      LakuvoTodaySnapshot | null
    >;

  checkAllowance:
    typeof checkAiAllowance;

  recordUsageSafely:
    typeof recordOpenAIChatUsageSafely;

  createCompletion:
    (
      input:
        TodayDailyBriefTransportInput,
    ) => Promise<
      TodayDailyBriefCompletionResult
    >;
};

export type LoadLakuvoTodayWithDailyBriefOptions =
  LoadLakuvoTodayFromServerOptions & {
    dailyBriefApiKey?:
      string | null;

    dailyBriefModel?:
      string | null;

    dailyBriefEnvironment?:
      TodayDailyBriefEnvironment;

    dependencies?:
      Partial<
        TodayDailyBriefRuntimeDependencies
      >;
  };

async function getAuthenticatedUserId():
  Promise<string | null> {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },

    error,
  } =
    await supabase.auth.getUser();

  if (
    error ||
    !user
  ) {
    return null;
  }

  return user.id;
}

async function getCurrentOrganizationId():
  Promise<string | null> {
  const currentOrganization =
    await getCurrentOrganization();

  return (
    currentOrganization
      ?.organizationId ??
    null
  );
}

const DEFAULT_DEPENDENCIES:
  TodayDailyBriefRuntimeDependencies = {
    getAuthenticatedUserId,

    getCurrentOrganizationId,

    loadSnapshot:
      loadLakuvoTodayFromServer,

    checkAllowance:
      checkAiAllowance,

    recordUsageSafely:
      recordOpenAIChatUsageSafely,

    createCompletion:
      createOpenAIChatCompletion,
  };

function resolveDependencies(
  overrides:
    Partial<
      TodayDailyBriefRuntimeDependencies
    > | undefined,
): TodayDailyBriefRuntimeDependencies {
  return {
    ...DEFAULT_DEPENDENCIES,
    ...overrides,
  };
}

export async function generateMeteredTodayDailyBrief({
  snapshot,
  organizationId,
  userId,
  apiKey,
  model,
  environment,
  dependencies,
}: {
  snapshot:
    LakuvoTodaySnapshot;

  organizationId:
    string;

  userId:
    string;

  apiKey?:
    string | null;

  model?:
    string | null;

  environment?:
    TodayDailyBriefEnvironment;

  dependencies?:
    Partial<
      TodayDailyBriefRuntimeDependencies
    >;
}): Promise<
  TodayDailyBrief
> {
  const resolvedDependencies =
    resolveDependencies(
      dependencies,
    );

  let allowance:
    Awaited<
      ReturnType<
        typeof checkAiAllowance
      >
    >;

  try {
    allowance =
      await resolvedDependencies
        .checkAllowance(
          organizationId,
        );
  }
  catch {
    return unavailableTodayDailyBrief(
      "AI Daily Brief usage metering is unavailable.",
    );
  }

  if (
    !allowance.allowed
  ) {
    return unavailableTodayDailyBrief(
      getAiAllowanceMessage(
        allowance.reason,
      ),
    );
  }

  const usageCaptureRef: {
    current:
      | {
          responseData:
            OpenAIChatCompletionResponse;

          requestIdHeader:
            string | null;

          requestStatus:
            "completed" | "failed";

          requestedModel:
            string;

          httpStatus:
            number;

          messageCount:
            number;
        }
      | null;
  } = {
    current:
      null,
  };

  const brief =
    await generateTodayDailyBrief({
      snapshot,

      apiKey,

      model,

      environment,

      transport:
        async (
          input,
        ) => {
          const result =
            await resolvedDependencies
              .createCompletion(
                input,
              );

          usageCaptureRef.current = {
            responseData:
              result.data,

            requestIdHeader:
              result.response.headers.get(
                "x-request-id",
              ),

            requestStatus:
              result.response.ok
                ? "completed"
                : "failed",

            requestedModel:
              input.model,

            httpStatus:
              result.response.status,

            messageCount:
              input.messages.length,
          };

          return result;
        },
    });

  const usageCapture =
    usageCaptureRef.current;

  if (
    usageCapture !==
    null
  ) {
    try {
      await resolvedDependencies
        .recordUsageSafely({
          organizationId,

          userId,

          feature:
            TODAY_DAILY_BRIEF_METERING_FEATURE,

          requestedModel:
            usageCapture
              .requestedModel,

          sourceKind:
            TODAY_DAILY_BRIEF_METERING_SOURCE_KIND,

          responseData:
            usageCapture
              .responseData,

          requestIdHeader:
            usageCapture
              .requestIdHeader,

          requestStatus:
            usageCapture
              .requestStatus,

          metadata: {
            http_status:
              usageCapture
                .httpStatus,

            message_count:
              usageCapture
                .messageCount,

            daily_brief_status:
              brief.status,
          },
        });
    }
    catch {
      /*
       * recordOpenAIChatUsageSafely already
       * fails closed internally. This outer
       * guard prevents an injected or future
       * recorder regression from replacing a
       * valid business-facing Daily Brief.
       */
    }
  }

  return brief;
}

export async function loadLakuvoTodayWithDailyBriefFromServer(
  options:
    LoadLakuvoTodayWithDailyBriefOptions = {},
): Promise<
  LakuvoTodaySnapshot | null
> {
  const dependencies =
    resolveDependencies(
      options.dependencies,
    );

  const userId =
    await dependencies
      .getAuthenticatedUserId();

  if (
    !userId
  ) {
    return null;
  }

  const organizationId =
    await dependencies
      .getCurrentOrganizationId();

  if (
    !organizationId
  ) {
    return null;
  }

  const snapshot =
    await dependencies
      .loadSnapshot({
        generatedAt:
          options.generatedAt,

        marketplaceSyncFailureHours:
          options.marketplaceSyncFailureHours,
      });

  if (
    !snapshot
  ) {
    return null;
  }

  if (
    snapshot.organizationId !==
    organizationId
  ) {
    return null;
  }

  const dailyBrief =
    await generateMeteredTodayDailyBrief({
      snapshot,

      organizationId,

      userId,

      apiKey:
        options.dailyBriefApiKey,

      model:
        options.dailyBriefModel,

      environment:
        options.dailyBriefEnvironment,

      dependencies,
    });

  return {
    ...snapshot,

    dailyBrief,
  };
}