import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type MonetaryValue = number | string;

type ProductPerformancePageProps = {
  params: Promise<{
    id: string;
  }>;
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

function toNumber(value: MonetaryValue) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: MonetaryValue, locale: "id" | "en") {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatNumber(value: MonetaryValue, locale: "id" | "en") {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US").format(toNumber(value));
}

function formatPercent(value: MonetaryValue, locale: "id" | "en") {
  return `${toNumber(value).toLocaleString(locale === "id" ? "id-ID" : "en-US", {
    maximumFractionDigits: 2,
  })}%`;
}

export default async function ProductPerformancePage({
  params,
}: ProductPerformancePageProps) {
  const locale = await getLocale();
  const copy =
    getDictionary(locale).products.performance;
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {copy.noOrganization}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, sku")
    .eq("id", id)
    .eq("organization_id", currentOrganization.organizationId)
    .maybeSingle();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!product) {
    notFound();
  }

  const performanceResult = await supabase.rpc(
    "get_product_performance",
    {
      p_organization_id: currentOrganization.organizationId,
      p_product_id: product.id,
    },
  );

  if (performanceResult.error) {
    throw new Error(performanceResult.error.message);
  }

  const performanceRows =
    (performanceResult.data ?? []) as unknown as ProductPerformanceRow[];

  const performance = performanceRows[0];

  if (!performance) {
    throw new Error("Product performance result not found.");
  }

  const hasSales =
    toNumber(performance.total_units_sold) > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {copy.title}
            </h1>

            <p className="mt-2 text-muted-foreground">
              {copy.description}
            </p>

            <p className="mt-2 text-sm font-medium">
              {product.name}
              {product.sku ? ` (${product.sku})` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/analytics"
              className="inline-flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              {copy.analytics}
            </Link>

            <Link
              href="/products"
              className="inline-flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              {copy.backToProducts}
            </Link>
          </div>
        </div>

        {!hasSales ? (
          <div className="rounded-2xl border border-dashed bg-card p-6">
            <h2 className="font-semibold">
              {copy.noSalesTitle}
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {copy.noSalesDescription}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {copy.metrics.unitsSold}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatNumber(performance.total_units_sold, locale)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {copy.metrics.revenue}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(performance.revenue, locale)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {copy.metrics.historicalCost}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(performance.cost, locale)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {copy.metrics.grossProfit}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(performance.profit, locale)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {copy.metrics.grossMargin}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatPercent(performance.margin, locale)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {copy.metrics.currentStock}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatNumber(performance.stock, locale)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          {copy.note}
        </div>
      </div>
    </DashboardLayout>
  );
}
