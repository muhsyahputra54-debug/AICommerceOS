"use client";

import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Package,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
} from "lucide-react";

import { LandingProductWorkspaceCycle } from "./LandingProductWorkspaceCycle";

type LandingProductPreviewProps = {
  locale: string;
};

const resetPointerDepth = (
  scene: HTMLDivElement,
) => {
  scene.style.setProperty(
    "--depth-tilt-x",
    "0deg",
  );

  scene.style.setProperty(
    "--depth-tilt-y",
    "0deg",
  );

  scene.style.setProperty(
    "--depth-main-x",
    "0px",
  );

  scene.style.setProperty(
    "--depth-main-y",
    "0px",
  );

  scene.style.setProperty(
    "--depth-mid-x",
    "0px",
  );

  scene.style.setProperty(
    "--depth-mid-y",
    "0px",
  );

  scene.style.setProperty(
    "--depth-near-x",
    "0px",
  );

  scene.style.setProperty(
    "--depth-near-y",
    "0px",
  );

  scene.style.setProperty(
    "--depth-front-x",
    "0px",
  );

  scene.style.setProperty(
    "--depth-front-y",
    "0px",
  );

  scene.style.setProperty(
    "--depth-back-x",
    "0px",
  );

  scene.style.setProperty(
    "--depth-back-y",
    "0px",
  );
};

