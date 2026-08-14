import DashboardLayout from "@/components/layout/DashboardLayout";
import AutomationManager from "@/components/automation/AutomationManager";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function AutomationPage() {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Automated Commerce
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

  const supabase = await createClient();

  const [
    rulesResult,
    targetsResult,
    runsResult,
    actionsResult,
  ] = await Promise.all([
    supabase
      .from("automation_rules")
      .select(
        "id, organization_id, price_monitor_target_id, name, trigger_type, action_type, pricing_strategy, adjustment_percent, minimum_price, maximum_price, execution_mode, is_active, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),

    supabase
      .from("price_monitor_targets")
      .select(
        "id, name, product_id, variant_id, source_name, threshold_percent, is_active",
      )
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),

    supabase
      .from("automation_runs")
      .select(
        "id, rule_id, trigger_observation_id, status, observed_price_snapshot, internal_price_before, proposed_price, threshold_triggered_snapshot, reason, error_message, started_at, completed_at, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("automation_actions")
      .select(
        "id, run_id, rule_id, action_type, target_type, product_id, variant_id, before_price, requested_price, applied_price, status, error_message, executed_at, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (rulesResult.error) {
    throw new Error(rulesResult.error.message);
  }

  if (targetsResult.error) {
    throw new Error(targetsResult.error.message);
  }

  if (runsResult.error) {
    throw new Error(runsResult.error.message);
  }

  if (actionsResult.error) {
    throw new Error(actionsResult.error.message);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Automated Commerce
          </h1>

          <p className="mt-2 text-muted-foreground">
            Convert Price Monitoring signals into controlled
            commerce actions with proposal and automatic
            execution modes.
          </p>
        </div>

        <AutomationManager
          organizationId={organizationId}
          rules={rulesResult.data ?? []}
          targets={targetsResult.data ?? []}
          runs={runsResult.data ?? []}
          actions={actionsResult.data ?? []}
        />
      </div>
    </DashboardLayout>
  );
}
