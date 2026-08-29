import {
  logServerError,
} from "@/lib/observability/server-logger";

export type AiChatFailureOperation =
  | "memory_command_conversation_touch"
  | "conversation_validate"
  | "user_message_persist"
  | "user_message_conversation_touch"
  | "memory_command_response_persist"
  | "explicit_memory_save"
  | "explicit_memory_forget_load"
  | "explicit_memory_forget_delete"
  | "business_profile_context_load"
  | "active_memories_context_load"
  | "assistant_message_persist"
  | "assistant_message_conversation_touch";

type AiChatFailureInput = {
  operation:
    AiChatFailureOperation;
  requestId?: string | null;
  error: unknown;
};

const FAILURE_METADATA:
  Record<
    AiChatFailureOperation,
    {
      event: string;
      provider: string;
    }
  > = {
    memory_command_conversation_touch: {
      event:
        "ai_chat_memory_command_conversation_touch_failed",
      provider:
        "supabase",
    },
    conversation_validate: {
      event:
        "ai_chat_conversation_validate_failed",
      provider:
        "supabase",
    },
    user_message_persist: {
      event:
        "ai_chat_user_message_persist_failed",
      provider:
        "supabase",
    },
    user_message_conversation_touch: {
      event:
        "ai_chat_user_message_conversation_touch_failed",
      provider:
        "supabase",
    },
    memory_command_response_persist: {
      event:
        "ai_chat_memory_command_response_persist_failed",
      provider:
        "supabase",
    },
    explicit_memory_save: {
      event:
        "ai_chat_explicit_memory_save_failed",
      provider:
        "supabase",
    },
    explicit_memory_forget_load: {
      event:
        "ai_chat_explicit_memory_forget_load_failed",
      provider:
        "supabase",
    },
    explicit_memory_forget_delete: {
      event:
        "ai_chat_explicit_memory_forget_delete_failed",
      provider:
        "supabase",
    },
    business_profile_context_load: {
      event:
        "ai_chat_business_profile_context_load_failed",
      provider:
        "supabase",
    },
    active_memories_context_load: {
      event:
        "ai_chat_active_memories_context_load_failed",
      provider:
        "supabase",
    },
    assistant_message_persist: {
      event:
        "ai_chat_assistant_message_persist_failed",
      provider:
        "supabase",
    },
    assistant_message_conversation_touch: {
      event:
        "ai_chat_assistant_message_conversation_touch_failed",
      provider:
        "supabase",
    },
  };

export function logAiChatFailure({
  operation,
  requestId = null,
  error,
}: AiChatFailureInput) {
  const metadata =
    FAILURE_METADATA[operation];

  logServerError({
    event:
      metadata.event,
    requestId,
    route:
      "/api/ai/chat",
    method:
      "POST",
    provider:
      metadata.provider,
    operation,
    error,
  });
}