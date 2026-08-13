import Link from "next/link";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export default async function InventoryPage() {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Inventory
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
    { data: movements, error: movementsError },
    { data: products, error: productsError },
    { data: variants, error: variantsError },
  ] = await Promise.all([
    supabase
      .from("inventory_movements")
      .select(
        "id, target_type, product_id, variant_id, movement_type, quantity_delta, stock_before, stock_after, reference_type, reference_id, note, created_at",
      )
      .eq("organization_id", currentOrganization.organizationId)
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("products")
      .select("id, name, sku")
      .eq("organization_id", currentOrganization.organizationId),

    supabase
      .from("product_variants")
      .select("id, name, sku")
      .eq("organization_id", currentOrganization.organizationId),
  ]);

  if (movementsError) {
    throw new Error(movementsError.message);
  }

  if (productsError) {
    throw new Error(productsError.message);
  }

  if (variantsError) {
    throw new Error(variantsError.message);
  }

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
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Inventory History
            </h1>

            <p className="mt-2 text-muted-foreground">
              Audit trail perubahan stock pada organization aktif.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Products
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              Inventory Movements
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Menampilkan hingga 100 movement terbaru.
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
                    <th className="px-6 py-3 font-medium">Reference</th>
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
        </div>
      </div>
    </DashboardLayout>
  );
}