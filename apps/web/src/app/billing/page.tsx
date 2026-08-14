import BillingDashboard, {
  type BillingOverview,
} from "@/components/billing/BillingDashboard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Billing & SaaS
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
    error: usageError,
  } = await supabase.rpc(
    "refresh_billing_usage",
    {
      p_organization_id:
        organizationId,
    },
  );

  if (usageError) {
    throw new Error(
      usageError.message,
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_billing_overview",
    {
      p_organization_id:
        organizationId,
    },
  );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  if (!data) {
    throw new Error(
      "Billing overview tidak tersedia.",
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Billing & SaaS
          </h1>

          <p className="mt-2 text-muted-foreground">
            Subscription, plan entitlements,
            and organization usage.
          </p>
        </div>

        <BillingDashboard
          data={
            data as BillingOverview
          }
        />
      </div>
    </DashboardLayout>
  );
}
