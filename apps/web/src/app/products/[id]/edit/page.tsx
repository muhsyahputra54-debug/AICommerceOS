import { notFound } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import EditProductForm from "@/components/products/EditProductForm";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Product
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

  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, description, price, stock, status")
    .eq("id", id)
    .eq("organization_id", currentOrganization.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!product) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Product
          </h1>
          <p className="mt-2 text-muted-foreground">
            Perbarui informasi produk pada organization aktif.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <EditProductForm
            organizationId={currentOrganization.organizationId}
            product={product}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
