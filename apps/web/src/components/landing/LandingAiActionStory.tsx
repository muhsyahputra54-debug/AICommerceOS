"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRoundCheck,
} from "lucide-react";

type LandingAiActionStoryProps = {
  locale: string;
};

const STAGE_INTERVAL_MS =
  2500;

export function LandingAiActionStory({
  locale,
}: LandingAiActionStoryProps) {
  const isId =
    locale === "id";

  const copy =
    isId
      ? {
          eyebrow:
            "AI YANG BERTINDAK DENGAN KONTROL",
          title:
            "Dari insight menjadi tindakan—tanpa kehilangan kendali.",
          description:
            "LAKUVO AI memahami konteks bisnis, menyusun rekomendasi, lalu Action Center memisahkan review, konfirmasi, dan eksekusi untuk tindakan penting.",
          principle:
            "AI membantu. Anda tetap memutuskan.",
          signal:
            "Sinyal Bisnis",
          signalTitle:
            "3 SKU berisiko stock-out dalam 2 hari",
          signalMeta:
            "Inventori • Revenue impact tinggi",
          assistant:
            "LAKUVO AI",
          analyzing:
            "Menganalisis data terverifikasi",
          analysis:
            "Ketiga SKU menyumbang 41% revenue kategori Fashion minggu ini. Stock-out berpotensi mengganggu penjualan produk dengan demand tertinggi.",
          recommendation:
            "Rekomendasi",
          recommendationText:
            "Prioritaskan restock untuk 3 SKU dan review pemasok dengan lead time tercepat.",
          actionCenter:
            "ACTION CENTER",
          proposed:
            "Proposed Action",
          actionTitle:
            "Buat restock request untuk 3 SKU",
          scope:
            "Scope",
          scopeValue:
            "3 SKU • 1 pemasok • tanpa pembayaran otomatis",
          review:
            "Tinjau",
          confirm:
            "Konfirmasi",
          confirmed:
            "Dikonfirmasi",
          executing:
            "Menjalankan tindakan terkontrol",
          completed:
            "Restock request berhasil dibuat",
          audit:
            "Tindakan tercatat di activity log",
          stageSignal:
            "Signal",
          stageAnalyze:
            "Analyze",
          stageRecommend:
            "Recommend",
          stageReview:
            "Review",
          stageConfirm:
            "Confirm",
          stageComplete:
            "Complete",
          safety:
            "Tidak ada tindakan penting dieksekusi sebelum konfirmasi.",
        }
      : {
          eyebrow:
            "AI THAT ACTS WITH CONTROL",
          title:
            "From insight to action—without losing control.",
          description:
            "LAKUVO AI understands business context and prepares recommendations, while Action Center separates review, confirmation, and execution for important actions.",
          principle:
            "AI assists. You still decide.",
          signal:
            "Business Signal",
          signalTitle:
            "3 SKUs may stock out within 2 days",
          signalMeta:
            "Inventory • High revenue impact",
          assistant:
            "LAKUVO AI",
          analyzing:
            "Analyzing verified data",
          analysis:
            "The three SKUs contribute 41% of Fashion category revenue this week. A stockout could affect the highest-demand products.",
          recommendation:
            "Recommendation",
          recommendationText:
            "Prioritize replenishment for the 3 SKUs and review the supplier with the shortest lead time.",
          actionCenter:
            "ACTION CENTER",
          proposed:
            "Proposed Action",
          actionTitle:
            "Create a restock request for 3 SKUs",
          scope:
            "Scope",
          scopeValue:
            "3 SKUs • 1 supplier • no automatic payment",
          review:
            "Review",
          confirm:
            "Confirm",
          confirmed:
            "Confirmed",
          executing:
            "Executing controlled action",
          completed:
            "Restock request successfully created",
          audit:
            "Action recorded in the activity log",
          stageSignal:
            "Signal",
          stageAnalyze:
            "Analyze",
          stageRecommend:
            "Recommend",
          stageReview:
            "Review",
          stageConfirm:
            "Confirm",
          stageComplete:
            "Complete",
          safety:
            "No important action executes before confirmation.",
        };

  const stages =
    [
      copy.stageSignal,
      copy.stageAnalyze,
      copy.stageRecommend,
      copy.stageReview,
      copy.stageConfirm,
      copy.stageComplete,
    ];

  const [
    activeStage,
    setActiveStage,
  ] =
    useState(0);

  const [
    reducedMotion,
    setReducedMotion,
  ] =
    useState(false);

  const sectionRef =
    useRef<HTMLElement>(
      null,
    );

  const [
    sectionVisible,
    setSectionVisible,
  ] =
    useState(false);

  const [
    sectionActive,
    setSectionActive,
  ] =
    useState(false);

  useEffect(
    () => {
      const node =
        sectionRef.current;

      if (!node) {
        return;
      }

      if (
        typeof IntersectionObserver ===
        "undefined"
      ) {
        const timer =
          window.setTimeout(
            () => {
              setSectionVisible(
                true,
              );

              setSectionActive(
                true,
              );
            },
            0,
          );

        return () => {
          window.clearTimeout(
            timer,
          );
        };
      }

      const observer =
        new IntersectionObserver(
          (
            entries,
          ) => {
            const entry =
              entries[0];

            const visible =
              Boolean(
                entry?.isIntersecting,
              );

            setSectionActive(
              visible,
            );

            if (visible) {
              setSectionVisible(
                true,
              );
            }
          },
          {
            threshold:
              0.16,
          },
        );

      observer.observe(
        node,
      );

      return () => {
        observer.disconnect();
      };
    },
    [],
  );

  useEffect(
    () => {
      const media =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );

      const sync =
        () => {
          setReducedMotion(
            media.matches,
          );
        };

      sync();

      media.addEventListener(
        "change",
        sync,
      );

      return () => {
        media.removeEventListener(
          "change",
          sync,
        );
      };
    },
    [],
  );

  useEffect(
    () => {
      if (
        reducedMotion ||
        !sectionActive
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () => {
            setActiveStage(
              (current) =>
                (
                  current + 1
                ) %
                stages.length,
            );
          },
          STAGE_INTERVAL_MS,
        );

      return () => {
        window.clearInterval(
          timer,
        );
      };
    },
    [
      reducedMotion,
      sectionActive,
      stages.length,
    ],
  );

  const showAnalysis =
    activeStage >= 1;

  const showRecommendation =
    activeStage >= 2;

  const showAction =
    activeStage >= 3;

  const showConfirmed =
    activeStage >= 4;

  const showCompleted =
    activeStage >= 5;

  return (
    <section
      ref={sectionRef}
      id="ai-action-story"
      className="relative overflow-hidden"
    >
      <div
        className="pointer-events-none absolute right-[8%] top-[18%] -z-10 h-[420px] w-[420px] rounded-full bg-primary/[0.08] blur-3xl"
        aria-hidden="true"
      />

      <div
        className={`mx-auto max-w-[1440px] px-5 py-20 transition-all duration-700 ease-out sm:px-8 lg:px-12 ${
          reducedMotion ||
          sectionVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-primary">
            {copy.eyebrow}
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[44px] lg:leading-[1.08]">
            {copy.title}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-muted-foreground">
            {copy.description}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.035] px-4 py-2 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            {copy.principle}
          </div>
        </div>

        <div className="relative mx-auto mt-12 max-w-[1120px]">
          <div className="absolute inset-8 -z-10 rounded-[44px] bg-primary/10 blur-3xl" />

          <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-2xl shadow-primary/[0.07]">
            <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>

                <div>
                  <div className="text-sm font-bold">
                    LAKUVO Intelligence Flow
                  </div>

                  <div className="text-[10px] text-muted-foreground">
                    {
                      isId
                        ? "Verified data → recommendation → controlled action"
                        : "Verified data → recommendation → controlled action"
                    }
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {stages.map(
                  (
                    stage,
                    index,
                  ) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={
                        () => {
                          setActiveStage(
                            index,
                          );
                        }
                      }
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        index === activeStage
                          ? "w-8 bg-primary"
                          : index < activeStage
                            ? "w-3 bg-primary/50"
                            : "w-3 bg-primary/15 hover:bg-primary/30"
                      }`}
                      aria-label={stage}
                      title={stage}
                    />
                  ),
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              <div className="border-b border-border/60 p-5 lg:border-b-0 lg:border-r lg:p-6">
                <div className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground">
                  {copy.signal}
                </div>

                <div
                  className={`mt-3 rounded-2xl border p-4 transition-all duration-500 ${
                    activeStage >= 0
                      ? "border-amber-500/25 bg-amber-500/[0.045]"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <TriangleAlert className="h-4 w-4" />
                    </span>

                    <div>
                      <div className="text-sm font-bold leading-5">
                        {copy.signalTitle}
                      </div>

                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {copy.signalMeta}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-3 rounded-2xl border p-4 transition-all duration-500 ${
                    showAnalysis
                      ? "border-primary/20 bg-primary/[0.035] opacity-100"
                      : "border-border/50 bg-muted/20 opacity-45"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                      <div className="text-[9px] font-bold tracking-[0.13em] text-primary">
                        {copy.assistant}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold">
                        {
                          showAnalysis
                            ? copy.analyzing
                            : (
                              isId
                                ? "Menunggu sinyal"
                                : "Waiting for signal"
                            )
                        }

                        {
                          showAnalysis &&
                          !showRecommendation &&
                          !reducedMotion
                            ? (
                              <span className="inline-flex gap-0.5">
                                <span className="h-1 w-1 animate-pulse rounded-full bg-primary" />
                                <span className="h-1 w-1 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                                <span className="h-1 w-1 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
                              </span>
                            )
                            : null
                        }
                      </div>

                      <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                        {
                          showAnalysis
                            ? copy.analysis
                            : (
                              isId
                                ? "LAKUVO AI menggunakan data commerce yang terverifikasi sebelum memberi rekomendasi."
                                : "LAKUVO AI uses verified commerce data before providing a recommendation."
                            )
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-3 rounded-2xl border p-4 transition-all duration-500 ${
                    showRecommendation
                      ? "border-emerald-500/20 bg-emerald-500/[0.035] opacity-100"
                      : "border-border/50 bg-muted/20 opacity-45"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                      <CircleDot className="h-4 w-4" />
                    </span>

                    <div>
                      <div className="text-[9px] font-bold tracking-[0.13em] text-emerald-700 dark:text-emerald-400">
                        {copy.recommendation}
                      </div>

                      <p className="mt-2 text-[11px] font-semibold leading-5">
                        {
                          showRecommendation
                            ? copy.recommendationText
                            : (
                              isId
                                ? "Rekomendasi belum dibuat."
                                : "Recommendation not prepared yet."
                            )
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-h-[470px] p-5 lg:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.14em] text-primary">
                      {copy.actionCenter}
                    </div>

                    <div className="mt-1 text-lg font-bold">
                      {copy.proposed}
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold transition-all ${
                      showCompleted
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : showConfirmed
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {
                      showCompleted
                        ? (
                          isId
                            ? "Selesai"
                            : "Completed"
                        )
                        : showConfirmed
                          ? copy.confirmed
                          : showAction
                            ? copy.review
                            : (
                              isId
                                ? "Menunggu"
                                : "Waiting"
                            )
                    }
                  </span>
                </div>

                <div
                  className={`mt-5 rounded-2xl border p-5 transition-all duration-500 ${
                    showAction
                      ? "border-primary/20 bg-background opacity-100 shadow-sm"
                      : "border-border/60 bg-muted/20 opacity-45"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <PackageCheck className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">
                        {copy.actionTitle}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-muted/45 p-3">
                          <div className="text-[9px] font-semibold text-muted-foreground">
                            {copy.scope}
                          </div>

                          <div className="mt-1 text-[10px] font-semibold leading-4">
                            {copy.scopeValue}
                          </div>
                        </div>

                        <div className="rounded-xl bg-muted/45 p-3">
                          <div className="text-[9px] font-semibold text-muted-foreground">
                            {
                              isId
                                ? "Kontrol"
                                : "Control"
                            }
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            {
                              isId
                                ? "Konfirmasi diperlukan"
                                : "Confirmation required"
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative mt-5 pl-5">
                  <div
                    className="absolute bottom-3 left-[7px] top-3 w-px bg-border"
                    aria-hidden="true"
                  />

                  <div className="space-y-5">
                    <div className="relative flex items-center gap-3">
                      <span className={`absolute -left-5 flex h-4 w-4 items-center justify-center rounded-full border ${
                        showAction
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background"
                      }`}>
                        {
                          showAction
                            ? <Check className="h-2.5 w-2.5" />
                            : null
                        }
                      </span>

                      <div>
                        <div className="text-[11px] font-semibold">
                          {copy.review}
                        </div>

                        <div className="text-[9px] text-muted-foreground">
                          {
                            isId
                              ? "Periksa rekomendasi dan scope"
                              : "Review recommendation and scope"
                          }
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-center gap-3">
                      <span className={`absolute -left-5 flex h-4 w-4 items-center justify-center rounded-full border ${
                        showConfirmed
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background"
                      }`}>
                        {
                          showConfirmed
                            ? <Check className="h-2.5 w-2.5" />
                            : null
                        }
                      </span>

                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold">
                          {copy.confirm}

                          {
                            showConfirmed
                              ? (
                                <UserRoundCheck className="h-3.5 w-3.5 text-primary" />
                              )
                              : null
                          }
                        </div>

                        <div className="text-[9px] text-muted-foreground">
                          {
                            isId
                              ? "Keputusan tetap di tangan pengguna"
                              : "The decision remains with the user"
                          }
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-center gap-3">
                      <span className={`absolute -left-5 flex h-4 w-4 items-center justify-center rounded-full border ${
                        showCompleted
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-border bg-background"
                      }`}>
                        {
                          showCompleted
                            ? <Check className="h-2.5 w-2.5" />
                            : null
                        }
                      </span>

                      <div>
                        <div className="text-[11px] font-semibold">
                          {
                            showCompleted
                              ? copy.completed
                              : copy.executing
                          }
                        </div>

                        <div className="text-[9px] text-muted-foreground">
                          {copy.audit}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-6 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition-all duration-500 ${
                    showCompleted
                      ? "border-emerald-500/20 bg-emerald-500/[0.045]"
                      : "border-primary/15 bg-primary/[0.025]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {
                      showCompleted
                        ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )
                        : (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        )
                    }

                    <span className="text-[10px] font-semibold">
                      {
                        showCompleted
                          ? copy.completed
                          : copy.safety
                      }
                    </span>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-[9px] text-muted-foreground">
              <span>
                {stages[activeStage]}
              </span>

              <span>
                {activeStage + 1} / {stages.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
