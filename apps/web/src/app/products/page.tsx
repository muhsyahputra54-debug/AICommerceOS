import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Products
          </h1>

          <p className="mt-2 text-muted-foreground">
            Kelola produk dan katalog bisnis Anda.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Product Management
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Halaman manajemen produk akan dikembangkan pada tahap
            berikutnya.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}