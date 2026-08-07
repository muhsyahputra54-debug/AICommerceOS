import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics
          </h1>

          <p className="mt-2 text-muted-foreground">
            Pantau performa bisnis dan analisis data penjualan Anda.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Total Revenue
            </p>

            <p className="mt-2 text-2xl font-bold">
              $12,450
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Total Orders
            </p>

            <p className="mt-2 text-2xl font-bold">
              245
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Conversion Rate
            </p>

            <p className="mt-2 text-2xl font-bold">
              4.8%
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Growth
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              +18.4%
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Business Analytics
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Modul analytics lengkap akan dikembangkan pada tahap
            berikutnya dengan data real-time dari backend.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}