import DashboardLayout from "@/components/layout/DashboardLayout";
import AddOrderForm from "@/components/orders/AddOrderForm";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function NewOrderPage() {
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add Order
          </h1>

          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();

  const { data: customers, error: customersError } =
    await supabase
      .from("customers")
      .select("id, name")
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .order("name", { ascending: true });

  if (customersError) {
    throw new Error(customersError.message);
  }

  const { data: products, error: productsError } =
    await supabase
      .from("products")
      .select("id, name, price, stock")
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .eq("status", "active")
      .order("name", { ascending: true });

  if (productsError) {
    throw new Error(productsError.message);
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add Order
          </h1>

          <p className="mt-2 text-muted-foreground">
            Buat pesanan baru untuk organization aktif.
          </p>
        </div>

        <AddOrderForm
          organizationId={
            currentOrganization.organizationId
          }
          customers={customers}
          products={products}
        />
      </div>
    </DashboardLayout>
  );
}