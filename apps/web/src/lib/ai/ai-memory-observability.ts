import {
  logServerError,
} from "@/lib/observability/server-logger";

export type AiMemoryFailureOperation =
  | "memory_list"
  | "memory_source_conversation_validate_create"
  | "memory_create"
  | "memory_load"
  | "memory_source_conversation_validate_update"
  | "memory_update"
  | "memory_delete";

type AiMemoryFailureInput = {
  operation:
    AiMemoryFailureOperation;
  requestId?: string | null;
  error: unknown;
};

const FAILURE_METADATA:
  Record<
    AiMemoryFailureOperation,
    {
      event: string;
      route: string;
      method: string;
    }
  > = {
    memory_list: {
      event:
        "ai_memory_list_failed",
      route:
        "/api/ai/memories",
      method:
        "GET",
    },
    memory_source_conversation_validate_create: {
      event:
        "ai_memory_source_conversation_validate_create_failed",
      route:
        "/api/ai/memories",
      method:
        "POST",
    },
    memory_create: {
      event:
        "ai_memory_create_failed",
      route:
        "/api/ai/memories",
      method:
        "POST",
    },
    memory_load: {
      event:
        "ai_memory_load_failed",
      route:
        "/api/ai/memories/[id]",
      method:
        "GET",
    },
    memory_source_conversation_validate_update: {
      event:
        "ai_memory_source_conversation_validate_update_failed",
      route:
        "/api/ai/memories/[id]",
      method:
        "PATCH",
    },
    memory_update: {
      event:
        "ai_memory_update_failed",
      route:
        "/api/ai/memories/[id]",
      method:
        "PATCH",
    },
    memory_delete: {
      event:
        "ai_memory_delete_failed",
      route:
        "/api/ai/memories/[id]",
      method:
        "DELETE",
    },
  };

export function logAiMemoryFailure({
  operation,
  requestId = null,
  error,
}: AiMemoryFailureInput) {
  const metadata =
    FAILURE_METADATA[operation];

  logServerError({
    event:
      metadata.event,
    requestId,
    route:
      metadata.route,
    method:
      metadata.method,
    provider:
      "supabase",
    operation,
    error,
  });
}