import {
  logServerError,
} from "@/lib/observability/server-logger";

export type AiPersistenceFailureOperation =
  | "business_profile_load"
  | "business_profile_check_existing"
  | "business_profile_update"
  | "business_profile_update_after_concurrent_create"
  | "business_profile_create"
  | "conversation_load_latest"
  | "conversation_create"
  | "conversation_load"
  | "conversation_messages_load"
  | "conversation_archive";

type AiPersistenceFailureInput = {
  operation:
    AiPersistenceFailureOperation;
  requestId?: string | null;
  error: unknown;
};

const FAILURE_METADATA:
  Record<
    AiPersistenceFailureOperation,
    {
      event: string;
      route: string;
      method: string;
    }
  > = {
    business_profile_load: {
      event:
        "ai_business_profile_load_failed",
      route:
        "/api/ai/business-profile",
      method:
        "GET",
    },
    business_profile_check_existing: {
      event:
        "ai_business_profile_check_existing_failed",
      route:
        "/api/ai/business-profile",
      method:
        "PUT",
    },
    business_profile_update: {
      event:
        "ai_business_profile_update_failed",
      route:
        "/api/ai/business-profile",
      method:
        "PUT",
    },
    business_profile_update_after_concurrent_create: {
      event:
        "ai_business_profile_concurrent_update_failed",
      route:
        "/api/ai/business-profile",
      method:
        "PUT",
    },
    business_profile_create: {
      event:
        "ai_business_profile_create_failed",
      route:
        "/api/ai/business-profile",
      method:
        "PUT",
    },
    conversation_load_latest: {
      event:
        "ai_conversation_load_latest_failed",
      route:
        "/api/ai/conversations",
      method:
        "GET",
    },
    conversation_create: {
      event:
        "ai_conversation_create_failed",
      route:
        "/api/ai/conversations",
      method:
        "POST",
    },
    conversation_load: {
      event:
        "ai_conversation_load_failed",
      route:
        "/api/ai/conversations/[id]",
      method:
        "GET",
    },
    conversation_messages_load: {
      event:
        "ai_conversation_messages_load_failed",
      route:
        "/api/ai/conversations/[id]",
      method:
        "GET",
    },
    conversation_archive: {
      event:
        "ai_conversation_archive_failed",
      route:
        "/api/ai/conversations/[id]",
      method:
        "PATCH",
    },
  };

export function logAiPersistenceFailure({
  operation,
  requestId = null,
  error,
}: AiPersistenceFailureInput) {
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