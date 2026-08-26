"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type BusinessStage =
  | "starting"
  | "selling"
  | "growing";

type GuidedStartEntryProps = {
  organizationName:
    string;
};

export function GuidedStartEntry({
  organizationName,
}: GuidedStartEntryProps) {
  const router =
    useRouter();

  function continueWithStage(
    stage:
      BusinessStage,
  ) {
    if (
      stage ===
      "starting"
    ) {
      router.push(
        "/get-started/business",
      );

      return;
    }

    router.push(
      "/today",
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">
              LAKUVO Guided Start
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Mari siapkan usaha Anda
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Workspace{" "}
              <span className="font-medium text-foreground">
                {organizationName}
              </span>{" "}
              sudah siap. Pilih kondisi usaha Anda sekarang agar LAKUVO
              dapat membantu dari langkah yang paling relevan.
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            <button
              type="button"
              onClick={() =>
                continueWithStage(
                  "starting",
                )
              }
              className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-left transition hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="font-semibold">
                Saya baru mau memulai usaha
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Bantu saya menyiapkan usaha, produk pertama, harga, stok,
                tempat berjualan, dan langkah pemasaran pertama.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                continueWithStage(
                  "selling",
                )
              }
              className="rounded-2xl border border-border p-5 text-left transition hover:border-primary/60 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="font-semibold">
                Saya sudah mulai berjualan
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Saya sudah memiliki produk atau pesanan dan ingin mulai
                mengelolanya dengan lebih rapi.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                continueWithStage(
                  "growing",
                )
              }
              className="rounded-2xl border border-border p-5 text-left transition hover:border-primary/60 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="font-semibold">
                Bisnis saya sudah berjalan
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Saya ingin menggunakan LAKUVO untuk membantu operasional,
                analitik, marketplace, AI, dan pertumbuhan bisnis.
              </p>
            </button>
          </div>

          <div className="mt-8 flex justify-end border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(
                  "/today",
                )
              }
            >
              Lewati untuk sekarang
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}