export function LandingProductPreview({
  locale,
}: LandingProductPreviewProps) {
  const sceneRef =
    useRef<HTMLDivElement>(
      null,
    );

  const isId =
    locale === "id";

  const copy =
    isId
      ? {
          topProducts:
            "Top Produk",
          channels:
            "Channel Performance",
          insight:
            "AI Insight",
          insightText:
            "Permintaan kategori Fashion meningkat 18% minggu ini.",
        }
      : {
          topProducts:
            "Top Products",
          channels:
            "Channel Performance",
          insight:
            "AI Insight",
          insightText:
            "Fashion category demand increased 18% this week.",
        };

  useEffect(
    () => {
      const scene =
        sceneRef.current;

      if (!scene) {
        return;
      }

      const desktopQuery =
        window.matchMedia(
          "(min-width: 1024px) and (pointer: fine)",
        );

      const reducedMotionQuery =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );

      const syncBaseDepth =
        () => {
          if (
            desktopQuery.matches
          ) {
            scene.style.setProperty(
              "--depth-base-x",
              "0.8deg",
            );

            scene.style.setProperty(
              "--depth-base-y",
              "-2deg",
            );
          }
          else {
            scene.style.setProperty(
              "--depth-base-x",
              "0deg",
            );

            scene.style.setProperty(
              "--depth-base-y",
              "0deg",
            );
          }

          if (
            reducedMotionQuery.matches
          ) {
            resetPointerDepth(
              scene,
            );
          }
        };

      syncBaseDepth();

      desktopQuery.addEventListener(
        "change",
        syncBaseDepth,
      );

      reducedMotionQuery.addEventListener(
        "change",
        syncBaseDepth,
      );

      return () => {
        desktopQuery.removeEventListener(
          "change",
          syncBaseDepth,
        );

        reducedMotionQuery.removeEventListener(
          "change",
          syncBaseDepth,
        );
      };
    },
    [],
  );

  const handlePointerMove =
    (
      event: ReactPointerEvent<HTMLDivElement>,
    ) => {
      if (
        event.pointerType !==
        "mouse"
      ) {
        return;
      }

      if (
        window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches
      ) {
        return;
      }

      if (
        !window.matchMedia(
          "(min-width: 1024px) and (pointer: fine)",
        ).matches
      ) {
        return;
      }

      const scene =
        sceneRef.current;

      if (!scene) {
        return;
      }

      const bounds =
        scene.getBoundingClientRect();

      const normalizedX =
        (
          event.clientX -
          bounds.left
        ) /
        bounds.width -
        0.5;

      const normalizedY =
        (
          event.clientY -
          bounds.top
        ) /
        bounds.height -
        0.5;

      const tiltX =
        normalizedY *
        -5;

      const tiltY =
        normalizedX *
        7;

      scene.style.setProperty(
        "--depth-tilt-x",
        `${tiltX.toFixed(
          2,
        )}deg`,
      );

      scene.style.setProperty(
        "--depth-tilt-y",
        `${tiltY.toFixed(
          2,
        )}deg`,
      );

      scene.style.setProperty(
        "--depth-main-x",
        `${(
          normalizedX *
          2
        ).toFixed(
          2,
        )}px`,
      );

      scene.style.setProperty(
        "--depth-main-y",
        `${(
          normalizedY *
          2
        ).toFixed(
          2,
        )}px`,
      );

      scene.style.setProperty(
        "--depth-mid-x",
        `${(
          normalizedX *
          7
        ).toFixed(
          2,
        )}px`,
      );

      scene.style.setProperty(
        "--depth-mid-y",
        `${(
          normalizedY *
          5
        ).toFixed(
          2,
        )}px`,
      );

      scene.style.setProperty(
        "--depth-near-x",
        `${(
          normalizedX *
          10
        ).toFixed(
          2,
        )}px`,
      );

      scene.style.setProperty(
        "--depth-near-y",
        `${(
          normalizedY *
          7
        ).toFixed(
          2,
        )}px`,
      );

      scene.style.setProperty(
        "--depth-front-x",
        `${(
          normalizedX *
          13
        ).toFixed(
          2,
        )}px`,
      );

      scene.style.setProperty(
        "--depth-front-y",
        `${(
          normalizedY *
          9
        ).toFixed(
          2,
        )}px`,
      );

      scene.style.setProperty(
        "--depth-back-x",
        `${(
          normalizedX *
          -10
        ).toFixed(
          2,
        )}px`,
      );

      scene.style.setProperty(
        "--depth-back-y",
        `${(
          normalizedY *
          -7
        ).toFixed(
          2,
        )}px`,
      );
    };

  const handlePointerLeave =
    () => {
      const scene =
        sceneRef.current;

      if (!scene) {
        return;
      }

      resetPointerDepth(
        scene,
      );
    };

  return (
    <div
      ref={sceneRef}
      onPointerMove={
        handlePointerMove
      }
      onPointerLeave={
        handlePointerLeave
      }
      className="relative mx-auto w-full max-w-[760px] py-4 sm:py-6 lg:py-5"
      style={{
        perspective:
          "1400px",
        transformStyle:
          "preserve-3d",
      }}
    >
      <div
        className="pointer-events-none absolute inset-8 -z-10 rounded-full bg-primary/15 blur-3xl transition-transform duration-500 ease-out motion-reduce:transform-none"
        style={{
          transform:
            "translate3d(var(--depth-back-x, 0px), var(--depth-back-y, 0px), -80px) scale(1.08)",
        }}
        aria-hidden="true"
      />

      <div
        className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-2xl shadow-primary/10 transition-[transform,box-shadow] duration-300 ease-out will-change-transform motion-reduce:transform-none"
        style={{
          transformStyle:
            "preserve-3d",
          transformOrigin:
            "50% 45%",
          transform:
            "translate3d(var(--depth-main-x, 0px), var(--depth-main-y, 0px), 0px) rotateX(calc(var(--depth-base-x, 0deg) + var(--depth-tilt-x, 0deg))) rotateY(calc(var(--depth-base-y, 0deg) + var(--depth-tilt-y, 0deg)))",
        }}
      >
        <LandingProductWorkspaceCycle
          locale={locale}
        />

        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,color-mix(in_oklab,var(--primary)_4%,transparent)_52%,transparent_80%)] opacity-70"
          aria-hidden="true"
        />
      </div>

      <div
        className="pointer-events-none absolute -left-3 top-[190px] hidden w-36 rounded-2xl border bg-card p-3 shadow-xl shadow-black/10 transition-transform duration-300 ease-out will-change-transform md:block motion-reduce:transform-none"
        style={{
          transform:
            "translate3d(var(--depth-mid-x, 0px), var(--depth-mid-y, 0px), 55px) rotateZ(-2deg)",
        }}
      >
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-primary" />

          <span className="text-[9px] font-semibold">
            {copy.topProducts}
          </span>
        </div>

        <div className="mt-3 space-y-2 text-[8px]">
          <div className="flex justify-between">
            <span>
              LAKUVO T-Shirt
            </span>

            <span className="font-semibold">
              #1
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              LAKUVO Hoodie
            </span>

            <span className="font-semibold">
              #2
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              LAKUVO Mug
            </span>

            <span className="font-semibold">
              #3
            </span>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -right-3 top-[180px] hidden w-40 rounded-2xl border bg-card p-3 shadow-xl shadow-black/10 transition-transform duration-300 ease-out will-change-transform lg:block motion-reduce:transform-none"
        style={{
          transform:
            "translate3d(var(--depth-near-x, 0px), var(--depth-near-y, 0px), 70px) rotateZ(2deg)",
        }}
      >
        <div className="flex items-center gap-2">
          <Store className="h-3.5 w-3.5 text-primary" />

          <span className="text-[9px] font-semibold">
            {copy.channels}
          </span>
        </div>

        <div className="mt-3 space-y-2 text-[8px]">
          <div className="flex justify-between">
            <span>
              Marketplace A
            </span>

            <span className="text-emerald-600">
              +12,4%
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Marketplace B
            </span>

            <span className="text-emerald-600">
              +8,7%
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Marketplace C
            </span>

            <span className="text-emerald-600">
              +4,1%
            </span>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-1/2 hidden w-[270px] rounded-2xl border bg-card p-3 shadow-xl shadow-black/10 transition-transform duration-300 ease-out will-change-transform md:flex md:items-center md:gap-3 motion-reduce:transform-none"
        style={{
          transform:
            "translate3d(calc(-50% + var(--depth-front-x, 0px)), var(--depth-front-y, 0px), 95px)",
        }}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <div className="text-[9px] font-semibold">
            {copy.insight}
          </div>

          <div className="mt-0.5 text-[8px] leading-relaxed text-muted-foreground">
            {
              copy.insightText
            }
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -bottom-4 -right-2 -z-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-transform duration-500 ease-out"
        style={{
          transform:
            "translate3d(var(--depth-back-x, 0px), var(--depth-back-y, 0px), -60px)",
        }}
        aria-hidden="true"
      />

      <div className="sr-only">
        <ShoppingCart />
        <Users />
      </div>
    </div>
  );
}
