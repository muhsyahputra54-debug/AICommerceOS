import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ProductsPage() {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, price, stock, status, created_at")
    .eq("organization_id", currentOrganization.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-2 text-muted-foreground">
            Kelola produk dan katalog bisnis Anda.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Product Management</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {products.length} produk pada organization aktif.
                </p>
              </div>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium">Belum ada produk</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Produk yang ditambahkan nanti akan tampil di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">Product</th>
                    <th className="px-6 py-3 font-medium">Price</th>
                    <th className="px-6 py-3 font-medium">Stock</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium">{product.name}</div>

                        {product.description ? (
                          <div className="mt-1 max-w-md truncate text-muted-foreground">
                            {product.description}
                          </div>
                        ) : null}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {formatCurrency(Number(product.price))}
                      </td>

                      <td className="px-6 py-4">{product.stock}</td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                          {product.status}
                        </span>
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
