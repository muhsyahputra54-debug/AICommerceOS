import type { Metadata } from "next";
import Link from "next/link";

import ActionCenterWorkspace from "@/components/ai/ActionCenterWorkspace";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  parseTodayActionCenterHandoff,
  type TodayActionCenterHandoffRecommendationId,
} from "@/lib/ai/today-action-center-handoff";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "AI Action Center",
};

type ActionCenterPageSearchParams =
  Record<
    string,
    string | string[] | undefined
  >;

type ActionCenterPageProps = {
  searchParams:
    Promise<ActionCenterPageSearchParams>;
};

function toUrlSearchParams(
  input: ActionCenterPageSearchParams,
) {
  const params =
    new URLSearchParams();

  for (
    const [
      key,
      value,
    ] of Object.entries(input)
  ) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(
          key,
          item,
        );
      }

      continue;
    }

    if (typeof value === "string") {
      params.append(
        key,
        value,
      );
    }
  }

  return params;
}

function recommendationLabel(
  recommendationId:
    TodayActionCenterHandoffRecommendationId,
  isIndonesian: boolean,
) {
  switch (recommendationId) {
    case "review-out-of-stock-inventory":
      return isIndonesian
        ? "Tinjau inventaris yang kehabisan stok"
        : "Review out-of-stock inventory";

    case "review-marketplace-health":
      return isIndonesian
        ? "Tinjau kesehatan marketplace"
        : "Review marketplace health";

    case "review-low-stock-inventory":
      return isIndonesian
        ? "Tinjau inventaris stok rendah"
        : "Review low-stock inventory";
  }
}

export default async function ActionCenterPage({
  searchParams,
}: ActionCenterPageProps) {
  const [
    locale,
    resolvedSearchParams,
  ] =
    await Promise.all([
      getLocale(),
      searchParams,
    ]);

  const handoff =
    parseTodayActionCenterHandoff(
      toUrlSearchParams(
        resolvedSearchParams,
      ),
    );

  const isIndonesian =
    locale === "id";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {handoff ? (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {isIndonesian
                    ? "Konteks TODAY"
                    : "TODAY context"}
                </p>

                <h2 className="mt-1 font-semibold">
                  {recommendationLabel(
                    handoff.recommendationId,
                    isIndonesian,
                  )}
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800">
                  {isIndonesian
                    ? "Dibuka dari rekomendasi TODAY. Konteks ini hanya untuk navigasi; TODAY tidak membuat proposal, konfirmasi, atau eksekusi controlled action."
                    : "Opened from a TODAY recommendation. This context is navigation only; TODAY does not create, confirm, or execute a controlled action."}
                </p>
              </div>

              <Link
                href="/today"
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-blue-300 bg-white px-3 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-100"
              >
                {isIndonesian
                  ? "Kembali ke TODAY"
                  : "Back to TODAY"}
              </Link>
            </div>
          </section>
        ) : null}

        <ActionCenterWorkspace />
      </div>
    </DashboardLayout>
  );
}