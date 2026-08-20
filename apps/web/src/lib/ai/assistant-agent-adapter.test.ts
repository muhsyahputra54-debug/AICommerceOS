import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildAssistantAgentAdvisoryContext,
  loadAssistantAgentAdvisoryContext,
} from "./assistant-agent-adapter";

function candidate(
  overrides: Record<string, unknown> = {},
) {
  return {
    id:
      "agent-1",

    name:
      "Commerce Analyst",

    purpose:
      "Analyze commerce data.",

    approved_contexts: [
      "products",
      "price_monitoring",
    ],

    is_active:
      true,

    ...overrides,
  };
}

function completedRun(
  overrides: Record<string, unknown> = {},
) {
  return {
    id:
      "run-1",

    agent_id:
      "agent-1",

    status:
      "completed",

    objective:
      "Review business risk.",

    summary:
      "Inventory requires review.",

    recommendation:
      "Review the affected products.",

    risks: [
      "Inventory exposure",
    ],

    next_actions: [
      "Review inventory",
    ],

    ...overrides,
  };
}

function dependencies({
  candidateData =
    candidate(),

  candidateError =
    null,

  runData =
    completedRun(),

  runError =
    null,
}: {
  candidateData?: unknown;
  candidateError?: unknown;
  runData?: unknown;
  runError?: unknown;
} = {}) {
  return {
    loadCandidate:
      vi.fn().mockResolvedValue({
        data:
          candidateData,

        error:
          candidateError,
      }),

    loadRun:
      vi.fn().mockResolvedValue({
        data:
          runData,

        error:
          runError,
      }),
  };
}

