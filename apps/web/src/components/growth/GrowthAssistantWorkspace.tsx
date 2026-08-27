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
  CONTROLLED_PUBLICATION_CHANNEL_ACTION_TYPE,
  CONTROLLED_PUBLICATION_CHANNEL_MAX_CONTENT_LENGTH,
} from "@/lib/ai/controlled-publication-channel-target";

import type {
  ControlledPublicationApiRecord,
} from "@/lib/ai/controlled-publication-runtime";
import {
  buildGrowthPublicationIdempotencyKey,
  type ControlledPublicationDestination,
} from "@/lib/ai/controlled-publication-ui";
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
  publicationAllowed: boolean;
  publicationDestinations:
    ControlledPublicationDestination[];
};

type ChatResponse = {
  message?: string;
  error?: string;
  conversationId?: string | null;
};

type PublicationResponse = {
  publication?:
    ControlledPublicationApiRecord;
  error?: string;
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
  publicationAllowed,
  publicationDestinations,
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
          publicationPrepare:
            "Siapkan draft publikasi",
          publicationTitle:
            "Draft publikasi terkontrol",
          publicationDescription:
            "Tinjau dan edit caption sebelum membuat proposal. Menyiapkan draft tidak mempublikasikan apa pun.",
          publicationDestination:
            "Tujuan publikasi",
          publicationContent:
            "Konten yang akan diajukan",
          publicationSubmit:
            "Buat proposal untuk ditinjau",
          publicationSubmitting:
            "Membuat proposal...",
          publicationNoDestination:
            "Belum ada destination publikasi terverifikasi yang aktif dan dipilih. Koneksi seller Marketplace tidak digunakan sebagai identitas publishing.",
          publicationOwnerOnly:
            "Proposal publikasi hanya tersedia untuk owner atau admin organisasi.",
          publicationTooLong:
            "Hasil caption melebihi batas 5.000 karakter. Ringkas hasil sebelum menyiapkan proposal.",
          publicationError:
            "Proposal publikasi tidak dapat dibuat. Tidak ada konten yang dipublikasikan.",
          publicationSuccess:
            "Proposal tersimpan di Action Center. Belum ada publikasi eksternal.",
          publicationOpenActionCenter:
            "Buka Action Center",
          publicationReset:
            "Batalkan draft",
          publicationSafety:
            "Konfirmasi proposal tidak mempublikasikan konten. Eksekusi channel tetap dinonaktifkan sampai executor provider SG5 selesai direview.",
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
          publicationPrepare:
            "Prepare publication draft",
          publicationTitle:
            "Controlled publication draft",
          publicationDescription:
            "Review and edit the caption before creating a proposal. Preparing a draft does not publish anything.",
          publicationDestination:
            "Publication destination",
          publicationContent:
            "Content to propose",
          publicationSubmit:
            "Create proposal for review",
          publicationSubmitting:
            "Creating proposal...",
          publicationNoDestination:
            "No verified active selected publishing destination is available. Seller Marketplace connections are not used as publishing identities.",
          publicationOwnerOnly:
            "Publication proposals are available only to organization owners or admins.",
          publicationTooLong:
            "The caption result exceeds the 5,000 character limit. Shorten it before preparing a proposal.",
          publicationError:
            "The publication proposal could not be created. No content was published.",
          publicationSuccess:
            "The proposal is stored in Action Center. Nothing has been published externally.",
          publicationOpenActionCenter:
            "Open Action Center",
          publicationReset:
            "Discard draft",
          publicationSafety:
            "Confirming the proposal does not publish content. Channel execution remains disabled until the SG5 provider executor is separately reviewed.",
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

  const [
    publicationDraft,
    setPublicationDraft,
  ] =
    useState<string | null>(
      null,
    );

  const [
    publicationDestinationId,
    setPublicationDestinationId,
  ] =
    useState(
      publicationDestinations[0]
        ?.id ??
        "",
    );

  const [
    publicationSubmitting,
    setPublicationSubmitting,
  ] =
    useState(false);

  const [
    publicationError,
    setPublicationError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    createdPublication,
    setCreatedPublication,
  ] =
    useState<
      ControlledPublicationApiRecord | null
    >(
      null,
    );

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

  const selectedPublicationDestination =
    useMemo(
      () =>
        publicationDestinations.find(
          (destination) =>
            destination.id ===
            publicationDestinationId,
        ) ??
        publicationDestinations[0] ??
        null,
      [
        publicationDestinationId,
        publicationDestinations,
      ],
    );

  async function generate() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setPublicationDraft(null);
    setPublicationError(null);
    setCreatedPublication(null);

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
  function resetPublicationDraft() {
    setPublicationDraft(
      null,
    );
    setPublicationError(
      null,
    );
    setCreatedPublication(
      null,
    );
  }

  function preparePublication() {
    if (
      !result ||
      selectedTask !==
        "captions" ||
      publicationSubmitting
    ) {
      return;
    }

    if (!publicationAllowed) {
      setPublicationError(
        copy.publicationOwnerOnly,
      );
      return;
    }

    if (
      publicationDestinations.length ===
        0
    ) {
      setPublicationError(
        copy.publicationNoDestination,
      );
      return;
    }

    if (
      result.length >
        CONTROLLED_PUBLICATION_CHANNEL_MAX_CONTENT_LENGTH
    ) {
      setPublicationError(
        copy.publicationTooLong,
      );
      return;
    }

    setPublicationDraft(
      result,
    );
    setPublicationDestinationId(
      selectedPublicationDestination
        ?.id ??
        publicationDestinations[0]
          ?.id ??
        "",
    );
    setPublicationError(
      null,
    );
    setCreatedPublication(
      null,
    );
  }

  async function submitPublication() {
    if (
      publicationSubmitting ||
      !publicationDraft ||
      !selectedPublicationDestination
    ) {
      return;
    }

    setPublicationSubmitting(
      true,
    );
    setPublicationError(
      null,
    );

    try {
      const idempotencyKey =
        await buildGrowthPublicationIdempotencyKey(
          selectedPublicationDestination
            .id,
          publicationDraft,
        );

      if (!idempotencyKey) {
        throw new Error(
          copy.publicationError,
        );
      }

      const response =
        await fetch(
          "/api/ai/controlled-publications",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actionType:
                  CONTROLLED_PUBLICATION_CHANNEL_ACTION_TYPE,

                publishingDestinationId:
                  selectedPublicationDestination
                    .id,

                content:
                  publicationDraft,

                idempotencyKey,
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
        body !==
          null
          ? body as
              PublicationResponse
          : {};

      if (
        !response.ok ||
        !data.publication
      ) {
        throw new Error(
          data.error?.trim() ||
            copy.publicationError,
        );
      }

      setCreatedPublication(
        data.publication,
      );
    } catch (cause) {
      setPublicationError(
        cause instanceof
          Error &&
        cause.message.trim()
          ? cause.message
          : copy.publicationError,
      );
    } finally {
      setPublicationSubmitting(
        false,
      );
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
                          resetPublicationDraft();
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

          {result &&
          selectedTask ===
            "captions" ? (
            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.025] p-4 md:p-5">
              {!publicationDraft ? (
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {copy.publicationTitle}
                      </p>

                      <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                        {copy.publicationDescription}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        loading ||
                        publicationSubmitting ||
                        !publicationAllowed ||
                        publicationDestinations.length ===
                          0 ||
                        result.length >
                          CONTROLLED_PUBLICATION_CHANNEL_MAX_CONTENT_LENGTH
                      }
                      onClick={
                        preparePublication
                      }
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {copy.publicationPrepare}
                    </button>
                  </div>

                  {!publicationAllowed ? (
                    <p className="mt-3 text-xs leading-5 text-amber-700">
                      {copy.publicationOwnerOnly}
                    </p>
                  ) : publicationDestinations.length ===
                    0 ? (
                    <p className="mt-3 text-xs leading-5 text-amber-700">
                      {copy.publicationNoDestination}
                    </p>
                  ) : result.length >
                    CONTROLLED_PUBLICATION_CHANNEL_MAX_CONTENT_LENGTH ? (
                    <p className="mt-3 text-xs leading-5 text-amber-700">
                      {copy.publicationTooLong}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {copy.publicationTitle}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {copy.publicationSafety}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        publicationSubmitting
                      }
                      onClick={
                        resetPublicationDraft
                      }
                      className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {copy.publicationReset}
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor="growth-publication-destination"
                      className="text-sm font-medium"
                    >
                      {copy.publicationDestination}
                    </label>

                    <select
                      id="growth-publication-destination"
                      value={
                        selectedPublicationDestination
                          ?.id ??
                        ""
                      }
                      disabled={
                        publicationSubmitting ||
                        createdPublication !==
                          null
                      }
                      onChange={
                        (event) => {
                          setPublicationDestinationId(
                            event.target
                              .value,
                          );
                          setPublicationError(
                            null,
                          );
                          setCreatedPublication(
                            null,
                          );
                        }
                      }
                      className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {publicationDestinations.map(
                        (
                          destination,
                        ) => (
                          <option
                            key={
                              destination.id
                            }
                            value={
                              destination.id
                            }
                          >
                            {
                              destination.name
                            }{" "}
                            Â·{" "}
                            {
                              destination.provider
                            }{" "}
                            Â·{" "}
                            {
                              destination.externalDestinationId
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="growth-publication-content"
                      className="text-sm font-medium"
                    >
                      {copy.publicationContent}
                    </label>

                    <textarea
                      id="growth-publication-content"
                      value={
                        publicationDraft
                      }
                      disabled={
                        publicationSubmitting ||
                        createdPublication !==
                          null
                      }
                      maxLength={
                        CONTROLLED_PUBLICATION_CHANNEL_MAX_CONTENT_LENGTH
                      }
                      rows={
                        8
                      }
                      onChange={
                        (event) => {
                          setPublicationDraft(
                            event.target
                              .value,
                          );
                          setPublicationError(
                            null,
                          );
                          setCreatedPublication(
                            null,
                          );
                        }
                      }
                      className="mt-2 w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <p className="mt-2 text-right text-xs text-muted-foreground">
                      {
                        publicationDraft.length
                      }/
                      {
                        CONTROLLED_PUBLICATION_CHANNEL_MAX_CONTENT_LENGTH
                      }
                    </p>
                  </div>

                  {publicationError ? (
                    <div
                      role="alert"
                      className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm leading-6 text-destructive"
                    >
                      {publicationError}
                    </div>
                  ) : null}

                  {createdPublication ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p className="font-semibold">
                        {copy.publicationSuccess}
                      </p>

                      <p className="mt-1 break-all font-mono text-xs">
                        {createdPublication.id}
                      </p>

                      <Link
                        href="/ai/action-center"
                        className="mt-3 inline-flex h-9 items-center rounded-lg border border-emerald-300 bg-white px-3 text-sm font-medium"
                      >
                        {copy.publicationOpenActionCenter}
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        publicationSubmitting ||
                        !publicationDraft.trim() ||
                        !selectedPublicationDestination
                      }
                      onClick={
                        () => {
                          void submitPublication();
                        }
                      }
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {publicationSubmitting ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}

                      {
                        publicationSubmitting
                          ? copy.publicationSubmitting
                          : copy.publicationSubmit
                      }
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {copy.evidence}
          </p>
        </section>
      </div>
    </div>
  );
}