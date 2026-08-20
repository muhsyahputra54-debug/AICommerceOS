export const MAX_ASSISTANT_AGENT_HANDOFF_REFERENCE_LENGTH =
  128;

const MAX_HANDOFF_QUERY_LENGTH =
  2048;

const HANDOFF_REFERENCE_PATTERN =
  /^[A-Za-z0-9_-]+$/;

export type AssistantAgentHandoff = {
  agentId: string;
  runId: string;
};

function normalizeReference(
  value: unknown,
) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  if (
    normalized === "" ||
    normalized.length >
      MAX_ASSISTANT_AGENT_HANDOFF_REFERENCE_LENGTH ||
    !HANDOFF_REFERENCE_PATTERN.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

export function buildAssistantAgentHandoffUrl({
  agentId,
  runId,
}: {
  agentId: unknown;
  runId: unknown;
}) {
  const normalizedAgentId =
    normalizeReference(
      agentId,
    );

  const normalizedRunId =
    normalizeReference(
      runId,
    );

  if (
    !normalizedAgentId ||
    !normalizedRunId
  ) {
    return null;
  }

  const params =
    new URLSearchParams({
      agentId:
        normalizedAgentId,

      runId:
        normalizedRunId,
    });

  return `/ai?${params.toString()}`;
}

export function parseAssistantAgentHandoff(
  search: unknown,
): AssistantAgentHandoff | null {
  if (typeof search !== "string") {
    return null;
  }

  const normalizedSearch =
    search.startsWith("?")
      ? search.slice(1)
      : search;

  if (
    normalizedSearch.length >
    MAX_HANDOFF_QUERY_LENGTH
  ) {
    return null;
  }

  const params =
    new URLSearchParams(
      normalizedSearch,
    );

  const agentIds =
    params.getAll(
      "agentId",
    );

  const runIds =
    params.getAll(
      "runId",
    );

  /*
   * Fail closed on ambiguous duplicate references.
   */
  if (
    agentIds.length !== 1 ||
    runIds.length !== 1
  ) {
    return null;
  }

  const agentId =
    normalizeReference(
      agentIds[0],
    );

  const runId =
    normalizeReference(
      runIds[0],
    );

  if (
    !agentId ||
    !runId
  ) {
    return null;
  }

  return {
    agentId,
    runId,
  };
}

export function stripAssistantAgentHandoffFromUrl(
  value: unknown,
) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return "/ai";
  }

  try {
    const url =
      new URL(
        value,
        "https://lakuvo.local",
      );

    url.searchParams.delete(
      "agentId",
    );

    url.searchParams.delete(
      "runId",
    );

    return [
      url.pathname,
      url.search,
      url.hash,
    ].join("");
  }
  catch {
    return "/ai";
  }
}
