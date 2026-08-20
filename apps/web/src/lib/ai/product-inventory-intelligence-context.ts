type UnknownRecord =
  Record<string, unknown>;

type ProductPerformanceItem = {
  product_id: string;
  product_name: string;
  sku: string | null;
  stock: number | null;
  total_units_sold: number | null;
  revenue: number | null;
  cost: number | null;
  profit: number | null;
  margin: number | null;
};

export type BuildProductInventoryIntelligenceContextInput = {
  analytics: unknown;
  productPerformance: unknown;
};

const MAX_RANKED_PRODUCTS = 5;
const MAX_EXPOSURE_PRODUCTS = 10;

const LIMITATIONS = [
  "Catalog inventory is a current snapshot from get_commerce_analytics.",
  "Base-product and variant inventory values are reported separately and must not be added together as a combined inventory value.",
  "Product performance comes from get_product_performance and aggregates completed-order history without a date-window parameter.",
  "Product performance revenue and cost use order item price and cost_price_snapshot values.",
  "The stock field in product performance is the current base products.stock value, not variant-level stock.",
  "Variant inventory is available only as aggregate catalog totals in this context, not per-variant performance.",
  "Stock-versus-sales exposure signals are descriptive evidence, not a demand forecast, reorder recommendation, or future stockout prediction.",
  "Products with stock but no completed sales should not automatically be called slow-moving because this source has no bounded sales period.",
  "If product performance is unavailable, do not infer product rankings or completed-sales performance from the recent-order sample.",
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

function normalizePerformanceRow(
  value: unknown,
): ProductPerformanceItem | null {
  const row =
    asRecord(value);

  if (!row) {
    return null;
  }

  const productId =
    textValue(
      row.product_id,
    );

  const productName =
    textValue(
      row.product_name,
    );

  if (
    !productId ||
    !productName
  ) {
    return null;
  }

  return {
    product_id:
      productId,

    product_name:
      productName,

    sku:
      textValue(
        row.sku,
      ),

    stock:
      finiteNumber(
        row.stock,
      ),

    total_units_sold:
      finiteNumber(
        row.total_units_sold,
      ),

    revenue:
      finiteNumber(
        row.revenue,
      ),

    cost:
      finiteNumber(
        row.cost,
      ),

    profit:
      finiteNumber(
        row.profit,
      ),

    margin:
      finiteNumber(
        row.margin,
      ),
  };
}

function normalizePerformance(
  value: unknown,
): ProductPerformanceItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .map(
      normalizePerformanceRow,
    )
    .filter(
      (
        item,
      ): item is ProductPerformanceItem =>
        item !== null,
    );
}

function metricDescending(
  rows: ProductPerformanceItem[],
  metric: (
    row: ProductPerformanceItem,
  ) => number | null,
  limit: number,
) {
  return [...rows]
    .filter(
      (row) =>
        metric(row) !== null,
    )
    .sort(
      (
        left,
        right,
      ) => {
        const leftMetric =
          metric(left) ?? 0;

        const rightMetric =
          metric(right) ?? 0;

        if (
          rightMetric !==
          leftMetric
        ) {
          return (
            rightMetric -
            leftMetric
          );
        }

        return left.product_name
          .localeCompare(
            right.product_name,
          );
      },
    )
    .slice(
      0,
      limit,
    );
}

function metricAscending(
  rows: ProductPerformanceItem[],
  metric: (
    row: ProductPerformanceItem,
  ) => number | null,
  limit: number,
) {
  return [...rows]
    .filter(
      (row) =>
        metric(row) !== null,
    )
    .sort(
      (
        left,
        right,
      ) => {
        const leftMetric =
          metric(left) ?? 0;

        const rightMetric =
          metric(right) ?? 0;

        if (
          leftMetric !==
          rightMetric
        ) {
          return (
            leftMetric -
            rightMetric
          );
        }

        return left.product_name
          .localeCompare(
            right.product_name,
          );
      },
    )
    .slice(
      0,
      limit,
    );
}

