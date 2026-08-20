type UnknownRecord =
  Record<string, unknown>;

type ProductEvidence = {
  product_id: string;
  product_name: string;
  sku: string | null;
  stock: number | null;
  total_units_sold: number | null;
  revenue: number | null;
  profit: number | null;
  margin: number | null;
};

export type BuildBusinessIntelligenceSynthesisInput = {
  salesIntelligence: unknown;
  productInventoryIntelligence: unknown;
};

const MAX_EVIDENCE_PRODUCTS = 5;

const LIMITATIONS = [
  "This synthesis is deterministic and only summarizes facts already present in Sales Intelligence and Product/Inventory Intelligence.",
  "It does not perform external research, forecasting, demand prediction, or autonomous commerce actions.",
  "The 30-day sales window and all-completed-orders product-performance scope are different and must not be treated as the same time period.",
  "Inventory signals use current base-product stock. Variant inventory is available only as separate aggregate context.",
  "A stocked product without completed sales is a review signal, not proof that the product is slow-moving.",
  "A historical top performer is not a forecast that the product will continue performing.",
  "Suggested focus text is advisory context only and never authorizes a product, price, inventory, order, or automation mutation.",
  "Competitor threshold alerts remain governed by the separate deterministic proactive-insight engine and are not duplicated here.",
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

function productEvidence(
  value: unknown,
): ProductEvidence | null {
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

function evidenceList(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(
      productEvidence,
    )
    .filter(
      (
        row,
      ): row is ProductEvidence =>
        row !== null,
    )
    .slice(
      0,
      MAX_EVIDENCE_PRODUCTS,
    );
}

function booleanValue(
  value: unknown,
) {
  return value === true;
}

export function buildBusinessIntelligenceSynthesis({
  salesIntelligence,
  productInventoryIntelligence,
}: BuildBusinessIntelligenceSynthesisInput) {
  const salesRoot =
    asRecord(
      salesIntelligence,
    );

  const sales =
    salesRoot
      ? asRecord(
          salesRoot.sales,
        )
      : null;

  const productRoot =
    asRecord(
      productInventoryIntelligence,
    );

  const catalog =
    productRoot
      ? asRecord(
          productRoot.catalog,
        )
      : null;

  const performance =
    productRoot
      ? asRecord(
          productRoot.product_performance,
        )
      : null;

  const salesAvailable =
    booleanValue(
      salesRoot?.available,
    ) &&
    sales !== null;

  const productAvailable =
    booleanValue(
      productRoot?.product_performance_available,
    ) &&
    performance !== null;

  const catalogAvailable =
    booleanValue(
      productRoot?.catalog_available,
    ) &&
    catalog !== null;

  const priorities: Array<{
    code: string;
    urgency:
      | "critical"
      | "high"
      | "review";
    domain: string;
    evidence_count: number;
    products: ProductEvidence[];
    evidence: UnknownRecord | null;
    suggested_focus: string;
  }> = [];

  /*
   * ------------------------------------------------------------
   * Aggregate sales profitability.
   * No threshold is invented:
   * this fires only when authoritative gross profit is < 0.
   * ------------------------------------------------------------
   */

  const grossProfit =
    salesAvailable
      ? finiteNumber(
          sales?.gross_profit,
        )
      : null;

  if (
    grossProfit !== null &&
    grossProfit < 0
  ) {
    priorities.push({
      code:
        "negative_gross_profit",

      urgency:
        "high",

      domain:
        "sales_profitability",

      evidence_count:
        1,

      products:
        [],

      evidence: {
        gross_profit:
          grossProfit,

        revenue:
          finiteNumber(
            sales?.revenue,
          ),

        cogs:
          finiteNumber(
            sales?.cogs,
          ),

        gross_margin_percent:
          finiteNumber(
            sales?.gross_margin_percent,
          ),
      },

      suggested_focus:
        "Review completed-sales economics and cost drivers. This is gross profit, not net profit.",
    });
  }

  /*
   * ------------------------------------------------------------
   * Inventory integrity.
   * ------------------------------------------------------------
   */

  const negativeStock =
    productAvailable
      ? evidenceList(
          performance
            ?.negative_stock_products,
        )
      : [];

  if (negativeStock.length > 0) {
    priorities.push({
      code:
        "negative_stock",

      urgency:
        "critical",

      domain:
        "inventory_integrity",

      evidence_count:
        negativeStock.length,

      products:
        negativeStock,

      evidence:
        null,

      suggested_focus:
        "Review inventory records and synchronization because current base-product stock is negative.",
    });
  }

  /*
   * ------------------------------------------------------------
   * Sales + availability.
   * ------------------------------------------------------------
   */

  const outOfStockWithSales =
    productAvailable
      ? evidenceList(
          performance
            ?.out_of_stock_with_completed_sales,
        )
      : [];

  if (
    outOfStockWithSales.length >
    0
  ) {
    priorities.push({
      code:
        "out_of_stock_with_completed_sales",

      urgency:
        "high",

      domain:
        "sales_and_inventory",

      evidence_count:
        outOfStockWithSales.length,

      products:
        outOfStockWithSales,

      evidence:
        null,

      suggested_focus:
        "Review current availability for products that have completed-sales history. This is not a future stockout forecast.",
    });
  }

  /*
   * ------------------------------------------------------------
   * Product profitability.
   * ------------------------------------------------------------
   */

  const lossMaking =
    productAvailable
      ? evidenceList(
          performance
            ?.loss_making_products,
        )
      : [];

  if (lossMaking.length > 0) {
    priorities.push({
      code:
        "loss_making_products",

      urgency:
        "high",

      domain:
        "product_profitability",

      evidence_count:
        lossMaking.length,

      products:
        lossMaking,

      evidence:
        null,

      suggested_focus:
        "Review historical completed-sales price and recorded cost snapshots for these products.",
    });
  }

  /*
   * ------------------------------------------------------------
   * Unsold stocked catalog.
   * Deliberately labeled REVIEW rather than slow-moving.
   * ------------------------------------------------------------
   */

  const stockedWithoutSales =
    productAvailable
      ? evidenceList(
          performance
            ?.stocked_without_completed_sales,
        )
      : [];

  if (
    stockedWithoutSales.length >
    0
  ) {
    priorities.push({
      code:
        "stocked_without_completed_sales",

      urgency:
        "review",

      domain:
        "catalog_review",

      evidence_count:
        stockedWithoutSales.length,

      products:
        stockedWithoutSales,

      evidence:
        null,

      suggested_focus:
        "Review these stocked products in context. The data does not prove they are slow-moving because product performance has no bounded date window.",
    });
  }

  /*
   * ------------------------------------------------------------
   * Positive historical contributor.
   *
   * Choose only a product with:
   * - completed sales
   * - positive historical profit
   * - positive current base stock
   *
   * It is an opportunity for review, not a forecast.
   * ------------------------------------------------------------
   */

  const topProfit =
    productAvailable &&
    Array.isArray(
      performance?.top_by_profit,
    )
      ? evidenceList(
          performance
            ?.top_by_profit,
        )
      : [];

  const leadingAvailableProfitableProduct =
    topProfit.find(
      (row) =>
        (
          row.total_units_sold ??
          0
        ) > 0 &&
        (
          row.profit ??
          0
        ) > 0 &&
        (
          row.stock ??
          0
        ) > 0,
    ) ?? null;

  const opportunities =
    leadingAvailableProfitableProduct
      ? [
          {
            code:
              "leading_available_profitable_product",

            domain:
              "historical_product_performance",

            product:
              leadingAvailableProfitableProduct,

            suggested_focus:
              "Review whether current availability, positioning, and pricing support this historically profitable product. Do not treat historical performance as a forecast.",
          },
        ]
      : [];

  return {
    version:
      1,

    available:
      salesAvailable ||
      productAvailable ||
      catalogAvailable,

    source_availability: {
      sales_intelligence:
        salesAvailable,

      product_performance:
        productAvailable,

      catalog_inventory:
        catalogAvailable,
    },

    scopes: {
      sales:
        salesAvailable
          ? {
              period_days:
                finiteNumber(
                  salesRoot
                    ?.period_days,
                ),

              period_basis:
                textValue(
                  salesRoot
                    ?.period_basis,
                ),
            }
          : null,

      product_performance:
        productAvailable
          ? textValue(
              performance
                ?.sales_scope,
            )
          : null,

      product_stock:
        productAvailable
          ? textValue(
              performance
                ?.stock_scope,
            )
          : null,
    },

    snapshot: {
      revenue:
        salesAvailable
          ? finiteNumber(
              sales?.revenue,
            )
          : null,

      gross_profit:
        salesAvailable
          ? grossProfit
          : null,

      gross_margin_percent:
        salesAvailable
          ? finiteNumber(
              sales
                ?.gross_margin_percent,
            )
          : null,

      average_order_value:
        salesAvailable
          ? finiteNumber(
              sales
                ?.average_order_value,
            )
          : null,

      completed_orders:
        salesAvailable
          ? finiteNumber(
              sales
                ?.completed_orders,
            )
          : null,

      catalog_products:
        catalogAvailable
          ? finiteNumber(
              catalog?.products,
            )
          : null,

      base_stock_units:
        catalogAvailable
          ? finiteNumber(
              catalog
                ?.base_stock_units,
            )
          : null,

      variant_stock_units:
        catalogAvailable
          ? finiteNumber(
              catalog
                ?.variant_stock_units,
            )
          : null,

      products_with_completed_sales:
        productAvailable
          ? finiteNumber(
              performance
                ?.products_with_completed_sales,
            )
          : null,
    },

    priorities,

    opportunities,

    limitations: [
      ...LIMITATIONS,
    ],
  };
}
