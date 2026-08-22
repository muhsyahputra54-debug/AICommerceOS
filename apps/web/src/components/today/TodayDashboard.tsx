import type {
  ReactNode,
} from "react";

import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  Store,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import TodayDailyBriefPanel from "@/components/today/TodayDailyBriefPanel";

import type {
  Dictionary,
} from "@/lib/i18n/dictionaries";

import type {
  Locale,
} from "@/lib/i18n/config";

import type {
  LakuvoTodaySnapshot,
  TodayMetric,
  TodayMetricValue,
} from "@/lib/ai/today-contract";

type TodayDashboardProps = {
  snapshot:
    LakuvoTodaySnapshot;

  locale:
    Locale;

  copy:
    Dictionary["today"];
};

type MetricDisplay = {
  value:
    string;

  reason:
    string | null;
};

function intlLocale(
  locale:
    Locale,
) {
  return locale === "id"
    ? "id-ID"
    : "en-US";
}

function finiteNumber(
  value:
    TodayMetricValue,
): number | null {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function numberValue(
  value:
    TodayMetricValue,
  locale:
    Locale,
) {
  const parsed =
    finiteNumber(value);

  if (parsed === null) {
    return String(value);
  }

  return new Intl.NumberFormat(
    intlLocale(locale),
  ).format(parsed);
}

function currencyValue(
  value:
    TodayMetricValue,
  locale:
    Locale,
) {
  const parsed =
    finiteNumber(value);

  if (parsed === null) {
    return String(value);
  }

  return new Intl.NumberFormat(
    intlLocale(locale),
    {
      style:
        "currency",

      currency:
        "IDR",

      maximumFractionDigits:
        0,
    },
  ).format(parsed);
}

function percentValue(
  value:
    TodayMetricValue,
  locale:
    Locale,
) {
  const parsed =
    finiteNumber(value);

  if (parsed === null) {
    return String(value);
  }

  return `${new Intl.NumberFormat(
    intlLocale(locale),
    {
      maximumFractionDigits:
        2,
    },
  ).format(parsed)}%`;
}

function metricDisplay<T>(
  metric:
    TodayMetric<T>,
  formatter:
    (value: T) => string,
): MetricDisplay {
  if (
    metric.status ===
    "unavailable"
  ) {
    return {
      value:
        "—",

      reason:
        metric.reason,
    };
  }

  return {
    value:
      formatter(
        metric.value,
      ),

    reason:
      null,
  };
}

function numberMetric(
  metric:
    TodayMetric<number>,
  locale:
    Locale,
) {
  return metricDisplay(
    metric,
    (value) =>
      new Intl.NumberFormat(
        intlLocale(locale),
      ).format(value),
  );
}

function dateTime(
  value:
    string,
  locale:
    Locale,
) {
  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    intlLocale(locale),
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(parsed);
}

function MetricCard({
  label,
  display,
  description,
  icon,
}: {
  label:
    string;

  display:
    MetricDisplay;

  description:
    string;

  icon:
    ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardDescription>
              {label}
            </CardDescription>

            <CardTitle className="mt-2 text-2xl font-semibold tracking-tight">
              {display.value}
            </CardTitle>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-xs text-muted-foreground">
          {
            display.reason ??
            description
          }
        </p>
      </CardContent>
    </Card>
  );
}

function severityClass(
  severity:
    string,
) {
  if (
    severity === "critical" ||
    severity === "high"
  ) {
    return "bg-destructive/10 text-destructive";
  }

  if (
    severity === "medium"
  ) {
    return "bg-secondary text-secondary-foreground";
  }

  return "bg-muted text-muted-foreground";
}

function healthClass(
  health:
    string,
) {
  if (
    health === "attention"
  ) {
    return "bg-destructive/10 text-destructive";
  }

  if (
    health === "healthy"
  ) {
    return "bg-primary/10 text-primary";
  }

  return "bg-muted text-muted-foreground";
}

export default function TodayDashboard({
  snapshot,
  locale,
  copy,
}: TodayDashboardProps) {
  const commerce =
    snapshot.commerce;

  const revenue =
    metricDisplay(
      commerce.revenue,
      (value) =>
        currencyValue(
          value,
          locale,
        ),
    );

  const completedOrders =
    metricDisplay(
      commerce.completedOrders,
      (value) =>
        numberValue(
          value,
          locale,
        ),
    );

  const grossProfit =
    metricDisplay(
      commerce.grossProfit,
      (value) =>
        currencyValue(
          value,
          locale,
        ),
    );

  const grossMargin =
    metricDisplay(
      commerce.grossMargin,
      (value) =>
        percentValue(
          value,
          locale,
        ),
    );

  const productLowStock =
    numberMetric(
      snapshot.inventory.products
        .lowStockCount,
      locale,
    );

  const productOutOfStock =
    numberMetric(
      snapshot.inventory.products
        .outOfStockCount,
      locale,
    );

  const variantLowStock =
    numberMetric(
      snapshot.inventory.variants
        .lowStockCount,
      locale,
    );

  const variantOutOfStock =
    numberMetric(
      snapshot.inventory.variants
        .outOfStockCount,
      locale,
    );

  const alertCount =
    numberMetric(
      snapshot.inventory
        .alertCount,
      locale,
    );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {copy.title}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {copy.subtitle}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          {copy.snapshotUpdated}:{" "}
          {dateTime(
            snapshot.generatedAt,
            locale,
          )}
        </p>
      </header>

      <section>
        <TodayDailyBriefPanel
          initialBrief={snapshot.dailyBrief}
          copy={copy.dailyBrief}
        />
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            {copy.commerce.title}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {copy.commerce.description}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={
              copy.commerce.revenue
            }
            display={revenue}
            description={
              copy.commerce
                .completedSalesOnly
            }
            icon={
              <DollarSign className="h-5 w-5" />
            }
          />

          <MetricCard
            label={
              copy.commerce
                .completedOrders
            }
            display={
              completedOrders
            }
            description={
              copy.commerce
                .completedSalesOnly
            }
            icon={
              <ShoppingCart className="h-5 w-5" />
            }
          />

          <MetricCard
            label={
              copy.commerce
                .grossProfit
            }
            display={
              grossProfit
            }
            description={
              copy.commerce
                .verifiedCommerce
            }
            icon={
              <TrendingUp className="h-5 w-5" />
            }
          />

          <MetricCard
            label={
              copy.commerce
                .grossMargin
            }
            display={
              grossMargin
            }
            description={
              copy.commerce
                .verifiedCommerce
            }
            icon={
              <BarChart3 className="h-5 w-5" />
            }
          />
        </div>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <CardTitle>
                  {
                    copy.urgentIssues
                      .title
                  }
                </CardTitle>

                <CardDescription className="mt-1">
                  {
                    copy.urgentIssues
                      .description
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {
              snapshot
                .urgentIssues
                .length === 0
                ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {
                        copy.urgentIssues
                          .empty
                      }
                    </div>
                  )
                : (
                    <div className="space-y-3">
                      {
                        snapshot
                          .urgentIssues
                          .map(
                            (issue) => (
                              <article
                                key={
                                  issue.id
                                }
                                className="rounded-xl border border-border/70 bg-background/60 p-4"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <h3 className="font-medium">
                                      {
                                        issue.title
                                      }
                                    </h3>

                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                      {
                                        issue.explanation
                                      }
                                    </p>
                                  </div>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase ${severityClass(
                                      issue.severity,
                                    )}`}
                                  >
                                    {
                                      issue.severity
                                    }
                                  </span>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span>
                                    {
                                      issue.category
                                    }
                                  </span>

                                  <span>
                                    {
                                      issue.source
                                    }
                                  </span>
                                </div>
                              </article>
                            ),
                          )
                      }
                    </div>
                  )
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>

              <div>
                <CardTitle>
                  {
                    copy.inventory
                      .title
                  }
                </CardTitle>

                <CardDescription className="mt-1">
                  {
                    copy.inventory
                      .description
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {
                [
                  {
                    label:
                      copy.inventory
                        .productLowStock,

                    display:
                      productLowStock,
                  },
                  {
                    label:
                      copy.inventory
                        .productOutOfStock,

                    display:
                      productOutOfStock,
                  },
                  {
                    label:
                      copy.inventory
                        .variantLowStock,

                    display:
                      variantLowStock,
                  },
                  {
                    label:
                      copy.inventory
                        .variantOutOfStock,

                    display:
                      variantOutOfStock,
                  },
                ].map(
                  (item) => (
                    <div
                      key={
                        item.label
                      }
                      className="rounded-xl border border-border/70 bg-background/60 p-4"
                    >
                      <p className="text-xs text-muted-foreground">
                        {
                          item.label
                        }
                      </p>

                      <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {
                          item.display
                            .value
                        }
                      </p>

                      {
                        item.display
                          .reason
                          ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {
                                  item.display
                                    .reason
                                }
                              </p>
                            )
                          : null
                      }
                    </div>
                  ),
                )
              }
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {
                  copy.inventory
                    .alerts
                }
              </span>

              <span className="font-semibold">
                {
                  alertCount.value
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="h-5 w-5" />
              </div>

              <div>
                <CardTitle>
                  {
                    copy.marketplace
                      .title
                  }
                </CardTitle>

                <CardDescription className="mt-1">
                  {
                    copy.marketplace
                      .description
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">
                  {
                    copy.marketplace
                      .connected
                  }
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {
                    snapshot
                      .marketplaces
                      .connectedCount
                  }
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">
                  {
                    copy.marketplace
                      .attention
                  }
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {
                    snapshot
                      .marketplaces
                      .attentionRequiredCount
                  }
                </p>
              </div>
            </div>

            {
              snapshot
                .marketplaces
                .channels
                .length === 0
                ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {
                        copy.marketplace
                          .noChannels
                      }
                    </div>
                  )
                : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {
                        snapshot
                          .marketplaces
                          .channels
                          .map(
                            (
                              channel,
                            ) => (
                              <article
                                key={
                                  channel.id
                                }
                                className="rounded-xl border border-border/70 bg-background/60 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h3 className="font-medium">
                                      {
                                        channel.name
                                      }
                                    </h3>

                                    <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                                      {
                                        channel.provider
                                      }
                                    </p>
                                  </div>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${healthClass(
                                      channel.health,
                                    )}`}
                                  >
                                    {
                                      channel.health
                                    }
                                  </span>
                                </div>

                                <p className="mt-3 text-xs text-muted-foreground">
                                  {
                                    copy.marketplace
                                      .status
                                  }
                                  :{" "}
                                  {
                                    channel.status
                                  }
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {
                                    copy.marketplace
                                      .lastSynced
                                  }
                                  :{" "}
                                  {
                                    channel.lastSyncedAt
                                      ? dateTime(
                                          channel.lastSyncedAt,
                                          locale,
                                        )
                                      : copy.marketplace
                                          .neverSynced
                                  }
                                </p>

                                {
                                  channel
                                    .reasons
                                    .length > 0
                                    ? (
                                        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                                          {
                                            channel
                                              .reasons
                                              .map(
                                                (
                                                  reason,
                                                ) => (
                                                  <li
                                                    key={
                                                      reason
                                                    }
                                                  >
                                                    •{" "}
                                                    {
                                                      reason
                                                    }
                                                  </li>
                                                ),
                                              )
                                          }
                                        </ul>
                                      )
                                    : null
                                }
                              </article>
                            ),
                          )
                      }
                    </div>
                  )
            }
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              {
                copy.recommendations
                  .title
              }
            </CardTitle>

            <CardDescription>
              {
                copy.recommendations
                  .description
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {
              snapshot
                .recommendations
                .length === 0
                ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {
                        copy.recommendations
                          .empty
                      }
                    </div>
                  )
                : (
                    <div className="space-y-3">
                      {
                        snapshot
                          .recommendations
                          .map(
                            (
                              recommendation,
                              index,
                            ) => (
                              <article
                                key={
                                  recommendation.id
                                }
                                className="rounded-xl border border-border/70 bg-background/60 p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-primary">
                                      #
                                      {
                                        index +
                                        1
                                      }
                                    </p>

                                    <h3 className="mt-1 font-medium">
                                      {
                                        recommendation.title
                                      }
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                      {
                                        recommendation.rationale
                                      }
                                    </p>

                                    {
                                      recommendation
                                        .expectedImpact
                                        ? (
                                            <p className="mt-3 text-sm">
                                              <span className="font-medium">
                                                {
                                                  copy.recommendations
                                                    .expectedImpact
                                                }
                                                :{" "}
                                              </span>

                                              <span className="text-muted-foreground">
                                                {
                                                  recommendation
                                                    .expectedImpact
                                                }
                                              </span>
                                            </p>
                                          )
                                        : null
                                    }
                                  </div>

                                  <span className="w-fit shrink-0 self-start rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                                    {
                                      copy.recommendations
                                        .priority
                                    }
                                    :{" "}
                                    {
                                      recommendation
                                        .priorityScore
                                    }
                                  </span>
                                </div>
                              </article>
                            ),
                          )
                      }
                    </div>
                  )
            }
          </CardContent>
        </Card>
      </section>
    </div>
  );
}