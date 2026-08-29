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
  logAiPersistenceFailure,
  type AiPersistenceFailureOperation,
} from "./ai-persistence-observability";

beforeEach(() => {
  mocks.logServerError
    .mockReset();
});

describe(
  "AI persistence observability",
  () => {
    it.each([
      [
        "business_profile_load",
        "ai_business_profile_load_failed",
        "/api/ai/business-profile",
        "GET",
      ],
      [
        "business_profile_check_existing",
        "ai_business_profile_check_existing_failed",
        "/api/ai/business-profile",
        "PUT",
      ],
      [
        "business_profile_update",
        "ai_business_profile_update_failed",
        "/api/ai/business-profile",
        "PUT",
      ],
      [
        "business_profile_update_after_concurrent_create",
        "ai_business_profile_concurrent_update_failed",
        "/api/ai/business-profile",
        "PUT",
      ],
      [
        "business_profile_create",
        "ai_business_profile_create_failed",
        "/api/ai/business-profile",
        "PUT",
      ],
      [
        "conversation_load_latest",
        "ai_conversation_load_latest_failed",
        "/api/ai/conversations",
        "GET",
      ],
      [
        "conversation_create",
        "ai_conversation_create_failed",
        "/api/ai/conversations",
        "POST",
      ],
      [
        "conversation_load",
        "ai_conversation_load_failed",
        "/api/ai/conversations/[id]",
        "GET",
      ],
      [
        "conversation_messages_load",
        "ai_conversation_messages_load_failed",
        "/api/ai/conversations/[id]",
        "GET",
      ],
      [
        "conversation_archive",
        "ai_conversation_archive_failed",
        "/api/ai/conversations/[id]",
        "PATCH",
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

        logAiPersistenceFailure({
          operation:
            operation as AiPersistenceFailureOperation,
          requestId:
            "request-test-123",
          error,
        });

        expect(
          mocks.logServerError,
        ).toHaveBeenCalledWith({
          event,
          requestId:
            "request-test-123",
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
      "does not accept business identifiers as log metadata",
      () => {
        const error =
          new Error(
            "failure",
          );

        logAiPersistenceFailure({
          operation:
            "conversation_archive",
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
          "conversationId",
        );
        expect(
          input,
        ).not.toHaveProperty(
          "memoryId",
        );
      },
    );
  },
);