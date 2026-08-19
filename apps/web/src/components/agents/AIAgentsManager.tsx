"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/lib/i18n/dictionaries";
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

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(
    locale,
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
  const { locale } = useLanguage();
  const copy = getDictionary(locale).agents.manager;
  const localeTag =
    locale === "id" ? "id-ID" : "en-US";

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

  function runStatusLabel(status: string) {
    switch (status) {
      case "pending":
        return copy.statuses.pending;
      case "running":
        return copy.statuses.running;
      case "completed":
        return copy.statuses.completed;
      case "failed":
        return copy.statuses.failed;
      case "cancelled":
        return copy.statuses.cancelled;
      default:
        return status;
    }
  }

  function contextLabel(context: string) {
    switch (context) {
      case "products":
        return copy.contexts.products;
      case "product_research":
        return copy.contexts.productResearch;
      case "price_monitoring":
        return copy.contexts.priceMonitoring;
      case "automation":
        return copy.contexts.automation;
      default:
        return context;
    }
  }

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
      setMessage(copy.messages.createFailed);
      setCreating(false);
      return;
    }

    form.reset();

    setMessage(
      copy.messages.createSuccess,
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

      if (!response.ok) {
        throw new Error(
          copy.messages.runFailed,
        );
      }

      setMessage(
        copy.messages.runSuccess,
      );

      form.reset();

      router.refresh();
    } catch {
      setMessage(
        copy.messages.runFailed,
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
      setMessage(copy.messages.toggleFailed);
      return;
    }

    router.refresh();
  }

  async function deleteAgent(
    agent: Agent,
  ) {
    if (
      !window.confirm(
        copy.deleteConfirm.replace(
          "{name}",
          agent.name,
        ),
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
      setMessage(copy.messages.deleteFailed);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            {copy.stats.agents}
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {agents.length}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            {copy.stats.active}
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
            {copy.stats.runs}
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {runs.length}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {copy.create.title}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {copy.create.description}
        </p>

        <form
          onSubmit={createAgent}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <Input
            name="name"
            required
            placeholder={copy.create.namePlaceholder}
          />

          <Input
            name="purpose"
            required
            placeholder={copy.create.purposePlaceholder}
          />

          <Input
            name="model"
            placeholder={copy.create.modelPlaceholder}
          />

          <div />

          <textarea
            name="system_instructions"
            rows={4}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm md:col-span-2"
            placeholder={copy.create.instructionsPlaceholder}
          />

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={creating}
            >
              {creating
                ? copy.create.creating
                : copy.create.create}
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
            {copy.empty}
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
                          ? copy.statuses.active
                          : copy.statuses.inactive}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {agent.purpose}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {copy.contextsLabel}:{" "}
                      {stringArray(
                        agent.approved_contexts,
                      )
                        .map(contextLabel)
                        .join(", ")}
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
                        ? copy.actions.pause
                        : copy.actions.activate}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        deleteAgent(agent)
                      }
                    >
                      {copy.actions.delete}
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
                    placeholder={copy.run.objectivePlaceholder}
                  />

                  <Button
                    type="submit"
                    disabled={
                      !agent.is_active ||
                      runningId === agent.id
                    }
                  >
                    {runningId === agent.id
                      ? copy.run.running
                      : copy.run.run}
                  </Button>
                </form>

                {latest ? (
                  <div className="mt-5 space-y-4 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {copy.latest.title}
                      </span>

                      <span className="rounded-full border px-2 py-0.5 text-xs capitalize">
                        {runStatusLabel(
                          latest.status,
                        )}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {stepCountMap.get(
                          latest.id,
                        ) ?? 0}{" "}
                        {copy.latest.auditSteps}
                      </span>
                    </div>

                    <p className="text-sm">
                      <span className="font-medium">
                        {copy.latest.objective}:
                      </span>{" "}
                      {latest.objective}
                    </p>

                    {latest.summary ? (
                      <div>
                        <div className="text-sm font-medium">
                          {copy.latest.summary}
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {latest.summary}
                        </p>
                      </div>
                    ) : null}

                    {latest.recommendation ? (
                      <div>
                        <div className="text-sm font-medium">
                          {copy.latest.recommendation}
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
                          {copy.latest.risks}
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
                          {copy.latest.nextActions}
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
                        {copy.latest.error}:{" "}
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
            {copy.history.title}
          </h2>
        </div>

        {runs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            {copy.history.empty}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3">
                    {copy.history.columns.time}
                  </th>

                  <th className="px-6 py-3">
                    {copy.history.columns.agent}
                  </th>

                  <th className="px-6 py-3">
                    {copy.history.columns.status}
                  </th>

                  <th className="px-6 py-3">
                    {copy.history.columns.model}
                  </th>

                  <th className="px-6 py-3">
                    {copy.history.columns.steps}
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
                          localeTag,
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {agent?.name ??
                          copy.history.unknownAgent}
                      </td>

                      <td className="px-6 py-4 capitalize">
                        {runStatusLabel(
                          run.status,
                        )}
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
