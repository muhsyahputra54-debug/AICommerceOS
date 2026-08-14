export type CommerceAnalyticsData = {
  generated_at: string;
  period_days: number;
  period_start: string;

  sales: {
    orders: number;
    completed_orders: number;
    pending_orders: number;
    processing_orders: number;
    cancelled_orders: number;

    revenue: number;
    cogs: number;
    gross_profit: number;
    average_order_value: number;
  };

  catalog: {
    products: number;
    active_products: number;

    base_stock_units: number;
    base_retail_value: number;
    base_cost_value: number;

    variants: number;

    variant_stock_units: number;
    variant_retail_value: number;
    variant_cost_value: number;
  };

  research: {
    total: number;
    shortlisted: number;
    approved: number;
    rejected: number;

    average_opportunity_score: number;
  };

  price_monitoring: {
    targets: number;
    active_targets: number;

    observations: number;
    threshold_alerts: number;
  };

  automation: {
    rules: number;
    active_rules: number;

    runs: number;
    executed_runs: number;
    proposed_runs: number;
    failed_runs: number;

    pending_actions: number;
  };

  ai_activity: {
    research_runs: number;
    description_runs: number;

    agent_runs: number;
    agent_completed: number;
    agent_failed: number;
  };

  daily_sales: Array<{
    date: string;
    orders: number;
    completed_orders: number;
    revenue: number;
  }>;
};

type Props = {
  data: CommerceAnalyticsData;
};

function numeric(
  value: number | string | null | undefined,
) {
  const parsed =
    Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function money(
  value: number | string | null | undefined,
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    },
  ).format(
    numeric(value),
  );
}

function number(
  value: number | string | null | undefined,
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 2,
    },
  ).format(
    numeric(value),
  );
}

function date(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
    },
  ).format(
    new Date(value),
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="text-sm text-muted-foreground">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </div>

      {detail ? (
        <div className="mt-2 text-xs text-muted-foreground">
          {detail}
        </div>
      ) : null}
    </div>
  );
}

