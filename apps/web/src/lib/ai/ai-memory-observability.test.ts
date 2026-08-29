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
  logAiMemoryFailure,
  type AiMemoryFailureOperation,
} from "./ai-memory-observability";

beforeEach(() => {
  mocks.logServerError
    .mockReset();
});

describe(
  "AI memory observability",
  () => {
    it.each([
      [
        "memory_list",
        "ai_memory_list_failed",
        "/api/ai/memories",
        "GET",
      ],
      [
        "memory_source_conversation_validate_create",
        "ai_memory_source_conversation_validate_create_failed",
        "/api/ai/memories",
        "POST",
      ],
      [
        "memory_create",
        "ai_memory_create_failed",
        "/api/ai/memories",
        "POST",
      ],
      [
        "memory_load",
        "ai_memory_load_failed",
        "/api/ai/memories/[id]",
        "GET",
      ],
      [
        "memory_source_conversation_validate_update",
        "ai_memory_source_conversation_validate_update_failed",
        "/api/ai/memories/[id]",
        "PATCH",
      ],
      [
        "memory_update",
        "ai_memory_update_failed",
        "/api/ai/memories/[id]",
        "PATCH",
      ],
      [
        "memory_delete",
        "ai_memory_delete_failed",
        "/api/ai/memories/[id]",
        "DELETE",
      ],
    ] as const)(
      "maps %s to bounded structured metadata",
      (
        operation,
        event,
        route,
        method,
      ) => {
        const error =
          new Error(
            "database failure",
          );

        logAiMemoryFailure({
          operation:
            operation as AiMemoryFailureOperation,
          requestId:
            "request-memory-123",
          error,
        });

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledWith({
          event,
          requestId:
            "request-memory-123",
          route,
          method,
          provider:
            "supabase",
          operation,
          error,
        });
      },
    );

    it(
      "does not include memory or business identifiers as metadata",
      () => {
        const error =
          new Error(
            "failure",
          );

        logAiMemoryFailure({
          operation:
            "memory_update",
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
          "memoryId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "conversationId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "userId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "organizationId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "memoryKey",
        );
      },
    );
  },
);