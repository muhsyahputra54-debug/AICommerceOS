import Link from "next/link";
import type { ReactNode } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type InventoryMetrics = {
  total_items: number;
  active_items: number;
  total_stock: number;
  low_stock: number;
  out_of_stock: number;
  inventory_cost_value: number | string;
  inventory_selling_value: number | string;
  potential_profit: number | string;
};

type InventoryIntelligence = {
  products: InventoryMetrics;
  variants: InventoryMetrics;
};

type InventoryAlert = {
  target_type: "product" | "variant";
  target_id: string;
  product_id: string;
  name: string;
  sku: string | null;
  stock: number;
  low_stock_threshold: number;
  stock_status: "low_stock" | "out_of_stock";
};

type MetricCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
};

const emptyMetrics: InventoryMetrics = {
  total_items: 0,
  active_items: 0,
  total_stock: 0,
  low_stock: 0,
  out_of_stock: 0,
  inventory_cost_value: 0,
  inventory_selling_value: 0,
  potential_profit: 0,
};

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function formatCurrency(value: number | string) {
  const numericValue = Number(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

export default async function InventoryPage() {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Inventory Intelligence
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
    intelligenceResult,
    alertsResult,
    movementsResult,
    productsResult,
    variantsResult,
  ] = await Promise.all([
    supabase.rpc("get_inventory_intelligence", {
      p_organization_id: currentOrganization.organizationId,
    }),

    supabase.rpc("get_inventory_alerts", {
      p_organization_id: currentOrganization.organizationId,
      p_limit: 50,
    }),

    supabase
      .from("inventory_movements")
      .select(
        "id, target_type, product_id, variant_id, movement_type, quantity_delta, stock_before, stock_after, reference_type, reference_id, note, created_at",
      )
      .eq("organization_id", currentOrganization.organizationId)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("products")
      .select("id, name, sku")
      .eq("organization_id", currentOrganization.organizationId),

    supabase
      .from("product_variants")
      .select("id, name, sku")
      .eq("organization_id", currentOrganization.organizationId),
  ]);

  if (intelligenceResult.error) {
    throw new Error(intelligenceResult.error.message);
  }

  if (alertsResult.error) {
    throw new Error(alertsResult.error.message);
  }

  if (movementsResult.error) {
    throw new Error(movementsResult.error.message);
  }

  if (productsResult.error) {
    throw new Error(productsResult.error.message);
  }

  if (variantsResult.error) {
    throw new Error(variantsResult.error.message);
  }

  const intelligence =
    intelligenceResult.data as unknown as InventoryIntelligence | null;

  const productMetrics =
    intelligence?.products ?? emptyMetrics;

  const variantMetrics =
    intelligence?.variants ?? emptyMetrics;

  const alerts =
    (alertsResult.data ?? []) as InventoryAlert[];

  const movements = movementsResult.data ?? [];
  const products = productsResult.data ?? [];
  const variants = variantsResult.data ?? [];

  const productNames = new Map(
    products.map((product) => [
      product.id,
      product.sku
        ? `${product.name} (${product.sku})`
        : product.name,
    ]),
  );

  const variantNames = new Map(
    variants.map((variant) => [
      variant.id,
      `${variant.name} (${variant.sku})`,
    ]),
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Inventory Intelligence
            </h1>

            <p className="mt-2 text-muted-foreground">
              Monitor stock health, inventory value, profit potential,
              alerts, dan movement history untuk organization aktif.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Products
          </Link>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Product Inventory
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Product dan variant dihitung terpisah untuk menghindari
              double-counting inventory.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Products"
              value={productMetrics.total_items}
              description={`${productMetrics.active_items} active`}
            />

            <MetricCard
              label="Total Product Stock"
              value={productMetrics.total_stock}
            />

            <MetricCard
              label="Low Stock"
              value={productMetrics.low_stock}
            />

            <MetricCard
              label="Out of Stock"
              value={productMetrics.out_of_stock}
            />

            <MetricCard
              label="Inventory Cost"
              value={formatCurrency(
                productMetrics.inventory_cost_value,
              )}
            />

            <MetricCard
              label="Selling Value"
              value={formatCurrency(
                productMetrics.inventory_selling_value,
              )}
            />

            <MetricCard
              label="Potential Profit"
              value={formatCurrency(
                productMetrics.potential_profit,
              )}
            />

            <MetricCard
              label="Stock Health"
              value={
                productMetrics.low_stock +
                  productMetrics.out_of_stock ===
                0
                  ? "Healthy"
                  : "Attention"
              }
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Variant Inventory
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Intelligence khusus inventory product variants.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Variants"
              value={variantMetrics.total_items}
              description={`${variantMetrics.active_items} active`}
            />

            <MetricCard
              label="Total Variant Stock"
              value={variantMetrics.total_stock}
            />

            <MetricCard
              label="Low Stock Variants"
              value={variantMetrics.low_stock}
            />

            <MetricCard
              label="Out of Stock Variants"
              value={variantMetrics.out_of_stock}
            />

            <MetricCard
              label="Variant Cost Value"
              value={formatCurrency(
                variantMetrics.inventory_cost_value,
              )}
            />

            <MetricCard
              label="Variant Selling Value"
              value={formatCurrency(
                variantMetrics.inventory_selling_value,
              )}
            />

            <MetricCard
              label="Variant Potential Profit"
              value={formatCurrency(
                variantMetrics.potential_profit,
              )}
            />

            <MetricCard
              label="Variant Stock Health"
              value={
                variantMetrics.low_stock +
                  variantMetrics.out_of_stock ===
                0
                  ? "Healthy"
                  : "Attention"
              }
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              Stock Alerts
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Out-of-stock dan low-stock inventory yang membutuhkan
              perhatian.
            </p>
          </div>

          {alerts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium">
                Tidak ada stock alert
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Inventory aktif saat ini berada di atas low-stock
                threshold.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">Item</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Stock</th>
                    <th className="px-6 py-3 font-medium">
                      Threshold
                    </th>
                    <th className="px-6 py-3 font-medium">
                      Status
                    </th>
                    <th className="px-6 py-3 font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {alerts.map((alert) => {
                    const href =
                      alert.target_type === "product"
                        ? `/products/${alert.product_id}/inventory/adjust`
                        : `/products/${alert.product_id}/variants/${alert.target_id}/inventory/adjust`;

                    return (
                      <tr
                        key={`${alert.target_type}-${alert.target_id}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {alert.name}
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            {alert.sku ?? "No SKU"}
                          </div>
                        </td>

                        <td className="px-6 py-4 capitalize">
                          {alert.target_type}
                        </td>

                        <td className="px-6 py-4 font-medium">
                          {alert.stock}
                        </td>

                        <td className="px-6 py-4">
                          {alert.low_stock_threshold}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                            {alert.stock_status.replaceAll("_", " ")}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <Link
                            href={href}
                            className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-muted"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              Inventory Movements
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              50 movement inventory terbaru.
            </p>
          </div>

          {movements.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium">
                Belum ada inventory movement
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Perubahan stock berikutnya akan tercatat di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium">Target</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Change</th>
                    <th className="px-6 py-3 font-medium">Before</th>
                    <th className="px-6 py-3 font-medium">After</th>
                    <th className="px-6 py-3 font-medium">
                      Reference
                    </th>
                    <th className="px-6 py-3 font-medium">Note</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {movements.map((movement) => {
                    const targetName =
                      movement.target_type === "product"
                        ? movement.product_id
                          ? productNames.get(movement.product_id) ??
                            "Deleted product"
                          : "Deleted product"
                        : movement.variant_id
                          ? variantNames.get(movement.variant_id) ??
                            "Deleted variant"
                          : "Deleted variant";

                    return (
                      <tr key={movement.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          {formatDate(movement.created_at)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {targetName}
                          </div>

                          <div className="mt-1 text-xs capitalize text-muted-foreground">
                            {movement.target_type}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                            {movement.movement_type.replaceAll("_", " ")}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-medium">
                          {formatDelta(movement.quantity_delta)}
                        </td>

                        <td className="px-6 py-4">
                          {movement.stock_before}
                        </td>

                        <td className="px-6 py-4">
                          {movement.stock_after}
                        </td>

                        <td className="px-6 py-4">
                          {movement.reference_type ?? "—"}
                        </td>

                        <td className="max-w-xs px-6 py-4 text-muted-foreground">
                          {movement.note ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}