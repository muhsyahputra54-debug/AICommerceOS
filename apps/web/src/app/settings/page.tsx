import DashboardLayout from "@/components/layout/DashboardLayout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Settings
          </h1>

          <p className="mt-2 text-muted-foreground">
            Kelola pengaturan dan konfigurasi LAKUVO.
          </p>
        </div>

        {/* Settings Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* General Settings */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              General Settings
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Pengaturan umum aplikasi dan informasi bisnis.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium">
                  Business Name
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  LAKUVO
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">
                  Account Role
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Administrator
                </p>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              AI Settings
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Konfigurasi AI Assistant dan automation.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium">
                  AI Assistant
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Ready to configure
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">
                  Automation
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Ready to configure
                </p>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Account Settings
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Informasi akun administrator.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium">
                  Role
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Administrator
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">
                  Status
                </p>

                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                  Active
                </p>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              System Settings
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Konfigurasi sistem dan infrastruktur aplikasi.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium">
                  Environment
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Development
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">
                  System Status
                </p>

                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                  Operational
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}