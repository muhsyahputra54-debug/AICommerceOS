import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import RevenueChart, {
  type SalesTrendPoint,
} from "@/components/dashboard/RevenueChart";
import RecentOrders from "@/components/dashboard/RecentOrders";
import QuickActions from "@/components/dashboard/QuickActions";

import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
} from "lucide-react";

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

  return Number.isFinite(parsed) ? parsed : 0;
}

function getIntlLocale(locale: Locale) {
  return locale === "id" ? "id-ID" : "en-US";
}

function formatCurrency(value: MonetaryValue) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatNumber(
  value: MonetaryValue,
  locale: Locale
) {
  return new Intl.NumberFormat(
    getIntlLocale(locale)
  ).format(toNumber(value));
}

function formatPercent(
  value: MonetaryValue,
  locale: Locale
) {
  return `${toNumber(value).toLocaleString(
    getIntlLocale(locale),
    {
      maximumFractionDigits: 2,
    }
  )}%`;
}

export default async function Home() {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const dashboard = dictionary.dashboard;

  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div className="mx-auto w-full max-w-[1600px] space-y-6 px-1 sm:px-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {dashboard.title}
            </h1>

            <p className="mt-2 text-muted-foreground">
              {dashboard.noOrganization}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();

  const [
    summaryResult,
    trendResult,
    customersResult,
  ] = await Promise.all([
    supabase.rpc("get_sales_performance_summary", {
      p_organization_id:
        currentOrganization.organizationId,
    }),

    supabase.rpc("get_sales_trend", {
      p_organization_id:
        currentOrganization.organizationId,
      p_days: 7,
    }),

    supabase
      .from("customers")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      ),
  ]);

  if (summaryResult.error) {
    throw new Error(summaryResult.error.message);
  }

  if (trendResult.error) {
    throw new Error(trendResult.error.message);
  }

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  const summary = {
    ...emptySummary,
    ...((summaryResult.data ?? {}) as unknown as Partial<SalesSummary>),
  };

  const trend =
    (trendResult.data ?? []) as unknown as SalesTrendPoint[];

  const customerCount = customersResult.count ?? 0;

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-1 sm:space-y-8 sm:px-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {dashboard.title}
          </h1>

          <p className="text-sm text-muted-foreground sm:text-base">
            {dashboard.subtitle}
          </p>
        </div>

        <section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              title={dashboard.stats.revenue.title}
              value={formatCurrency(summary.revenue)}
              description={
                dashboard.stats.revenue.description
              }
              icon={
                <DollarSign className="h-6 w-6 text-primary" />
              }
            />

            <StatsCard
              title={
                dashboard.stats.completedOrders.title
              }
              value={formatNumber(
                summary.completed_orders,
                locale
              )}
              description={
                dashboard.stats.completedOrders
                  .description
              }
              icon={
                <ShoppingCart className="h-6 w-6 text-primary" />
              }
            />

            <StatsCard
              title={dashboard.stats.customers.title}
              value={formatNumber(
                customerCount,
                locale
              )}
              description={
                dashboard.stats.customers.description
              }
              icon={
                <Users className="h-6 w-6 text-primary" />
              }
            />

            <StatsCard
              title={dashboard.stats.grossProfit.title}
              value={formatCurrency(summary.profit)}
              description={
                dashboard.stats.grossProfit.description
              }
              icon={
                <TrendingUp className="h-6 w-6 text-primary" />
              }
            />
          </div>
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <RevenueChart
              data={trend}
              locale={locale}
              title={dashboard.revenueChart.title}
              description={
                dashboard.revenueChart.description
              }
              emptyTitle={
                dashboard.revenueChart.emptyTitle
              }
              emptyDescription={
                dashboard.revenueChart
                  .emptyDescription
              }
              revenueLabel={
                dashboard.revenueChart.revenueLabel
              }
              profitLabel={
                dashboard.revenueChart.profitLabel
              }
            />
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              {dashboard.performance.title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {dashboard.performance.description}
            </p>

            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {dashboard.performance.grossMargin}
                </span>

                <span className="font-semibold">
                  {formatPercent(
                    summary.margin,
                    locale
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {dashboard.performance.averageOrder}
                </span>

                <span className="font-semibold">
                  {formatCurrency(
                    summary.average_order_value
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {dashboard.performance.unitsSold}
                </span>

                <span className="font-semibold">
                  {formatNumber(
                    summary.units_sold,
                    locale
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {dashboard.performance.productsSold}
                </span>

                <span className="font-semibold">
                  {formatNumber(
                    summary.products_sold,
                    locale
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="min-w-0">
          <RecentOrders
            copy={dashboard.recentOrders}
          />
        </section>

        <section className="min-w-0">
          <QuickActions
            copy={dashboard.quickActions}
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
