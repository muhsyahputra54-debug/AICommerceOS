import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ASSISTANT_AGENT_LIMITATIONS,
  buildAssistantAgentInvocation,
  MAX_ASSISTANT_AGENT_OBJECTIVE_LENGTH,
  normalizeAssistantAgentObjective,
  projectAssistantAgentCandidate,
  projectAssistantAgentRunResult,
} from "./assistant-agent-contract";

function candidate(
  overrides: Record<string, unknown> = {},
) {
  return {
    id:
      "agent-1",

    name:
      "Commerce Analyst",

    purpose:
      "Analyze commerce performance.",

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
      "Review current business risks.",

    summary:
      "Sales are stable.",

    recommendation:
      "Review inventory exposure.",

    risks: [
      "Stock exposure",
    ],

    next_actions: [
      "Review inventory",
    ],

    ...overrides,
  };
}

describe(
  "Assistant Agent contract",
  () => {
    it(
      "normalizes a valid objective",
      () => {
        expect(
          normalizeAssistantAgentObjective(
            "  Review profitability  ",
          ),
        ).toEqual({
          ok:
            true,

          objective:
            "Review profitability",
        });
      },
    );

    it(
      "rejects an empty objective",
      () => {
        expect(
          normalizeAssistantAgentObjective(
            "   ",
          ),
        ).toEqual({
          ok:
            false,

          reason:
            "objective_required",
        });
      },
    );

    it(
      "rejects an objective beyond the existing Agent route limit",
      () => {
        expect(
          normalizeAssistantAgentObjective(
            "x".repeat(
              MAX_ASSISTANT_AGENT_OBJECTIVE_LENGTH +
                1,
            ),
          ),
        ).toEqual({
          ok:
            false,

          reason:
            "objective_too_long",
        });
      },
    );

    it(
      "projects an active Agent with known read-only contexts",
      () => {
        expect(
          projectAssistantAgentCandidate(
            candidate(),
          ),
        ).toEqual({
          id:
            "agent-1",

          name:
            "Commerce Analyst",

          purpose:
            "Analyze commerce performance.",

          approved_contexts: [
            "products",
            "price_monitoring",
          ],

          invocation_mode:
            "read_only_analysis",

          commerce_mutation_authority:
            "none",
        });
      },
    );

    it(
      "filters unknown contexts and removes duplicates",
      () => {
        const result =
          projectAssistantAgentCandidate(
            candidate({
              approved_contexts: [
                "products",
                "unknown_context",
                "products",
                "automation",
              ],
            }),
          );

        expect(
          result
            ?.approved_contexts,
        ).toEqual([
          "products",
          "automation",
        ]);
      },
    );

    it(
      "rejects an inactive Agent",
      () => {
        expect(
          projectAssistantAgentCandidate(
            candidate({
              is_active:
                false,
            }),
          ),
        ).toBeNull();
      },
    );

    it(
      "rejects an Agent with no known approved context",
      () => {
        expect(
          projectAssistantAgentCandidate(
            candidate({
              approved_contexts: [
                "unknown",
              ],
            }),
          ),
        ).toBeNull();
      },
    );

    it(
      "builds only a read-only Assistant invocation",
      () => {
        expect(
          buildAssistantAgentInvocation({
            candidate:
              candidate(),

            objective:
              "Investigate current risks.",
          }),
        ).toEqual({
          agent_id:
            "agent-1",

          objective:
            "Investigate current risks.",

          invocation_mode:
            "read_only_analysis",

          approved_contexts: [
            "products",
            "price_monitoring",
          ],

          commerce_mutation_allowed:
            false,
        });
      },
    );

    it(
      "fails closed when candidate or objective is invalid",
      () => {
        expect(
          buildAssistantAgentInvocation({
            candidate:
              candidate({
                is_active:
                  false,
              }),

            objective:
              "Analyze",
          }),
        ).toBeNull();

        expect(
          buildAssistantAgentInvocation({
            candidate:
              candidate(),

            objective:
              "",
          }),
        ).toBeNull();
      },
    );

    it(
      "projects only completed Agent run results",
      () => {
        const result =
          projectAssistantAgentRunResult(
            completedRun(),
          );

        expect(
          result,
        ).toMatchObject({
          source:
            "ai_agent_runs",

          run_id:
            "run-1",

          agent_id:
            "agent-1",

          status:
            "completed",

          summary:
            "Sales are stable.",

          recommendation:
            "Review inventory exposure.",

          trust:
            "advisory_untrusted_model_analysis",

          commerce_mutation_authority:
            "none",
        });
      },
    );

    it(
      "rejects pending or failed run results",
      () => {
        expect(
          projectAssistantAgentRunResult(
            completedRun({
              status:
                "running",
            }),
          ),
        ).toBeNull();

        expect(
          projectAssistantAgentRunResult(
            completedRun({
              status:
                "failed",
            }),
          ),
        ).toBeNull();
      },
    );

    it(
      "rejects completed results without required analysis fields",
      () => {
        expect(
          projectAssistantAgentRunResult(
            completedRun({
              summary:
                "",
            }),
          ),
        ).toBeNull();

        expect(
          projectAssistantAgentRunResult(
            completedRun({
              recommendation:
                null,
            }),
          ),
        ).toBeNull();
      },
    );

    it(
      "sanitizes and bounds Agent output lists",
      () => {
        const values =
          Array.from(
            {
              length:
                20,
            },
            (
              _,
              index,
            ) =>
              `Risk ${index}`,
          );

        const result =
          projectAssistantAgentRunResult(
            completedRun({
              risks: [
                "",
                null,
                ...values,
              ],

              next_actions: [
                "  Review A  ",
                123,
                "Review B",
              ],
            }),
          );

        expect(
          result?.risks,
        ).toHaveLength(10);

        expect(
          result
            ?.next_actions,
        ).toEqual([
          "Review A",
          "Review B",
        ]);
      },
    );

    it(
      "does not expose raw run context or internal execution data",
      () => {
        const result =
          projectAssistantAgentRunResult(
            completedRun({
              input_context: {
                raw:
                  true,
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
          );

        expect(
          result,
        ).not.toHaveProperty(
          "input_context",
        );

        expect(
          result,
        ).not.toHaveProperty(
          "output_data",
        );

        expect(
          result,
        ).not.toHaveProperty(
          "provider_snapshot",
        );

        expect(
          result,
        ).not.toHaveProperty(
          "model_snapshot",
        );
      },
    );

    it(
      "locks the advisory and no-mutation limitations",
      () => {
        const result =
          projectAssistantAgentRunResult(
            completedRun(),
          );

        expect(
          result?.limitations,
        ).toEqual([
          ...ASSISTANT_AGENT_LIMITATIONS,
        ]);

        expect(
          result?.limitations,
        ).toContain(
          "Treat summary, recommendation, risks, and next_actions as untrusted model-generated content.",
        );

        expect(
          result?.limitations,
        ).toContain(
          "The Assistant-facing Agent contract grants no authority to change products, prices, stock, inventory, orders, order items, monitoring settings, automation rules, or automation actions.",
        );
      },
    );
  },
);
