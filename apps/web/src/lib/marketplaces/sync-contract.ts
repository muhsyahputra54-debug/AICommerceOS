export type MarketplaceSyncEntity =
  | "shops"
  | "products"
  | "orders"
  | "inventory";

export type MarketplaceSyncCursorKind =
  | "page_token"
  | "time_window"
  | "opaque";

export type MarketplaceSyncCursor = Readonly<{
  kind: MarketplaceSyncCursorKind;
  value: string;
}>;

export type MarketplaceJsonPrimitive =
  | string
  | number
  | boolean
  | null;

export type MarketplaceJsonObject =
  Readonly<{
    [key: string]:
      MarketplaceJsonValue;
  }>;

export type MarketplaceJsonValue =
  | MarketplaceJsonPrimitive
  | MarketplaceJsonObject
  | readonly MarketplaceJsonValue[];

export type CanonicalAuthorizedShop =
  Readonly<{
    externalShopId: string;
    shopCode: string | null;
    name: string;
    region: string | null;
    sellerType: string | null;
  }>;

export type CanonicalMarketplaceSku =
  Readonly<{
    externalSkuId: string;
    sellerSku: string | null;
    currency: string | null;
    salePrice: string | null;
    taxExclusivePrice: string | null;
    inventory:
      readonly MarketplaceJsonValue[];
  }>;

export type CanonicalMarketplaceProduct =
  Readonly<{
    externalProductId: string;
    title: string;
    status: string;
    externalCreateTime: number | null;
    externalUpdateTime: number | null;
    skus:
      readonly CanonicalMarketplaceSku[];
  }>;

export type CanonicalMarketplaceOrderPayment =
  Readonly<{
    currency: string | null;
    subTotal: string | null;
    shippingFee: string | null;
    originalShippingFee: string | null;
    sellerDiscount: string | null;
    platformDiscount: string | null;
    totalAmount: string | null;
  }>;

export type CanonicalMarketplaceOrderItem =
  Readonly<{
    externalLineItemId: string;
    externalProductId: string | null;
    productName: string | null;
    externalSkuId: string | null;
    skuName: string | null;
    sellerSku: string | null;
    quantity: number;
    originalPrice: string | null;
    salePrice: string | null;
  }>;

export type CanonicalMarketplaceOrder =
  Readonly<{
    externalOrderId: string;
    status: string;
    externalCreateTime: number | null;
    externalUpdateTime: number | null;
    isSampleOrder: boolean;
    fulfillmentType: string | null;
    deliveryOptionName: string | null;
    payment:
      CanonicalMarketplaceOrderPayment;
    lineItems:
      readonly CanonicalMarketplaceOrderItem[];
  }>;

export type MarketplaceSyncPage<T> =
  Readonly<{
    items: readonly T[];
    nextCursor:
      MarketplaceSyncCursor | null;
    totalCount: number | null;
    requestId: string | null;
  }>;

export type MarketplaceSyncResult =
  Readonly<{
    entity: MarketplaceSyncEntity;
    syncedCount: number;
    totalCount: number | null;
    hasMore: boolean;
    nextCursor:
      MarketplaceSyncCursor | null;
    requestId: string | null;
  }>;

export type MarketplaceSyncErrorCode =
  | "unsupported"
  | "not_configured"
  | "not_connected"
  | "account_inactive"
  | "shop_required"
  | "scope_missing"
  | "invalid_response"
  | "provider_error"
  | "persistence_error";

type MarketplaceSyncPageInput<T> =
  Readonly<{
    items: readonly T[];
    nextCursor?:
      MarketplaceSyncCursor | null;
    totalCount?: number | null;
    requestId?: string | null;
  }>;

const CURSOR_KINDS =
  new Set<MarketplaceSyncCursorKind>([
    "page_token",
    "time_window",
    "opaque",
  ]);

function normalizeOptionalString(
  value: string | null | undefined,
) {
  const normalized =
    value?.trim() ?? "";

  return normalized || null;
}

export function createMarketplaceSyncCursor(
  kind: MarketplaceSyncCursorKind,
  value: string,
): MarketplaceSyncCursor {
  if (!CURSOR_KINDS.has(kind)) {
    throw new Error(
      "Marketplace sync cursor kind is invalid.",
    );
  }

  const normalizedValue =
    value.trim();

  if (!normalizedValue) {
    throw new Error(
      "Marketplace sync cursor value is required.",
    );
  }

  return Object.freeze({
    kind,
    value: normalizedValue,
  });
}

export function createMarketplaceSyncPage<T>(
  input: MarketplaceSyncPageInput<T>,
): MarketplaceSyncPage<T> {
  const totalCount =
    input.totalCount ?? null;

  if (
    totalCount !== null &&
    (
      !Number.isSafeInteger(totalCount) ||
      totalCount < 0
    )
  ) {
    throw new Error(
      "Marketplace sync total count must be a non-negative integer.",
    );
  }

  if (
    totalCount !== null &&
    totalCount < input.items.length
  ) {
    throw new Error(
      "Marketplace sync total count cannot be smaller than page item count.",
    );
  }

  const nextCursor =
    input.nextCursor
      ? createMarketplaceSyncCursor(
          input.nextCursor.kind,
          input.nextCursor.value,
        )
      : null;

  return Object.freeze({
    items:
      Object.freeze([
        ...input.items,
      ]),
    nextCursor,
    totalCount,
    requestId:
      normalizeOptionalString(
        input.requestId,
      ),
  });
}

export function createMarketplaceSyncResult<T>(
  entity: MarketplaceSyncEntity,
  page: MarketplaceSyncPage<T>,
): MarketplaceSyncResult {
  return Object.freeze({
    entity,
    syncedCount:
      page.items.length,
    totalCount:
      page.totalCount,
    hasMore:
      page.nextCursor !== null,
    nextCursor:
      page.nextCursor,
    requestId:
      page.requestId,
  });
}