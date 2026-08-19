import type { OpenAIChatResponseMetadata } from "@/lib/ai/metering";

export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAIChatCompletionResponse =
  OpenAIChatResponseMetadata & {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;

    error?: {
      message?: string;
      type?: string;
      code?: string | null;
    };
  };

type CreateOpenAIChatCompletionInput = {
  apiKey: string;
  model: string;
  messages: OpenAIChatMessage[];
  responseFormat?: unknown;
};

export async function createOpenAIChatCompletion({
  apiKey,
  model,
  messages,
  responseFormat,
}: CreateOpenAIChatCompletionInput) {
  const response = await fetch(
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
        messages,
        response_format: responseFormat,
      }),
    },
  );

  const data =
    (await response
      .json()
      .catch(() => ({}))) as OpenAIChatCompletionResponse;

  return {
    response,
    data,
  };
}
