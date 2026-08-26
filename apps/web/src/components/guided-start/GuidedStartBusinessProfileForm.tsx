"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  Button,
} from "@/components/ui/button";
import {
  Input,
} from "@/components/ui/input";

import {
  EMPTY_BUSINESS_PROFILE_FORM,
  businessProfileToForm,
  listInputToArray,
  type BusinessProfileForm,
  type BusinessProfileResponse,
} from "@/lib/ai/business-profile-client";

type LoadState =
  | "loading"
  | "ready"
  | "error";

function nullableText(
  value: string,
) {
  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

export function GuidedStartBusinessProfileForm() {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] =
    useState<BusinessProfileForm>({
      ...EMPTY_BUSINESS_PROFILE_FORM,
    });

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
            !body ||
            !(
              "profile" in
              body
            )
          ) {
            throw new Error(
              "Respons profil usaha tidak valid.",
            );
          }

          if (
            controller
              .signal
              .aborted
          ) {
            return;
          }

          setForm(
            businessProfileToForm(
              body.profile ??
                null,
            ),
          );

          setLoadState(
            "ready",
          );
        } catch (error) {
          if (
            controller
              .signal
              .aborted
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

  function updateField<
    Key extends keyof BusinessProfileForm,
  >(
    key: Key,
    value: BusinessProfileForm[Key],
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      }),
    );

    setErrorMessage(
      null,
    );
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      saving ||
      loadState !==
        "ready"
    ) {
      return;
    }

    const industry =
      form.industry.trim();

    const businessType =
      form.businessType.trim();

    const primaryGoal =
      form.primaryGoal.trim();

    if (
      !industry ||
      !businessType ||
      !primaryGoal
    ) {
      setErrorMessage(
        "Lengkapi jenis usaha, model bisnis, dan tujuan utama terlebih dahulu.",
      );

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
              JSON.stringify({
                industry,

                businessType,

                salesModel:
                  nullableText(
                    form.salesModel,
                  ),

                primaryMarket:
                  nullableText(
                    form.primaryMarket,
                  ),

                primarySalesChannels:
                  listInputToArray(
                    form.primarySalesChannels,
                  ),

                pricingStrategy:
                  nullableText(
                    form.pricingStrategy,
                  ),

                primaryGoal,

                operationalPriorities:
                  listInputToArray(
                    form.operationalPriorities,
                  ),

                businessDescription:
                  nullableText(
                    form.businessDescription,
                  ),
              }),
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
            "Profil usaha belum dapat disimpan.",
        );
      }

      if (
        !body?.profile
      ) {
        throw new Error(
          "Profil usaha tersimpan dengan respons yang tidak valid.",
        );
      }

      router.push(
        "/get-started/product",
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Profil usaha belum dapat disimpan.",
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
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
        <div className="w-full max-w-xl rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-medium">
            Menyiapkan Guided Start...
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
    "error"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
        <div className="w-full max-w-xl rounded-2xl border border-border/70 bg-card p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            LAKUVO Guided Start
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Profil usaha belum dapat dimuat
          </h1>

          <p
            role="alert"
            className="mt-3 text-sm leading-6 text-destructive"
          >
            {errorMessage}
          </p>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Data lama tidak diubah. Muat ulang halaman untuk mencoba kembali.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={
                () =>
                  router.push(
                    "/get-started",
                  )
              }
            >
              Kembali
            </Button>

            <Button
              type="button"
              onClick={
                () =>
                  window.location.reload()
              }
            >
              Coba lagi
            </Button>
          </div>
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
            Langkah 1 dari 5
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Ceritakan usaha Anda
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Informasi ini membantu LAKUVO memahami bisnis Anda sehingga TODAY dan AI dapat memberi panduan yang lebih relevan.
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="guided-start-industry"
                className="text-sm font-medium"
              >
                Jenis usaha *
              </label>

              <Input
                id="guided-start-industry"
                value={
                  form.industry
                }
                placeholder="Contoh: Fashion, makanan, skincare"
                onChange={
                  (event) =>
                    updateField(
                      "industry",
                      event.target.value,
                    )
                }
                disabled={
                  saving
                }
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="guided-start-business-type"
                className="text-sm font-medium"
              >
                Model bisnis *
              </label>

              <Input
                id="guided-start-business-type"
                value={
                  form.businessType
                }
                placeholder="Contoh: Retail online, reseller, brand sendiri"
                onChange={
                  (event) =>
                    updateField(
                      "businessType",
                      event.target.value,
                    )
                }
                disabled={
                  saving
                }
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="guided-start-sales-model"
                className="text-sm font-medium"
              >
                Menjual kepada
              </label>

              <select
                id="guided-start-sales-model"
                value={
                  form.salesModel
                }
                onChange={
                  (event) =>
                    updateField(
                      "salesModel",
                      event.target.value,
                    )
                }
                disabled={
                  saving
                }
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  Belum ditentukan
                </option>

                <option value="b2c">
                  Konsumen langsung (B2C)
                </option>

                <option value="b2b">
                  Bisnis lain (B2B)
                </option>

                <option value="hybrid">
                  Keduanya
                </option>

                <option value="other">
                  Lainnya
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="guided-start-market"
                className="text-sm font-medium"
              >
                Target pasar
              </label>

              <Input
                id="guided-start-market"
                value={
                  form.primaryMarket
                }
                placeholder="Contoh: Wanita 18-35 tahun di Indonesia"
                onChange={
                  (event) =>
                    updateField(
                      "primaryMarket",
                      event.target.value,
                    )
                }
                disabled={
                  saving
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="guided-start-channels"
              className="text-sm font-medium"
            >
              Tempat berjualan
            </label>

            <Input
              id="guided-start-channels"
              value={
                form.primarySalesChannels
              }
              placeholder="Contoh: TikTok Shop, Shopee, Instagram, WhatsApp"
              onChange={
                (event) =>
                  updateField(
                    "primarySalesChannels",
                    event.target.value,
                  )
              }
              disabled={
                saving
              }
            />

            <p className="text-xs text-muted-foreground">
              Pisahkan beberapa kanal dengan koma.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="guided-start-goal"
              className="text-sm font-medium"
            >
              Tujuan utama saat ini *
            </label>

            <Input
              id="guided-start-goal"
              value={
                form.primaryGoal
              }
              placeholder="Contoh: Mendapatkan 10 pelanggan pertama"
              onChange={
                (event) =>
                  updateField(
                    "primaryGoal",
                    event.target.value,
                  )
              }
              disabled={
                saving
              }
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="guided-start-description"
              className="text-sm font-medium"
            >
              Ceritakan sedikit tentang usaha Anda
            </label>

            <textarea
              id="guided-start-description"
              rows={4}
              value={
                form.businessDescription
              }
              placeholder="Apa yang ingin Anda jual, siapa calon pembelinya, atau ide usaha yang sedang Anda siapkan?"
              onChange={
                (event) =>
                  updateField(
                    "businessDescription",
                    event.target.value,
                  )
              }
              disabled={
                saving
              }
              className="flex w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {
            errorMessage
              ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    {errorMessage}
                  </p>
                )
              : null
          }

          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  saving
                }
                onClick={
                  () =>
                    router.push(
                      "/get-started",
                    )
                }
              >
                Kembali
              </Button>

              <Button
                type="button"
                variant="ghost"
                disabled={
                  saving
                }
                onClick={
                  () =>
                    router.push(
                      "/today",
                    )
                }
              >
                Lewati dulu
              </Button>
            </div>

            <Button
              type="submit"
              disabled={
                saving
              }
            >
              {
                saving
                  ? "Menyimpan..."
                  : "Simpan & buat produk pertama"
              }
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}