"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Bot,
  CheckCircle2,
  Package,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

type LandingHeroLiveSimulationProps = {
  locale: string;
  active?: boolean;
};

type SceneTone =
  | "blue"
  | "amber"
  | "emerald";

type SimulationScene = {
  key: string;
  title: string;
  description: string;
  status: string;
  action: string;
  meta: string;
  icon: LucideIcon;
  tone: SceneTone;
};

const SCENE_INTERVAL_MS =
  2200;

const toneStyles: Record<
  SceneTone,
  {
    icon: string;
    badge: string;
    dot: string;
  }
> = {
  blue: {
    icon:
      "bg-primary/10 text-primary",
    badge:
      "bg-primary/10 text-primary",
    dot:
      "bg-primary",
  },
  amber: {
    icon:
      "bg-amber-500/10 text-amber-600",
    badge:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot:
      "bg-amber-500",
  },
  emerald: {
    icon:
      "bg-emerald-500/10 text-emerald-600",
    badge:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot:
      "bg-emerald-500",
  },
};

export function LandingHeroLiveSimulation({
  locale,
  active = true,
}: LandingHeroLiveSimulationProps) {
  const isId =
    locale === "id";

  const scenes: SimulationScene[] =
    isId
      ? [
          {
            key:
              "orders",
            title:
              "12 pesanan baru masuk",
            description:
              "Marketplace tersinkron dan TODAY memperbarui prioritas dari kondisi commerce terbaru.",
            status:
              "Masuk",
            action:
              "Lihat pesanan",
            meta:
              "Order signal",
            icon:
              ShoppingCart,
            tone:
              "blue",
          },
          {
            key:
              "today",
            title:
              "5 hal perlu perhatian hari ini",
            description:
              "TODAY menyusun pekerjaan paling penting agar tim tahu apa yang perlu ditangani lebih dulu.",
            status:
              "Prioritas",
            action:
              "Buka TODAY",
            meta:
              "Daily priorities",
            icon:
              Sparkles,
            tone:
              "blue",
          },
          {
            key:
              "stock",
            title:
              "3 SKU berisiko kehabisan stok",
            description:
              "Stok diperkirakan habis dalam 2 hari pada produk dengan kontribusi revenue tinggi.",
            status:
              "Perlu perhatian",
            action:
              "Lihat risiko",
            meta:
              "Inventory signal",
            icon:
              TriangleAlert,
            tone:
              "amber",
          },
          {
            key:
              "ai",
            title:
              "LAKUVO AI menganalisis dampak",
            description:
              "AI memprioritaskan restock untuk SKU dengan dampak terbesar terhadap penjualan.",
            status:
              "Menganalisis",
            action:
              "Lihat insight",
            meta:
              "Verified analysis",
            icon:
              Bot,
            tone:
              "blue",
          },
          {
            key:
              "action",
            title:
              "Action Center menyiapkan rekomendasi",
            description:
              "Restock request siap ditinjau sebelum tindakan apa pun dijalankan.",
            status:
              "Review",
            action:
              "Tinjau tindakan",
            meta:
              "Controlled action",
            icon:
              Package,
            tone:
              "amber",
          },
          {
            key:
              "complete",
            title:
              "Restock request dibuat",
            description:
              "Tindakan tercatat setelah konfirmasi. Kontrol bisnis tetap berada di tangan Anda.",
            status:
              "Selesai",
            action:
              "Lihat aktivitas",
            meta:
              "Action completed",
            icon:
              CheckCircle2,
            tone:
              "emerald",
          },
        ]
      : [
          {
            key:
              "orders",
            title:
              "12 new orders just arrived",
            description:
              "Marketplace data is synced and TODAY refreshes priorities from the latest commerce signals.",
            status:
              "Incoming",
            action:
              "View orders",
            meta:
              "Order signal",
            icon:
              ShoppingCart,
            tone:
              "blue",
          },
          {
            key:
              "today",
            title:
              "5 things need attention today",
            description:
              "TODAY organizes the most important work so your team knows what to handle first.",
            status:
              "Priority",
            action:
              "Open TODAY",
            meta:
              "Daily priorities",
            icon:
              Sparkles,
            tone:
              "blue",
          },
          {
            key:
              "stock",
            title:
              "3 SKUs are at risk of stockout",
            description:
              "Inventory is projected to run out within 2 days for high-revenue products.",
            status:
              "Attention",
            action:
              "View risk",
            meta:
              "Inventory signal",
            icon:
              TriangleAlert,
            tone:
              "amber",
          },
          {
            key:
              "ai",
            title:
              "LAKUVO AI analyzes the impact",
            description:
              "AI prioritizes replenishment for SKUs with the greatest impact on sales.",
            status:
              "Analyzing",
            action:
              "View insight",
            meta:
              "Verified analysis",
            icon:
              Bot,
            tone:
              "blue",
          },
          {
            key:
              "action",
            title:
              "Action Center prepares a recommendation",
            description:
              "The restock request is ready for review before any action is executed.",
            status:
              "Review",
            action:
              "Review action",
            meta:
              "Controlled action",
            icon:
              Package,
            tone:
              "amber",
          },
          {
            key:
              "complete",
            title:
              "Restock request created",
            description:
              "The action is recorded after confirmation. Your business remains under your control.",
            status:
              "Completed",
            action:
              "View activity",
            meta:
              "Action completed",
            icon:
              CheckCircle2,
            tone:
              "emerald",
          },
        ];

  const [
    activeScene,
    setActiveScene,
  ] =
    useState(0);

  const [
    reducedMotion,
    setReducedMotion,
  ] =
    useState(false);

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
        !active
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () => {
            setActiveScene(
              (current) =>
                (
                  current + 1
                ) %
                scenes.length,
            );
          },
          SCENE_INTERVAL_MS,
        );

      return () => {
        window.clearInterval(
          timer,
        );
      };
    },
    [
      active,
      reducedMotion,
      scenes.length,
    ],
  );

  const scene =
    scenes[activeScene];

  const SceneIcon =
    scene.icon;

  const tone =
    toneStyles[
      scene.tone
    ];

  return (
    <div
      className="mt-5 min-h-[132px] rounded-2xl border border-primary/15 bg-primary/[0.035] p-4"
      data-motion-state={scene.key}
      aria-label={
        isId
          ? "Simulasi aktivitas commerce LAKUVO"
          : "LAKUVO live commerce activity simulation"
      }
    >
      <div
        key={scene.key}
        className={
          reducedMotion
            ? ""
            : "animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        }
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
          >
            <SceneIcon
              className="h-4 w-4"
              aria-hidden="true"
            />
          </span>

          <div className="min-w-0 flex-1">
            <div className="text-[8px] font-bold tracking-[0.14em] text-primary">
              {
                isId
                  ? "LIVE COMMERCE"
                  : "LIVE COMMERCE"
              }
            </div>

            <div className="mt-1 text-[11px] font-semibold">
              {scene.title}
            </div>

            <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
              {
                scene.description
              }
            </p>
          </div>

          <span
            className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[8px] font-medium md:inline-flex ${tone.badge}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${tone.dot} ${
                reducedMotion ||
                scene.key ===
                  "complete"
                  ? ""
                  : "animate-pulse"
              }`}
              aria-hidden="true"
            />

            {scene.status}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/60 pt-3">
        <div className="min-w-0">
          <div className="text-[8px] text-muted-foreground">
            {scene.meta}
          </div>

          <div
            className="mt-1 flex items-center gap-1"
            aria-hidden="true"
          >
            {scenes.map(
              (
                item,
                index,
              ) => (
                <span
                  key={
                    item.key
                  }
                  className={`h-1 rounded-full transition-all duration-500 ${
                    index ===
                    activeScene
                      ? "w-5 bg-primary"
                      : "w-1.5 bg-primary/20"
                  }`}
                />
              ),
            )}
          </div>
        </div>

        <span className="shrink-0 rounded-lg bg-primary px-3 py-2 text-[8px] font-semibold text-primary-foreground shadow-sm">
          {scene.action}
        </span>
      </div>
    </div>
  );
}
