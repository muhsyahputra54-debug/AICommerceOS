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

type NumericValue =
  | string
  | number
  | null;

type Target = {
  id: string;
  name: string;

  product_id: string | null;
  variant_id: string | null;

  source_name: string;

  threshold_percent:
    NumericValue;

  is_active: boolean;
};

type Rule = {
  id: string;
  organization_id: string;

  price_monitor_target_id: string;

  name: string;

  trigger_type: string;
  action_type: string;

  pricing_strategy: string;

  adjustment_percent:
    NumericValue;

  minimum_price:
    NumericValue;

  maximum_price:
    NumericValue;

  execution_mode: string;

  is_active: boolean;

  created_at: string;
};

type Run = {
  id: string;
  rule_id: string;

  trigger_observation_id:
    string | null;

  status: string;

  observed_price_snapshot:
    NumericValue;

  internal_price_before:
    NumericValue;

  proposed_price:
    NumericValue;

  threshold_triggered_snapshot:
    boolean | null;

  reason: string | null;
  error_message: string | null;

  started_at: string;
  completed_at: string | null;
  created_at: string;
};

type Action = {
  id: string;

  run_id: string;
  rule_id: string;

  action_type: string;
  target_type: string;

  product_id: string | null;
  variant_id: string | null;

  before_price:
    NumericValue;

  requested_price:
    NumericValue;

  applied_price:
    NumericValue;

  status: string;

  error_message:
    string | null;

  executed_at:
    string | null;

  created_at: string;
};

type Props = {
  organizationId: string;

  rules: Rule[];
  targets: Target[];

  runs: Run[];
  actions: Action[];
};

