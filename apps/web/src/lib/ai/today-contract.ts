export const LAKUVO_TODAY_CONTRACT_VERSION =
  1 as const;

export const TODAY_ISSUE_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export type TodayIssueSeverity =
  (typeof TODAY_ISSUE_SEVERITIES)[number];

export type TodayIssueCategory =
  | "commerce"
  | "inventory"
  | "marketplace"
  | "product"
  | "pricing";

export type TodayMetricValue =
  number | string;

export type TodayMetric<T> =
  | {
      status:
        "available";

      value:
        T;
    }
  | {
      status:
        "unavailable";

      value:
        null;

      reason:
        string;
    };

export type TodayCommerceSummary = {
  source:
    "get_sales_performance_summary";

  semantics:
    "completed_orders_only";

  completedOrders:
    TodayMetric<TodayMetricValue>;

  unitsSold:
    TodayMetric<TodayMetricValue>;

  productsSold:
    TodayMetric<TodayMetricValue>;

  revenue:
    TodayMetric<TodayMetricValue>;

  cost:
    TodayMetric<TodayMetricValue>;

  grossProfit:
    TodayMetric<TodayMetricValue>;

  grossMargin:
    TodayMetric<TodayMetricValue>;

  averageOrderValue:
    TodayMetric<TodayMetricValue>;
};

export type TodayInventorySummary = {
  metricsSource:
    "get_inventory_intelligence";

  alertsSource:
    "get_inventory_alerts";

  products: {
    lowStockCount:
      TodayMetric<number>;

    outOfStockCount:
      TodayMetric<number>;
  };

  variants: {
    lowStockCount:
      TodayMetric<number>;

    outOfStockCount:
      TodayMetric<number>;
  };

  alertCount:
    TodayMetric<number>;
};

export type TodayMarketplaceHealth =
  | "healthy"
  | "attention"
  | "unavailable";

export type TodayMarketplaceChannel = {
  id:
    string;

  provider:
    string;

  name:
    string;

  status:
    string;

  lastSyncedAt:
    string | null;

  health:
    TodayMarketplaceHealth;

  reasons:
    string[];
};

export type TodayMarketplaceSummary = {
  accountsSource:
    "marketplace_accounts";

  operationalSources: readonly [
    "marketplace_listings",
    "marketplace_order_links",
    "marketplace_sync_logs",
  ];

  connectedCount:
    number;

  attentionRequiredCount:
    number;

  channels:
    TodayMarketplaceChannel[];
};

export type TodayEvidenceValue =
  | string
  | number
  | boolean
  | null;

export type TodayIssue = {
  id:
    string;

  severity:
    TodayIssueSeverity;

  category:
    TodayIssueCategory;

  title:
    string;

  explanation:
    string;

  source:
    string;

  evidence:
    Record<
      string,
      TodayEvidenceValue
    >;

  entity:
    | {
        type:
          "product"
          | "order"
          | "marketplace";

        id:
          string;

        name?:
          string;
      }
    | null;

  detectedAt:
    string;
};

export type TodayRecommendationAction = {
  destination:
    "action_center";

  actionType:
    string;

  supported:
    boolean;

  requiresExplicitHumanConfirmation:
    true;

  directExecutionAllowed:
    false;
};

export type TodayRecommendation = {
  id:
    string;

  title:
    string;

  rationale:
    string;

  expectedImpact:
    string | null;

  priorityScore:
    number;

  sourceIssueIds:
    string[];

  action:
    TodayRecommendationAction | null;
};

export type TodayDailyBrief =
  | {
      status:
        "not_generated";

      source:
        null;
    }
  | {
      status:
        "unavailable";

      source:
        null;

      reason:
        string;
    }
  | {
      status:
        "ready";

      source:
        "ai_synthesis";

      headline:
        string;

      summary:
        string;

      highlights:
        string[];
    };

export type LakuvoTodaySnapshot = {
  contractVersion:
    typeof LAKUVO_TODAY_CONTRACT_VERSION;

  organizationId:
    string;

  generatedAt:
    string;

  commerce:
    TodayCommerceSummary;

  inventory:
    TodayInventorySummary;

  marketplaces:
    TodayMarketplaceSummary;

  urgentIssues:
    TodayIssue[];

  recommendations:
    TodayRecommendation[];

  dailyBrief:
    TodayDailyBrief;
};

export type ProjectLakuvoTodaySnapshotInput = {
  organizationId:
    string;

  generatedAt:
    string;

  commerce:
    TodayCommerceSummary;

  inventory:
    TodayInventorySummary;

  marketplaces:
    TodayMarketplaceSummary;

  urgentIssues:
    TodayIssue[];

  recommendations:
    TodayRecommendation[];

  dailyBrief?:
    TodayDailyBrief;
};

const ISSUE_SEVERITY_WEIGHT:
  Record<
    TodayIssueSeverity,
    number
  > = {
    critical:
      400,

    high:
      300,

    medium:
      200,

    low:
      100,
  };

export function availableTodayMetric<T>(
  value: T,
): TodayMetric<T> {
  return {
    status:
      "available",

    value,
  };
}

export function unavailableTodayMetric<T>(
  reason: string,
): TodayMetric<T> {
  const normalizedReason =
    reason.trim();

  return {
    status:
      "unavailable",

    value:
      null,

    reason:
      normalizedReason.length > 0
        ? normalizedReason
        : "Data unavailable.",
  };
}

export function rankTodayIssues(
  issues: TodayIssue[],
): TodayIssue[] {
  return [...issues].sort(
    (left, right) => {
      const severityDifference =
        ISSUE_SEVERITY_WEIGHT[
          right.severity
        ] -
        ISSUE_SEVERITY_WEIGHT[
          left.severity
        ];

      if (
        severityDifference !== 0
      ) {
        return severityDifference;
      }

      const detectedDifference =
        left.detectedAt.localeCompare(
          right.detectedAt,
        );

      if (
        detectedDifference !== 0
      ) {
        return detectedDifference;
      }

      return left.id.localeCompare(
        right.id,
      );
    },
  );
}

export function selectTodayRecommendations(
  recommendations:
    TodayRecommendation[],
  limit = 3,
): TodayRecommendation[] {
  const normalizedLimit =
    Math.max(
      0,
      Math.min(
        3,
        Math.trunc(limit),
      ),
    );

  return [...recommendations]
    .sort(
      (left, right) => {
        const priorityDifference =
          right.priorityScore -
          left.priorityScore;

        if (
          priorityDifference !== 0
        ) {
          return priorityDifference;
        }

        return left.id.localeCompare(
          right.id,
        );
      },
    )
    .slice(
      0,
      normalizedLimit,
    );
}

export function projectLakuvoTodaySnapshot(
  input:
    ProjectLakuvoTodaySnapshotInput,
): LakuvoTodaySnapshot {
  return {
    contractVersion:
      LAKUVO_TODAY_CONTRACT_VERSION,

    organizationId:
      input.organizationId,

    generatedAt:
      input.generatedAt,

    commerce:
      input.commerce,

    inventory:
      input.inventory,

    marketplaces:
      input.marketplaces,

    urgentIssues:
      rankTodayIssues(
        input.urgentIssues,
      ),

    recommendations:
      selectTodayRecommendations(
        input.recommendations,
      ),

    dailyBrief:
      input.dailyBrief ?? {
        status:
          "not_generated",

        source:
          null,
      },
  };
}
