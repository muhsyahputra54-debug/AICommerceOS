import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
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

export default async function ProductPerformancePage({
  params,
}: ProductPerformancePageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product Performance
          </h1>

          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
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
              Product Performance
            </h1>

            <p className="mt-2 text-muted-foreground">
              Sales, revenue, historical cost, profit, margin, dan current stock.
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
              Analytics
            </Link>

            <Link
              href="/products"
              className="inline-flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Back to Products
            </Link>
          </div>
        </div>

        {!hasSales ? (
          <div className="rounded-2xl border border-dashed bg-card p-6">
            <h2 className="font-semibold">
              Belum ada completed sales
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Product ini belum memiliki penjualan completed. Metrics
              performance tetap ditampilkan sebagai nilai nol yang nyata.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Units Sold
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatNumber(performance.total_units_sold)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Revenue
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(performance.revenue)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Historical Cost
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(performance.cost)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Gross Profit
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(performance.profit)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Gross Margin
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatPercent(performance.margin)}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Current Stock
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatNumber(performance.stock)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Revenue dan cost menggunakan snapshot order yang sudah selesai.
          Perubahan selling price atau cost product setelah order dibuat tidak
          mengubah historical performance.
        </div>
      </div>
    </DashboardLayout>
  );
}
