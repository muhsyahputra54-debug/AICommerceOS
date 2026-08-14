"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Agent = {
  id: string;
  organization_id: string;

  name: string;
  purpose: string;

  provider: string;
  model: string | null;

  system_instructions: string | null;

  approved_contexts: unknown;

  is_active: boolean;

  created_at: string;
};

type Run = {
  id: string;
  agent_id: string;

  status: string;
  objective: string;

  provider_snapshot: string;
  model_snapshot: string;

  summary: string | null;
  recommendation: string | null;

  risks: unknown;
  next_actions: unknown;

  error_message: string | null;

  started_at: string;
  completed_at: string | null;

  created_at: string;
};

type Step = {
  id: string;
  run_id: string;

  step_number: number;
  step_type: string;

  tool_name: string | null;

  status: string;

  error_message: string | null;

  created_at: string;
};

type Props = {
  organizationId: string;

  agents: Agent[];
  runs: Run[];
  steps: Step[];
};

function stringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export default function AIAgentsManager({
  organizationId,
  agents,
  runs,
  steps,
}: Props) {
  const router = useRouter();

  const [
    message,
    setMessage,
  ] = useState<string | null>(null);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    runningId,
    setRunningId,
  ] = useState<string | null>(null);

  const latestRunMap =
    useMemo(() => {
      const map =
        new Map<string, Run>();

      for (const run of runs) {
        if (!map.has(run.agent_id)) {
          map.set(
            run.agent_id,
            run,
          );
        }
      }

      return map;
    }, [runs]);

  const stepCountMap =
    useMemo(() => {
      const map =
        new Map<string, number>();

      for (const step of steps) {
        map.set(
          step.run_id,
          (
            map.get(step.run_id) ?? 0
          ) + 1,
        );
      }

      return map;
    }, [steps]);

  async function createAgent(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form = event.currentTarget;

    setMessage(null);
    setCreating(true);

    const formData =
      new FormData(form);

    const name =
      String(
        formData.get("name") ?? "",
      ).trim();

    const purpose =
      String(
        formData.get("purpose") ?? "",
      ).trim();

    const model =
      String(
        formData.get("model") ?? "",
      ).trim();

    const instructions =
      String(
        formData.get(
          "system_instructions",
        ) ?? "",
      ).trim();

    const supabase =
      createClient();

    const { error } =
      await supabase
        .from("ai_agents")
        .insert({
          organization_id:
            organizationId,

          name,
          purpose,

          provider: "openai",

          model:
            model || null,

          system_instructions:
            instructions || null,

          approved_contexts: [
            "products",
            "product_research",
            "price_monitoring",
            "automation",
          ],
        });

    if (error) {
      setMessage(error.message);
      setCreating(false);
      return;
    }

    form.reset();

    setMessage(
      "AI agent berhasil dibuat.",
    );

    setCreating(false);

    router.refresh();
  }

  async function runAgent(
    agent: Agent,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form = event.currentTarget;

    setMessage(null);
    setRunningId(agent.id);

    const formData =
      new FormData(form);

    const objective =
      String(
        formData.get("objective") ?? "",
      ).trim();

    try {
      const response =
        await fetch(
          `/api/agents/${agent.id}/run`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                objective,
              }),
          },
        );

      const data =
        (await response.json()) as {
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "AI agent run gagal.",
        );
      }

      setMessage(
        "AI agent run selesai.",
      );

      form.reset();

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "AI agent run gagal.",
      );
    } finally {
      setRunningId(null);
    }
  }

  async function toggleAgent(
    agent: Agent,
  ) {
    setMessage(null);

    const supabase =
      createClient();

    const { error } =
      await supabase
        .from("ai_agents")
        .update({
          is_active:
            !agent.is_active,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", agent.id)
        .eq(
          "organization_id",
          organizationId,
        );

    if (error) {
      setMessage(error.message);
      return;
    }

    router.refresh();
  }

  async function deleteAgent(
    agent: Agent,
  ) {
    if (
      !window.confirm(
        `Delete AI agent "${agent.name}" dan seluruh run history-nya?`,
      )
    ) {
      return;
    }

    setMessage(null);

    const supabase =
      createClient();

    const { error } =
      await supabase
        .from("ai_agents")
        .delete()
        .eq("id", agent.id)
        .eq(
          "organization_id",
          organizationId,
        );

    if (error) {
      setMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            AI Agents
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {agents.length}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Active
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {
              agents.filter(
                (agent) =>
                  agent.is_active,
              ).length
            }
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Agent Runs
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {runs.length}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Create AI Agent
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Agents receive read-only commerce context and
          generate recommendations. They cannot execute
          commerce mutations.
        </p>

        <form
          onSubmit={createAgent}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <Input
            name="name"
            required
            placeholder="Agent name"
          />

          <Input
            name="purpose"
            required
            placeholder="Purpose"
          />

          <Input
            name="model"
            placeholder="Model override (optional)"
          />

          <div />

          <textarea
            name="system_instructions"
            rows={4}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm md:col-span-2"
            placeholder="Additional agent instructions (optional)"
          />

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={creating}
            >
              {creating
                ? "Creating..."
                : "Create Agent"}
            </Button>
          </div>
        </form>

        {message ? (
          <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            {message}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {agents.length === 0 ? (
          <div className="rounded-2xl border bg-card px-6 py-12 text-center shadow-sm">
            Belum ada AI Agent.
          </div>
        ) : (
          agents.map((agent) => {
            const latest =
              latestRunMap.get(
                agent.id,
              );

            return (
              <div
                key={agent.id}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {agent.name}
                      </h3>

                      <span className="rounded-full border px-2 py-0.5 text-xs">
                        {agent.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {agent.purpose}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Context:{" "}
                      {stringArray(
                        agent.approved_contexts,
                      ).join(", ")}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        toggleAgent(agent)
                      }
                    >
                      {agent.is_active
                        ? "Pause"
                        : "Activate"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        deleteAgent(agent)
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <form
                  onSubmit={(event) =>
                    runAgent(
                      agent,
                      event,
                    )
                  }
                  className="mt-5 flex flex-col gap-3 md:flex-row"
                >
                  <Input
                    name="objective"
                    required
                    placeholder="What should this agent analyze?"
                  />

                  <Button
                    type="submit"
                    disabled={
                      !agent.is_active ||
                      runningId === agent.id
                    }
                  >
                    {runningId === agent.id
                      ? "Running..."
                      : "Run Agent"}
                  </Button>
                </form>

                {latest ? (
                  <div className="mt-5 space-y-4 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        Latest Run
                      </span>

                      <span className="rounded-full border px-2 py-0.5 text-xs capitalize">
                        {latest.status}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {stepCountMap.get(
                          latest.id,
                        ) ?? 0}{" "}
                        audit steps
                      </span>
                    </div>

                    <p className="text-sm">
                      <span className="font-medium">
                        Objective:
                      </span>{" "}
                      {latest.objective}
                    </p>

                    {latest.summary ? (
                      <div>
                        <div className="text-sm font-medium">
                          Summary
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {latest.summary}
                        </p>
                      </div>
                    ) : null}

                    {latest.recommendation ? (
                      <div>
                        <div className="text-sm font-medium">
                          Recommendation
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {latest.recommendation}
                        </p>
                      </div>
                    ) : null}

                    {stringArray(
                      latest.risks,
                    ).length > 0 ? (
                      <div>
                        <div className="text-sm font-medium">
                          Risks
                        </div>

                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {stringArray(
                            latest.risks,
                          ).map(
                            (item) => (
                              <li key={item}>
                                {item}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    ) : null}

                    {stringArray(
                      latest.next_actions,
                    ).length > 0 ? (
                      <div>
                        <div className="text-sm font-medium">
                          Next Actions
                        </div>

                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {stringArray(
                            latest.next_actions,
                          ).map(
                            (item) => (
                              <li key={item}>
                                {item}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    ) : null}

                    {latest.error_message ? (
                      <p className="text-sm text-muted-foreground">
                        Error:{" "}
                        {
                          latest.error_message
                        }
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            Agent Run History
          </h2>
        </div>

        {runs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No agent runs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3">
                    Time
                  </th>

                  <th className="px-6 py-3">
                    Agent
                  </th>

                  <th className="px-6 py-3">
                    Status
                  </th>

                  <th className="px-6 py-3">
                    Model
                  </th>

                  <th className="px-6 py-3">
                    Steps
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {runs.map((run) => {
                  const agent =
                    agents.find(
                      (item) =>
                        item.id ===
                        run.agent_id,
                    );

                  return (
                    <tr key={run.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        {formatDate(
                          run.created_at,
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {agent?.name ??
                          "Unknown"}
                      </td>

                      <td className="px-6 py-4 capitalize">
                        {run.status}
                      </td>

                      <td className="px-6 py-4">
                        {run.model_snapshot}
                      </td>

                      <td className="px-6 py-4">
                        {stepCountMap.get(
                          run.id,
                        ) ?? 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
