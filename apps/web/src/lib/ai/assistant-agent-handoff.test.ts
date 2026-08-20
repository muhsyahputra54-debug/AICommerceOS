import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildAssistantAgentHandoffUrl,
  MAX_ASSISTANT_AGENT_HANDOFF_REFERENCE_LENGTH,
  parseAssistantAgentHandoff,
  stripAssistantAgentHandoffFromUrl,
} from "./assistant-agent-handoff";

describe(
  "Assistant Agent explicit handoff",
  () => {
    it(
      "builds an explicit Assistant URL",
      () => {
        expect(
          buildAssistantAgentHandoffUrl({
            agentId:
              "agent-123",

            runId:
              "run-456",
          }),
        ).toBe(
          "/ai?agentId=agent-123&runId=run-456",
        );
      },
    );

    it(
      "normalizes surrounding whitespace",
      () => {
        expect(
          buildAssistantAgentHandoffUrl({
            agentId:
              "  agent-123  ",

            runId:
              "  run-456  ",
          }),
        ).toBe(
          "/ai?agentId=agent-123&runId=run-456",
        );
      },
    );

    it(
      "rejects missing or malformed references",
      () => {
        expect(
          buildAssistantAgentHandoffUrl({
            agentId:
              "",

            runId:
              "run-1",
          }),
        ).toBeNull();

        expect(
          buildAssistantAgentHandoffUrl({
            agentId:
              "<script>",

            runId:
              "run-1",
          }),
        ).toBeNull();
      },
    );

    it(
      "rejects oversized references",
      () => {
        expect(
          buildAssistantAgentHandoffUrl({
            agentId:
              "a".repeat(
                MAX_ASSISTANT_AGENT_HANDOFF_REFERENCE_LENGTH +
                  1,
              ),

            runId:
              "run-1",
          }),
        ).toBeNull();
      },
    );

    it(
      "parses a valid handoff query",
      () => {
        expect(
          parseAssistantAgentHandoff(
            "?agentId=agent-123&runId=run-456",
          ),
        ).toEqual({
          agentId:
            "agent-123",

          runId:
            "run-456",
        });
      },
    );

    it(
      "accepts unrelated query parameters without broadening the handoff",
      () => {
        expect(
          parseAssistantAgentHandoff(
            "?source=agents&agentId=agent-1&runId=run-2",
          ),
        ).toEqual({
          agentId:
            "agent-1",

          runId:
            "run-2",
        });
      },
    );

    it(
      "fails closed on duplicate Agent references",
      () => {
        expect(
          parseAssistantAgentHandoff(
            "?agentId=agent-1&agentId=agent-2&runId=run-1",
          ),
        ).toBeNull();

        expect(
          parseAssistantAgentHandoff(
            "?agentId=agent-1&runId=run-1&runId=run-2",
          ),
        ).toBeNull();
      },
    );

    it(
      "rejects incomplete handoff queries",
      () => {
        expect(
          parseAssistantAgentHandoff(
            "?agentId=agent-1",
          ),
        ).toBeNull();

        expect(
          parseAssistantAgentHandoff(
            "?runId=run-1",
          ),
        ).toBeNull();
      },
    );

    it(
      "removes handoff references while preserving unrelated URL state",
      () => {
        expect(
          stripAssistantAgentHandoffFromUrl(
            "https://example.test/ai?agentId=agent-1&runId=run-2&tab=chat#message",
          ),
        ).toBe(
          "/ai?tab=chat#message",
        );
      },
    );

    it(
      "returns a clean Assistant URL when only handoff parameters exist",
      () => {
        expect(
          stripAssistantAgentHandoffFromUrl(
            "/ai?agentId=agent-1&runId=run-2",
          ),
        ).toBe(
          "/ai",
        );
      },
    );
  },
);
