"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Megaphone,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

type LandingTodayStoryProps = {
  locale: string;
};

type PriorityTone =
  | "blue"
  | "amber"
  | "rose"
  | "violet";

type Priority = {
  title: string;
  meta: string;
  insight: string;
  action: string;
  icon: LucideIcon;
  tone: PriorityTone;
};

const STORY_INTERVAL_MS =
  2600;

const toneStyles: Record<
  PriorityTone,
  {
    icon: string;
    active: string;
  }
> = {
  blue: {
    icon:
      "bg-primary/10 text-primary",
    active:
      "border-primary/30 bg-primary/[0.055]",
  },
  amber: {
    icon:
      "bg-amber-500/10 text-amber-600",
    active:
      "border-amber-500/30 bg-amber-500/[0.055]",
  },
  rose: {
    icon:
      "bg-rose-500/10 text-rose-600",
    active:
      "border-rose-500/30 bg-rose-500/[0.045]",
  },
  violet: {
    icon:
      "bg-violet-500/10 text-violet-600",
    active:
      "border-violet-500/30 bg-violet-500/[0.045]",
  },
};

export function LandingTodayStory({
  locale,
}: LandingTodayStoryProps) {
  const isId =
    locale === "id";

  const copy =
    isId
      ? {
          eyebrow:
            "TODAY — LIVE OPERATIONS",
          title:
            "Setiap pagi, LAKUVO sudah tahu apa yang perlu Anda lakukan.",
          description:
            "TODAY mengubah sinyal commerce menjadi prioritas yang jelas, lalu LAKUVO AI membantu memberi konteks dan Action Center menjaga tindakan tetap terkontrol.",
          productPreview:
            "SIMULASI PRODUK",
          attention:
            "5 hal perlu perhatian hari ini",
          updated:
            "Diperbarui dari data commerce terbaru",
          ai:
            "LAKUVO AI",
          actionCenter:
            "ACTION CENTER",
          recommendation:
            "Rekomendasi",
          review:
            "Tinjau tindakan",
          confirmed:
            "Tindakan dikonfirmasi",
          controlled:
            "Rekomendasi dan eksekusi tetap dipisahkan.",
          humanControl:
            "Anda tetap memegang kontrol",
          priorities:
            "Prioritas Hari Ini",
          stageOverview:
            "TODAY menyusun prioritas",
          stageSelected:
            "Prioritas dipilih",
          stageAi:
            "AI memberi konteks",
          stageAction:
            "Tindakan siap ditinjau",
          stageDone:
            "Konfirmasi tercatat",
        }
      : {
          eyebrow:
            "TODAY — LIVE OPERATIONS",
          title:
            "Every morning, LAKUVO already knows what needs your attention.",
          description:
            "TODAY turns commerce signals into clear priorities, LAKUVO AI adds context, and Action Center keeps important actions controlled.",
          productPreview:
            "PRODUCT SIMULATION",
          attention:
            "5 things need attention today",
          updated:
            "Updated from the latest commerce data",
          ai:
            "LAKUVO AI",
          actionCenter:
            "ACTION CENTER",
          recommendation:
            "Recommendation",
          review:
            "Review action",
          confirmed:
            "Action confirmed",
          controlled:
            "Recommendations and execution remain separated.",
          humanControl:
            "You remain in control",
          priorities:
            "Today's Priorities",
          stageOverview:
            "TODAY organizes priorities",
          stageSelected:
            "Priority selected",
          stageAi:
            "AI adds context",
          stageAction:
            "Action ready for review",
          stageDone:
            "Confirmation recorded",
        };

  const priorities: Priority[] =
    isId
      ? [
          {
            title:
              "12 pesanan belum diproses",
            meta:
              "Operasional",
            insight:
              "Sebagian besar pesanan masuk dalam 45 menit terakhir. Tidak ada indikasi keterlambatan kritis.",
            action:
              "Buka antrean pesanan",
            icon:
              ShoppingCart,
            tone:
              "blue",
          },
          {
            title:
              "3 SKU diperkirakan habis dalam 2 hari",
            meta:
              "Inventori",
            insight:
              "3 SKU ini berkontribusi besar terhadap revenue minggu ini. Prioritaskan pengecekan stok dan pemasok.",
            action:
              "Siapkan review restock",
            icon:
              TriangleAlert,
            tone:
              "amber",
          },
          {
            title:
              "Revenue Marketplace A turun 8%",
            meta:
              "Analitik",
            insight:
              "Penurunan terutama berasal dari dua produk dengan conversion rate lebih rendah dari rata-rata 7 hari.",
            action:
              "Tinjau performa channel",
            icon:
              TrendingDown,
            tone:
              "rose",
          },
          {
            title:
              "2 produk memiliki conversion rendah",
            meta:
              "Produk",
            insight:
              "Traffic tetap stabil tetapi conversion menurun. Konten produk dan harga layak ditinjau.",
            action:
              "Buka analisis produk",
            icon:
              Package,
            tone:
              "violet",
          },
          {
            title:
              "1 campaign membutuhkan review",
            meta:
              "Pemasaran",
            insight:
              "Spend meningkat tanpa kenaikan order yang sebanding dalam snapshot terbaru.",
            action:
              "Tinjau campaign",
            icon:
              Megaphone,
            tone:
              "blue",
          },
        ]
      : [
          {
            title:
              "12 orders are still unprocessed",
            meta:
              "Operations",
            insight:
              "Most orders arrived within the last 45 minutes. No critical delay signal is currently detected.",
            action:
              "Open order queue",
            icon:
              ShoppingCart,
            tone:
              "blue",
          },
          {
            title:
              "3 SKUs may run out within 2 days",
            meta:
              "Inventory",
            insight:
              "These SKUs contribute strongly to weekly revenue. Prioritize inventory and supplier review.",
            action:
              "Prepare restock review",
            icon:
              TriangleAlert,
            tone:
              "amber",
          },
          {
            title:
              "Marketplace A revenue is down 8%",
            meta:
              "Analytics",
            insight:
              "The decline is concentrated in two products with conversion below the 7-day average.",
            action:
              "Review channel performance",
            icon:
              TrendingDown,
            tone:
              "rose",
          },
          {
            title:
              "2 products have low conversion",
            meta:
              "Products",
            insight:
              "Traffic remains stable while conversion has declined. Product content and pricing deserve review.",
            action:
              "Open product analysis",
            icon:
              Package,
            tone:
              "violet",
          },
          {
            title:
              "1 campaign needs review",
            meta:
              "Marketing",
            insight:
              "Spend increased without a proportional increase in orders in the latest snapshot.",
            action:
              "Review campaign",
            icon:
              Megaphone,
            tone:
              "blue",
          },
        ];

  const [
    activePriority,
    setActivePriority,
  ] =
    useState(1);

  const [
    storyStage,
    setStoryStage,
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
              0.18,
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
      const mediaQuery =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );

      const syncPreference =
        () => {
          setReducedMotion(
            mediaQuery.matches,
          );
        };

      syncPreference();

      mediaQuery.addEventListener(
        "change",
        syncPreference,
      );

      return () => {
        mediaQuery.removeEventListener(
          "change",
          syncPreference,
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
            setStoryStage(
              (current) =>
                (
                  current + 1
                ) %
                5,
            );
          },
          STORY_INTERVAL_MS,
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
    ],
  );

  const priority =
    priorities[
      activePriority
    ];

  const PriorityIcon =
    priority.icon;

  const priorityTone =
    toneStyles[
      priority.tone
    ];

  const stageLabels =
    [
      copy.stageOverview,
      copy.stageSelected,
      copy.stageAi,
      copy.stageAction,
      copy.stageDone,
    ];

  const showSelection =
    storyStage >= 1;

  const showAi =
    storyStage >= 2;

  const showAction =
    storyStage >= 3;

  const showDone =
    storyStage >= 4;

  return (
    <section
      ref={sectionRef}
      id="today-story"
      className="relative overflow-hidden border-y border-border/60 bg-muted/20"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-3xl"
        aria-hidden="true"
      />

      <div
        className={`mx-auto grid max-w-[1440px] gap-10 px-5 py-20 transition-all duration-700 ease-out sm:px-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-center lg:px-12 ${
          reducedMotion ||
          sectionVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0"
        }`}
      >
        <div className="max-w-xl">
          <p className="text-xs font-bold tracking-[0.18em] text-primary">
            {copy.eyebrow}
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[44px] lg:leading-[1.08]">
            {copy.title}
          </h2>

          <p className="mt-5 max-w-[560px] leading-7 text-muted-foreground">
            {
              copy.description
            }
          </p>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {
              copy.humanControl
            }
          </div>

          <div className="mt-8">
            <div className="text-xs font-semibold text-muted-foreground">
              Product story
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              {stageLabels.map(
                (
                  label,
                  index,
                ) => (
                  <button
                    key={
                      label
                    }
                    type="button"
                    onClick={
                      () => {
                        setStoryStage(
                          index,
                        );
                      }
                    }
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      index ===
                      storyStage
                        ? "w-9 bg-primary"
                        : "w-3 bg-primary/20 hover:bg-primary/35"
                    }`}
                    aria-label={
                      label
                    }
                    title={
                      label
                    }
                  />
                ),
              )}
            </div>

            <div className="mt-3 text-sm font-semibold">
              {
                stageLabels[
                  storyStage
                ]
              }
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-6 -z-10 rounded-[40px] bg-primary/10 blur-3xl" />

          <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-2xl shadow-primary/[0.08]">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>

                <div>
                  <div className="text-sm font-bold">
                    TODAY
                  </div>

                  <div className="text-[10px] text-muted-foreground">
                    {
                      copy.updated
                    }
                  </div>
                </div>
              </div>

              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-semibold tracking-wide text-primary">
                {
                  copy.productPreview
                }
              </span>
            </div>

            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              <div className="border-b border-border/60 p-4 sm:p-5 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground">
                      {
                        copy.priorities
                      }
                    </div>

                    <div className="mt-1 text-base font-bold">
                      {
                        copy.attention
                      }
                    </div>
                  </div>

                  <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
                    5
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {priorities.map(
                    (
                      item,
                      index,
                    ) => {
                      const Icon =
                        item.icon;

                      const tone =
                        toneStyles[
                          item.tone
                        ];

                      const selected =
                        index ===
                        activePriority;

                      return (
                        <button
                          key={
                            item.title
                          }
                          type="button"
                          onClick={
                            () => {
                              setActivePriority(
                                index,
                              );

                              setStoryStage(
                                2,
                              );
                            }
                          }
                          className={`group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all duration-300 ${
                            selected &&
                            showSelection
                              ? tone.active
                              : "border-transparent bg-background/45 hover:border-border hover:bg-background/80"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] font-semibold leading-4">
                              {
                                item.title
                              }
                            </span>

                            <span className="mt-1 block text-[9px] text-muted-foreground">
                              {
                                item.meta
                              }
                            </span>
                          </span>

                          <ArrowRight
                            className={`mt-2 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                              selected &&
                              showSelection
                                ? "translate-x-0.5 text-primary"
                                : "group-hover:translate-x-0.5"
                            }`}
                          />
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="min-h-[430px] p-4 sm:p-5">
                <div
                  key={`${activePriority}-${storyStage}`}
                  className={
                    reducedMotion
                      ? ""
                      : "animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                  }
                >
                  <div className="flex items-start gap-3 rounded-2xl border bg-background/65 p-4">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${priorityTone.icon}`}
                    >
                      <PriorityIcon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                      <div className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground">
                        {
                          showSelection
                            ? priority.meta
                            : "TODAY"
                        }
                      </div>

                      <div className="mt-1 text-sm font-bold leading-5">
                        {
                          showSelection
                            ? priority.title
                            : copy.attention
                        }
                      </div>

                      <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                        {
                          showSelection
                            ? isId
                              ? "TODAY memprioritaskan sinyal ini berdasarkan kondisi commerce terbaru."
                              : "TODAY prioritizes this signal using the latest commerce context."
                            : isId
                              ? "Sinyal operasional, inventori, analitik, produk, dan pemasaran diringkas dalam satu tempat."
                              : "Operations, inventory, analytics, products, and marketing signals are summarized in one place."
                        }
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-3 rounded-2xl border p-4 transition-all duration-500 ${
                      showAi
                        ? "border-primary/20 bg-primary/[0.035] opacity-100"
                        : "border-border/50 bg-muted/20 opacity-55"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Bot className="h-4 w-4" />
                      </span>

                      <div className="min-w-0">
                        <div className="text-[9px] font-bold tracking-[0.12em] text-primary">
                          {copy.ai}
                        </div>

                        <div className="mt-1 text-[11px] font-semibold">
                          {
                            copy.recommendation
                          }
                        </div>

                        <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                          {
                            showAi
                              ? priority.insight
                              : isId
                                ? "Menunggu prioritas untuk dianalisis."
                                : "Waiting for a priority to analyze."
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`mt-3 rounded-2xl border p-4 transition-all duration-500 ${
                      showAction
                        ? "border-amber-500/20 bg-amber-500/[0.035] opacity-100"
                        : "border-border/50 bg-muted/20 opacity-55"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold tracking-[0.12em] text-amber-700 dark:text-amber-400">
                          {
                            copy.actionCenter
                          }
                        </div>

                        <div className="mt-1 text-[11px] font-semibold">
                          {
                            showDone
                              ? copy.confirmed
                              : priority.action
                          }
                        </div>

                        <p className="mt-2 text-[9px] leading-4 text-muted-foreground">
                          {
                            copy.controlled
                          }
                        </p>
                      </div>

                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          showDone
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {
                          showDone
                            ? (
                              <CheckCircle2 className="h-4 w-4" />
                            )
                            : (
                              <Sparkles className="h-4 w-4" />
                            )
                        }
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-[9px] text-muted-foreground">
                        {
                          showDone
                            ? copy.humanControl
                            : copy.review
                        }
                      </span>

                      <span
                        className={`rounded-lg px-3 py-2 text-[9px] font-semibold ${
                          showDone
                            ? "bg-emerald-600 text-white"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {
                          showDone
                            ? (
                              <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3" />
                                {
                                  isId
                                    ? "Dikonfirmasi"
                                    : "Confirmed"
                                }
                              </span>
                            )
                            : copy.review
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[9px] text-muted-foreground">
                  <span>
                    {
                      stageLabels[
                        storyStage
                      ]
                    }
                  </span>

                  <span>
                    {
                      storyStage + 1
                    } / 5
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
