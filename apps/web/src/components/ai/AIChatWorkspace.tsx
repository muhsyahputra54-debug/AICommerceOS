"use client";

import {
  Archive,
  Bot,
  Brain,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AIChatWorkspaceCopy = {
  assistantTitle: string;
  assistantStatus: string;

  welcomeTitle: string;
  welcomeDescription: string;

  inputPlaceholder: string;

  send: string;
  clear: string;

  memoryButton: string;
  memoryTitle: string;
  memoryDescription: string;
  memoryEmpty: string;
  memoryLoading: string;
  memoryActive: string;
  memoryArchived: string;
  memoryDisable: string;
  memoryRestore: string;
  memoryDelete: string;
  memoryDeleteConfirm: string;
  memoryError: string;

  memoryTypePreference: string;
  memoryTypeGoal: string;
  memoryTypeConstraint: string;
  memoryTypeBusinessContext: string;

  thinking: string;

  userLabel: string;
  assistantLabel: string;

  errorFallback: string;

  suggestions: readonly string[];
};

type AIChatWorkspaceProps = {
  copy: AIChatWorkspaceCopy;
};

type ChatResponse = {
  message?: string;
  conversationId?: string | null;
  error?: string;
};

type ConversationRecord = {
  id: string;
  archived_at?: string | null;
};

type ConversationResponse = {
  conversation?:
    | ConversationRecord
    | null;

  error?: string;
};

type ConversationDetailResponse =
  ConversationResponse & {
    messages?: ChatMessage[];
  };

type AIMemory = {
  id: string;
  memory_type:
    | "preference"
    | "goal"
    | "constraint"
    | "business_context"
    | string;

  memory_key: string;
  content: string;

  source_kind: string;

  source_conversation_id:
    | string
    | null;

  created_at: string;
  updated_at: string;

  last_used_at:
    | string
    | null;

  archived_at:
    | string
    | null;
};

type MemoryListResponse = {
  memories?: AIMemory[];
  error?: string;
};

type MemoryMutationResponse = {
  memory?: AIMemory;
  deleted?: boolean;
  id?: string;
  error?: string;
};

const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONTEXT_MESSAGES = 20;

export default function AIChatWorkspace({
  copy,
}: AIChatWorkspaceProps) {
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [input, setInput] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isConversationLoading,
    setIsConversationLoading,
  ] = useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [
    isMemoryPanelOpen,
    setIsMemoryPanelOpen,
  ] = useState(false);

  const [
    memories,
    setMemories,
  ] =
    useState<AIMemory[]>([]);

  const [
    isMemoryLoading,
    setIsMemoryLoading,
  ] = useState(false);

  const [
    memoryError,
    setMemoryError,
  ] =
    useState<string | null>(null);

  const [
    memoryActionId,
    setMemoryActionId,
  ] =
    useState<string | null>(null);

  const conversationEndRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadConversation() {
      setIsConversationLoading(true);
      setErrorMessage(null);

      try {
        const activeResponse =
          await fetch(
            "/api/ai/conversations",
            {
              cache: "no-store",
              signal:
                controller.signal,
            },
          );

        const activeData =
          (await activeResponse
            .json()
            .catch(
              () => ({}),
            )) as ConversationResponse;

        if (!activeResponse.ok) {
          throw new Error(
            activeData.error?.trim() ||
              copy.errorFallback,
          );
        }

        const activeConversationId =
          activeData.conversation?.id;

        if (!activeConversationId) {
          setConversationId(null);
          setMessages([]);
          return;
        }

        const detailResponse =
          await fetch(
            `/api/ai/conversations/${activeConversationId}`,
            {
              cache: "no-store",
              signal:
                controller.signal,
            },
          );

        const detailData =
          (await detailResponse
            .json()
            .catch(
              () => ({}),
            )) as ConversationDetailResponse;

        if (!detailResponse.ok) {
          throw new Error(
            detailData.error?.trim() ||
              copy.errorFallback,
          );
        }

        if (
          detailData.conversation
            ?.archived_at
        ) {
          setConversationId(null);
          setMessages([]);
          return;
        }

        const persistedMessages =
          Array.isArray(
            detailData.messages,
          )
            ? detailData.messages.filter(
                (message) =>
                  (
                    message.role ===
                      "user" ||
                    message.role ===
                      "assistant"
                  ) &&
                  typeof message.content ===
                    "string" &&
                  Boolean(
                    message.content.trim(),
                  ),
              )
            : [];

        setConversationId(
          activeConversationId,
        );

        setMessages(
          persistedMessages,
        );
      } catch (error) {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        setConversationId(null);
        setMessages([]);

        setErrorMessage(
          error instanceof Error &&
            error.message.trim()
            ? error.message
            : copy.errorFallback,
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsConversationLoading(
            false,
          );
        }
      }
    }

    void loadConversation();

    return () => {
      controller.abort();
    };
  }, [
    copy.errorFallback,
  ]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [
    messages,
    isLoading,
    errorMessage,
  ]);

  async function sendMessage(
    rawContent: string,
  ) {
    if (
      isLoading ||
      isConversationLoading
    ) {
      return;
    }

    const content =
      rawContent.trim();

    if (!content) {
      return;
    }

    if (
      content.length >
      MAX_MESSAGE_LENGTH
    ) {
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    let activeConversationId =
      conversationId;

    try {
      if (!activeConversationId) {
        const createResponse =
          await fetch(
            "/api/ai/conversations",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                firstMessage:
                  content,
              }),
            },
          );

        const createData =
          (await createResponse
            .json()
            .catch(
              () => ({}),
            )) as ConversationResponse;

        const createdId =
          createData.conversation?.id;

        if (
          !createResponse.ok ||
          !createdId
        ) {
          setErrorMessage(
            createData.error?.trim() ||
              copy.errorFallback,
          );

          return;
        }

        activeConversationId =
          createdId;

        setConversationId(
          createdId,
        );
      }

      const userMessage: ChatMessage = {
        role: "user",
        content,
      };

      const previousContext =
        messages.slice(
          -(
            MAX_CONTEXT_MESSAGES -
            1
          ),
        );

      const requestMessages = [
        ...previousContext,
        userMessage,
      ];

      setMessages((current) => [
        ...current,
        userMessage,
      ]);

      setInput("");

      const response =
        await fetch(
          "/api/ai/chat",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              conversationId:
                activeConversationId,

              messages:
                requestMessages,
            }),
          },
        );

      const data =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as ChatResponse;

      if (
        !response.ok ||
        !data.message?.trim()
      ) {
        setErrorMessage(
          data.error?.trim() ||
            copy.errorFallback,
        );

        return;
      }

      if (
        data.conversationId !==
        activeConversationId
      ) {
        setErrorMessage(
          copy.errorFallback,
        );

        return;
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data.message!.trim(),
        },
      ]);
    } catch {
      setErrorMessage(
        copy.errorFallback,
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    void sendMessage(input);
  }

  function handleKeyDown(
    event:
      KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void sendMessage(input);
    }
  }

  async function clearConversation() {
    if (
      isLoading ||
      isConversationLoading
    ) {
      return;
    }

    const activeConversationId =
      conversationId;

    if (!activeConversationId) {
      setMessages([]);
      setInput("");
      setErrorMessage(null);
      return;
    }

    setIsConversationLoading(true);
    setErrorMessage(null);

    try {
      const response =
        await fetch(
          `/api/ai/conversations/${activeConversationId}`,
          {
            method: "PATCH",
          },
        );

      const data =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as ConversationResponse;

      if (!response.ok) {
        setErrorMessage(
          data.error?.trim() ||
            copy.errorFallback,
        );

        return;
      }

      setConversationId(null);
      setMessages([]);
      setInput("");
    } catch {
      setErrorMessage(
        copy.errorFallback,
      );
    } finally {
      setIsConversationLoading(
        false,
      );
    }
  }

  function getMemoryTypeLabel(
    memoryType: string,
  ) {
    switch (memoryType) {
      case "preference":
        return copy.memoryTypePreference;

      case "goal":
        return copy.memoryTypeGoal;

      case "constraint":
        return copy.memoryTypeConstraint;

      case "business_context":
        return copy.memoryTypeBusinessContext;

      default:
        return memoryType;
    }
  }

  async function loadMemories() {
    setIsMemoryLoading(true);
    setMemoryError(null);

    try {
      const response =
        await fetch(
          "/api/ai/memories?includeArchived=true",
          {
            cache: "no-store",
          },
        );

      const data =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as MemoryListResponse;

      if (!response.ok) {
        setMemoryError(
          data.error?.trim() ||
            copy.memoryError,
        );

        return;
      }

      setMemories(
        Array.isArray(
          data.memories,
        )
          ? data.memories
          : [],
      );
    } catch {
      setMemoryError(
        copy.memoryError,
      );
    } finally {
      setIsMemoryLoading(false);
    }
  }

  async function toggleMemoryPanel() {
    if (isMemoryPanelOpen) {
      setIsMemoryPanelOpen(false);
      return;
    }

    setIsMemoryPanelOpen(true);

    await loadMemories();
  }

  async function setMemoryArchived(
    memory: AIMemory,
    archived: boolean,
  ) {
    if (memoryActionId) {
      return;
    }

    setMemoryActionId(
      memory.id,
    );

    setMemoryError(null);

    try {
      const response =
        await fetch(
          `/api/ai/memories/${memory.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              archived,
            }),
          },
        );

      const data =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as MemoryMutationResponse;

      if (
        !response.ok ||
        !data.memory
      ) {
        setMemoryError(
          data.error?.trim() ||
            copy.memoryError,
        );

        return;
      }

      setMemories(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              memory.id
                ? data.memory!
                : item,
          ),
      );
    } catch {
      setMemoryError(
        copy.memoryError,
      );
    } finally {
      setMemoryActionId(
        null,
      );
    }
  }

  async function permanentlyForgetMemory(
    memory: AIMemory,
  ) {
    if (
      memoryActionId ||
      !window.confirm(
        copy.memoryDeleteConfirm,
      )
    ) {
      return;
    }

    setMemoryActionId(
      memory.id,
    );

    setMemoryError(null);

    try {
      const response =
        await fetch(
          `/api/ai/memories/${memory.id}`,
          {
            method: "DELETE",
          },
        );

      const data =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as MemoryMutationResponse;

      if (
        !response.ok ||
        data.deleted !== true
      ) {
        setMemoryError(
          data.error?.trim() ||
            copy.memoryError,
        );

        return;
      }

      setMemories(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              memory.id,
          ),
      );
    } catch {
      setMemoryError(
        copy.memoryError,
      );
    } finally {
      setMemoryActionId(
        null,
      );
    }
  }

  const hasConversation =
    messages.length > 0;

  const canClearConversation =
    Boolean(conversationId) ||
    hasConversation;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Assistant Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>

          <div>
            <h2 className="font-semibold">
              {copy.assistantTitle}
            </h2>

            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />

              <span>
                {copy.assistantStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void toggleMemoryPanel();
            }}
            disabled={
              isMemoryLoading
            }
            aria-expanded={
              isMemoryPanelOpen
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMemoryLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}

            {copy.memoryButton}
          </button>

          <button
            type="button"
            onClick={clearConversation}
            disabled={
              !canClearConversation ||
              isLoading ||
              isConversationLoading
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />

            {copy.clear}
          </button>
        </div>
      </div>

      {isMemoryPanelOpen ? (
        <div className="border-b bg-muted/20 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h3 className="font-semibold">
                {copy.memoryTitle}
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {copy.memoryDescription}
              </p>
            </div>
          </div>

          {memoryError ? (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {memoryError}
            </div>
          ) : null}

          {isMemoryLoading ? (
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />

              {copy.memoryLoading}
            </div>
          ) : memories.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              {copy.memoryEmpty}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {memories.map(
                (memory) => {
                  const isArchived =
                    Boolean(
                      memory.archived_at,
                    );

                  const isActing =
                    memoryActionId ===
                    memory.id;

                  return (
                    <div
                      key={memory.id}
                      className="rounded-xl border bg-background p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              {getMemoryTypeLabel(
                                memory.memory_type,
                              )}
                            </span>

                            <span
                              className={
                                isArchived
                                  ? "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                                  : "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700"
                              }
                            >
                              {isArchived
                                ? copy.memoryArchived
                                : copy.memoryActive}
                            </span>
                          </div>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                            {memory.content}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={
                              isActing
                            }
                            onClick={() => {
                              void setMemoryArchived(
                                memory,
                                !isArchived,
                              );
                            }}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isActing ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : isArchived ? (
                              <RotateCcw className="h-4 w-4" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}

                            {isArchived
                              ? copy.memoryRestore
                              : copy.memoryDisable}
                          </button>

                          <button
                            type="button"
                            disabled={
                              isActing
                            }
                            onClick={() => {
                              void permanentlyForgetMemory(
                                memory,
                              );
                            }}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />

                            {copy.memoryDelete}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Conversation */}
      <div className="min-h-[430px] max-h-[620px] overflow-y-auto p-4 sm:p-6">
        {isConversationLoading ? (
          <div className="flex min-h-[380px] items-center justify-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasConversation ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              {copy.welcomeTitle}
            </h3>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {copy.welcomeDescription}
            </p>

            <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {copy.suggestions.map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isLoading || isConversationLoading}
                    onClick={() => {
                      void sendMessage(
                        suggestion,
                      );
                    }}
                    className="rounded-xl border bg-background p-3 text-left text-sm leading-5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map(
              (message, index) => {
                const isUser =
                  message.role ===
                  "user";

                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      isUser
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    <div
                      className={
                        isUser
                          ? "flex max-w-[85%] flex-row-reverse items-start gap-3"
                          : "flex max-w-[85%] items-start gap-3"
                      }
                    >
                      <div
                        className={
                          isUser
                            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                        }
                      >
                        {isUser ? (
                          <UserRound className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>

                      <div>
                        <p
                          className={
                            isUser
                              ? "mb-1 text-right text-xs text-muted-foreground"
                              : "mb-1 text-xs text-muted-foreground"
                          }
                        >
                          {isUser
                            ? copy.userLabel
                            : copy.assistantLabel}
                        </p>

                        <div
                          className={
                            isUser
                              ? "whitespace-pre-wrap rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground"
                              : "whitespace-pre-wrap rounded-2xl rounded-tl-md bg-muted px-4 py-3 text-sm leading-6"
                          }
                        >
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
            )}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      {copy.assistantLabel}
                    </p>

                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                      <LoaderCircle className="h-4 w-4 animate-spin" />

                      {copy.thinking}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            ) : null}

            <div
              ref={conversationEndRef}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t bg-background/50 p-4">
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <textarea
            value={input}
            rows={3}
            maxLength={
              MAX_MESSAGE_LENGTH
            }
            disabled={isLoading || isConversationLoading}
            placeholder={
              copy.inputPlaceholder
            }
            onChange={(event) => {
              setInput(
                event.target.value,
              );
            }}
            onKeyDown={
              handleKeyDown
            }
            className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm leading-6 outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {input.length}/
              {MAX_MESSAGE_LENGTH}
            </span>

            <button
              type="submit"
              disabled={
                isLoading ||
                input.trim().length === 0
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {copy.send}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
