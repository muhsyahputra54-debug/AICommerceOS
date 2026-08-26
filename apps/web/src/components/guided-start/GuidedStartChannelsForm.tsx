"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  Button,
} from "@/components/ui/button";

import type {
  BusinessProfile,
  BusinessProfileResponse,
} from "@/lib/ai/business-profile-client";

const CHANNEL_OPTIONS = [
  {
    value: "TikTok Shop",
    title: "TikTok Shop",
    description:
      "Cocok untuk produk yang mudah ditemukan lewat video dan live.",
  },
  {
    value: "Shopee",
    title: "Shopee",
    description:
      "Marketplace untuk menjangkau pembeli yang sudah aktif mencari produk.",
  },
  {
    value: "Instagram",
    title: "Instagram",
    description:
      "Bangun brand dan jual melalui konten, DM, atau tautan pemesanan.",
  },
  {
    value: "WhatsApp",
    title: "WhatsApp",
    description:
      "Cocok untuk penjualan personal, repeat order, dan pelanggan lokal.",
  },
  {
    value: "Marketplace lain",
    title: "Marketplace lain",
    description:
      "Gunakan jika Anda berjualan di kanal marketplace selain pilihan di atas.",
  },
  {
    value: "Penjualan langsung",
    title: "Penjualan langsung",
    description:
      "Untuk toko fisik, bazar, komunitas, reseller, atau transaksi langsung.",
  },
] as const;

type LoadState =
  | "loading"
  | "ready"
  | "missing"
  | "error";

function buildPreservedPayload(
  profile: BusinessProfile,
  channels: string[],
) {
  return {
    industry:
      profile.industry,

    businessType:
      profile.business_type,

    salesModel:
      profile.sales_model,

    primaryMarket:
      profile.primary_market,

    primarySalesChannels:
      channels,

    pricingStrategy:
      profile.pricing_strategy,

    primaryGoal:
      profile.primary_goal,

    operationalPriorities:
      profile.operational_priorities,

    businessDescription:
      profile.business_description,
  };
}

