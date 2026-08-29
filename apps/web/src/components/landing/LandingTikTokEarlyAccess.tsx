import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Upload,
} from "lucide-react";

import type {
  Locale,
} from "@/lib/i18n/config";

type LandingTikTokEarlyAccessProps = Readonly<{
  locale: Locale;
}>;

export function LandingTikTokEarlyAccess({
  locale,
}: LandingTikTokEarlyAccessProps) {
  const isId =
    locale === "id";

  const copy =
    isId
      ? {
          eyebrow:
            "TIKTOK DIRECT PUBLISHING · EARLY ACCESS",
          title:
            "Dari ide sampai tayang di TikTok.",
          description:
            "Siapkan video di LAKUVO, tinjau caption, privasi, interaksi, dan disclosure, lalu publikasikan hanya setelah Anda memberikan persetujuan.",
          availability:
            "Ketersediaan produksi mengikuti persetujuan platform TikTok. Early Access digunakan untuk menyiapkan workflow Anda lebih awal.",
          cta:
            "Gabung Early Access",
          trust:
            "Tidak ada posting otomatis tanpa persetujuan Anda.",
          steps: [
            [
              "Siapkan konten",
              "Pilih video dan caption yang ingin Anda publikasikan.",
            ],
            [
              "Review kontrol TikTok",
              "Tinjau privasi, komentar, duet, stitch, serta disclosure sebelum lanjut.",
            ],
            [
              "Setujui & publikasikan",
              "Publikasi dimulai setelah konfirmasi eksplisit dari Anda.",
            ],
          ],
          points: [
            "Akun TikTok tetap berada di bawah kontrol Anda.",
            "Status publikasi dipantau tanpa mengunggah ulang video secara sembarangan.",
            "LAKUVO menangani workflow teknis; seller tidak perlu menjadi TikTok Developer.",
          ],
        }
      : {
          eyebrow:
            "TIKTOK DIRECT PUBLISHING · EARLY ACCESS",
          title:
            "From idea to published on TikTok.",
          description:
            "Prepare a video in LAKUVO, review the caption, privacy, interactions, and disclosures, then publish only after you explicitly approve it.",
          availability:
            "Production availability is subject to TikTok platform approval. Early Access lets you prepare your workflow ahead of availability.",
          cta:
            "Join Early Access",
          trust:
            "No automatic posting without your approval.",
          steps: [
            [
              "Prepare content",
              "Choose the video and caption you want to publish.",
            ],
            [
              "Review TikTok controls",
              "Review privacy, comments, duet, stitch, and disclosures before continuing.",
            ],
            [
              "Approve & publish",
              "Publishing starts only after your explicit confirmation.",
            ],
          ],
          points: [
            "Your TikTok account remains under your control.",
            "Publishing status can be checked without blindly re-uploading the video.",
            "LAKUVO handles the technical workflow; sellers do not need to become TikTok Developers.",
          ],
        };

  const icons = [
    Upload,
    MessageSquareText,
    ShieldCheck,
  ] as const;

  return (
    <section
      id="tiktok-early-access"
      className="relative overflow-hidden border-y border-border/60 bg-background"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-3xl" />

      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-primary">
              <LockKeyhole className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </div>

            <h2 className="mt-5 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
              {copy.title}
            </h2>

            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              {copy.description}
            </p>

            <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/[0.035] p-4">
              <p className="text-sm font-semibold">
                {copy.trust}
              </p>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {copy.availability}
              </p>
            </div>

            <Link
              href="/signup"
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
            >
              {copy.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-7">
            <div className="grid gap-4 md:grid-cols-3">
              {copy.steps.map(
                (
                  [
                    title,
                    description,
                  ],
                  index,
                ) => {
                  const Icon =
                    icons[index];

                  return (
                    <article
                      key={title}
                      className="relative rounded-2xl border bg-background p-5"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4.5 w-4.5" />
                      </span>

                      <span className="absolute right-4 top-4 text-3xl font-black text-primary/[0.08]">
                        {index + 1}
                      </span>

                      <h3 className="mt-5 text-sm font-semibold">
                        {title}
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {description}
                      </p>
                    </article>
                  );
                },
              )}
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-muted/35 p-5">
              {copy.points.map(
                (point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 text-sm leading-6"
                  >
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      {point}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}