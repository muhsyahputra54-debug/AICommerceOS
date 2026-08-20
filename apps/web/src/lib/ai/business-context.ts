export type BusinessContextOrder = {
  status?:
    | string
    | null;

  total?: unknown;

  [key: string]: unknown;
};

export type BuildBusinessContextInput = {
  generatedAt: string;

  products: unknown[];

  productTotalCount:
    | number
    | null
    | undefined;

  nonpositiveStockCount:
    | number
    | null
    | undefined;

  nonpositivePriceCount:
    | number
    | null
    | undefined;

  recentOrders:
    BusinessContextOrder[];

  orderTotalCount:
    | number
    | null
    | undefined;

  customerTotalCount:
    | number
    | null
    | undefined;

  priceTargets: unknown[];

  priceObservations: unknown[];
};

export function buildBusinessContext({
  generatedAt,
  products,
  productTotalCount,
  nonpositiveStockCount,
  nonpositivePriceCount,
  recentOrders,
  orderTotalCount,
  customerTotalCount,
  priceTargets,
  priceObservations,
}: BuildBusinessContextInput) {
  const recentOrdersByStatus =
    recentOrders.reduce<
      Record<string, number>
    >(
      (
        summary,
        order,
      ) => {
        const status =
          order.status?.trim() ||
          "unknown";

        summary[status] =
          (summary[status] ?? 0) + 1;

        return summary;
      },
      {},
    );

  const recentOrderValue =
    recentOrders.reduce(
      (
        sum,
        order,
      ) => {
        const total =
          Number(
            order.total ?? 0,
          );

        return (
          sum +
          (Number.isFinite(total)
            ? total
            : 0)
        );
      },
      0,
    );

  return {
    generated_at:
      generatedAt,

    business_summary: {
      products: {
        total_count:
          productTotalCount ??
          products.length,

        nonpositive_stock_count:
          nonpositiveStockCount ??
          0,

        nonpositive_price_count:
          nonpositivePriceCount ??
          0,
      },

      orders: {
        total_count:
          orderTotalCount ??
          recentOrders.length,

        recent_count:
          recentOrders.length,

        recent_value:
          recentOrderValue,

        recent_by_status:
          recentOrdersByStatus,

        recent_window_limit:
          30,
      },

      customers: {
        total_count:
          customerTotalCount ??
          0,
      },
    },

    products,

    sales: {
      recent_orders:
        recentOrders,

      customer_count:
        customerTotalCount ??
        0,
    },

    price_monitoring: {
      targets:
        priceTargets,

      observations:
        priceObservations,
    },

    limitations: [
      "Only the 30 selected product records are included as product details.",
      "Only the 30 most recent orders are included as order details.",
      "business_summary.orders.recent_value is only the sum of total from those recent order records. It is not official revenue, profit, or completed-sales value.",
      "The recent order value includes all order statuses in the recent window.",
      "nonpositive_stock_count means products where stock is less than or equal to zero.",
      "nonpositive_price_count means products where price is less than or equal to zero.",
      "Order item details are not included.",
      "Customer names, email addresses, and phone numbers are not included.",
      "Competitor prices come only from stored price monitoring observations.",
      "A price observation is a historical snapshot and may not represent the competitor price at this exact moment.",
    ],
  };
}