export default function CommerceAnalyticsDashboard({
  data,
}: Props) {
  const maxRevenue =
    Math.max(
      ...data.daily_sales.map(
        (item) =>
          numeric(item.revenue),
      ),
      1,
    );

  const grossMargin =
    numeric(
      data.sales.revenue,
    ) > 0
      ? (
          numeric(
            data.sales.gross_profit,
          ) /
          numeric(
            data.sales.revenue,
          )
        ) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Completed Revenue"
          value={money(
            data.sales.revenue,
          )}
          detail={`${number(
            data.sales.completed_orders,
          )} completed orders`}
        />

        <MetricCard
          label="Gross Profit"
          value={money(
            data.sales.gross_profit,
          )}
          detail={`${grossMargin.toFixed(
            2,
          )}% gross margin`}
        />

        <MetricCard
          label="Average Order Value"
          value={money(
            data.sales.average_order_value,
          )}
          detail={`${number(
            data.sales.orders,
          )} total orders`}
        />

        <MetricCard
          label="Pending Automation"
          value={number(
            data.automation.pending_actions,
          )}
          detail={`${number(
            data.automation.executed_runs,
          )} executed runs`}
        />
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Sales Trend
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Daily order activity and completed
              revenue during the last{" "}
              {data.period_days} days.
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            Generated{" "}
            {new Intl.DateTimeFormat(
              "id-ID",
              {
                dateStyle: "medium",
                timeStyle: "short",
              },
            ).format(
              new Date(
                data.generated_at,
              ),
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {data.daily_sales.map(
            (item) => {
              const revenue =
                numeric(
                  item.revenue,
                );

              const width =
                Math.max(
                  (
                    revenue /
                    maxRevenue
                  ) * 100,
                  revenue > 0
                    ? 2
                    : 0,
                );

              return (
                <div
                  key={item.date}
                  className="grid grid-cols-[70px_1fr_auto] items-center gap-3"
                >
                  <div className="text-xs text-muted-foreground">
                    {date(
                      item.date,
                    )}
                  </div>

                  <div className="h-7 overflow-hidden rounded-md bg-muted">
                    <div
                      className="h-full rounded-md bg-foreground/20"
                      style={{
                        width:
                          `${width}%`,
                      }}
                    />
                  </div>

                  <div className="min-w-32 text-right text-xs">
                    <div className="font-medium">
                      {money(
                        revenue,
                      )}
                    </div>

                    <div className="text-muted-foreground">
                      {number(
                        item.orders,
                      )} orders
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Order Intelligence
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="Completed"
              value={number(
                data.sales.completed_orders,
              )}
            />

            <MetricCard
              label="Processing"
              value={number(
                data.sales.processing_orders,
              )}
            />

            <MetricCard
              label="Pending"
              value={number(
                data.sales.pending_orders,
              )}
            />

            <MetricCard
              label="Cancelled"
              value={number(
                data.sales.cancelled_orders,
              )}
            />
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between border-b pb-3">
              <span className="text-muted-foreground">
                Revenue
              </span>

              <span className="font-medium">
                {money(
                  data.sales.revenue,
                )}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-muted-foreground">
                Cost of Goods
              </span>

              <span className="font-medium">
                {money(
                  data.sales.cogs,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Gross Profit
              </span>

              <span className="font-medium">
                {money(
                  data.sales.gross_profit,
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Catalog & Inventory
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="Products"
              value={number(
                data.catalog.products,
              )}
              detail={`${number(
                data.catalog.active_products,
              )} active`}
            />

            <MetricCard
              label="Variants"
              value={number(
                data.catalog.variants,
              )}
            />

            <MetricCard
              label="Base Stock"
              value={number(
                data.catalog.base_stock_units,
              )}
              detail={money(
                data.catalog.base_retail_value,
              )}
            />

            <MetricCard
              label="Variant Stock"
              value={number(
                data.catalog.variant_stock_units,
              )}
              detail={money(
                data.catalog.variant_retail_value,
              )}
            />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Base Product and Variant inventory are
            intentionally reported separately to
            prevent accidental double-counting.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Product Research
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Total candidates</span>
              <strong>
                {number(
                  data.research.total,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Shortlisted</span>
              <strong>
                {number(
                  data.research.shortlisted,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Approved</span>
              <strong>
                {number(
                  data.research.approved,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Rejected</span>
              <strong>
                {number(
                  data.research.rejected,
                )}
              </strong>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span>
                Avg. Opportunity
              </span>

              <strong>
                {number(
                  data.research
                    .average_opportunity_score,
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Price Intelligence
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Monitor targets</span>

              <strong>
                {number(
                  data.price_monitoring
                    .targets,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Active targets</span>

              <strong>
                {number(
                  data.price_monitoring
                    .active_targets,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Observations</span>

              <strong>
                {number(
                  data.price_monitoring
                    .observations,
                )}
              </strong>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span>Threshold alerts</span>

              <strong>
                {number(
                  data.price_monitoring
                    .threshold_alerts,
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Automation
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Rules</span>

              <strong>
                {number(
                  data.automation.rules,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Active rules</span>

              <strong>
                {number(
                  data.automation.active_rules,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Executed runs</span>

              <strong>
                {number(
                  data.automation.executed_runs,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Failed runs</span>

              <strong>
                {number(
                  data.automation.failed_runs,
                )}
              </strong>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span>Pending actions</span>

              <strong>
                {number(
                  data.automation.pending_actions,
                )}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          AI Activity
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          AI-related workflow activity during
          the selected analytics period.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-5">
          <MetricCard
            label="Research AI"
            value={number(
              data.ai_activity.research_runs,
            )}
          />

          <MetricCard
            label="Description AI"
            value={number(
              data.ai_activity.description_runs,
            )}
          />

          <MetricCard
            label="Agent Runs"
            value={number(
              data.ai_activity.agent_runs,
            )}
          />

          <MetricCard
            label="Agent Completed"
            value={number(
              data.ai_activity.agent_completed,
            )}
          />

          <MetricCard
            label="Agent Failed"
            value={number(
              data.ai_activity.agent_failed,
            )}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
        Analytics is read-only. This dashboard does
        not mutate Products, Variants, Inventory,
        Orders, Price Monitoring, Automation, or
        AI Agent state.
      </div>
    </div>
  );
}
