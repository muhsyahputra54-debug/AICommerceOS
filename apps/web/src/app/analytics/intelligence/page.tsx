import DashboardLayout from "@/components/layout/DashboardLayout";
import CommerceAnalyticsDashboard, {
  type CommerceAnalyticsData,
} from "@/components/analytics/CommerceAnalyticsDashboard";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsIntelligencePage() {
  const locale = await getLocale();
  const copy = getDictionary(locale).analytics.intelligence;
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {copy.noOrganization}
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
    throw new Error(copy.errors.loadFailed);
  }

  if (!data) {
    throw new Error(
      copy.errors.dataUnavailable,
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {copy.description}
          </p>
        </div>

        <CommerceAnalyticsDashboard
          data={
            data as CommerceAnalyticsData
          }
          locale={locale}
        />
      </div>
    </DashboardLayout>
  );
}
