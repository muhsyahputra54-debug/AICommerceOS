import type {
  LakuvoTodaySnapshot,
  TodayDailyBrief,
} from "./today-contract";

import {
  buildTodayDailyBriefMessages,
  parseTodayDailyBriefContent,
  unavailableTodayDailyBrief,
} from "./today-daily-brief";

import {
  createOpenAIChatCompletion,
  type OpenAIChatMessage,
} from "./openai-chat";

export const TODAY_DAILY_BRIEF_DEFAULT_MODEL =
  "gpt-5.6-luna";

export const TODAY_DAILY_BRIEF_RESPONSE_FORMAT = {
  type:
    "json_schema",

  json_schema: {
    name:
      "lakuvo_today_daily_brief",

    strict:
      true,

    schema: {
      type:
        "object",

      additionalProperties:
        false,

      properties: {
        headline: {
          type:
            "string",
        },

        summary: {
          type:
            "string",
        },

        highlights: {
          type:
            "array",

          items: {
            type:
              "string",
          },
        },
      },

      required: [
        "headline",
        "summary",
        "highlights",
      ],
    },
  },
} as const;

export type TodayDailyBriefEnvironment = {
  OPENAI_API_KEY?:
    string;

  OPENAI_MODEL?:
    string;
};

export type TodayDailyBriefTransportInput = {
  apiKey:
    string;

  model:
    string;

  messages:
    OpenAIChatMessage[];

  responseFormat?:
    unknown;
};

export type TodayDailyBriefTransportResult = {
  response: {
    ok:
      boolean;
  };

  data: {
    choices?: Array<{
      message?: {
        content?:
          string | null;
      };
    }>;

    error?: {
      message?:
        string;
    };
  };
};

export type TodayDailyBriefTransport = (
  input:
    TodayDailyBriefTransportInput,
) => Promise<
  TodayDailyBriefTransportResult
>;

export type GenerateTodayDailyBriefOptions = {
  snapshot:
    LakuvoTodaySnapshot;

  apiKey?:
    string | null;

  model?:
    string | null;

  environment?:
    TodayDailyBriefEnvironment;

  transport?:
    TodayDailyBriefTransport;
};

function normalizedOptionalString(
  value:
    string | null | undefined,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

export function resolveTodayDailyBriefOpenAIConfig({
  apiKey,
  model,
  environment,
}: {
  apiKey?:
    string | null;

  model?:
    string | null;

  environment?:
    TodayDailyBriefEnvironment;
}) {
  const sourceEnvironment =
    environment ??
    process.env;

  const resolvedApiKey =
    normalizedOptionalString(
      apiKey,
    ) ??
    normalizedOptionalString(
      sourceEnvironment
        .OPENAI_API_KEY,
    );

  const resolvedModel =
    normalizedOptionalString(
      model,
    ) ??
    normalizedOptionalString(
      sourceEnvironment
        .OPENAI_MODEL,
    ) ??
    TODAY_DAILY_BRIEF_DEFAULT_MODEL;

  return {
    apiKey:
      resolvedApiKey,

    model:
      resolvedModel,
  };
}

export async function generateTodayDailyBrief({
  snapshot,
  apiKey,
  model,
  environment,
  transport,
}: GenerateTodayDailyBriefOptions): Promise<
  TodayDailyBrief
> {
  const config =
    resolveTodayDailyBriefOpenAIConfig({
      apiKey,
      model,
      environment,
    });

  if (
    config.apiKey ===
    null
  ) {
    return unavailableTodayDailyBrief(
      "OpenAI is not configured for AI Daily Brief.",
    );
  }

  const selectedTransport:
    TodayDailyBriefTransport =
      transport ??
      createOpenAIChatCompletion;

  try {
    const {
      response,
      data,
    } =
      await selectedTransport({
        apiKey:
          config.apiKey,

        model:
          config.model,

        messages:
          buildTodayDailyBriefMessages(
            snapshot,
          ),

        responseFormat:
          TODAY_DAILY_BRIEF_RESPONSE_FORMAT,
      });

    if (
      !response.ok
    ) {
      return unavailableTodayDailyBrief(
        "AI Daily Brief request failed.",
      );
    }

    const content =
      data
        .choices?.[0]
        ?.message
        ?.content;

    if (
      typeof content !==
        "string" ||
      content.trim().length ===
        0
    ) {
      return unavailableTodayDailyBrief(
        "AI Daily Brief response is empty.",
      );
    }

    return parseTodayDailyBriefContent(
      content,
    );
  }
  catch {
    return unavailableTodayDailyBrief(
      "AI Daily Brief transport is unavailable.",
    );
  }
}