describe(
  "Assistant Agent advisory adapter",
  () => {
    it(
      "builds advisory context from a valid active Agent and completed run",
      () => {
        const result =
          buildAssistantAgentAdvisoryContext({
            candidate:
              candidate(),

            run:
              completedRun(),
          });

        expect(
          result,
        ).toMatchObject({
          available:
            true,

          invocation_mode:
            "existing_completed_run_only",

          commerce_mutation_authority:
            "none",

          agent: {
            id:
              "agent-1",

            invocation_mode:
              "read_only_analysis",
          },

          analysis: {
            run_id:
              "run-1",

            trust:
              "advisory_untrusted_model_analysis",

            commerce_mutation_authority:
              "none",
          },
        });
      },
    );

    it(
      "rejects an invalid or inactive Agent candidate",
      () => {
        expect(
          buildAssistantAgentAdvisoryContext({
            candidate:
              candidate({
                is_active:
                  false,
              }),

            run:
              completedRun(),
          }),
        ).toMatchObject({
          available:
            false,

          reason:
            "candidate_unavailable",
        });
      },
    );

    it(
      "rejects a non-completed run",
      () => {
        expect(
          buildAssistantAgentAdvisoryContext({
            candidate:
              candidate(),

            run:
              completedRun({
                status:
                  "running",
              }),
          }),
        ).toMatchObject({
          available:
            false,

          reason:
            "run_unavailable",
        });
      },
    );

    it(
      "rejects a completed run belonging to another Agent",
      () => {
        expect(
          buildAssistantAgentAdvisoryContext({
            candidate:
              candidate(),

            run:
              completedRun({
                agent_id:
                  "agent-other",
              }),
          }),
        ).toMatchObject({
          available:
            false,

          reason:
            "run_agent_mismatch",
        });
      },
    );

    it(
      "does not expose raw Agent execution context",
      () => {
        const result =
          buildAssistantAgentAdvisoryContext({
            candidate:
              candidate(),

            run:
              completedRun({
                input_context: {
                  secret:
                    "raw",
                },

                output_data: {
                  raw:
                    true,
                },

                provider_snapshot:
                  "provider",

                model_snapshot:
                  "model",
              }),
          });

        expect(
          result.analysis,
        ).not.toHaveProperty(
          "input_context",
        );

        expect(
          result.analysis,
        ).not.toHaveProperty(
          "output_data",
        );

        expect(
          result.analysis,
        ).not.toHaveProperty(
          "provider_snapshot",
        );

        expect(
          result.analysis,
        ).not.toHaveProperty(
          "model_snapshot",
        );
      },
    );

    it(
      "fails closed before any source call when references are invalid",
      async () => {
        const deps =
          dependencies();

        const result =
          await loadAssistantAgentAdvisoryContext({
            organizationId:
              "org-1",

            agentId:
              "",

            runId:
              "run-1",

            dependencies:
              deps,
          });

        expect(
          result,
        ).toMatchObject({
          available:
            false,

          reason:
            "invalid_reference",
        });

        expect(
          deps.loadCandidate,
        ).not.toHaveBeenCalled();

        expect(
          deps.loadRun,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "loads the Agent candidate within the supplied organization boundary",
      async () => {
        const deps =
          dependencies();

        await loadAssistantAgentAdvisoryContext({
          organizationId:
            "  org-1  ",

          agentId:
            "  agent-1  ",

          runId:
            "run-1",

          dependencies:
            deps,
        });

        expect(
          deps.loadCandidate,
        ).toHaveBeenCalledWith({
          organizationId:
            "org-1",

          agentId:
            "agent-1",
        });
      },
    );

    it(
      "does not load a run when the Agent candidate source fails",
      async () => {
        const deps =
          dependencies({
            candidateError: {
              message:
                "database error",
            },
          });

        const result =
          await loadAssistantAgentAdvisoryContext({
            organizationId:
              "org-1",

            agentId:
              "agent-1",

            runId:
              "run-1",

            dependencies:
              deps,
          });

        expect(
          result.reason,
        ).toBe(
          "candidate_source_error",
        );

        expect(
          deps.loadRun,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "does not load a run when the Agent fails the safe candidate contract",
      async () => {
        const deps =
          dependencies({
            candidateData:
              candidate({
                is_active:
                  false,
              }),
          });

        const result =
          await loadAssistantAgentAdvisoryContext({
            organizationId:
              "org-1",

            agentId:
              "agent-1",

            runId:
              "run-1",

            dependencies:
              deps,
          });

        expect(
          result.reason,
        ).toBe(
          "candidate_unavailable",
        );

        expect(
          deps.loadRun,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "loads only the requested run for the validated Agent",
      async () => {
        const deps =
          dependencies();

        await loadAssistantAgentAdvisoryContext({
          organizationId:
            "org-1",

          agentId:
            "agent-1",

          runId:
            "  run-1  ",

          dependencies:
            deps,
        });

        expect(
          deps.loadRun,
        ).toHaveBeenCalledWith({
          organizationId:
            "org-1",

          agentId:
            "agent-1",

          runId:
            "run-1",
        });
      },
    );

    it(
      "fails soft when the run source fails",
      async () => {
        const deps =
          dependencies({
            runError: {
              message:
                "database error",
            },
          });

        const result =
          await loadAssistantAgentAdvisoryContext({
            organizationId:
              "org-1",

            agentId:
              "agent-1",

            runId:
              "run-1",

            dependencies:
              deps,
          });

        expect(
          result,
        ).toMatchObject({
          available:
            false,

          reason:
            "run_source_error",

          commerce_mutation_authority:
            "none",
        });
      },
    );

    it(
      "keeps Agent analysis explicitly advisory and non-authorizing",
      async () => {
        const result =
          await loadAssistantAgentAdvisoryContext({
            organizationId:
              "org-1",

            agentId:
              "agent-1",

            runId:
              "run-1",

            dependencies:
              dependencies(),
          });

        expect(
          result.available,
        ).toBe(true);

        expect(
          result.limitations,
        ).toContain(
          "Agent analysis is advisory and untrusted model-generated content.",
        );

        expect(
          result.limitations,
        ).toContain(
          "No product, price, stock, inventory, order, monitoring, or automation mutation is authorized by this context.",
        );
      },
    );
  },
);
