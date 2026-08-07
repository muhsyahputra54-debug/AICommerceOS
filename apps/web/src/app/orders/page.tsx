import DashboardLayout from "@/components/layout/DashboardLayout";

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Orders
          </h1>

          <p className="mt-2 text-muted-foreground">
            Kelola dan pantau seluruh pesanan bisnis Anda.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Order Management
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Halaman manajemen pesanan akan dikembangkan pada tahap
            berikutnya.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}