import {
  BarChart3,
  Bot,
  Package,
  Search,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";

type LandingProductPreviewProps = {
  locale: string;
};

export function LandingProductPreview({
  locale,
}: LandingProductPreviewProps) {
  const isId =
    locale === "id";

  const copy =
    isId
      ? {
          attention:
            "Apa yang perlu perhatian hari ini?",
          brief:
            "Ringkasan harian berdasarkan data terverifikasi.",
          recommendation:
            "Lihat Rekomendasi",
          revenue:
            "Pendapatan",
          orders:
            "Pesanan Selesai",
          profit:
            "Laba Kotor",
          margin:
            "Margin Kotor",
          topProducts:
            "Top Produk",
          channels:
            "Channel Performance",
          insight:
            "AI Insight",
          insightText:
            "Permintaan kategori Fashion meningkat 18% minggu ini.",
          demo:
            "PREVIEW PRODUK",
        }
      : {
          attention:
            "What needs attention today?",
          brief:
            "Daily summary based on verified commerce data.",
          recommendation:
            "View Recommendation",
          revenue:
            "Revenue",
          orders:
            "Completed Orders",
          profit:
            "Gross Profit",
          margin:
            "Gross Margin",
          topProducts:
            "Top Products",
          channels:
            "Channel Performance",
          insight:
            "AI Insight",
          insightText:
            "Fashion category demand increased 18% this week.",
          demo:
            "PRODUCT PREVIEW",
        };

  return (
    <div className="relative mx-auto w-full max-w-[760px] py-4 sm:py-6 lg:py-5">
      <div className="absolute inset-8 -z-10 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-2xl shadow-primary/10">
        <div className="flex min-h-[410px]">
          <aside className="hidden w-[155px] shrink-0 bg-sidebar p-3 text-sidebar-foreground sm:block">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </span>

              <div>
                <div className="text-[10px] font-bold">
                  LAKUVO
                </div>

                <div className="text-[7px] text-sidebar-foreground/55">
                  Business Intelligence
                </div>
              </div>
            </div>

            <div className="mb-2 text-[7px] font-semibold text-sidebar-foreground/45">
              UTAMA
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 rounded-md bg-sidebar-primary px-2 py-1.5 text-[9px] text-sidebar-primary-foreground">
                <Sparkles className="h-3 w-3" />
                TODAY
              </div>

              <div className="flex items-center gap-2 px-2 py-1.5 text-[9px] text-sidebar-foreground/65">
                <BarChart3 className="h-3 w-3" />
                Dashboard
              </div>
            </div>

            <div className="mb-2 mt-5 text-[7px] font-semibold text-sidebar-foreground/45">
              AI & OTOMASI
            </div>

            <div className="space-y-1 text-[9px] text-sidebar-foreground/65">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Bot className="h-3 w-3" />
                LAKUVO AI
              </div>

              <div className="pl-7">
                Asisten AI
              </div>

              <div className="pl-7">
                Agen AI
              </div>

              <div className="pl-7">
                Action Center
              </div>
            </div>

            <div className="mb-2 mt-5 text-[7px] font-semibold text-sidebar-foreground/45">
              OPERASIONAL
            </div>

            <div className="space-y-1 text-[9px] text-sidebar-foreground/65">
              <div className="flex items-center gap-2 px-2 py-1">
                <Package className="h-3 w-3" />
                Produk
              </div>

              <div className="flex items-center gap-2 px-2 py-1">
                <Store className="h-3 w-3" />
                Marketplace
              </div>

              <div className="flex items-center gap-2 px-2 py-1">
                <Search className="h-3 w-3" />
                Riset
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex h-12 items-center justify-between border-b border-border/70 px-4">
              <span className="rounded-full bg-primary/10 px-2 py-1 text-[8px] font-semibold text-primary">
                {copy.demo}
              </span>

              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-muted" />
                <span className="hidden text-[8px] text-muted-foreground md:block">
                  User
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-lg font-bold">
                    TODAY
                  </div>

                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {copy.attention}
                  </div>
                </div>

                <div className="hidden text-[8px] text-muted-foreground md:block">
                  Snapshot terbaru
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.035] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold">
                      AI Daily Brief
                    </div>

                    <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
                      {copy.brief}
                    </p>
                  </div>

                  <span className="hidden rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-medium text-emerald-600 md:inline">
                    Ready
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/60 pt-3">
                  <p className="max-w-[340px] text-[9px] leading-relaxed text-muted-foreground">
                    3 priorities detected across commerce operations.
                  </p>

                  <span className="shrink-0 rounded-lg bg-primary px-3 py-2 text-[8px] font-semibold text-primary-foreground">
                    {copy.recommendation}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-[12px] font-semibold">
                  Commerce Snapshot
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {[
                    [
                      copy.revenue,
                      "Rp 125.430.000",
                      "+12,5%",
                    ],
                    [
                      copy.orders,
                      "1.250",
                      "+8,2%",
                    ],
                    [
                      copy.profit,
                      "Rp 48.210.000",
                      "+9,1%",
                    ],
                    [
                      copy.margin,
                      "38,4%",
                      "+1,3%",
                    ],
                  ].map(
                    (metric) => (
                      <div
                        key={metric[0]}
                        className="rounded-xl border bg-background/80 p-3"
                      >
                        <div className="text-[8px] text-muted-foreground">
                          {metric[0]}
                        </div>

                        <div className="mt-2 whitespace-nowrap text-[11px] font-bold">
                          {metric[1]}
                        </div>

                        <div className="mt-2 text-[8px] font-medium text-emerald-600">
                          {metric[2]}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[9px] text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Verified commerce metrics
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-3 top-[190px] hidden w-36 rotate-[-2deg] rounded-2xl border bg-card p-3 shadow-xl shadow-black/5 md:block">
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-primary" />
          <span className="text-[9px] font-semibold">
            {copy.topProducts}
          </span>
        </div>

        <div className="mt-3 space-y-2 text-[8px]">
          <div className="flex justify-between">
            <span>LAKUVO T-Shirt</span>
            <span className="font-semibold">
              #1
            </span>
          </div>

          <div className="flex justify-between">
            <span>LAKUVO Hoodie</span>
            <span className="font-semibold">
              #2
            </span>
          </div>

          <div className="flex justify-between">
            <span>LAKUVO Mug</span>
            <span className="font-semibold">
              #3
            </span>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 top-[180px] hidden w-40 rotate-[2deg] rounded-2xl border bg-card p-3 shadow-xl shadow-black/5 lg:block">
        <div className="flex items-center gap-2">
          <Store className="h-3.5 w-3.5 text-primary" />
          <span className="text-[9px] font-semibold">
            {copy.channels}
          </span>
        </div>

        <div className="mt-3 space-y-2 text-[8px]">
          <div className="flex justify-between">
            <span>Marketplace A</span>
            <span className="text-emerald-600">
              +12,4%
            </span>
          </div>

          <div className="flex justify-between">
            <span>Marketplace B</span>
            <span className="text-emerald-600">
              +8,7%
            </span>
          </div>

          <div className="flex justify-between">
            <span>Marketplace C</span>
            <span className="text-emerald-600">
              +4,1%
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 hidden w-[270px] -translate-x-1/2 rounded-2xl border bg-card p-3 shadow-xl shadow-black/5 sm:flex sm:items-center sm:gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <div className="text-[9px] font-semibold">
            {copy.insight}
          </div>

          <div className="mt-0.5 text-[8px] leading-relaxed text-muted-foreground">
            {copy.insightText}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-4 -right-2 -z-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

      <div className="sr-only">
        <ShoppingCart />
        <Users />
      </div>
    </div>
  );
}
