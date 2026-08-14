type JsonObject = Record<
  string,
  unknown
>;

export type BillingPlan = {
  id: string;

  slug: string;
  name: string;

  description:
    | string
    | null;

  currency: string;

  price_monthly:
    | number
    | string
    | null;

  price_annual:
    | number
    | string
    | null;

  features: unknown;
  limits: JsonObject;

  is_public?: boolean;
};

export type BillingSubscription = {
  id: string;

  status: string;
  provider: string;

  provider_customer_id:
    | string
    | null;

  provider_subscription_id:
    | string
    | null;

  current_period_start:
    | string
    | null;

  current_period_end:
    | string
    | null;

  trial_ends_at:
    | string
    | null;

  cancel_at_period_end: boolean;
};

export type BillingOverview = {
  subscription:
    | BillingSubscription
    | null;

  plan:
    | BillingPlan
    | null;

  usage: JsonObject;

  usage_updated_at:
    | string
    | null;

  period: {
    start: string;
    end: string;
  };

  plans: BillingPlan[];

  provider_checkout_configured:
    boolean;
};

type Props = {
  data: BillingOverview;
};

function numeric(
  value: unknown,
) {
  const parsed =
    Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function number(
  value: unknown,
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 0,
    },
  ).format(
    numeric(value),
  );
}

function money(
  value: unknown,
  currency = "USD",
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "Not configured";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    },
  ).format(
    numeric(value),
  );
}

function dateTime(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "—";
  }

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

function strings(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

function limitText(
  plan: BillingPlan | null,
  key: string,
) {
  if (!plan) {
    return "Not configured";
  }

  const value =
    plan.limits?.[key];

  if (
    value === null ||
    value === undefined
  ) {
    return "Not enforced";
  }

  return number(value);
}

function UsageCard({
  label,
  value,
  limit,
}: {
  label: string;
  value: string;
  limit: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="text-sm text-muted-foreground">
        {label}
      </div>

      <div className="mt-2 text-3xl font-semibold tracking-tight">
        {value}
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Limit: {limit}
      </div>
    </div>
  );
}

export default function BillingDashboard({
  data,
}: Props) {
  const plan =
    data.plan;

  const subscription =
    data.subscription;

  const usage =
    data.usage ?? {};

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">
                Current Plan
              </div>

              <h2 className="mt-1 text-2xl font-semibold">
                {plan?.name ??
                  "No plan"}
              </h2>

              {plan?.description ? (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {plan.description}
                </p>
              ) : null}
            </div>

            <span className="rounded-full border px-3 py-1 text-sm capitalize">
              {subscription?.status ??
                "unassigned"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">
                Monthly Price
              </div>

              <div className="mt-2 text-xl font-semibold">
                {money(
                  plan?.price_monthly,
                  plan?.currency ??
                    "USD",
                )}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">
                Annual Price
              </div>

              <div className="mt-2 text-xl font-semibold">
                {money(
                  plan?.price_annual,
                  plan?.currency ??
                    "USD",
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium">
              Included Features
            </div>

            {strings(
              plan?.features,
            ).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No feature catalog configured.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {strings(
                  plan?.features,
                ).map(
                  (feature) => (
                    <span
                      key={feature}
                      className="rounded-full border bg-muted/40 px-3 py-1 text-xs"
                    >
                      {feature}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Subscription
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b pb-3">
              <span className="text-muted-foreground">
                Provider
              </span>

              <span className="font-medium">
                {subscription?.provider ??
                  "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b pb-3">
              <span className="text-muted-foreground">
                Status
              </span>

              <span className="font-medium capitalize">
                {subscription?.status ??
                  "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b pb-3">
              <span className="text-muted-foreground">
                Period Start
              </span>

              <span className="text-right font-medium">
                {dateTime(
                  subscription
                    ?.current_period_start,
                )}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b pb-3">
              <span className="text-muted-foreground">
                Period End
              </span>

              <span className="text-right font-medium">
                {dateTime(
                  subscription
                    ?.current_period_end,
                )}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                Cancel at period end
              </span>

              <span className="font-medium">
                {subscription
                  ?.cancel_at_period_end
                  ? "Yes"
                  : "No"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Current Usage
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Server-derived organization
              usage for the current billing
              period.
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            Updated{" "}
            {dateTime(
              data.usage_updated_at,
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <UsageCard
            label="Products"
            value={number(
              usage.products,
            )}
            limit={limitText(
              plan,
              "products",
            )}
          />

          <UsageCard
            label="Monthly Orders"
            value={number(
              usage.monthly_orders,
            )}
            limit={limitText(
              plan,
              "monthly_orders",
            )}
          />

          <UsageCard
            label="Research Items"
            value={number(
              usage.research_items,
            )}
            limit={limitText(
              plan,
              "research_items",
            )}
          />

          <UsageCard
            label="Price Monitor Targets"
            value={number(
              usage.price_monitor_targets,
            )}
            limit={limitText(
              plan,
              "price_monitor_targets",
            )}
          />

          <UsageCard
            label="Automation Rules"
            value={number(
              usage.automation_rules,
            )}
            limit={limitText(
              plan,
              "automation_rules",
            )}
          />

          <UsageCard
            label="Monthly AI Runs"
            value={number(
              usage.monthly_ai_runs,
            )}
            limit={limitText(
              plan,
              "monthly_ai_runs",
            )}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          AI Usage Detail
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <UsageCard
            label="Research AI Runs"
            value={number(
              usage.ai_research_runs,
            )}
            limit="Included in monthly AI usage"
          />

          <UsageCard
            label="Description AI Runs"
            value={number(
              usage.ai_description_runs,
            )}
            limit="Included in monthly AI usage"
          />

          <UsageCard
            label="Agent Runs"
            value={number(
              usage.ai_agent_runs,
            )}
            limit="Included in monthly AI usage"
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Plan Catalog
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Commercial plans can be configured
          later without changing the tenant
          subscription architecture.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {data.plans.map(
            (item) => (
              <div
                key={item.id}
                className="rounded-xl border p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.slug}
                    </p>
                  </div>

                  {item.id ===
                  plan?.id ? (
                    <span className="rounded-full border px-2 py-0.5 text-xs">
                      Current
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 text-lg font-semibold">
                  {money(
                    item.price_monthly,
                    item.currency,
                  )}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / month
                  </span>
                </div>

                {item.description ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {
                      item.description
                    }
                  </p>
                ) : null}
              </div>
            ),
          )}
        </div>
      </div>

      {!data.provider_checkout_configured ? (
        <div className="rounded-xl border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
          Payment-provider checkout is not
          configured yet. Subscription writes,
          provider webhooks, invoices, and
          payments remain server-controlled and
          are not exposed to browser clients.
        </div>
      ) : null}
    </div>
  );
}
