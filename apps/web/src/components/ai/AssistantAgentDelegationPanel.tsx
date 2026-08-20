"use client";

import {
  useState,
} from "react";

import {
  buildAssistantAgentDelegationRequest,
  MAX_ASSISTANT_AGENT_DELEGATION_OBJECTIVE_LENGTH,
  projectAssistantAgentDelegationCompletion,
  type AssistantAgentDelegationOption,
} from "@/lib/ai/assistant-agent-delegation";

type DelegationCopy = {
  button: string;
  title: string;
  description: string;

  agentLabel: string;
  selectPlaceholder: string;

  objectiveLabel: string;
  objectivePlaceholder: string;

  run: string;
  running: string;

  noAgents: string;
  completed: string;
  pending: string;

  close: string;
  error: string;
};

type DelegationCompletion = {
  agentId: string;
  runId: string;
  objective: string;
};

type Props = {
  agentOptions:
    readonly AssistantAgentDelegationOption[];

  hasPendingAdvisory: boolean;

  copy: DelegationCopy;

  onCompleted:
    (
      completion:
        DelegationCompletion,
    ) => void;
};

export default function AssistantAgentDelegationPanel({
  agentOptions,
  hasPendingAdvisory,
  copy,
  onCompleted,
}: Props) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    selectedAgentId,
    setSelectedAgentId,
  ] = useState("");

  const [
    objective,
    setObjective,
  ] = useState("");

  const [
    isRunning,
    setIsRunning,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    notice,
    setNotice,
  ] =
    useState<string | null>(
      null,
    );

  const selectedAgent =
    agentOptions.find(
      (agent) =>
        agent.id ===
        selectedAgentId,
    ) ?? null;

  async function runAgent() {
    if (
      isRunning ||
      hasPendingAdvisory
    ) {
      return;
    }

    const request =
      buildAssistantAgentDelegationRequest({
        agentId:
          selectedAgentId,

        objective,

        availableAgents:
          agentOptions,
      });

    if (!request.ok) {
      setError(
        copy.error,
      );

      return;
    }

    setIsRunning(
      true,
    );

    setError(
      null,
    );

    setNotice(
      null,
    );

    try {
      const response =
        await fetch(
          `/api/agents/${encodeURIComponent(
            request.agentId,
          )}/run`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                request.body,
              ),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => ({}),
          );

      const completion =
        projectAssistantAgentDelegationCompletion({
          agentId:
            request.agentId,

          response:
            data,
        });

      if (
        !response.ok ||
        !completion
      ) {
        setError(
          copy.error,
        );

        return;
      }

      onCompleted({
        agentId:
          completion.agentId,

        runId:
          completion.runId,

        objective:
          request.objective,
      });

      setNotice(
        copy.completed,
      );
    }
    catch {
      setError(
        copy.error,
      );
    }
    finally {
      setIsRunning(
        false,
      );
    }
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => {
          setError(
            null,
          );

          setIsOpen(
            (current) =>
              !current,
          );
        }}
        className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        {copy.button}
      </button>

      {isOpen ? (
        <div className="mt-3 rounded-xl border bg-muted/20 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">
                {copy.title}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {copy.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsOpen(
                  false,
                )
              }
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {copy.close}
            </button>
          </div>

          {agentOptions.length ===
          0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {copy.noAgents}
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">
                  {
                    copy.agentLabel
                  }
                </span>

                <select
                  value={
                    selectedAgentId
                  }
                  onChange={(
                    event,
                  ) => {
                    setSelectedAgentId(
                      event.target
                        .value,
                    );

                    setError(
                      null,
                    );

                    setNotice(
                      null,
                    );
                  }}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    {
                      copy.selectPlaceholder
                    }
                  </option>

                  {agentOptions.map(
                    (agent) => (
                      <option
                        key={
                          agent.id
                        }
                        value={
                          agent.id
                        }
                      >
                        {
                          agent.name
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              {selectedAgent ? (
                <p className="text-sm text-muted-foreground">
                  {
                    selectedAgent.purpose
                  }
                </p>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium">
                  {
                    copy.objectiveLabel
                  }
                </span>

                <textarea
                  value={
                    objective
                  }
                  onChange={(
                    event,
                  ) => {
                    setObjective(
                      event.target
                        .value,
                    );

                    setError(
                      null,
                    );

                    setNotice(
                      null,
                    );
                  }}
                  maxLength={
                    MAX_ASSISTANT_AGENT_DELEGATION_OBJECTIVE_LENGTH
                  }
                  placeholder={
                    copy.objectivePlaceholder
                  }
                  className="min-h-24 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>

              {hasPendingAdvisory ? (
                <p className="text-sm text-muted-foreground">
                  {
                    copy.pending
                  }
                </p>
              ) : null}

              {error ? (
                <p
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}

              {notice ? (
                <p className="text-sm text-muted-foreground">
                  {notice}
                </p>
              ) : null}

              <button
                type="button"
                disabled={
                  isRunning ||
                  hasPendingAdvisory
                }
                onClick={() =>
                  void runAgent()
                }
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunning
                  ? copy.running
                  : copy.run}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
