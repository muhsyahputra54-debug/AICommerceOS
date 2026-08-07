import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentOrders from "@/components/dashboard/RecentOrders";
import QuickActions from "@/components/dashboard/QuickActions";

import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-1 sm:space-y-8 sm:px-2">

        {/* Dashboard Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard
          </h1>

          <p className="text-sm text-muted-foreground sm:text-base">
            Selamat datang di AI Commerce OS.
          </p>
        </div>

        {/* KPI Cards */}
        <section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatsCard
              title="Revenue"
              value="$12,450"
              description="+12% bulan ini"
              icon={
                <DollarSign className="h-6 w-6 text-blue-600" />
              }
            />

            <StatsCard
              title="Orders"
              value="245"
              description="+18 order hari ini"
              icon={
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              }
            />

            <StatsCard
              title="Customers"
              value="1,248"
              description="+35 pelanggan baru"
              icon={
                <Users className="h-6 w-6 text-blue-600" />
              }
            />

            <StatsCard
              title="Profit"
              value="$8,240"
              description="+9% minggu ini"
              icon={
                <TrendingUp className="h-6 w-6 text-blue-600" />
              }
            />

          </div>
        </section>

        {/* Analytics */}
        <section className="grid min-w-0 gap-6 xl:grid-cols-3">

          <div className="min-w-0 xl:col-span-2">
            <RevenueChart />
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Ringkasan performa bisnis.
            </p>

            <div className="mt-6 space-y-5">

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Conversion Rate
                </span>

                <span className="font-semibold">
                  4.8%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Average Order
                </span>

                <span className="font-semibold">
                  $51.20
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Returning Customers
                </span>

                <span className="font-semibold">
                  68%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Growth
                </span>

                <span className="font-semibold text-green-600">
                  +18.4%
                </span>
              </div>

            </div>
          </div>

        </section>

        {/* Recent Orders */}
        <section className="min-w-0">
          <RecentOrders />
        </section>

        {/* Quick Actions */}
        <section className="min-w-0">
          <QuickActions />
        </section>

      </div>
    </DashboardLayout>
  );
}