function numberValue(
  value: NumericValue,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function money(
  value: NumericValue,
) {
  const parsed =
    numberValue(value);

  if (parsed === null) {
    return "—";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    },
  ).format(parsed);
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

export default function AutomationManager({
  organizationId,
  rules,
  targets,
  runs,
  actions,
}: Props) {
  const router =
    useRouter();

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    evaluatingId,
    setEvaluatingId,
  ] = useState<
    string | null
  >(null);

  const [
    executingId,
    setExecutingId,
  ] = useState<
    string | null
  >(null);

  const targetMap =
    useMemo(
      () =>
        new Map(
          targets.map(
            (target) => [
              target.id,
              target,
            ],
          ),
        ),
      [targets],
    );

  const latestRunMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          Run
        >();

      for (
        const run of runs
      ) {
        if (
          !map.has(
            run.rule_id,
          )
        ) {
          map.set(
            run.rule_id,
            run,
          );
        }
      }

      return map;
    }, [runs]);

  async function createRule(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);
    setCreating(true);

    const formData =
      new FormData(
        event.currentTarget,
      );

    const minimumRaw =
      String(
        formData.get(
          "minimum_price",
        ) ?? "",
      ).trim();

    const maximumRaw =
      String(
        formData.get(
          "maximum_price",
        ) ?? "",
      ).trim();

    const adjustment =
      Number(
        formData.get(
          "adjustment_percent",
        ) ?? 0,
      );

    const minimum =
      minimumRaw
        ? Number(minimumRaw)
        : null;

    const maximum =
      maximumRaw
        ? Number(maximumRaw)
        : null;

    if (
      !Number.isFinite(
        adjustment,
      ) ||
      adjustment < -100
    ) {
      setMessage(
        "Adjustment percent tidak valid.",
      );

      setCreating(false);
      return;
    }

    if (
      minimum !== null &&
      (
        !Number.isFinite(
          minimum,
        ) ||
        minimum < 0
      )
    ) {
      setMessage(
        "Minimum price tidak valid.",
      );

      setCreating(false);
      return;
    }

    if (
      maximum !== null &&
      (
        !Number.isFinite(
          maximum,
        ) ||
        maximum < 0
      )
    ) {
      setMessage(
        "Maximum price tidak valid.",
      );

      setCreating(false);
      return;
    }

    if (
      minimum !== null &&
      maximum !== null &&
      minimum > maximum
    ) {
      setMessage(
        "Minimum price tidak boleh lebih besar dari maximum price.",
      );

      setCreating(false);
      return;
    }

    const supabase =
      createClient();

    const { error } =
      await supabase
        .from(
          "automation_rules",
        )
        .insert({
          organization_id:
            organizationId,

          price_monitor_target_id:
            String(
              formData.get(
                "price_monitor_target_id",
              ) ?? "",
            ),

          name:
            String(
              formData.get(
                "name",
              ) ?? "",
            ).trim(),

          trigger_type:
            "price_threshold",

          action_type:
            "set_internal_price",

          pricing_strategy:
            String(
              formData.get(
                "pricing_strategy",
              ) ??
                "match_observed",
            ),

          adjustment_percent:
            adjustment,

          minimum_price:
            minimum,

          maximum_price:
            maximum,

          execution_mode:
            String(
              formData.get(
                "execution_mode",
              ) ??
                "proposal",
            ),
        });

    if (error) {
      setMessage(
        error.message,
      );

      setCreating(false);
      return;
    }

    event.currentTarget.reset();

    setMessage(
      "Automation rule berhasil dibuat.",
    );

    setCreating(false);

    router.refresh();
  }

  async function evaluateRule(
    rule: Rule,
  ) {
    setMessage(null);

    setEvaluatingId(
      rule.id,
    );

    const supabase =
      createClient();

    const {
      data,
      error,
    } = await supabase.rpc(
      "evaluate_automation_rule",
      {
        p_rule_id:
          rule.id,
      },
    );

    if (error) {
      setMessage(
        error.message,
      );

      setEvaluatingId(
        null,
      );

      return;
    }

    setMessage(
      `Automation evaluated. Run: ${String(
        data,
      )}`,
    );

    setEvaluatingId(null);

    router.refresh();
  }

  async function executeAction(
    action: Action,
  ) {
    setMessage(null);

    setExecutingId(
      action.id,
    );

    const supabase =
      createClient();

    const {
      data,
      error,
    } = await supabase.rpc(
      "execute_automation_action",
      {
        p_action_id:
          action.id,
      },
    );

    if (error) {
      setMessage(
        error.message,
      );

      setExecutingId(
        null,
      );

      return;
    }

    const result =
      data as {
        status?: string;
        error?: string;
      } | null;

    if (
      result?.status ===
      "failed"
    ) {
      setMessage(
        result.error ??
          "Automation action gagal.",
      );
    } else {
      setMessage(
        "Automation action berhasil dieksekusi.",
      );
    }

    setExecutingId(null);

    router.refresh();
  }

  async function toggleRule(
    rule: Rule,
  ) {
    setMessage(null);

    const supabase =
      createClient();

    const { error } =
      await supabase
        .from(
          "automation_rules",
        )
        .update({
          is_active:
            !rule.is_active,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          rule.id,
        )
        .eq(
          "organization_id",
          organizationId,
        );

    if (error) {
      setMessage(
        error.message,
      );

      return;
    }

    router.refresh();
  }

  async function deleteRule(
    rule: Rule,
  ) {
    if (
      !window.confirm(
        `Delete automation rule "${rule.name}" dan audit history-nya?`,
      )
    ) {
      return;
    }

    setMessage(null);

    const supabase =
      createClient();

    const { error } =
      await supabase
        .from(
          "automation_rules",
        )
        .delete()
        .eq(
          "id",
          rule.id,
        )
        .eq(
          "organization_id",
          organizationId,
        );

    if (error) {
      setMessage(
        error.message,
      );

      return;
    }

    router.refresh();
  }

  const pendingActions =
    actions.filter(
      (action) =>
        action.status ===
        "pending",
    );

  const executedActions =
    actions.filter(
      (action) =>
        action.status ===
        "executed",
    );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Rules
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {rules.length}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Active
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {
              rules.filter(
                (rule) =>
                  rule.is_active,
              ).length
            }
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Pending Actions
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {
              pendingActions.length
            }
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Executed
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {
              executedActions.length
            }
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Create Automation Rule
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          A rule reacts only to a triggered Phase 11
          Price Monitoring observation.
        </p>

        <form
          onSubmit={
            createRule
          }
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <Input
            name="name"
            required
            placeholder="Rule name"
          />

          <select
            name="price_monitor_target_id"
            required
            defaultValue=""
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option
              value=""
              disabled
            >
              Select Price Monitor
            </option>

            {targets.map(
              (target) => (
                <option
                  key={
                    target.id
                  }
                  value={
                    target.id
                  }
                >
                  {target.name}
                  {" • "}
                  {target.source_name}
                  {" • "}
                  {Number(
                    target.threshold_percent,
                  )}
                  %
                  {!target.is_active
                    ? " • Inactive"
                    : ""}
                </option>
              ),
            )}
          </select>

          <select
            name="pricing_strategy"
            defaultValue="match_observed"
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="match_observed">
              Match observed price
            </option>

            <option value="adjust_observed_percent">
              Observed price + adjustment %
            </option>
          </select>

          <Input
            name="adjustment_percent"
            type="number"
            step="0.01"
            defaultValue="0"
            placeholder="Adjustment %"
          />

          <Input
            name="minimum_price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Minimum price (optional)"
          />

          <Input
            name="maximum_price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Maximum price (optional)"
          />

          <select
            name="execution_mode"
            defaultValue="proposal"
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="proposal">
              Proposal — manual approval
            </option>

            <option value="automatic">
              Automatic — execute immediately
            </option>
          </select>

          <div className="flex items-center">
            <Button
              type="submit"
              disabled={
                creating
              }
            >
              {creating
                ? "Creating..."
                : "Create Rule"}
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
        {rules.length === 0 ? (
          <div className="rounded-2xl border bg-card px-6 py-12 text-center shadow-sm">
            <p className="font-medium">
              Belum ada Automation Rule.
            </p>
          </div>
        ) : (
          rules.map(
            (rule) => {
              const target =
                targetMap.get(
                  rule.price_monitor_target_id,
                );

              const latestRun =
                latestRunMap.get(
                  rule.id,
                );

              return (
                <div
                  key={
                    rule.id
                  }
                  className="rounded-2xl border bg-card p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {rule.name}
                        </h3>

                        <span className="rounded-full border px-2 py-0.5 text-xs">
                          {rule.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                        <span className="rounded-full border px-2 py-0.5 text-xs">
                          {
                            rule.execution_mode
                          }
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Price Monitor:{" "}
                        {target?.name ??
                          "Unknown"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Strategy:{" "}
                        {
                          rule.pricing_strategy
                        }
                        {" • "}
                        Adjustment:{" "}
                        {Number(
                          rule.adjustment_percent,
                        )}
                        %
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() =>
                          evaluateRule(
                            rule,
                          )
                        }
                        disabled={
                          !rule.is_active ||
                          evaluatingId ===
                            rule.id
                        }
                      >
                        {evaluatingId ===
                        rule.id
                          ? "Evaluating..."
                          : "Evaluate"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          toggleRule(
                            rule,
                          )
                        }
                      >
                        {rule.is_active
                          ? "Pause"
                          : "Activate"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          deleteRule(
                            rule,
                          )
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border p-4">
                      <div className="text-xs text-muted-foreground">
                        Latest Run
                      </div>

                      <div className="mt-2 font-medium capitalize">
                        {latestRun?.status ??
                          "—"}
                      </div>
                    </div>

                    <div className="rounded-xl border p-4">
                      <div className="text-xs text-muted-foreground">
                        Internal Before
                      </div>

                      <div className="mt-2 font-medium">
                        {money(
                          latestRun?.internal_price_before ??
                            null,
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border p-4">
                      <div className="text-xs text-muted-foreground">
                        Observed
                      </div>

                      <div className="mt-2 font-medium">
                        {money(
                          latestRun?.observed_price_snapshot ??
                            null,
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border p-4">
                      <div className="text-xs text-muted-foreground">
                        Proposed
                      </div>

                      <div className="mt-2 font-medium">
                        {money(
                          latestRun?.proposed_price ??
                            null,
                        )}
                      </div>
                    </div>
                  </div>

                  {latestRun?.reason ? (
                    <p className="mt-4 text-sm text-muted-foreground">
                      {
                        latestRun.reason
                      }
                    </p>
                  ) : null}
                </div>
              );
            },
          )
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            Pending Actions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Proposal-mode actions require explicit execution.
          </p>
        </div>

        {pendingActions.length ===
        0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No pending actions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3">
                    Rule
                  </th>

                  <th className="px-6 py-3">
                    Target
                  </th>

                  <th className="px-6 py-3">
                    Before
                  </th>

                  <th className="px-6 py-3">
                    Requested
                  </th>

                  <th className="px-6 py-3">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {pendingActions.map(
                  (action) => {
                    const rule =
                      rules.find(
                        (item) =>
                          item.id ===
                          action.rule_id,
                      );

                    return (
                      <tr
                        key={
                          action.id
                        }
                      >
                        <td className="px-6 py-4">
                          {rule?.name ??
                            "Unknown"}
                        </td>

                        <td className="px-6 py-4 capitalize">
                          {
                            action.target_type
                          }
                        </td>

                        <td className="px-6 py-4">
                          {money(
                            action.before_price,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {money(
                            action.requested_price,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <Button
                            type="button"
                            onClick={() =>
                              executeAction(
                                action,
                              )
                            }
                            disabled={
                              executingId ===
                              action.id
                            }
                          >
                            {executingId ===
                            action.id
                              ? "Executing..."
                              : "Execute"}
                          </Button>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            Automation Run History
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {runs.length} recent evaluation runs.
          </p>
        </div>

        {runs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No automation runs.
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
                    Rule
                  </th>

                  <th className="px-6 py-3">
                    Status
                  </th>

                  <th className="px-6 py-3">
                    Before
                  </th>

                  <th className="px-6 py-3">
                    Proposed
                  </th>

                  <th className="px-6 py-3">
                    Reason
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {runs.map(
                  (run) => {
                    const rule =
                      rules.find(
                        (item) =>
                          item.id ===
                          run.rule_id,
                      );

                    return (
                      <tr
                        key={
                          run.id
                        }
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          {formatDate(
                            run.created_at,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {rule?.name ??
                            "Unknown"}
                        </td>

                        <td className="px-6 py-4 capitalize">
                          {
                            run.status
                          }
                        </td>

                        <td className="px-6 py-4">
                          {money(
                            run.internal_price_before,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {money(
                            run.proposed_price,
                          )}
                        </td>

                        <td className="max-w-sm px-6 py-4 text-muted-foreground">
                          {run.error_message ??
                            run.reason ??
                            "—"}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
