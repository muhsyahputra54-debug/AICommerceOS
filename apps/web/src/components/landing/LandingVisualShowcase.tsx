"use client";

import Image from "next/image";
import {
  Bot,
  Boxes,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type LandingVisualShowcaseProps = {
  locale: string;
};

type VisualItem = {
  key: string;
  title: string;
  description: string;
  meta: string;
  badge: string;
  image: string;
  alt: string;
  icon: LucideIcon;
};

const VISUAL_INTERVAL_MS = 4800;

export function LandingVisualShowcase({
  locale,
}: LandingVisualShowcaseProps) {
  const isId =
    locale === "id";

  const copy =
    isId
      ? {
          eyebrow:
            "LAKUVO DALAM AKSI",
          title:
            "Operasi commerce yang lebih mudah dilihat, dipahami, dan dikendalikan.",
          description:
            "Jelajahi bagaimana workspace, inventori lintas kanal, dan AI terkontrol bekerja sebagai satu pengalaman operasional.",
          hint:
            "Pilih tampilan atau biarkan visual berpindah otomatis.",
          controlled:
            "Visual interaktif — tanpa menjalankan tindakan bisnis",
        }
      : {
          eyebrow:
            "LAKUVO IN ACTION",
          title:
            "Commerce operations that are easier to see, understand, and control.",
          description:
            "Explore how the workspace, multichannel inventory, and controlled AI come together in one operating experience.",
          hint:
            "Choose a view or let the visual rotate automatically.",
          controlled:
            "Interactive visual — no business action is executed",
        };

  const items: VisualItem[] =
    isId
      ? [
          {
            key:
              "workspace",
            title:
              "Workspace Commerce",
            description:
              "Satu gambaran operasional untuk memahami produk, pesanan, inventori, analitik, dan automasi dalam konteks yang sama.",
            meta:
              "OPERASI TERPADU",
            badge:
              "Workspace LAKUVO",
            image:
              "/images/marketing/home/hero-dashboard.jpg",
            alt:
              "Ilustrasi workspace commerce LAKUVO dengan pengguna dan dashboard operasional",
            icon:
              LayoutDashboard,
          },
          {
            key:
              "inventory",
            title:
              "Sinkronisasi Inventori",
            description:
              "Visualisasi bagaimana inventori dan perubahan stok dapat dikoordinasikan melalui satu lapisan operasi lintas kanal.",
            meta:
              "INVENTORI",
            badge:
              "Sync workflow",
            image:
              "/images/marketing/home/inventory-sync.jpg",
            alt:
              "Ilustrasi sinkronisasi inventori dan operasi lintas kanal LAKUVO",
            icon:
              Boxes,
          },
          {
            key:
              "ai",
            title:
              "AI Command Center",
            description:
              "Dari sinyal bisnis menuju analisis, rekomendasi, review, konfirmasi, dan tindakan yang tetap berada dalam kontrol pengguna.",
            meta:
              "CONTROLLED AI",
            badge:
              "AI + human control",
            image:
              "/images/marketing/home/ai-command-center.jpg",
            alt:
              "Ilustrasi LAKUVO AI Command Center dengan alur review dan controlled action",
            icon:
              Bot,
          },
        ]
      : [
          {
            key:
              "workspace",
            title:
              "Commerce Workspace",
            description:
              "One operational view for understanding products, orders, inventory, analytics, and automation in the same business context.",
            meta:
              "CONNECTED OPERATIONS",
            badge:
              "LAKUVO workspace",
            image:
              "/images/marketing/home/hero-dashboard.jpg",
            alt:
              "LAKUVO commerce workspace illustration with a user and operational dashboard",
            icon:
              LayoutDashboard,
          },
          {
            key:
              "inventory",
            title:
              "Inventory Synchronization",
            description:
              "A visual view of how inventory and stock changes can be coordinated through one multichannel operating layer.",
            meta:
              "INVENTORY",
            badge:
              "Sync workflow",
            image:
              "/images/marketing/home/inventory-sync.jpg",
            alt:
              "LAKUVO multichannel inventory synchronization illustration",
            icon:
              Boxes,
          },
          {
            key:
              "ai",
            title:
              "AI Command Center",
            description:
              "Move from business signals to analysis, recommendation, review, confirmation, and actions that remain under user control.",
            meta:
              "CONTROLLED AI",
            badge:
              "AI + human control",
            image:
              "/images/marketing/home/ai-command-center.jpg",
            alt:
              "LAKUVO AI Command Center illustration with review and controlled action workflow",
            icon:
              Bot,
          },
        ];

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(0);

  const [
    reducedMotion,
    setReducedMotion,
  ] =
    useState(false);

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

  const sectionRef =
    useRef<HTMLElement>(
      null,
    );

  const depthRef =
    useRef<HTMLDivElement>(
      null,
    );

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
              setSectionVisible(true);
              setSectionActive(true);
            },
            0,
          );

        return () => {
          window.clearTimeout(timer);
        };
      }

      const observer =
        new IntersectionObserver(
          (entries) => {
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

      observer.observe(node);

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
            setActiveIndex(
              (current) =>
                (
                  current + 1
                ) %
                items.length,
            );
          },
          VISUAL_INTERVAL_MS,
        );

      return () => {
        window.clearInterval(
          timer,
        );
      };
    },
    [
      items.length,
      reducedMotion,
      sectionActive,
    ],
  );

  const resetDepth =
    () => {
      const node =
        depthRef.current;

      if (!node) {
        return;
      }

      node.style.setProperty(
        "--visual-tilt-x",
        "0deg",
      );

      node.style.setProperty(
        "--visual-tilt-y",
        "0deg",
      );

      node.style.setProperty(
        "--visual-back-x",
        "0px",
      );

      node.style.setProperty(
        "--visual-back-y",
        "0px",
      );

      node.style.setProperty(
        "--visual-near-x",
        "0px",
      );

      node.style.setProperty(
        "--visual-near-y",
        "0px",
      );
    };

  const handlePointerMove =
    (
      event:
        ReactPointerEvent<HTMLDivElement>,
    ) => {
      if (
        reducedMotion ||
        event.pointerType !==
          "mouse"
      ) {
        return;
      }

      const node =
        depthRef.current;

      if (!node) {
        return;
      }

      const rect =
        node.getBoundingClientRect();

      const x =
        (
          event.clientX -
          rect.left
        ) /
          rect.width -
        0.5;

      const y =
        (
          event.clientY -
          rect.top
        ) /
          rect.height -
        0.5;

      node.style.setProperty(
        "--visual-tilt-x",
        `${(-y * 2.8).toFixed(2)}deg`,
      );

      node.style.setProperty(
        "--visual-tilt-y",
        `${(x * 3.8).toFixed(2)}deg`,
      );

      node.style.setProperty(
        "--visual-back-x",
        `${(-x * 8).toFixed(1)}px`,
      );

      node.style.setProperty(
        "--visual-back-y",
        `${(-y * 6).toFixed(1)}px`,
      );

      node.style.setProperty(
        "--visual-near-x",
        `${(x * 10).toFixed(1)}px`,
      );

      node.style.setProperty(
        "--visual-near-y",
        `${(y * 8).toFixed(1)}px`,
      );
    };

  const activeItem =
    items[activeIndex];

  const ActiveIcon =
    activeItem.icon;

  return (
    <section
      ref={sectionRef}
      id="visual-showcase"
      className="relative overflow-hidden"
    >
      <div
        className="pointer-events-none absolute left-[14%] top-[18%] -z-10 h-[420px] w-[520px] rounded-full bg-primary/[0.07] blur-3xl"
        aria-hidden="true"
      />

      <div
        className={`mx-auto grid max-w-[1440px] gap-10 px-5 py-20 transition-all duration-700 ease-out sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-12 ${
          reducedMotion ||
          sectionVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0"
        }`}
      >
        <div className="max-w-[520px]">
          <p className="text-xs font-bold tracking-[0.18em] text-primary">
            {copy.eyebrow}
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[44px] lg:leading-[1.08]">
            {copy.title}
          </h2>

          <p className="mt-5 leading-7 text-muted-foreground">
            {copy.description}
          </p>

          <div
            className="mt-8 space-y-2"
            role="tablist"
            aria-label={
              isId
                ? "Visual fitur LAKUVO"
                : "LAKUVO feature visuals"
            }
          >
            {items.map(
              (
                item,
                index,
              ) => {
                const Icon =
                  item.icon;

                const selected =
                  index ===
                  activeIndex;

                return (
                  <button
                    key={item.key}
                    id={`landing-visual-tab-${item.key}`}
                    type="button"
                    role="tab"
                    aria-selected={
                      selected
                    }
                    aria-controls="landing-visual-panel"
                    onClick={() => {
                      setActiveIndex(
                        index,
                      );
                    }}
                    className={`group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
                      selected
                        ? "border-primary/25 bg-primary/[0.045] shadow-sm"
                        : "border-border/60 bg-card/60 hover:border-primary/20 hover:bg-card"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-bold">
                        {item.title}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {
                          item.description
                        }
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {copy.hint}
          </p>
        </div>

        <div
          ref={depthRef}
          className="relative"
          onPointerMove={
            handlePointerMove
          }
          onPointerLeave={
            resetDepth
          }
          style={{
            perspective:
              "1400px",
            transformStyle:
              "preserve-3d",
          }}
        >
          <div
            className="pointer-events-none absolute inset-8 -z-10 rounded-[42px] bg-primary/15 blur-3xl transition-transform duration-500 ease-out motion-reduce:transform-none"
            style={{
              transform:
                "translate3d(var(--visual-back-x, 0px), var(--visual-back-y, 0px), -70px) scale(1.05)",
            }}
            aria-hidden="true"
          />

          <div
            id="landing-visual-panel"
            role="tabpanel"
            aria-labelledby={`landing-visual-tab-${activeItem.key}`}
            className="relative overflow-hidden rounded-[30px] border border-border/70 bg-background shadow-2xl shadow-primary/10 transition-[transform,box-shadow] duration-300 ease-out will-change-transform motion-reduce:transform-none"
            style={{
              transformStyle:
                "preserve-3d",
              transform:
                "rotateX(var(--visual-tilt-x, 0deg)) rotateY(var(--visual-tilt-y, 0deg))",
            }}
          >
            <div
              key={
                activeItem.key
              }
              className={
                reducedMotion
                  ? ""
                  : "animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
              }
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-white">
                <Image
                  src={
                    activeItem.image
                  }
                  alt={
                    activeItem.alt
                  }
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  quality={88}
                  className="object-cover"
                />

                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_18%,color-mix(in_oklab,var(--primary)_3%,transparent)_52%,transparent_82%)]"
                  aria-hidden="true"
                />

                <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[10px] font-bold text-slate-800 shadow-lg backdrop-blur">
                  <span
                    className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${
                      reducedMotion
                        ? ""
                        : "animate-pulse"
                    }`}
                  />

                  {
                    activeItem.badge
                  }
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border/60 bg-card/95 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ActiveIcon className="h-4 w-4" />
                  </span>

                  <div>
                    <div className="text-[9px] font-bold tracking-[0.14em] text-primary">
                      {
                        activeItem.meta
                      }
                    </div>

                    <div className="mt-0.5 text-xs font-semibold">
                      {
                        activeItem.title
                      }
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-muted-foreground">
                  {activeIndex + 1}
                  {" / "}
                  {items.length}
                </span>
              </div>
            </div>
          </div>

          <div
            className="pointer-events-none absolute -bottom-3 right-4 hidden items-center gap-2 rounded-2xl border bg-card/95 px-3.5 py-2.5 text-[10px] font-semibold shadow-xl shadow-black/10 backdrop-blur md:flex motion-reduce:transform-none"
            style={{
              transform:
                "translate3d(var(--visual-near-x, 0px), var(--visual-near-y, 0px), 80px)",
            }}
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            {copy.controlled}
          </div>
        </div>
      </div>
    </section>
  );
}