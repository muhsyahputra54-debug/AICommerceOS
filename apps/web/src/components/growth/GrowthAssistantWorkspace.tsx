"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Lightbulb,
  LoaderCircle,
  Megaphone,
  MessageSquareText,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import {
  GROWTH_ASSISTANT_TASKS,
  buildGrowthAssistantPrompt,
  type GrowthAssistantTaskId,
} from "@/lib/ai/growth-assistant";
import type {
  Locale,
} from "@/lib/i18n/config";

type GrowthAssistantWorkspaceProps = {
  locale: Locale;
};

type ChatResponse = {
  message?: string;
  error?: string;
  conversationId?: string | null;
};

const taskIcons: Record<
  GrowthAssistantTaskId,
  LucideIcon
> = {
  "content-ideas":
    Lightbulb,
  "seven-day-plan":
    CalendarDays,
  captions:
    MessageSquareText,
  "promo-ideas":
    Megaphone,
  "product-focus":
    PackageSearch,
  "next-actions":
    TrendingUp,
};

export default function GrowthAssistantWorkspace({
  locale,
}: GrowthAssistantWorkspaceProps) {
  const isId =
    locale === "id";

  const copy =
    isId
      ? {
          eyebrow:
            "GROWTH ASSISTANT",
          title:
            "Ubah data bisnis menjadi ide growth yang lebih terarah.",
          description:
            "Gunakan konteks bisnis, produk, stok, dan performa yang sudah tersedia di LAKUVO untuk menyusun ide konten, rencana pemasaran, draft caption, dan langkah growth berikutnya.",
          safetyTitle:
            "AI membantu merencanakan. Anda tetap bertindak.",
          safetyDescription:
            "Growth Assistant V1 hanya menghasilkan analisis, rekomendasi, dan draft. Tidak ada posting otomatis, pengeluaran iklan, perubahan harga atau stok, tindakan marketplace, maupun eksekusi Action Center.",
          taskTitle:
            "Apa yang ingin Anda kerjakan?",
          taskDescription:
            "Pilih satu fokus. AI hanya berjalan setelah Anda menekan tombol buat.",
          briefLabel:
            "Brief tambahan",
          briefPlaceholder:
            "Contoh: Saya ingin fokus Instagram dan WhatsApp untuk produk yang stoknya masih cukup.",
          briefHelp:
            "Opsional. Jangan masukkan password, token, atau data rahasia.",
          generate:
            "Buat dengan Growth Assistant",
          generating:
            "Growth Assistant sedang menyusun...",
          resultTitle:
            "Hasil Growth Assistant",
          resultEmpty:
            "Pilih fokus dan buat hasil ketika Anda siap.",
          errorFallback:
            "Growth Assistant sementara tidak dapat membuat hasil. Data bisnis Anda tidak diubah.",
          openAssistant:
            "Buka AI Assistant",
          openToday:
            "Kembali ke TODAY",
          clear:
            "Bersihkan hasil",
          evidence:
            "Konteks data tetap mengikuti sumber terverifikasi LAKUVO. Jika data tidak tersedia, AI diarahkan untuk menyatakannya tanpa menebak.",
        }
      : {
          eyebrow:
            "GROWTH ASSISTANT",
          title:
            "Turn business data into more focused growth ideas.",
          description:
            "Use the business, product, inventory, and performance context already available in LAKUVO to create content ideas, marketing plans, caption drafts, and sensible next growth actions.",
          safetyTitle:
            "AI helps plan. You remain in control.",
          safetyDescription:
            "Growth Assistant V1 produces analysis, recommendations, and drafts only. It does not auto-publish, spend on ads, change prices or inventory, operate marketplaces, or execute Action Center actions.",
          taskTitle:
            "What do you want to work on?",
          taskDescription:
            "Choose one focus. AI runs only after you press the generate button.",
          briefLabel:
            "Additional brief",
          briefPlaceholder:
            "Example: Focus on Instagram and WhatsApp for products that currently have enough stock.",
          briefHelp:
            "Optional. Do not enter passwords, tokens, or secrets.",
          generate:
            "Generate with Growth Assistant",
          generating:
            "Growth Assistant is working...",
          resultTitle:
            "Growth Assistant Result",
          resultEmpty:
            "Choose a focus and generate a result when you are ready.",
          errorFallback:
            "Growth Assistant cannot generate a result right now. Your business data was not changed.",
          openAssistant:
            "Open AI Assistant",
          openToday:
            "Back to TODAY",
          clear:
            "Clear result",
          evidence:
            "Data context continues to use verified LAKUVO sources. When data is unavailable, AI is instructed to say so instead of guessing.",
        };

  const [
    selectedTask,
    setSelectedTask,
  ] =
    useState<GrowthAssistantTaskId>(
      "seven-day-plan",
    );

  const [
    objective,
    setObjective,
  ] =
    useState("");

  const [
    result,
    setResult,
  ] =
    useState<string | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const activeTask =
    useMemo(
      () =>
        GROWTH_ASSISTANT_TASKS.find(
          (task) =>
            task.id ===
            selectedTask,
        ) ??
        GROWTH_ASSISTANT_TASKS[0],
      [
        selectedTask,
      ],
    );

  async function generate() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prompt =
        buildGrowthAssistantPrompt({
          taskId:
            selectedTask,
          objective,
          locale:
            isId
              ? "id"
              : "en",
        });

      const response =
        await fetch(
          "/api/ai/chat",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                messages: [
                  {
                    role:
                      "user",

                    content:
                      prompt,
                  },
                ],
              }),
          },
        );

      const body:
        unknown =
        await response
          .json()
          .catch(
            () => null,
          );

      const data =
        typeof body ===
          "object" &&
        body !== null
          ? body as ChatResponse
          : {};

      if (
        !response.ok
      ) {
        throw new Error(
          data.error?.trim() ||
            copy.errorFallback,
        );
      }

      const message =
        data.message?.trim();

      if (!message) {
        throw new Error(
          copy.errorFallback,
        );
      }

      setResult(
        message,
      );
    } catch (cause) {
      setError(
        cause instanceof Error &&
        cause.message.trim()
          ? cause.message
          : copy.errorFallback,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              {copy.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/today"
                className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                {copy.openToday}
              </Link>

              <Link
                href="/ai"
                className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                {copy.openAssistant}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/[0.035] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>

              <div>
                <h2 className="font-semibold">
                  {copy.safetyTitle}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {copy.safetyDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold tracking-tight">
            {copy.taskTitle}
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {copy.taskDescription}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {
              GROWTH_ASSISTANT_TASKS.map(
                (task) => {
                  const Icon =
                    taskIcons[
                      task.id
                    ];

                  const active =
                    selectedTask ===
                    task.id;

                  return (
                    <button
                      key={
                        task.id
                      }
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={
                        () =>
                          setSelectedTask(
                            task.id,
                          )
                      }
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-primary/40 bg-primary/[0.055] shadow-sm"
                          : "bg-background hover:border-primary/20 hover:bg-muted/40"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="mt-3 block text-sm font-semibold">
                        {
                          task.title[
                            isId
                              ? "id"
                              : "en"
                          ]
                        }
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {
                          task.description[
                            isId
                              ? "id"
                              : "en"
                          ]
                        }
                      </span>
                    </button>
                  );
                },
              )
            }
          </div>

          <div className="mt-6">
            <label
              htmlFor="growth-assistant-brief"
              className="text-sm font-medium"
            >
              {copy.briefLabel}
            </label>

            <textarea
              id="growth-assistant-brief"
              value={
                objective
              }
              disabled={
                loading
              }
              maxLength={
                1600
              }
              rows={
                5
              }
              onChange={
                (event) =>
                  setObjective(
                    event.target
                      .value,
                  )
              }
              placeholder={
                copy.briefPlaceholder
              }
              className="mt-2 w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-6 outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-2 flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>
                {copy.briefHelp}
              </span>

              <span>
                {
                  objective.length
                }/1600
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={
              loading
            }
            onClick={
              generate
            }
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {
              loading
                ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )
                : (
                    <Sparkles className="h-4 w-4" />
                  )
            }

            {
              loading
                ? copy.generating
                : copy.generate
            }
          </button>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {
                  activeTask.title[
                    isId
                      ? "id"
                      : "en"
                  ]
                }
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                {copy.resultTitle}
              </h2>
            </div>

            {
              result
                ? (
                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={
                        () => {
                          setResult(
                            null,
                          );
                          setError(
                            null,
                          );
                        }
                      }
                      className="inline-flex h-9 items-center rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {copy.clear}
                    </button>
                  )
                : null
            }
          </div>

          {
            error
              ? (
                  <div
                    role="alert"
                    className="mt-6 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm leading-6 text-destructive"
                  >
                    {error}
                  </div>
                )
              : null
          }

          <div className="mt-6 min-h-[340px] rounded-2xl border bg-background p-5 md:p-6">
            {
              loading
                ? (
                    <div className="flex min-h-[290px] items-center justify-center">
                      <div className="text-center">
                        <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-primary" />

                        <p className="mt-3 text-sm text-muted-foreground">
                          {copy.generating}
                        </p>
                      </div>
                    </div>
                  )
                : result
                  ? (
                      <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                        {result}
                      </div>
                    )
                  : (
                      <div className="flex min-h-[290px] items-center justify-center text-center">
                        <div className="max-w-sm">
                          <Sparkles className="mx-auto h-7 w-7 text-muted-foreground" />

                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {copy.resultEmpty}
                          </p>
                        </div>
                      </div>
                    )
            }
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {copy.evidence}
          </p>
        </section>
      </div>
    </div>
  );
}