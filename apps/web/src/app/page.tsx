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

function formatCurrency(value: MonetaryValue) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatNumber(value: MonetaryValue) {
  return new Intl.NumberFormat("id-ID").format(toNumber(value));
}

function formatPercent(value: MonetaryValue) {
  return `${toNumber(value).toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })}%`;
}

export default async function Home() {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div className="mx-auto w-full max-w-[1600px] space-y-6 px-1 sm:px-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-2 text-muted-foreground">
              Organization aktif tidak ditemukan.
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
      p_organization_id: currentOrganization.organizationId,
    }),

    supabase.rpc("get_sales_trend", {
      p_organization_id: currentOrganization.organizationId,
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
            Dashboard
          </h1>

          <p className="text-sm text-muted-foreground sm:text-base">
            Ringkasan commerce organization aktif.
          </p>
        </div>

        <section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              title="Revenue"
              value={formatCurrency(summary.revenue)}
              description="Completed sales"
              icon={
                <DollarSign className="h-6 w-6 text-blue-600" />
              }
            />

            <StatsCard
              title="Completed Orders"
              value={formatNumber(summary.completed_orders)}
              description="Order terminal completed"
              icon={
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              }
            />

            <StatsCard
              title="Customers"
              value={formatNumber(customerCount)}
              description="Organization aktif"
              icon={
                <Users className="h-6 w-6 text-blue-600" />
              }
            />

            <StatsCard
              title="Gross Profit"
              value={formatCurrency(summary.profit)}
              description="Historical revenue - cost"
              icon={
                <TrendingUp className="h-6 w-6 text-blue-600" />
              }
            />
          </div>
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <RevenueChart
              data={trend}
              title="Revenue & Profit"
              description="Completed sales 7 hari terakhir"
            />
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Performance Overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Metrics nyata dari completed orders.
            </p>

            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Gross Margin
                </span>

                <span className="font-semibold">
                  {formatPercent(summary.margin)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Average Order
                </span>

                <span className="font-semibold">
                  {formatCurrency(summary.average_order_value)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Units Sold
                </span>

                <span className="font-semibold">
                  {formatNumber(summary.units_sold)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Products Sold
                </span>

                <span className="font-semibold">
                  {formatNumber(summary.products_sold)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="min-w-0">
          <RecentOrders />
        </section>

        <section className="min-w-0">
          <QuickActions />
        </section>
      </div>
    </DashboardLayout>
  );
}
