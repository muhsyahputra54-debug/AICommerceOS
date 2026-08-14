import DashboardLayout from "@/components/layout/DashboardLayout";
import AIAgentsManager from "@/components/agents/AIAgentsManager";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export default async function AgentsPage() {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return (
      <DashboardLayout>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Agents
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

  const [
    agentsResult,
    runsResult,
    stepsResult,
  ] = await Promise.all([
    supabase
      .from("ai_agents")
      .select(
        "id, organization_id, name, purpose, provider, model, system_instructions, approved_contexts, is_active, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),

    supabase
      .from("ai_agent_runs")
      .select(
        "id, agent_id, status, objective, provider_snapshot, model_snapshot, summary, recommendation, risks, next_actions, error_message, started_at, completed_at, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("ai_agent_steps")
      .select(
        "id, run_id, step_number, step_type, tool_name, status, error_message, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (agentsResult.error) {
    throw new Error(
      agentsResult.error.message,
    );
  }

  if (runsResult.error) {
    throw new Error(
      runsResult.error.message,
    );
  }

  if (stepsResult.error) {
    throw new Error(
      stepsResult.error.message,
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Agents
          </h1>

          <p className="mt-2 text-muted-foreground">
            Read-only commerce intelligence agents with
            controlled context and auditable recommendations.
          </p>
        </div>

        <AIAgentsManager
          organizationId={organizationId}
          agents={agentsResult.data ?? []}
          runs={runsResult.data ?? []}
          steps={stepsResult.data ?? []}
        />
      </div>
    </DashboardLayout>
  );
}
