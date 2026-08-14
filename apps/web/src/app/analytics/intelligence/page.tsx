import DashboardLayout from "@/components/layout/DashboardLayout";
import CommerceAnalyticsDashboard, {
  type CommerceAnalyticsData,
} from "@/components/analytics/CommerceAnalyticsDashboard";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsIntelligencePage() {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Analytics & Intelligence
          </h1>

          <p className="mt-2 text-muted-foreground">
            Organization aktif tidak ditemukan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const organizationId =
    currentOrganization.organizationId;

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_commerce_analytics",
    {
      p_organization_id:
        organizationId,

      p_days: 30,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Analytics intelligence data tidak tersedia.",
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Analytics & Intelligence
          </h1>

          <p className="mt-2 text-muted-foreground">
            Commerce performance, inventory,
            research, price monitoring, automation,
            and AI activity for the last 30 days.
          </p>
        </div>

        <CommerceAnalyticsDashboard
          data={
            data as CommerceAnalyticsData
          }
        />
      </div>
    </DashboardLayout>
  );
}