function projectCatalog(
  analytics: unknown,
) {
  const root =
    asRecord(
      analytics,
    );

  const catalog =
    root
      ? asRecord(
          root.catalog,
        )
      : null;

  if (!catalog) {
    return {
      generated_at:
        null,

      catalog:
        null,
    };
  }

  return {
    generated_at:
      textValue(
        root?.generated_at,
      ),

    catalog: {
      products:
        finiteNumber(
          catalog.products,
        ),

      active_products:
        finiteNumber(
          catalog.active_products,
        ),

      base_stock_units:
        finiteNumber(
          catalog.base_stock_units,
        ),

      base_retail_value:
        finiteNumber(
          catalog.base_retail_value,
        ),

      base_cost_value:
        finiteNumber(
          catalog.base_cost_value,
        ),

      variants:
        finiteNumber(
          catalog.variants,
        ),

      variant_stock_units:
        finiteNumber(
          catalog.variant_stock_units,
        ),

      variant_retail_value:
        finiteNumber(
          catalog.variant_retail_value,
        ),

      variant_cost_value:
        finiteNumber(
          catalog.variant_cost_value,
        ),
    },
  };
}

export function buildProductInventoryIntelligenceContext({
  analytics,
  productPerformance,
}: BuildProductInventoryIntelligenceContextInput) {
  const catalogProjection =
    projectCatalog(
      analytics,
    );

  const performance =
    normalizePerformance(
      productPerformance,
    );

  const catalogAvailable =
    catalogProjection.catalog !==
    null;

  const performanceAvailable =
    performance !== null;

  const rows =
    performance ?? [];

  const soldRows =
    rows.filter(
      (row) =>
        (
          row.total_units_sold ??
          0
        ) > 0,
    );

  const outOfStockWithSales =
    metricDescending(
      soldRows.filter(
        (row) =>
          row.stock !== null &&
          row.stock <= 0,
      ),
      (row) =>
        row.total_units_sold,
      MAX_EXPOSURE_PRODUCTS,
    );

  const negativeStock =
    metricAscending(
      rows.filter(
        (row) =>
          row.stock !== null &&
          row.stock < 0,
      ),
      (row) =>
        row.stock,
      MAX_EXPOSURE_PRODUCTS,
    );

  const stockedWithoutSales =
    metricDescending(
      rows.filter(
        (row) =>
          row.stock !== null &&
          row.stock > 0 &&
          (
            row.total_units_sold ??
            0
          ) === 0,
      ),
      (row) =>
        row.stock,
      MAX_EXPOSURE_PRODUCTS,
    );

  const lossMakingProducts =
    metricAscending(
      soldRows.filter(
        (row) =>
          row.profit !== null &&
          row.profit < 0,
      ),
      (row) =>
        row.profit,
      MAX_EXPOSURE_PRODUCTS,
    );

  const lowestProfitSoldProducts =
    metricAscending(
      soldRows,
      (row) =>
        row.profit,
      MAX_RANKED_PRODUCTS,
    );

  return {
    sources: {
      catalog:
        "get_commerce_analytics",

      product_performance:
        "get_product_performance",
    },

    available:
      catalogAvailable ||
      performanceAvailable,

    catalog_available:
      catalogAvailable,

    product_performance_available:
      performanceAvailable,

    catalog_generated_at:
      catalogProjection.generated_at,

    catalog:
      catalogProjection.catalog,

    inventory_value_semantics:
      "base_and_variant_values_reported_separately",

    product_performance:
      performanceAvailable
        ? {
            sales_scope:
              "all_completed_orders",

            stock_scope:
              "current_base_product_stock",

            product_count:
              rows.length,

            products_with_completed_sales:
              soldRows.length,

            top_by_revenue:
              metricDescending(
                rows,
                (row) =>
                  row.revenue,
                MAX_RANKED_PRODUCTS,
              ),

            top_by_profit:
              metricDescending(
                rows,
                (row) =>
                  row.profit,
                MAX_RANKED_PRODUCTS,
              ),

            top_by_units_sold:
              metricDescending(
                rows,
                (row) =>
                  row.total_units_sold,
                MAX_RANKED_PRODUCTS,
              ),

            lowest_profit_sold_products:
              lowestProfitSoldProducts,

            out_of_stock_with_completed_sales:
              outOfStockWithSales,

            negative_stock_products:
              negativeStock,

            stocked_without_completed_sales:
              stockedWithoutSales,

            loss_making_products:
              lossMakingProducts,
          }
        : null,

    limitations: [
      ...LIMITATIONS,
    ],
  };
}
