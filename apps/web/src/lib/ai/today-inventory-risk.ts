export const TODAY_INVENTORY_RISK_ITEM_LIMIT =
  5 as const;

export const TODAY_INVENTORY_RISK_SEMANTICS =
  "current_threshold_alert_sample" as const;

export type TodayInventoryRiskTargetType =
  | "product"
  | "variant";

export type TodayInventoryRiskStatus =
  | "out_of_stock"
  | "low_stock";

export type TodayInventoryRiskItem = {
  targetType:
    TodayInventoryRiskTargetType;

  targetId:
    string;

  productId:
    string;

  name:
    string;

  sku:
    string | null;

  stock:
    number;

  lowStockThreshold:
    number;

  status:
    TodayInventoryRiskStatus;
};

export type TodayInventoryRiskSummary = {
  source:
    "get_inventory_alerts";

  semantics:
    typeof TODAY_INVENTORY_RISK_SEMANTICS;

  status:
    "available" | "unavailable";

  returnedAlertCount:
    number | null;

  normalizedAlertCount:
    number | null;

  items:
    TodayInventoryRiskItem[];

  reason:
    string | null;
};

type UnknownRecord =
  Record<string, unknown>;

function asRecord(
  value:
    unknown,
): UnknownRecord | null {
  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(
      value,
    )
  ) {
    return null;
  }

  return value as
    UnknownRecord;
}

function finiteNumber(
  value:
    unknown,
): number | null {
  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value,
    )
      ? value
      : null;
  }

  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    normalized.length === 0
  ) {
    return null;
  }

  const parsed =
    Number(
      normalized,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}

function requiredString(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function nullableSku(
  value:
    unknown,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeInventoryRiskItem(
  value:
    unknown,
): TodayInventoryRiskItem | null {
  const row =
    asRecord(
      value,
    );

  if (!row) {
    return null;
  }

  const targetType =
    row.target_type ===
      "product" ||
    row.target_type ===
      "variant"
      ? row.target_type
      : null;

  const status =
    row.stock_status ===
      "out_of_stock" ||
    row.stock_status ===
      "low_stock"
      ? row.stock_status
      : null;

  const targetId =
    requiredString(
      row.target_id,
    );

  const productId =
    requiredString(
      row.product_id,
    );

  const name =
    requiredString(
      row.name,
    );

  const stock =
    finiteNumber(
      row.stock,
    );

  const lowStockThreshold =
    finiteNumber(
      row.low_stock_threshold,
    );

  if (
    targetType === null ||
    status === null ||
    targetId === null ||
    productId === null ||
    name === null ||
    stock === null ||
    lowStockThreshold === null
  ) {
    return null;
  }

  return {
    targetType,

    targetId,

    productId,

    name,

    sku:
      nullableSku(
        row.sku,
      ),

    stock,

    lowStockThreshold,

    status,
  };
}

const STATUS_WEIGHT:
  Record<
    TodayInventoryRiskStatus,
    number
  > = {
    out_of_stock:
      0,

    low_stock:
      1,
  };

function compareText(
  left:
    string,
  right:
    string,
): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

export function compareTodayInventoryRiskItems(
  left:
    TodayInventoryRiskItem,
  right:
    TodayInventoryRiskItem,
): number {
  const statusDifference =
    STATUS_WEIGHT[
      left.status
    ] -
    STATUS_WEIGHT[
      right.status
    ];

  if (
    statusDifference !== 0
  ) {
    return statusDifference;
  }

  const targetTypeDifference =
    compareText(
      left.targetType,
      right.targetType,
    );

  if (
    targetTypeDifference !== 0
  ) {
    return targetTypeDifference;
  }

  const nameDifference =
    compareText(
      left.name,
      right.name,
    );

  if (
    nameDifference !== 0
  ) {
    return nameDifference;
  }

  return compareText(
    left.targetId,
    right.targetId,
  );
}

export function buildTodayInventoryRiskSummary(
  alerts:
    readonly unknown[] | null,
): TodayInventoryRiskSummary {
  if (alerts === null) {
    return {
      source:
        "get_inventory_alerts",

      semantics:
        TODAY_INVENTORY_RISK_SEMANTICS,

      status:
        "unavailable",

      returnedAlertCount:
        null,

      normalizedAlertCount:
        null,

      items:
        [],

      reason:
        "Inventory alerts unavailable.",
    };
  }

  const normalized =
    alerts
      .map(
        normalizeInventoryRiskItem,
      )
      .filter(
        (
          item,
        ): item is TodayInventoryRiskItem =>
          item !== null,
      );

  const items =
    [...normalized]
      .sort(
        compareTodayInventoryRiskItems,
      )
      .slice(
        0,
        TODAY_INVENTORY_RISK_ITEM_LIMIT,
      );

  return {
    source:
      "get_inventory_alerts",

    semantics:
      TODAY_INVENTORY_RISK_SEMANTICS,

    status:
      "available",

    returnedAlertCount:
      alerts.length,

    normalizedAlertCount:
      normalized.length,

    items,

    reason:
      null,
  };
}