export function GuidedStartChannelsForm() {
  const router =
    useRouter();

  const [
    profile,
    setProfile,
  ] =
    useState<BusinessProfile | null>(
      null,
    );

  const [
    selected,
    setSelected,
  ] =
    useState<string[]>(
      [],
    );

  const [
    loadState,
    setLoadState,
  ] =
    useState<LoadState>(
      "loading",
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(
    () => {
      const controller =
        new AbortController();

      async function loadProfile() {
        try {
          const response =
            await fetch(
              "/api/ai/business-profile",
              {
                method: "GET",
                cache: "no-store",
                signal:
                  controller.signal,
              },
            );

          const body =
            (
              await response
                .json()
                .catch(
                  () => null,
                )
            ) as
              | BusinessProfileResponse
              | null;

          if (
            !response.ok
          ) {
            throw new Error(
              body?.error ??
                "Profil usaha belum dapat dimuat.",
            );
          }

          if (
            controller.signal.aborted
          ) {
            return;
          }

          if (
            !body?.profile
          ) {
            setLoadState(
              "missing",
            );

            return;
          }

          setProfile(
            body.profile,
          );

          setSelected(
            Array.isArray(
              body.profile
                .primary_sales_channels,
            )
              ? body.profile
                  .primary_sales_channels
              : [],
          );

          setLoadState(
            "ready",
          );
        } catch (error) {
          if (
            controller.signal.aborted
          ) {
            return;
          }

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Profil usaha belum dapat dimuat.",
          );

          setLoadState(
            "error",
          );
        }
      }

      void loadProfile();

      return () => {
        controller.abort();
      };
    },
    [],
  );

  function toggleChannel(
    channel: string,
  ) {
    setSelected(
      (current) =>
        current.includes(
          channel,
        )
          ? current.filter(
              (item) =>
                item !== channel,
            )
          : [
              ...current,
              channel,
            ],
    );

    setErrorMessage(
      null,
    );
  }

  async function saveAndContinue() {
    if (
      saving ||
      !profile
    ) {
      return;
    }

    setSaving(
      true,
    );

    setErrorMessage(
      null,
    );

    try {
      const response =
        await fetch(
          "/api/ai/business-profile",
          {
            method: "PUT",

            headers: {
              "content-type":
                "application/json",
            },

            body:
              JSON.stringify(
                buildPreservedPayload(
                  profile,
                  selected,
                ),
              ),
          },
        );

      const body =
        (
          await response
            .json()
            .catch(
              () => null,
            )
        ) as
          | BusinessProfileResponse
          | null;

      if (
        !response.ok
      ) {
        throw new Error(
          body?.error ??
            "Kanal penjualan belum dapat disimpan.",
        );
      }

      if (
        !body?.profile
      ) {
        throw new Error(
          "Respons penyimpanan kanal penjualan tidak valid.",
        );
      }

      router.push(
        "/get-started/marketing",
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Kanal penjualan belum dapat disimpan.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  if (
    loadState ===
    "loading"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-xl rounded-2xl border bg-card p-8 text-center">
          <p className="text-sm font-medium">
            Menyiapkan pilihan kanal...
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Memuat profil usaha Anda.
          </p>
        </div>
      </main>
    );
  }

  if (
    loadState ===
    "missing"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-xl rounded-2xl border bg-card p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            LAKUVO Guided Start
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Lengkapi profil usaha terlebih dahulu
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            LAKUVO belum menemukan Business Profile untuk workspace ini.
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={
              () =>
                router.push(
                  "/get-started/business",
                )
            }
          >
            Ke profil usaha
          </Button>
        </div>
      </main>
    );
  }

  if (
    loadState ===
    "error"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-xl rounded-2xl border bg-card p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            LAKUVO Guided Start
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Kanal penjualan belum dapat dimuat
          </h1>

          <p
            role="alert"
            className="mt-3 text-sm text-destructive"
          >
            {errorMessage}
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={
              () =>
                window.location.reload()
            }
          >
            Coba lagi
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            LAKUVO Guided Start
          </p>

          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Langkah 3 dari 5
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Di mana Anda ingin mulai berjualan?
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Pilih satu atau beberapa kanal. Anda tidak perlu menghubungkan akun marketplace sekarang.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {
            CHANNEL_OPTIONS.map(
              (channel) => {
                const active =
                  selected.includes(
                    channel.value,
                  );

                return (
                  <button
                    key={
                      channel.value
                    }
                    type="button"
                    aria-pressed={
                      active
                    }
                    disabled={
                      saving
                    }
                    onClick={
                      () =>
                        toggleChannel(
                          channel.value,
                        )
                    }
                    className={
                      active
                        ? "rounded-2xl border border-primary bg-primary/5 p-5 text-left shadow-sm transition"
                        : "rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:border-primary/50 hover:bg-muted/30"
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {
                            channel.title
                          }
                        </p>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {
                            channel.description
                          }
                        </p>
                      </div>

                      <span
                        className={
                          active
                            ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                            : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground"
                        }
                      >
                        {
                          active
                            ? "✓"
                            : "+"
                        }
                      </span>
                    </div>
                  </button>
                );
              },
            )
          }
        </div>

        <div className="mt-6 rounded-xl border border-border/70 bg-card p-4">
          <p className="text-sm font-medium">
            Pilihan Anda
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {
              selected.length > 0
                ? selected.join(
                    ", ",
                  )
                : "Belum ada kanal dipilih. Anda tetap dapat melanjutkan dan menentukannya nanti."
            }
          </p>
        </div>

        {
          errorMessage
            ? (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {errorMessage}
                </p>
              )
            : null
        }

        <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={
              saving
            }
            onClick={
              () =>
                router.push(
                  "/get-started/product",
                )
            }
          >
            Kembali
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              disabled={
                saving
              }
              onClick={
                () =>
                  router.push(
                    "/get-started/marketing",
                  )
              }
            >
              Tentukan nanti
            </Button>

            <Button
              type="button"
              disabled={
                saving
              }
              onClick={
                () =>
                  void saveAndContinue()
              }
            >
              {
                saving
                  ? "Menyimpan..."
                  : "Simpan & lanjut"
              }
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Guided Start hanya menyimpan pilihan kanal. Tidak ada akun marketplace yang dihubungkan dan tidak ada konten yang dipublikasikan otomatis.
        </p>
      </div>
    </main>
  );
}