"use client";

import {
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  Button,
} from "@/components/ui/button";

type ChatResponse = {
  message?: string;
  conversationId?: string | null;
  error?: string;
};

const MARKETING_PLAN_PROMPT = `
Bertindak sebagai LAKUVO Growth Assistant untuk pemilik usaha kecil yang sedang memulai bisnis.

Gunakan Business Profile, produk, harga, stok, dan konteks bisnis LAKUVO yang tersedia untuk membuat rencana pemasaran organik selama 7 hari.

Tujuan:
- membantu pengguna mendapatkan perhatian dan calon pembeli pertama;
- prioritaskan kanal penjualan yang sudah dipilih pengguna;
- berikan langkah yang realistis untuk usaha kecil;
- jangan mengarang fakta yang tidak tersedia;
- jika data bisnis masih terbatas, nyatakan asumsi secara singkat.

Buat jawaban dalam Bahasa Indonesia dengan format:

RINGKASAN STRATEGI
2-4 kalimat singkat.

HARI 1 sampai HARI 7
Untuk setiap hari berikan:
1. Tujuan
2. Kanal
3. Ide konten atau aktivitas
4. Contoh pesan / hook / caption singkat
5. Call to action
6. Indikator sederhana yang perlu diperhatikan

PRIORITAS SETELAH 7 HARI
Berikan 3 tindakan berikutnya.

Batasan penting:
- jangan menjalankan tindakan apa pun;
- jangan mengklaim telah memposting konten;
- jangan mengubah produk, harga, atau stok;
- jangan menghubungkan marketplace;
- jangan menyarankan pengeluaran iklan berbayar sebagai kewajiban;
- jangan menjanjikan hasil penjualan tertentu;
- fokus pada pemasaran organik yang sederhana dan dapat dilakukan pemula.
`.trim();

export function GuidedStartMarketingPlan() {
  const router =
    useRouter();

  const [
    plan,
    setPlan,
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
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  async function generatePlan() {
    if (
      loading
    ) {
      return;
    }

    setLoading(
      true,
    );

    setErrorMessage(
      null,
    );

    try {
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
                      MARKETING_PLAN_PROMPT,
                  },
                ],
              }),
          },
        );

      const data =
        (
          await response
            .json()
            .catch(
              () => ({}),
            )
        ) as ChatResponse;

      if (
        !response.ok
      ) {
        throw new Error(
          data.error?.trim() ||
            "AI belum dapat membuat rencana pemasaran.",
        );
      }

      const message =
        data.message?.trim();

      if (
        !message
      ) {
        throw new Error(
          "AI tidak mengembalikan rencana pemasaran.",
        );
      }

      setPlan(
        message,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error &&
          error.message.trim()
          ? error.message
          : "AI belum dapat membuat rencana pemasaran.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            LAKUVO Guided Start
          </p>

          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Langkah 4 dari 5
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Buat rencana pemasaran 7 hari
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            LAKUVO AI akan menggunakan konteks usaha, produk, stok, harga, dan kanal penjualan Anda untuk menyusun langkah pemasaran organik yang bisa mulai dilakukan.
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold">
              AI membantu merencanakan, bukan bertindak
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Tidak ada posting otomatis, pengeluaran iklan, perubahan harga, perubahan stok, atau tindakan marketplace dari langkah ini.
            </p>
          </div>

          {
            !plan
              ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto max-w-xl">
                      <h2 className="text-xl font-semibold">
                        Siap membuat rencana pertama?
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        AI akan membuat rencana praktis untuk 7 hari. Anda tetap dapat melewati langkah ini jika ingin melanjutkan tanpa AI.
                      </p>

                      <Button
                        type="button"
                        className="mt-6"
                        disabled={
                          loading
                        }
                        onClick={
                          () =>
                            void generatePlan()
                        }
                      >
                        {
                          loading
                            ? "AI sedang menyusun..."
                            : "Buat rencana 7 hari dengan AI"
                        }
                      </Button>
                    </div>
                  </div>
                )
              : (
                  <div className="mt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          Rencana pemasaran 7 hari
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Rencana ini bersifat rekomendasi dan dapat Anda sesuaikan.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          loading
                        }
                        onClick={
                          () =>
                            void generatePlan()
                        }
                      >
                        {
                          loading
                            ? "Menyusun ulang..."
                            : "Buat ulang"
                        }
                      </Button>
                    </div>

                    <div className="mt-5 whitespace-pre-wrap rounded-xl border border-border/70 bg-muted/20 p-5 text-sm leading-7">
                      {plan}
                    </div>
                  </div>
                )
          }

          {
            errorMessage
              ? (
                  <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                    <p
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {errorMessage}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Guided Start tetap dapat dilanjutkan tanpa AI.
                    </p>
                  </div>
                )
              : null
          }

          <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={
                loading
              }
              onClick={
                () =>
                  router.push(
                    "/get-started/channels",
                  )
              }
            >
              Kembali
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row">
              {
                !plan
                  ? (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={
                          loading
                        }
                        onClick={
                          () =>
                            router.push(
                              "/get-started/complete",
                            )
                        }
                      >
                        Lewati AI
                      </Button>
                    )
                  : null
              }

              <Button
                type="button"
                disabled={
                  loading
                }
                onClick={
                  () =>
                    router.push(
                      "/get-started/complete",
                    )
                }
              >
                Lanjut ke selesai
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Penggunaan AI mengikuti allowance dan metering LAKUVO yang berlaku untuk workspace Anda.
        </p>
      </div>
    </main>
  );
}