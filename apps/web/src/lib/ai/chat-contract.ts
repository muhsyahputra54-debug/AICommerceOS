const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOTAL_MESSAGE_LENGTH = 20000;

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export function parseMessages(
  value: unknown,
): AssistantMessage[] | null {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_MESSAGES
  ) {
    return null;
  }

  const messages: AssistantMessage[] = [];
  let totalLength = 0;

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null
    ) {
      return null;
    }

    const record =
      item as Record<string, unknown>;

    const role = record.role;

    const content =
      typeof record.content === "string"
        ? record.content.trim()
        : "";

    if (
      role !== "user" &&
      role !== "assistant"
    ) {
      return null;
    }

    if (
      content.length === 0 ||
      content.length > MAX_MESSAGE_LENGTH
    ) {
      return null;
    }

    totalLength += content.length;

    if (
      totalLength >
      MAX_TOTAL_MESSAGE_LENGTH
    ) {
      return null;
    }

    messages.push({
      role,
      content,
    });
  }

  const lastMessage =
    messages[messages.length - 1];

  if (
    !lastMessage ||
    lastMessage.role !== "user"
  ) {
    return null;
  }

  return messages;
}

export type ProactiveInsightCode =
  | "catalog_readiness"
  | "competitor_threshold_alert"
  | "no_orders"
  | "price_monitoring_no_observations";

export function parseProactiveInsightCode(
  value: unknown,
): ProactiveInsightCode | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  switch (value) {
    case "catalog_readiness":
    case "competitor_threshold_alert":
    case "no_orders":
    case "price_monitoring_no_observations":
      return value;

    default:
      return null;
  }
}
