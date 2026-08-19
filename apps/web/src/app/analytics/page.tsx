import Link from "next/link";
import type { ReactNode } from "react";

import RevenueChart, {
  type SalesTrendPoint,
} from "@/components/dashboard/RevenueChart";
import DashboardLayout from "@/components/layout/DashboardLayout";

import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

type MonetaryValue = number | string;

type SalesSummary = {
  completed_orders: MonetaryValue;
  units_sold: MonetaryValue;
  products_sold: MonetaryValue;
  revenue: MonetaryValue;
  cost: MonetaryValue;
  profit: MonetaryValue;
  margin: MonetaryValue;
  average_order_value: MonetaryValue;
};

type ProductPerformanceRow = {
  product_id: string;
  product_name: string;
  sku: string | null;
  stock: number;
  total_units_sold: MonetaryValue;
  revenue: MonetaryValue;
  cost: MonetaryValue;
  profit: MonetaryValue;
  margin: MonetaryValue;
};

type MetricCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
};

const emptySummary: SalesSummary = {
  completed_orders: 0,
  units_sold: 0,
  products_sold: 0,
  revenue: 0,
  cost: 0,
  profit: 0,
  margin: 0,
  average_order_value: 0,
};

function toNumber(value: MonetaryValue) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function getIntlLocale(locale: Locale) {
  return locale === "id"
    ? "id-ID"
    : "en-US";
}

function formatCurrency(
  value: MonetaryValue,
  locale: Locale,
) {
  return new Intl.NumberFormat(
    getIntlLocale(locale),
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    },
  ).format(toNumber(value));
}

function formatNumber(
  value: MonetaryValue,
  locale: Locale,
) {
  return new Intl.NumberFormat(
    getIntlLocale(locale),
  ).format(toNumber(value));
}

function formatPercent(
  value: MonetaryValue,
  locale: Locale,
) {
  return `${toNumber(value).toLocaleString(
    getIntlLocale(locale),
    {
      maximumFractionDigits: 2,
    },
  )}%`;
}

function MetricCard({
  label,
  value,
  description,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      {description ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default async function AnalyticsPage() {
  const locale = await getLocale();
  const analytics =
    getDictionary(locale).analytics;

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {analytics.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {analytics.noOrganization}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();

  const [
    summaryResult,
    performanceResult,
    trendResult,
  ] = await Promise.all([
    supabase.rpc(
      "get_sales_performance_summary",
      {
        p_organization_id:
          currentOrganization.organizationId,
      },
    ),

    supabase.rpc(
      "get_product_performance",
      {
        p_organization_id:
          currentOrganization.organizationId,
        p_product_id: null,
      },
    ),

    supabase.rpc(
      "get_sales_trend",
      {
        p_organization_id:
          currentOrganization.organizationId,
        p_days: 30,
      },
    ),
  ]);

  if (summaryResult.error) {
    throw new Error(
      summaryResult.error.message,
    );
  }

  if (performanceResult.error) {
    throw new Error(
      performanceResult.error.message,
    );
  }

  if (trendResult.error) {
    throw new Error(
      trendResult.error.message,
    );
  }

  const summary = {
    ...emptySummary,
    ...((summaryResult.data ??
      {}) as unknown as Partial<SalesSummary>),
  };

  const products =
    (performanceResult.data ??
      []) as unknown as ProductPerformanceRow[];

  const trend =
    (trendResult.data ??
      []) as unknown as SalesTrendPoint[];

  const hasCompletedSales =
    toNumber(summary.completed_orders) > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {analytics.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {analytics.description}
          </p>
        </div>

        {!hasCompletedSales ? (
          <div className="rounded-2xl border border-dashed bg-card p-6">
            <h2 className="font-semibold">
              {analytics.emptySales.title}
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {analytics.emptySales.description}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={
              analytics.metrics.revenue.label
            }
            value={formatCurrency(
              summary.revenue,
              locale,
            )}
            description={
              analytics.metrics.revenue
                .description
            }
          />

          <MetricCard
            label={
              analytics.metrics.cost.label
            }
            value={formatCurrency(
              summary.cost,
              locale,
            )}
            description={
              analytics.metrics.cost
                .description
            }
          />

          <MetricCard
            label={
              analytics.metrics.grossProfit
                .label
            }
            value={formatCurrency(
              summary.profit,
              locale,
            )}
            description={
              analytics.metrics.grossProfit
                .description
            }
          />

          <MetricCard
            label={
              analytics.metrics.grossMargin
                .label
            }
            value={formatPercent(
              summary.margin,
              locale,
            )}
            description={
              analytics.metrics.grossMargin
                .description
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={
              analytics.metrics
                .completedOrders
            }
            value={formatNumber(
              summary.completed_orders,
              locale,
            )}
          />

          <MetricCard
            label={
              analytics.metrics.unitsSold
            }
            value={formatNumber(
              summary.units_sold,
              locale,
            )}
          />

          <MetricCard
            label={
              analytics.metrics.productsSold
            }
            value={formatNumber(
              summary.products_sold,
              locale,
            )}
          />

          <MetricCard
            label={
              analytics.metrics
                .averageOrderValue
            }
            value={formatCurrency(
              summary.average_order_value,
              locale,
            )}
          />
        </div>

        <RevenueChart
          data={trend}
          locale={locale}
          title={analytics.chart.title}
          description={
            analytics.chart.description
          }
          emptyTitle={
            analytics.chart.emptyTitle
          }
          emptyDescription={
            analytics.chart.emptyDescription
          }
          revenueLabel={
            analytics.chart.revenueLabel
          }
          profitLabel={
            analytics.chart.profitLabel
          }
        />

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">
              {analytics.productPerformance.title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {
                analytics.productPerformance
                  .description
              }
            </p>
          </div>

          {products.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {analytics.productPerformance.empty}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">
                      {
                        analytics
                          .productPerformance
                          .columns.product
                      }
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      {
                        analytics
                          .productPerformance
                          .columns.sku
                      }
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      {
                        analytics
                          .productPerformance
                          .columns.units
                      }
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      {
                        analytics
                          .productPerformance
                          .columns.revenue
                      }
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      {
                        analytics
                          .productPerformance
                          .columns.cost
                      }
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      {
                        analytics
                          .productPerformance
                          .columns.profit
                      }
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      {
                        analytics
                          .productPerformance
                          .columns.margin
                      }
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      {
                        analytics
                          .productPerformance
                          .columns.stock
                      }
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.product_id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-5 py-4 font-medium">
                        <Link
                          href={`/products/${product.product_id}/performance`}
                          className="underline-offset-4 hover:underline"
                        >
                          {product.product_name}
                        </Link>
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {product.sku ?? "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatNumber(
                          product.total_units_sold,
                          locale,
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatCurrency(
                          product.revenue,
                          locale,
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatCurrency(
                          product.cost,
                          locale,
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatCurrency(
                          product.profit,
                          locale,
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatPercent(
                          product.margin,
                          locale,
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatNumber(
                          product.stock,
                          locale,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
