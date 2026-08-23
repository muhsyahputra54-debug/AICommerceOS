"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  CheckCircle2,
  Clock3,
  Package,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { LandingHeroLiveSimulation } from "./LandingHeroLiveSimulation";

type LandingProductWorkspaceCycleProps = {
  locale: string;
};

type WorkspaceKey =
  | "today"
  | "orders"
  | "products"
  | "analytics"
  | "ai";

type Workspace = {
  key: WorkspaceKey;
  label: string;
  icon: LucideIcon;
};

const WORKSPACE_ORDER: WorkspaceKey[] =
  [
    "today",
    "orders",
    "products",
    "analytics",
    "ai",
  ];

const WORKSPACE_DURATION: Record<
  WorkspaceKey,
  number
> = {
  today:
    13200,
  orders:
    4800,
  products:
    4800,
  analytics:
    5200,
  ai:
    6000,
};

export function LandingProductWorkspaceCycle({
  locale,
}: LandingProductWorkspaceCycleProps) {
  const isId =
    locale === "id";

  const copy =
    isId
      ? {
          productPreview:
            "PREVIEW PRODUK",
          user:
            "User",
          snapshot:
            "Snapshot terbaru",

          today:
            "TODAY",
          orders:
            "Pesanan",
          products:
            "Produk",
          analytics:
            "Analitik",
          ai:
            "LAKUVO AI",

          main:
            "UTAMA",
          aiAutomation:
            "AI & OTOMASI",
          operations:
            "OPERASIONAL",
          analyticsGroup:
            "ANALITIK",
          dashboard:
            "Dasbor",
          actionCenter:
            "Action Center",

          todayAttention:
            "Apa yang perlu perhatian hari ini?",
          commerceSnapshot:
            "Commerce Snapshot",
          revenue:
            "Pendapatan",
          completedOrders:
            "Pesanan Selesai",
          grossProfit:
            "Laba Kotor",
          grossMargin:
            "Margin Kotor",
          verifiedMetrics:
            "Verified commerce metrics",

          ordersTitle:
            "Pesanan bergerak dalam satu antrean kerja.",
          ordersDescription:
            "Lihat pesanan baru, yang sedang diproses, dan yang siap dikirim tanpa berpindah workspace.",
          newOrders:
            "Pesanan Baru",
          processing:
            "Diproses",
          readyToShip:
            "Siap Dikirim",
          recentOrders:
            "Aktivitas Pesanan Terbaru",
          incoming:
            "Baru",
          packed:
            "Dikemas",
          ready:
            "Siap kirim",

          productsTitle:
            "Produk dan stok yang perlu perhatian terlihat lebih cepat.",
          productsDescription:
            "LAKUVO menyatukan performa produk dengan kondisi inventori agar risiko stock-out tidak terlambat ditangani.",
          lowStock:
            "Risiko Stok",
          healthy:
            "Stok Sehat",
          topProducts:
            "Top Produk Minggu Ini",
          daysLeft:
            "hari tersisa",

          analyticsTitle:
            "Performa commerce menjadi lebih mudah dibaca.",
          analyticsDescription:
            "Pantau revenue, order, margin, dan performa channel dalam konteks yang sama.",
          weeklyRevenue:
            "Revenue Mingguan",
          channelPerformance:
            "Channel Performance",
          comparedToLastWeek:
            "dibanding minggu lalu",

          aiTitle:
            "Tanyakan bisnis Anda, bukan hanya datanya.",
          aiDescription:
            "LAKUVO AI menggunakan konteks commerce yang terverifikasi untuk menjelaskan apa yang terjadi dan apa yang layak ditinjau berikutnya.",
          aiQuestion:
            "Apa yang paling perlu saya perhatikan hari ini?",
          aiAnswer:
            "Prioritaskan stok. 3 SKU dengan demand tertinggi diperkirakan habis dalam 2 hari dan menyumbang 41% revenue kategori Fashion minggu ini.",
          recommendation:
            "Rekomendasi berikutnya",
          aiAction:
            "Tinjau restock di Action Center",
          controlled:
            "Tindakan penting tetap membutuhkan konfirmasi.",
        }
      : {
          productPreview:
            "PRODUCT PREVIEW",
          user:
            "User",
          snapshot:
            "Latest snapshot",

          today:
            "TODAY",
          orders:
            "Orders",
          products:
            "Products",
          analytics:
            "Analytics",
          ai:
            "LAKUVO AI",

          main:
            "MAIN",
          aiAutomation:
            "AI & AUTOMATION",
          operations:
            "OPERATIONS",
          analyticsGroup:
            "ANALYTICS",
          dashboard:
            "Dashboard",
          actionCenter:
            "Action Center",

          todayAttention:
            "What needs attention today?",
          commerceSnapshot:
            "Commerce Snapshot",
          revenue:
            "Revenue",
          completedOrders:
            "Completed Orders",
          grossProfit:
            "Gross Profit",
          grossMargin:
            "Gross Margin",
          verifiedMetrics:
            "Verified commerce metrics",

          ordersTitle:
            "Orders move through one operating queue.",
          ordersDescription:
            "See new orders, processing work, and shipments without switching between disconnected tools.",
          newOrders:
            "New Orders",
          processing:
            "Processing",
          readyToShip:
            "Ready to Ship",
          recentOrders:
            "Latest Order Activity",
          incoming:
            "New",
          packed:
            "Packed",
          ready:
            "Ready",

          productsTitle:
            "Product and inventory risks surface earlier.",
          productsDescription:
            "LAKUVO connects product performance with inventory conditions so stockout risk is easier to act on.",
          lowStock:
            "Stock Risk",
          healthy:
            "Healthy Stock",
          topProducts:
            "Top Products This Week",
          daysLeft:
            "days left",

          analyticsTitle:
            "Commerce performance becomes easier to read.",
          analyticsDescription:
            "Track revenue, orders, margin, and channel performance in the same business context.",
          weeklyRevenue:
            "Weekly Revenue",
          channelPerformance:
            "Channel Performance",
          comparedToLastWeek:
            "vs last week",

          aiTitle:
            "Ask about your business, not just the data.",
          aiDescription:
            "LAKUVO AI uses verified commerce context to explain what is happening and what deserves review next.",
          aiQuestion:
            "What should I pay attention to today?",
          aiAnswer:
            "Prioritize inventory. 3 high-demand SKUs may run out within 2 days and contribute 41% of Fashion category revenue this week.",
          recommendation:
            "Next recommendation",
          aiAction:
            "Review restock in Action Center",
          controlled:
            "Important actions still require confirmation.",
        };

  const workspaces: Workspace[] =
    [
      {
        key:
          "today",
        label:
          copy.today,
        icon:
          Sparkles,
      },
      {
        key:
          "orders",
        label:
          copy.orders,
        icon:
          ShoppingCart,
      },
      {
        key:
          "products",
        label:
          copy.products,
        icon:
          Package,
      },
      {
        key:
          "analytics",
        label:
          copy.analytics,
        icon:
          BarChart3,
      },
      {
        key:
          "ai",
        label:
          copy.ai,
        icon:
          Bot,
      },
    ];

  const [
    activeWorkspace,
    setActiveWorkspace,
  ] =
    useState<WorkspaceKey>(
      "today",
    );

  const [
    reducedMotion,
    setReducedMotion,
  ] =
    useState(false);

  const workspaceRef =
    useRef<HTMLDivElement>(
      null,
    );

  const [
    workspaceVisible,
    setWorkspaceVisible,
  ] =
    useState(false);

  useEffect(
    () => {
      const node =
        workspaceRef.current;

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
              setWorkspaceVisible(
                true,
              );
            },
            0,
          );

        return () => {
          window.clearTimeout(
            timer,
          );
        };
      }

      const observer =
        new IntersectionObserver(
          (
            entries,
          ) => {
            const entry =
              entries[0];

            setWorkspaceVisible(
              Boolean(
                entry?.isIntersecting,
              ),
            );
          },
          {
            threshold:
              0.25,
          },
        );

      observer.observe(
        node,
      );

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
        !workspaceVisible
      ) {
        return;
      }

      const timer =
        window.setTimeout(
          () => {
            const index =
              WORKSPACE_ORDER.indexOf(
                activeWorkspace,
              );

            const nextIndex =
              (
                index + 1
              ) %
              WORKSPACE_ORDER.length;

            setActiveWorkspace(
              WORKSPACE_ORDER[
                nextIndex
              ],
            );
          },
          WORKSPACE_DURATION[
            activeWorkspace
          ],
        );

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    },
    [
      activeWorkspace,
      reducedMotion,
      workspaceVisible,
    ],
  );

  const selectWorkspace =
    (
      key: WorkspaceKey,
    ) => {
      setActiveWorkspace(
        key,
      );
    };

  const activeIndex =
    WORKSPACE_ORDER.indexOf(
      activeWorkspace,
    );

  const navClass =
    (
      key: WorkspaceKey,
    ) =>
      `flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[9px] transition-all ${
        activeWorkspace === key
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      }`;

  return (
    <div
      ref={workspaceRef}
      data-workspace-visible={
        workspaceVisible
          ? "true"
          : "false"
      }
      className="flex min-h-[520px] md:h-[600px] md:min-h-0 xl:h-[620px]"
    >
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
          {copy.main}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={
              () => {
                selectWorkspace(
                  "today",
                );
              }
            }
            className={
              navClass(
                "today",
              )
            }
          >
            <Sparkles className="h-3 w-3" />
            TODAY
          </button>

          <div className="flex items-center gap-2 px-2 py-1.5 text-[9px] text-sidebar-foreground/50">
            <BarChart3 className="h-3 w-3" />
            {copy.dashboard}
          </div>
        </div>

        <div className="mb-2 mt-5 text-[7px] font-semibold text-sidebar-foreground/45">
          {copy.aiAutomation}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={
              () => {
                selectWorkspace(
                  "ai",
                );
              }
            }
            className={
              navClass(
                "ai",
              )
            }
          >
            <Bot className="h-3 w-3" />
            LAKUVO AI
          </button>

          <div className="px-2 py-1.5 pl-7 text-[9px] text-sidebar-foreground/45">
            {copy.actionCenter}
          </div>
        </div>

        <div className="mb-2 mt-5 text-[7px] font-semibold text-sidebar-foreground/45">
          {copy.operations}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={
              () => {
                selectWorkspace(
                  "products",
                );
              }
            }
            className={
              navClass(
                "products",
              )
            }
          >
            <Package className="h-3 w-3" />
            {copy.products}
          </button>

          <div className="flex items-center gap-2 px-2 py-1.5 text-[9px] text-sidebar-foreground/45">
            <Store className="h-3 w-3" />
            Marketplace
          </div>

          <button
            type="button"
            onClick={
              () => {
                selectWorkspace(
                  "orders",
                );
              }
            }
            className={
              navClass(
                "orders",
              )
            }
          >
            <ShoppingCart className="h-3 w-3" />
            {copy.orders}
          </button>
        </div>

        <div className="mb-2 mt-5 text-[7px] font-semibold text-sidebar-foreground/45">
          {copy.analyticsGroup}
        </div>

        <button
          type="button"
          onClick={
            () => {
              selectWorkspace(
                "analytics",
              );
            }
          }
          className={
            navClass(
              "analytics",
            )
          }
        >
          <TrendingUp className="h-3 w-3" />
          {copy.analytics}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center justify-between border-b border-border/70 px-4">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-[8px] font-semibold text-primary">
            {
              copy.productPreview
            }
          </span>

          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-muted" />

            <span className="hidden text-[8px] text-muted-foreground md:block">
              {copy.user}
            </span>
          </div>
        </div>

        <div className="border-b border-border/60 px-3 py-2 sm:px-4">
          <div className="flex gap-1 overflow-x-auto">
            {workspaces.map(
              (
                workspace,
              ) => {
                const Icon =
                  workspace.icon;

                const selected =
                  activeWorkspace ===
                  workspace.key;

                return (
                  <button
                    key={
                      workspace.key
                    }
                    type="button"
                    onClick={
                      () => {
                        selectWorkspace(
                          workspace.key,
                        );
                      }
                    }
                    aria-pressed={
                      selected
                    }
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[8px] font-semibold transition-all ${
                      selected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {
                      workspace.label
                    }
                  </button>
                );
              },
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
          <div
            key={
              activeWorkspace
            }
            className={
              reducedMotion
                ? "min-h-0 md:flex-1 md:overflow-hidden"
                : "min-h-0 md:flex-1 md:overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
            }
          >
            {
              activeWorkspace ===
                "today"
                ? (
                  <TodayWorkspace
                    locale={
                      locale
                    }
                    copy={
                      copy
                    }
                    visible={
                      workspaceVisible ||
                      reducedMotion
                    }
                  />
                )
                : null
            }

            {
              activeWorkspace ===
                "orders"
                ? (
                  <OrdersWorkspace
                    copy={
                      copy
                    }
                  />
                )
                : null
            }

            {
              activeWorkspace ===
                "products"
                ? (
                  <ProductsWorkspace
                    copy={
                      copy
                    }
                  />
                )
                : null
            }

            {
              activeWorkspace ===
                "analytics"
                ? (
                  <AnalyticsWorkspace
                    copy={
                      copy
                    }
                    visible={
                      workspaceVisible ||
                      reducedMotion
                    }
                  />
                )
                : null
            }

            {
              activeWorkspace ===
                "ai"
                ? (
                  <AiWorkspace
                    copy={
                      copy
                    }
                  />
                )
                : null
            }
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
            <div className="flex items-center gap-1">
              {WORKSPACE_ORDER.map(
                (
                  workspace,
                  index,
                ) => (
                  <button
                    key={
                      workspace
                    }
                    type="button"
                    onClick={
                      () => {
                        selectWorkspace(
                          workspace,
                        );
                      }
                    }
                    aria-label={
                      workspaces[
                        index
                      ].label
                    }
                    className={`h-1 rounded-full transition-all duration-500 ${
                      index ===
                      activeIndex
                        ? "w-6 bg-primary"
                        : "w-2 bg-primary/20 hover:bg-primary/35"
                    }`}
                  />
                ),
              )}
            </div>

            <span className="text-[8px] font-medium text-muted-foreground">
              {
                activeIndex +
                1
              } / {
                WORKSPACE_ORDER.length
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

type WorkspaceCopy = {
  snapshot: string;
  todayAttention: string;
  commerceSnapshot: string;
  revenue: string;
  completedOrders: string;
  grossProfit: string;
  grossMargin: string;
  verifiedMetrics: string;

  orders: string;
  ordersTitle: string;
  ordersDescription: string;
  newOrders: string;
  processing: string;
  readyToShip: string;
  recentOrders: string;
  incoming: string;
  packed: string;
  ready: string;

  products: string;
  productsTitle: string;
  productsDescription: string;
  lowStock: string;
  healthy: string;
  topProducts: string;
  daysLeft: string;

  analytics: string;
  analyticsTitle: string;
  analyticsDescription: string;
  weeklyRevenue: string;
  channelPerformance: string;
  comparedToLastWeek: string;

  aiTitle: string;
  aiDescription: string;
  aiQuestion: string;
  aiAnswer: string;
  recommendation: string;
  aiAction: string;
  controlled: string;
};

function TodayWorkspace({
  locale,
  copy,
  visible,
}: {
  locale: string;
  copy: WorkspaceCopy;
  visible: boolean;
}) {
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-lg font-bold">
            TODAY
          </div>

          <div className="mt-1 text-[10px] text-muted-foreground">
            {
              copy.todayAttention
            }
          </div>
        </div>

        <div className="hidden text-[8px] text-muted-foreground md:block">
          {copy.snapshot}
        </div>
      </div>

      <LandingHeroLiveSimulation
        locale={
          locale
        }
        active={
          visible
        }
      />

      <div className="mt-5">
        <div className="text-[12px] font-semibold">
          {
            copy.commerceSnapshot
          }
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            [
              copy.revenue,
              "Rp 125.430.000",
              "+12,5%",
            ],
            [
              copy.completedOrders,
              "1.250",
              "+8,2%",
            ],
            [
              copy.grossProfit,
              "Rp 48.210.000",
              "+9,1%",
            ],
            [
              copy.grossMargin,
              "38,4%",
              "+1,3%",
            ],
          ].map(
            (
              metric,
              index,
            ) => (
              <div
                key={
                  metric[0]
                }
                className={`rounded-xl border bg-background/80 p-3 transition-all duration-500 ${
                  visible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
                style={{
                  transitionDelay:
                    `${index * 70}ms`,
                }}
              >
                <div className="text-[8px] text-muted-foreground">
                  {
                    metric[0]
                  }
                </div>

                <div className="mt-2 whitespace-nowrap text-[11px] font-bold">
                  {
                    metric[1]
                  }
                </div>

                <div className="mt-2 text-[8px] font-medium text-emerald-600">
                  {
                    metric[2]
                  }
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[9px] text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        {
          copy.verifiedMetrics
        }
      </div>
    </>
  );
}

function OrdersWorkspace({
  copy,
}: {
  copy: WorkspaceCopy;
}) {
  const orders =
    [
      {
        id:
          "#LK-1048",
        channel:
          "Marketplace A",
        amount:
          "Rp 1.240.000",
        status:
          copy.incoming,
        icon:
          Clock3,
        tone:
          "text-blue-600 bg-blue-500/10",
      },
      {
        id:
          "#LK-1047",
        channel:
          "Marketplace B",
        amount:
          "Rp 875.000",
        status:
          copy.packed,
        icon:
          Boxes,
        tone:
          "text-amber-600 bg-amber-500/10",
      },
      {
        id:
          "#LK-1046",
        channel:
          "Marketplace A",
        amount:
          "Rp 2.150.000",
        status:
          copy.ready,
        icon:
          Truck,
        tone:
          "text-emerald-600 bg-emerald-500/10",
      },
    ];

  return (
    <>
      <div className="max-w-[500px]">
        <div className="text-lg font-bold">
          {copy.orders}
        </div>

        <div className="mt-1 text-[11px] font-semibold">
          {
            copy.ordersTitle
          }
        </div>

        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
          {
            copy.ordersDescription
          }
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          [
            copy.newOrders,
            "12",
            ShoppingCart,
          ],
          [
            copy.processing,
            "8",
            Clock3,
          ],
          [
            copy.readyToShip,
            "4",
            Truck,
          ],
        ].map(
          (
            item,
          ) => {
            const Icon =
              item[2] as LucideIcon;

            return (
              <div
                key={
                  item[0] as string
                }
                className="rounded-xl border bg-background/80 p-3"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />

                <div className="mt-3 text-[15px] font-bold">
                  {
                    item[1] as string
                  }
                </div>

                <div className="mt-1 text-[8px] text-muted-foreground">
                  {
                    item[0] as string
                  }
                </div>
              </div>
            );
          },
        )}
      </div>

      <div className="mt-5">
        <div className="text-[11px] font-semibold">
          {
            copy.recentOrders
          }
        </div>

        <div className="mt-3 space-y-2">
          {orders.map(
            (
              order,
            ) => {
              const Icon =
                order.icon;

              return (
                <div
                  key={
                    order.id
                  }
                  className="flex items-center gap-3 rounded-xl border bg-background/70 p-3"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${order.tone}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold">
                      {
                        order.id
                      }
                    </div>

                    <div className="mt-0.5 text-[8px] text-muted-foreground">
                      {
                        order.channel
                      }
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] font-semibold">
                      {
                        order.amount
                      }
                    </div>

                    <div className="mt-0.5 text-[8px] text-muted-foreground">
                      {
                        order.status
                      }
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </>
  );
}

function ProductsWorkspace({
  copy,
}: {
  copy: WorkspaceCopy;
}) {
  return (
    <>
      <div className="max-w-[500px]">
        <div className="text-lg font-bold">
          {copy.products}
        </div>

        <div className="mt-1 text-[11px] font-semibold">
          {
            copy.productsTitle
          }
        </div>

        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
          {
            copy.productsDescription
          }
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.035] p-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold">
              {copy.lowStock}
            </div>

            <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[8px] font-semibold text-amber-700 dark:text-amber-400">
              3 SKU
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {[
              [
                "LAKUVO Hoodie Black",
                "2",
                "18%",
              ],
              [
                "Essential Tee Navy",
                "1",
                "12%",
              ],
              [
                "Daily Tote Sand",
                "2",
                "24%",
              ],
            ].map(
              (
                product,
              ) => (
                <div
                  key={
                    product[0]
                  }
                >
                  <div className="flex items-center justify-between gap-3 text-[9px]">
                    <span className="font-semibold">
                      {
                        product[0]
                      }
                    </span>

                    <span className="text-amber-700 dark:text-amber-400">
                      {
                        product[1]
                      } {
                        copy.daysLeft
                      }
                    </span>
                  </div>

                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-amber-500/10">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width:
                          product[2],
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-background/70 p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />

            <div className="text-[10px] font-bold">
              {copy.topProducts}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {[
              [
                "LAKUVO T-Shirt",
                "+18,4%",
              ],
              [
                "LAKUVO Hoodie",
                "+12,1%",
              ],
              [
                "LAKUVO Mug",
                "+8,7%",
              ],
            ].map(
              (
                product,
                index,
              ) => (
                <div
                  key={
                    product[0]
                  }
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                >
                  <div>
                    <span className="mr-2 text-[8px] font-bold text-primary">
                      #{
                        index +
                        1
                      }
                    </span>

                    <span className="text-[9px] font-semibold">
                      {
                        product[0]
                      }
                    </span>
                  </div>

                  <span className="text-[8px] font-medium text-emerald-600">
                    {
                      product[1]
                    }
                  </span>
                </div>
              ),
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[8px] text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {copy.healthy}: 124 SKU
          </div>
        </div>
      </div>
    </>
  );
}

function AnalyticsWorkspace({
  copy,
  visible,
}: {
  copy: WorkspaceCopy;
  visible: boolean;
}) {
  const bars =
    [
      42,
      56,
      48,
      70,
      62,
      86,
      78,
    ];

  return (
    <>
      <div className="max-w-[500px]">
        <div className="text-lg font-bold">
          {
            copy.analytics
          }
        </div>

        <div className="mt-1 text-[11px] font-semibold">
          {
            copy.analyticsTitle
          }
        </div>

        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
          {
            copy.analyticsDescription
          }
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border bg-background/75 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[9px] text-muted-foreground">
                {
                  copy.weeklyRevenue
                }
              </div>

              <div className="mt-1 text-lg font-bold">
                Rp 84,2 jt
              </div>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-semibold text-emerald-600">
              +12,4%
            </span>
          </div>

          <div className="mt-5 flex h-28 items-end gap-2">
            {bars.map(
              (
                height,
                index,
              ) => (
                <div
                  key={
                    `${height}-${index}`
                  }
                  className="flex h-full flex-1 items-end"
                >
                  <div
                    className="w-full rounded-t-md bg-primary/70 transition-all duration-700 ease-out"
                    style={{
                      height:
                        visible
                          ? `${height}%`
                          : "0%",
                      transitionDelay:
                        `${index * 80}ms`,
                    }}
                  />
                </div>
              ),
            )}
          </div>

          <div className="mt-3 text-[8px] text-muted-foreground">
            +12,4% {
              copy.comparedToLastWeek
            }
          </div>
        </div>

        <div className="rounded-2xl border bg-background/75 p-4">
          <div className="text-[10px] font-bold">
            {
              copy.channelPerformance
            }
          </div>

          <div className="mt-4 space-y-4">
            {[
              [
                "Marketplace A",
                "52%",
                "+12,4%",
              ],
              [
                "Marketplace B",
                "31%",
                "+8,7%",
              ],
              [
                "Marketplace C",
                "17%",
                "+4,1%",
              ],
            ].map(
              (
                channel,
                index,
              ) => (
                <div
                  key={
                    channel[0]
                  }
                >
                  <div className="flex justify-between gap-3 text-[8px]">
                    <span className="font-semibold">
                      {
                        channel[0]
                      }
                    </span>

                    <span className="text-emerald-600">
                      {
                        channel[2]
                      }
                    </span>
                  </div>

                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary/10">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                      style={{
                        width:
                          visible
                            ? channel[1]
                            : "0%",
                        transitionDelay:
                          `${index * 120}ms`,
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[9px] text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        {
          copy.verifiedMetrics
        }
      </div>
    </>
  );
}

function AiWorkspace({
  copy,
}: {
  copy: WorkspaceCopy;
}) {
  return (
    <>
      <div className="max-w-[520px]">
        <div className="text-lg font-bold">
          LAKUVO AI
        </div>

        <div className="mt-1 text-[11px] font-semibold">
          {
            copy.aiTitle
          }
        </div>

        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
          {
            copy.aiDescription
          }
        </p>
      </div>

      <div className="mt-5 rounded-2xl border bg-background/70 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted">
            <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
          </span>

          <div className="rounded-xl bg-muted/55 px-3 py-2 text-[10px] font-medium">
            {
              copy.aiQuestion
            }
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1 rounded-2xl border border-primary/15 bg-primary/[0.035] p-3">
            <div className="flex items-center gap-2 text-[9px] font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              LAKUVO AI
            </div>

            <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
              {
                copy.aiAnswer
              }
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.035] p-4">
        <div className="text-[9px] font-bold tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
          {
            copy.recommendation
          }
        </div>

        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold">
              {
                copy.aiAction
              }
            </div>

            <div className="mt-1 text-[8px] text-muted-foreground">
              {
                copy.controlled
              }
            </div>
          </div>

          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </>
  );
}
