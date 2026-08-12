import DashboardLayout from "@/components/layout/DashboardLayout";
import AddProductForm from "@/components/products/AddProductForm";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add Product
          </h1>
          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("organization_id", currentOrganization.organizationId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add Product
          </h1>
          <p className="mt-2 text-muted-foreground">
            Tambahkan produk baru ke katalog organization aktif.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <AddProductForm
            organizationId={currentOrganization.organizationId}
            categories={categories}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
