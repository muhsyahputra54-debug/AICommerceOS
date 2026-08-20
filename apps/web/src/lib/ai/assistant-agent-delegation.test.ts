import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildAssistantAgentDelegationRequest,
  MAX_ASSISTANT_AGENT_DELEGATION_OBJECTIVE_LENGTH,
  projectAssistantAgentDelegationCompletion,
  projectAssistantAgentDelegationOption,
} from "./assistant-agent-delegation";

function agent(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "agent-1",
    name: "Commerce Analyst",
    purpose: "Review commerce data.",

    approved_contexts: [
      "products",
      "price_monitoring",
    ],

    is_active: true,

    ...overrides,
  };
}

function delegationOption() {
  const option =
    projectAssistantAgentDelegationOption(
      agent(),
    );

  if (!option) {
    throw new Error(
      "Expected safe Agent delegation option.",
    );
  }

  return option;
}

describe(
  "Assistant explicit Agent delegation",
  () => {
    it(
      "projects an active safe Agent",
      () => {
        expect(
          projectAssistantAgentDelegationOption(
            agent(),
          ),
        ).toEqual({
          id: "agent-1",
          name: "Commerce Analyst",
          purpose:
            "Review commerce data.",

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
      "rejects an inactive Agent",
      () => {
        expect(
          projectAssistantAgentDelegationOption(
            agent({
              is_active: false,
            }),
          ),
        ).toBeNull();
      },
    );

    it(
      "removes unknown approved contexts",
      () => {
        expect(
          projectAssistantAgentDelegationOption(
            agent({
              approved_contexts: [
                "products",
                "unknown_context",
              ],
            }),
          )?.approved_contexts,
        ).toEqual([
          "products",
        ]);
      },
    );

    it(
      "builds a request for an explicitly selected Agent",
      () => {
        expect(
          buildAssistantAgentDelegationRequest({
            agentId:
              " agent-1 ",

            objective:
              " Review inventory risk. ",

            availableAgents: [
              delegationOption(),
            ],
          }),
        ).toEqual({
          ok: true,
          agentId: "agent-1",
          objective:
            "Review inventory risk.",

          body: {
            objective:
              "Review inventory risk.",
          },

          invocation_mode:
            "read_only_analysis",

          commerce_mutation_authority:
            "none",
        });
      },
    );

    it(
      "requires explicit Agent selection",
      () => {
        expect(
          buildAssistantAgentDelegationRequest({
            agentId: "",
            objective:
              "Review inventory.",

            availableAgents: [
              delegationOption(),
            ],
          }),
        ).toEqual({
          ok: false,
          reason: "agent_required",
        });
      },
    );

    it(
      "rejects unavailable Agent selection",
      () => {
        expect(
          buildAssistantAgentDelegationRequest({
            agentId:
              "agent-other",

            objective:
              "Review inventory.",

            availableAgents: [
              delegationOption(),
            ],
          }),
        ).toEqual({
          ok: false,
          reason: "agent_unavailable",
        });
      },
    );

    it(
      "requires a non-empty objective",
      () => {
        expect(
          buildAssistantAgentDelegationRequest({
            agentId: "agent-1",
            objective: "   ",

            availableAgents: [
              delegationOption(),
            ],
          }),
        ).toEqual({
          ok: false,
          reason: "objective_required",
        });
      },
    );

    it(
      "caps objectives at the Assistant message boundary",
      () => {
        expect(
          buildAssistantAgentDelegationRequest({
            agentId: "agent-1",

            objective:
              "x".repeat(
                MAX_ASSISTANT_AGENT_DELEGATION_OBJECTIVE_LENGTH +
                  1,
              ),

            availableAgents: [
              delegationOption(),
            ],
          }),
        ).toEqual({
          ok: false,
          reason: "objective_too_long",
        });
      },
    );

    it(
      "projects a completed run into one-shot handoff references",
      () => {
        expect(
          projectAssistantAgentDelegationCompletion({
            agentId: "agent-1",

            response: {
              runId: "run-1",
              status: "completed",
            },
          }),
        ).toEqual({
          agentId: "agent-1",
          runId: "run-1",
          status: "completed",

          commerce_mutation_authority:
            "none",
        });
      },
    );

    it(
      "rejects failed or incomplete run responses",
      () => {
        expect(
          projectAssistantAgentDelegationCompletion({
            agentId: "agent-1",

            response: {
              runId: "run-1",
              status: "failed",
            },
          }),
        ).toBeNull();

        expect(
          projectAssistantAgentDelegationCompletion({
            agentId: "agent-1",

            response: {
              status: "completed",
            },
          }),
        ).toBeNull();
      },
    );

    it(
      "does not expose raw execution metadata",
      () => {
        const result =
          projectAssistantAgentDelegationCompletion({
            agentId: "agent-1",

            response: {
              runId: "run-1",
              status: "completed",

              provider_snapshot:
                "provider",

              raw_output: {
                hidden: true,
              },
            },
          });

        expect(
          result,
        ).not.toHaveProperty(
          "provider_snapshot",
        );

        expect(
          result,
        ).not.toHaveProperty(
          "raw_output",
        );

        expect(
          result?.commerce_mutation_authority,
        ).toBe("none");
      },
    );
  },
);
