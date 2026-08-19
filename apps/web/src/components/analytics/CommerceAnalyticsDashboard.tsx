import { getDictionary } from "@/lib/i18n/dictionaries";

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
  locale: "id" | "en";
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

function formatMoney(
  value: number | string | null | undefined,
  locale: string,
) {
  return new Intl.NumberFormat(
    locale,
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    },
  ).format(
    numeric(value),
  );
}

function formatNumber(
  value: number | string | null | undefined,
  locale: string,
) {
  return new Intl.NumberFormat(
    locale,
    {
      maximumFractionDigits: 2,
    },
  ).format(
    numeric(value),
  );
}

function formatDate(
  value: string,
  locale: string,
) {
  return new Intl.DateTimeFormat(
    locale,
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
  locale,
}: Props) {
  const copy =
    getDictionary(locale).analytics.intelligence;
  const localeTag =
    locale === "id" ? "id-ID" : "en-US";

  const money = (
    value: number | string | null | undefined,
  ) => formatMoney(value, localeTag);

  const number = (
    value: number | string | null | undefined,
  ) => formatNumber(value, localeTag);

  const date = (value: string) =>
    formatDate(value, localeTag);

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
          label={copy.metrics.completedRevenue}
          value={money(
            data.sales.revenue,
          )}
          detail={`${number(
            data.sales.completed_orders,
          )} ${copy.metrics.completedOrdersSuffix}`}
        />

        <MetricCard
          label={copy.metrics.grossProfit}
          value={money(
            data.sales.gross_profit,
          )}
          detail={`${number(
            grossMargin,
          )}% ${copy.metrics.grossMarginSuffix}`}
        />

        <MetricCard
          label={copy.metrics.averageOrderValue}
          value={money(
            data.sales.average_order_value,
          )}
          detail={`${number(
            data.sales.orders,
          )} ${copy.metrics.totalOrdersSuffix}`}
        />

        <MetricCard
          label={copy.metrics.pendingAutomation}
          value={number(
            data.automation.pending_actions,
          )}
          detail={`${number(
            data.automation.executed_runs,
          )} ${copy.metrics.executedRunsSuffix}`}
        />
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {copy.salesTrend.title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {copy.salesTrend.descriptionPrefix}{" "}
              {data.period_days}{" "}
              {copy.salesTrend.descriptionSuffix}
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            {copy.salesTrend.generated}{" "}
            {new Intl.DateTimeFormat(
              localeTag,
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
                      )} {copy.salesTrend.orders}
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
            {copy.orderIntelligence.title}
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MetricCard
              label={copy.orderIntelligence.completed}
              value={number(
                data.sales.completed_orders,
              )}
            />

            <MetricCard
              label={copy.orderIntelligence.processing}
              value={number(
                data.sales.processing_orders,
              )}
            />

            <MetricCard
              label={copy.orderIntelligence.pending}
              value={number(
                data.sales.pending_orders,
              )}
            />

            <MetricCard
              label={copy.orderIntelligence.cancelled}
              value={number(
                data.sales.cancelled_orders,
              )}
            />
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between border-b pb-3">
              <span className="text-muted-foreground">
                {copy.orderIntelligence.revenue}
              </span>

              <span className="font-medium">
                {money(
                  data.sales.revenue,
                )}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-muted-foreground">
                {copy.orderIntelligence.costOfGoods}
              </span>

              <span className="font-medium">
                {money(
                  data.sales.cogs,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {copy.orderIntelligence.grossProfit}
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
            {copy.catalog.title}
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MetricCard
              label={copy.catalog.products}
              value={number(
                data.catalog.products,
              )}
              detail={`${number(
                data.catalog.active_products,
              )} ${copy.catalog.activeSuffix}`}
            />

            <MetricCard
              label={copy.catalog.variants}
              value={number(
                data.catalog.variants,
              )}
            />

            <MetricCard
              label={copy.catalog.baseStock}
              value={number(
                data.catalog.base_stock_units,
              )}
              detail={money(
                data.catalog.base_retail_value,
              )}
            />

            <MetricCard
              label={copy.catalog.variantStock}
              value={number(
                data.catalog.variant_stock_units,
              )}
              detail={money(
                data.catalog.variant_retail_value,
              )}
            />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {copy.catalog.note}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            {copy.research.title}
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>{copy.research.totalCandidates}</span>
              <strong>
                {number(
                  data.research.total,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>{copy.research.shortlisted}</span>
              <strong>
                {number(
                  data.research.shortlisted,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>{copy.research.approved}</span>
              <strong>
                {number(
                  data.research.approved,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>{copy.research.rejected}</span>
              <strong>
                {number(
                  data.research.rejected,
                )}
              </strong>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span>
                {copy.research.averageOpportunity}
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
            {copy.price.title}
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>{copy.price.monitorTargets}</span>

              <strong>
                {number(
                  data.price_monitoring
                    .targets,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>{copy.price.activeTargets}</span>

              <strong>
                {number(
                  data.price_monitoring
                    .active_targets,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>{copy.price.observations}</span>

              <strong>
                {number(
                  data.price_monitoring
                    .observations,
                )}
              </strong>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span>{copy.price.thresholdAlerts}</span>

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
            {copy.automation.title}
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>{copy.automation.rules}</span>

              <strong>
                {number(
                  data.automation.rules,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>{copy.automation.activeRules}</span>

              <strong>
                {number(
                  data.automation.active_rules,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>{copy.automation.executedRuns}</span>

              <strong>
                {number(
                  data.automation.executed_runs,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>{copy.automation.failedRuns}</span>

              <strong>
                {number(
                  data.automation.failed_runs,
                )}
              </strong>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span>{copy.automation.pendingActions}</span>

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
          {copy.aiActivity.title}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {copy.aiActivity.description}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-5">
          <MetricCard
            label={copy.aiActivity.researchAI}
            value={number(
              data.ai_activity.research_runs,
            )}
          />

          <MetricCard
            label={copy.aiActivity.descriptionAI}
            value={number(
              data.ai_activity.description_runs,
            )}
          />

          <MetricCard
            label={copy.aiActivity.agentRuns}
            value={number(
              data.ai_activity.agent_runs,
            )}
          />

          <MetricCard
            label={copy.aiActivity.agentCompleted}
            value={number(
              data.ai_activity.agent_completed,
            )}
          />

          <MetricCard
            label={copy.aiActivity.agentFailed}
            value={number(
              data.ai_activity.agent_failed,
            )}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
        {copy.readOnlyNote}
      </div>
    </div>
  );
}
