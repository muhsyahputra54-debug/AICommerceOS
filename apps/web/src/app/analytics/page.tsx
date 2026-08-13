import Link from "next/link";
import type { ReactNode } from "react";

import RevenueChart, {
  type SalesTrendPoint,
} from "@/components/dashboard/RevenueChart";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Analytics
          </h1>

          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
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
    supabase.rpc("get_sales_performance_summary", {
      p_organization_id: currentOrganization.organizationId,
    }),

    supabase.rpc("get_product_performance", {
      p_organization_id: currentOrganization.organizationId,
      p_product_id: null,
    }),

    supabase.rpc("get_sales_trend", {
      p_organization_id: currentOrganization.organizationId,
      p_days: 30,
    }),
  ]);

  if (summaryResult.error) {
    throw new Error(summaryResult.error.message);
  }

  if (performanceResult.error) {
    throw new Error(performanceResult.error.message);
  }

  if (trendResult.error) {
    throw new Error(trendResult.error.message);
  }

  const summary = {
    ...emptySummary,
    ...((summaryResult.data ?? {}) as unknown as Partial<SalesSummary>),
  };

  const products =
    (performanceResult.data ?? []) as unknown as ProductPerformanceRow[];

  const trend =
    (trendResult.data ?? []) as unknown as SalesTrendPoint[];

  const hasCompletedSales =
    toNumber(summary.completed_orders) > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics
          </h1>

          <p className="mt-2 text-muted-foreground">
            Product performance berdasarkan completed orders organization aktif.
          </p>
        </div>

        {!hasCompletedSales ? (
          <div className="rounded-2xl border border-dashed bg-card p-6">
            <h2 className="font-semibold">
              Belum ada completed sales
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Revenue, cost, profit, margin, dan sales trend akan dihitung
              dari order nyata setelah mencapai status completed.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Revenue"
            value={formatCurrency(summary.revenue)}
            description="Completed sales only"
          />

          <MetricCard
            label="Cost"
            value={formatCurrency(summary.cost)}
            description="Historical cost snapshots"
          />

          <MetricCard
            label="Gross Profit"
            value={formatCurrency(summary.profit)}
            description="Revenue dikurangi historical cost"
          />

          <MetricCard
            label="Gross Margin"
            value={formatPercent(summary.margin)}
            description="Gross profit / revenue"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Completed Orders"
            value={formatNumber(summary.completed_orders)}
          />

          <MetricCard
            label="Units Sold"
            value={formatNumber(summary.units_sold)}
          />

          <MetricCard
            label="Products Sold"
            value={formatNumber(summary.products_sold)}
          />

          <MetricCard
            label="Average Order Value"
            value={formatCurrency(summary.average_order_value)}
          />
        </div>

        <RevenueChart
          data={trend}
          title="Sales Trend"
          description="Revenue dan gross profit 30 hari terakhir"
        />

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">
              Product Performance
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Sales metrics menggunakan completed orders dan historical cost.
            </p>
          </div>

          {products.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Belum ada product pada organization aktif.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">
                      Product
                    </th>
                    <th className="px-5 py-3 text-left font-medium">
                      SKU
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Units
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Revenue
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Cost
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Profit
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Margin
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Stock
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
                        {formatNumber(product.total_units_sold)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatCurrency(product.revenue)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatCurrency(product.cost)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatCurrency(product.profit)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatPercent(product.margin)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {formatNumber(product.stock)}
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
