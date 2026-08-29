import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks =
  vi.hoisted(() => ({
    logServerError:
      vi.fn(),
  }));

vi.mock(
  "@/lib/observability/server-logger",
  () => ({
    logServerError:
      mocks.logServerError,
  }),
);

import {
  logAiChatFailure,
  type AiChatFailureOperation,
} from "./ai-chat-observability";

beforeEach(() => {
  mocks.logServerError
    .mockReset();
});

describe(
  "AI chat observability",
  () => {
    it.each([
      [
        "memory_command_conversation_touch",
        "ai_chat_memory_command_conversation_touch_failed",
      ],
      [
        "conversation_validate",
        "ai_chat_conversation_validate_failed",
      ],
      [
        "user_message_persist",
        "ai_chat_user_message_persist_failed",
      ],
      [
        "user_message_conversation_touch",
        "ai_chat_user_message_conversation_touch_failed",
      ],
      [
        "memory_command_response_persist",
        "ai_chat_memory_command_response_persist_failed",
      ],
      [
        "explicit_memory_save",
        "ai_chat_explicit_memory_save_failed",
      ],
      [
        "explicit_memory_forget_load",
        "ai_chat_explicit_memory_forget_load_failed",
      ],
      [
        "explicit_memory_forget_delete",
        "ai_chat_explicit_memory_forget_delete_failed",
      ],
    ] as const)(
      "maps %s to bounded structured metadata",
      (
        operation,
        event,
      ) => {
        const error =
          new Error(
            "database failure",
          );

        logAiChatFailure({
          operation:
            operation as AiChatFailureOperation,
          requestId:
            "request-chat-123",
          error,
        });

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledWith({
          event,
          requestId:
            "request-chat-123",
          route:
            "/api/ai/chat",
          method:
            "POST",
          provider:
            "supabase",
          operation,
          error,
        });
      },
    );

    it(
      "does not include chat, user, organization, or memory identifiers",
      () => {
        const error =
          new Error(
            "failure",
          );

        logAiChatFailure({
          operation:
            "explicit_memory_forget_delete",
          error,
        });

        const input =
          mocks.logServerError
            .mock.calls[0]?.[0];

        expect(
          input,
        ).toEqual(
          expect.objectContaining({
            requestId:
              null,
            error,
          }),
        );

        expect(
          input,
        ).not.toHaveProperty(
          "conversationId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "organizationId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "userId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "memoryId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "memoryKey",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "memoryType",
        );
      },
    );
  },
);