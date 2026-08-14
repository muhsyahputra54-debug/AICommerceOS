"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type AIRun = {
  id: string;
  provider: string;
  model: string;
  status: string;

  ai_demand_score: number | null;
  ai_competition_score: number | null;
  ai_opportunity_score: number | null;
  confidence_score: number | null;

  recommendation: string | null;

  summary: string | null;
  rationale: string | null;

  risks: unknown;
  next_actions: unknown;

  error_message: string | null;

  created_at: string;
  completed_at: string | null;
};

type Props = {
  researchItemId: string;
  runs: AIRun[];
};

function stringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string",
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AIProductResearchPanel({
  researchItemId,
  runs,
}: Props) {
  const router = useRouter();

  const [isRunning, setIsRunning] = useState(false);
  const [applyingId, setApplyingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const latestCompleted =
    runs.find((run) => run.status === "completed") ?? null;

  async function handleRun() {
    setMessage(null);
    setIsRunning(true);

    try {
      const response = await fetch(
        `/api/research/${researchItemId}/ai`,
        {
          method: "POST",
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "AI analysis gagal dijalankan.",
        );
      }

      setMessage("AI analysis selesai.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "AI analysis gagal.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  async function handleApply(runId: string) {
    setMessage(null);
    setApplyingId(runId);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "apply_product_research_ai_run",
      {
        p_run_id: runId,
      },
    );

    if (error) {
      setMessage(error.message);
      setApplyingId(null);
      return;
    }

    setMessage(
      "AI scores diterapkan. Status kandidat tetap harus diputuskan user.",
    );

    setApplyingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              AI Product Research
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Analisis AI terhadap research candidate dan market
              observations yang sudah tersedia.
            </p>
          </div>

          <Button
            type="button"
            disabled={isRunning}
            onClick={handleRun}
          >
            {isRunning
              ? "Analyzing..."
              : "Run AI Analysis"}
          </Button>
        </div>

        {message ? (
          <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            {message}
          </div>
        ) : null}
      </div>

      {latestCompleted ? (
        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                Latest AI Analysis
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {latestCompleted.provider} ·{" "}
                {latestCompleted.model} ·{" "}
                {formatDate(latestCompleted.created_at)}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={applyingId === latestCompleted.id}
              onClick={() =>
                handleApply(latestCompleted.id)
              }
            >
              {applyingId === latestCompleted.id
                ? "Applying..."
                : "Apply AI Scores"}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">
                AI Demand
              </div>

              <div className="mt-2 text-2xl font-semibold">
                {latestCompleted.ai_demand_score ?? "—"}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">
                AI Competition
              </div>

              <div className="mt-2 text-2xl font-semibold">
                {latestCompleted.ai_competition_score ?? "—"}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">
                AI Opportunity
              </div>

              <div className="mt-2 text-2xl font-semibold">
                {latestCompleted.ai_opportunity_score ?? "—"}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">
                Confidence
              </div>

              <div className="mt-2 text-2xl font-semibold">
                {latestCompleted.confidence_score ?? "—"}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">
              Recommendation
            </div>

            <div className="mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold capitalize">
              {latestCompleted.recommendation ?? "—"}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Summary</div>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {latestCompleted.summary ?? "—"}
            </p>
          </div>

          <div>
            <div className="text-sm font-medium">Rationale</div>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {latestCompleted.rationale ?? "—"}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Risks</div>

              <div className="mt-3 space-y-2">
                {stringArray(latestCompleted.risks).length ===
                0 ? (
                  <p className="text-sm text-muted-foreground">
                    —
                  </p>
                ) : (
                  stringArray(latestCompleted.risks).map(
                    (risk, index) => (
                      <div
                        key={`${risk}-${index}`}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        {risk}
                      </div>
                    ),
                  )
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">
                Next Actions
              </div>

              <div className="mt-3 space-y-2">
                {stringArray(latestCompleted.next_actions)
                  .length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    —
                  </p>
                ) : (
                  stringArray(
                    latestCompleted.next_actions,
                  ).map((action, index) => (
                    <div
                      key={`${action}-${index}`}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      {action}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            AI recommendation bersifat advisory. Apply AI Scores
            hanya memperbarui demand, competition, dan opportunity
            score; status kandidat tidak berubah otomatis.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card px-6 py-10 text-center shadow-sm">
          <p className="font-medium">
            Belum ada AI analysis yang selesai.
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Jalankan AI analysis untuk mengevaluasi candidate ini.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            AI Analysis History
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {runs.length} analysis run.
          </p>
        </div>

        {runs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No AI analysis history.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">
                    Opportunity
                  </th>
                  <th className="px-6 py-3">
                    Confidence
                  </th>
                  <th className="px-6 py-3">
                    Recommendation
                  </th>
                  <th className="px-6 py-3">Error</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatDate(run.created_at)}
                    </td>

                    <td className="px-6 py-4">
                      {run.model}
                    </td>

                    <td className="px-6 py-4 capitalize">
                      {run.status}
                    </td>

                    <td className="px-6 py-4">
                      {run.ai_opportunity_score ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      {run.confidence_score ?? "—"}
                    </td>

                    <td className="px-6 py-4 capitalize">
                      {run.recommendation ?? "—"}
                    </td>

                    <td className="max-w-xs px-6 py-4 text-muted-foreground">
                      {run.error_message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
