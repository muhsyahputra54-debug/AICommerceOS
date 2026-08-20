type UnknownRecord =
  Record<string, unknown>;

export type BuildSalesIntelligenceContextInput = {
  analytics: unknown;
};

const MAX_DAILY_SALES_POINTS = 30;

const SALES_INTELLIGENCE_LIMITATIONS = [
  "This sales intelligence is sourced from the read-only get_commerce_analytics RPC.",
  "The analytics window is based on orders.created_at, not completed_at.",
  "Revenue and COGS include only orders whose current status is completed within the created_at analytics window.",
  "COGS uses order_items.cost_price_snapshot, preserving the recorded order-time cost snapshot.",
  "Gross profit is revenue minus COGS. It is not net profit and does not include operating expenses, fees, taxes, shipping, refunds, or other costs unless represented in the source data.",
  "Gross margin percent is derived as gross profit divided by revenue when revenue is greater than zero.",
  "Daily sales are grouped by orders.created_at date and include revenue only from orders whose current status is completed.",
  "If this context is unavailable, do not infer official revenue, COGS, profit, margin, or average order value from recent order samples.",
] as const;

function asRecord(
  value: unknown,
): UnknownRecord | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as UnknownRecord;
}

function finiteNumber(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed =
      Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function textValue(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized === ""
    ? null
    : normalized;
}

function grossMarginPercent(
  revenue: number | null,
  grossProfit: number | null,
) {
  if (
    revenue === null ||
    grossProfit === null ||
    revenue <= 0
  ) {
    return null;
  }

  return Math.round(
    (
      (
        grossProfit /
        revenue
      ) *
      100
    ) *
      100,
  ) / 100;
}

function normalizeDailySales(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(
      0,
      MAX_DAILY_SALES_POINTS,
    )
    .map((item) => {
      const row =
        asRecord(item);

      if (!row) {
        return null;
      }

      const date =
        textValue(row.date);

      if (!date) {
        return null;
      }

      return {
        date,

        orders:
          finiteNumber(
            row.orders,
          ),

        completed_orders:
          finiteNumber(
            row.completed_orders,
          ),

        revenue:
          finiteNumber(
            row.revenue,
          ),
      };
    })
    .filter(
      (
        item,
      ): item is NonNullable<
        typeof item
      > => item !== null,
    );
}

export function buildSalesIntelligenceContext({
  analytics,
}: BuildSalesIntelligenceContextInput) {
  const root =
    asRecord(analytics);

  const sales =
    root
      ? asRecord(root.sales)
      : null;

  if (!root || !sales) {
    return {
      source:
        "get_commerce_analytics",

      available:
        false,

      generated_at:
        null,

      period_days:
        null,

      period_start:
        null,

      period_basis:
        "orders.created_at",

      sales:
        null,

      daily_sales:
        [],

      limitations:
        [
          ...SALES_INTELLIGENCE_LIMITATIONS,
        ],
    };
  }

  const revenue =
    finiteNumber(
      sales.revenue,
    );

  const grossProfit =
    finiteNumber(
      sales.gross_profit,
    );

  return {
    source:
      "get_commerce_analytics",

    available:
      true,

    generated_at:
      textValue(
        root.generated_at,
      ),

    period_days:
      finiteNumber(
        root.period_days,
      ),

    period_start:
      textValue(
        root.period_start,
      ),

    period_basis:
      "orders.created_at",

    sales: {
      orders:
        finiteNumber(
          sales.orders,
        ),

      completed_orders:
        finiteNumber(
          sales.completed_orders,
        ),

      pending_orders:
        finiteNumber(
          sales.pending_orders,
        ),

      processing_orders:
        finiteNumber(
          sales.processing_orders,
        ),

      cancelled_orders:
        finiteNumber(
          sales.cancelled_orders,
        ),

      revenue,

      cogs:
        finiteNumber(
          sales.cogs,
        ),

      gross_profit:
        grossProfit,

      gross_margin_percent:
        grossMarginPercent(
          revenue,
          grossProfit,
        ),

      average_order_value:
        finiteNumber(
          sales.average_order_value,
        ),
    },

    daily_sales:
      normalizeDailySales(
        root.daily_sales,
      ),

    limitations:
      [
        ...SALES_INTELLIGENCE_LIMITATIONS,
      ],
  };
}
