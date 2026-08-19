"use client";

import {
  Bot,
  LoaderCircle,
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
  error?: string;
};

const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONTEXT_MESSAGES = 20;

export default function AIChatWorkspace({
  copy,
}: AIChatWorkspaceProps) {
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [input, setInput] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const conversationEndRef =
    useRef<HTMLDivElement | null>(null);

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
    if (isLoading) {
      return;
    }

    const content =
      rawContent.trim();

    if (!content) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content,
    };

    const previousContext =
      messages.slice(
        -(MAX_CONTEXT_MESSAGES - 1),
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
    setErrorMessage(null);
    setIsLoading(true);

    try {
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

  function clearConversation() {
    if (isLoading) {
      return;
    }

    setMessages([]);
    setInput("");
    setErrorMessage(null);
  }

  const hasConversation =
    messages.length > 0;

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

        <button
          type="button"
          onClick={clearConversation}
          disabled={
            !hasConversation ||
            isLoading
          }
          className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />

          {copy.clear}
        </button>
      </div>

      {/* Conversation */}
      <div className="min-h-[430px] max-h-[620px] overflow-y-auto p-4 sm:p-6">
        {!hasConversation ? (
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
                    disabled={isLoading}
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
            disabled={isLoading}
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
