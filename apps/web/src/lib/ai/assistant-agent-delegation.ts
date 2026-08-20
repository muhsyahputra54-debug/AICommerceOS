import {
  projectAssistantAgentCandidate,
} from "./assistant-agent-contract";

import {
  parseAssistantAgentHandoff,
  type AssistantAgentHandoff,
} from "./assistant-agent-handoff";

export const MAX_ASSISTANT_AGENT_DELEGATION_OBJECTIVE_LENGTH =
  4000;

export type AssistantAgentDelegationOption = {
  id: string;
  name: string;
  purpose: string;
  approved_contexts: readonly string[];
  invocation_mode: "read_only_analysis";
  commerce_mutation_authority: "none";
};

export type AssistantAgentDelegationRequest =
  | {
      ok: true;
      agentId: string;
      objective: string;
      body: {
        objective: string;
      };
      invocation_mode: "read_only_analysis";
      commerce_mutation_authority: "none";
    }
  | {
      ok: false;
      reason:
        | "agent_required"
        | "agent_unavailable"
        | "objective_required"
        | "objective_too_long";
    };

function normalizedAgentId(
  value: unknown,
) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized
    ? normalized
    : null;
}

function normalizedObjective(
  value: unknown,
):
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      reason:
        | "objective_required"
        | "objective_too_long";
    } {
  if (typeof value !== "string") {
    return {
      ok: false,
      reason: "objective_required",
    };
  }

  const objective =
    value.trim();

  if (!objective) {
    return {
      ok: false,
      reason: "objective_required",
    };
  }

  if (
    objective.length >
    MAX_ASSISTANT_AGENT_DELEGATION_OBJECTIVE_LENGTH
  ) {
    return {
      ok: false,
      reason: "objective_too_long",
    };
  }

  return {
    ok: true,
    value: objective,
  };
}

function asRecord(
  value: unknown,
) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

export function projectAssistantAgentDelegationOption(
  value: unknown,
): AssistantAgentDelegationOption | null {
  const candidate =
    projectAssistantAgentCandidate(
      value,
    );

  if (!candidate) {
    return null;
  }

  return {
    id:
      candidate.id,

    name:
      candidate.name,

    purpose:
      candidate.purpose,

    approved_contexts:
      candidate.approved_contexts,

    invocation_mode:
      "read_only_analysis",

    commerce_mutation_authority:
      "none",
  };
}

export function buildAssistantAgentDelegationRequest({
  agentId,
  objective,
  availableAgents,
}: {
  agentId: unknown;
  objective: unknown;
  availableAgents: readonly unknown[];
}): AssistantAgentDelegationRequest {
  const resolvedAgentId =
    normalizedAgentId(
      agentId,
    );

  if (!resolvedAgentId) {
    return {
      ok: false,
      reason: "agent_required",
    };
  }

  const selected =
    availableAgents
      .map(
        projectAssistantAgentDelegationOption,
      )
      .find(
        (agent) =>
          agent?.id ===
          resolvedAgentId,
      );

  if (!selected) {
    return {
      ok: false,
      reason: "agent_unavailable",
    };
  }

  const objectiveResult =
    normalizedObjective(
      objective,
    );

  if (!objectiveResult.ok) {
    return objectiveResult;
  }

  return {
    ok: true,

    agentId:
      selected.id,

    objective:
      objectiveResult.value,

    body: {
      objective:
        objectiveResult.value,
    },

    invocation_mode:
      "read_only_analysis",

    commerce_mutation_authority:
      "none",
  };
}

export function projectAssistantAgentDelegationCompletion({
  agentId,
  response,
}: {
  agentId: unknown;
  response: unknown;
}):
  | (
      AssistantAgentHandoff & {
        status: "completed";
        commerce_mutation_authority: "none";
      }
    )
  | null {
  const resolvedAgentId =
    normalizedAgentId(
      agentId,
    );

  const record =
    asRecord(
      response,
    );

  if (
    !resolvedAgentId ||
    !record ||
    record.status !== "completed" ||
    typeof record.runId !== "string"
  ) {
    return null;
  }

  const params =
    new URLSearchParams({
      agentId:
        resolvedAgentId,

      runId:
        record.runId,
    });

  const handoff =
    parseAssistantAgentHandoff(
      params.toString(),
    );

  if (!handoff) {
    return null;
  }

  return {
    ...handoff,

    status:
      "completed",

    commerce_mutation_authority:
      "none",
  };
}
