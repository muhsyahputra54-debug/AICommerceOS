"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

type Account = {
  id: string;
  provider: string;
  name: string;
  external_shop_id: string | null;
  status: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  status: string;
};

type Variant = {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  status: string;
};

type Listing = {
  id: string;
  target_type: string;
  product_id: string | null;
  variant_id: string | null;
  external_listing_id: string | null;
  external_sku: string | null;
  listing_status: string;
  sync_enabled: boolean;
  last_synced_at: string | null;
  created_at: string;
};

type Order = {
  id: string;
  status: string;
  total: number | string;
  created_at: string;
};

type OrderLink = {
  id: string;
  order_id: string;
  external_order_id: string;
  external_status: string | null;
  last_synced_at: string | null;
  created_at: string;
};

type SyncLog = {
  id: string;
  direction: string;
  entity_type: string;
  operation: string;
  status: string;
  entity_id: string | null;
  external_id: string | null;
  message: string | null;
  created_at: string;
};

type MarketplaceConnectionStatus = {
  provider: string;
  status: string;
  connected_at: string | null;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  granted_scopes: string[];
  updated_at: string;
};


type AuthorizedShop = {
  id: string;
  external_shop_id: string;
  shop_code: string | null;
  name: string;
  region: string | null;
  seller_type: string | null;
  status: string;
  is_selected: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};


type CatalogProduct = {
  id: string;
  external_product_id: string;
  title: string;
  external_status: string;
  sku_count: number | string;
  seller_skus: string[];
  last_seen_at: string;
  external_update_time: string | null;
};


type ExternalOrder = {
  id: string;
  external_order_id: string;
  external_status: string;
  payment_currency: string | null;
  payment_subtotal: number | string | null;
  payment_total_amount: number | string | null;
  item_count: number | string;
  external_create_time: string | null;
  external_update_time: string | null;
  last_seen_at: string;
  linked_internal_order_id: string | null;
};


type WebhookEvent = {
  id: string;
  notification_id: string | null;
  notification_type: number | null;
  external_shop_id: string;
  external_entity_id: string | null;
  external_status: string | null;
  external_update_time: string | null;
  processing_status: string;
  attempt_count: number;
  last_attempt_at: string | null;
  processing_message: string | null;
  received_at: string;
};


type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type ExternalOrderBridgeReadiness = {
  external_order_row_id: string;
  external_order_id: string;
  total_items: number | string;
  mapped_items: number | string;
  unmapped_items: number | string;
  ambiguous_items: number | string;
  linked_internal_order_id: string | null;
  ready: boolean;
};


type OrderStatusReconciliation = {
  external_order_row_id: string;
  external_order_id: string;
  external_status: string;
  internal_order_id: string;
  internal_status: string;
  proposed_status: string | null;
  action_required: boolean;
  reason: string;
};

type MarketplaceIntegrationManagerProps = {
  organizationId: string;
  account: Account;
  products: Product[];
  variants: Variant[];
  listings: Listing[];
  orders: Order[];
  orderLinks: OrderLink[];
  logs: SyncLog[];
  connection: MarketplaceConnectionStatus | null;
  authorizedShops: AuthorizedShop[];
  catalogProducts: CatalogProduct[];
  externalOrders: ExternalOrder[];
  webhookEvents: WebhookEvent[];
  customers: Customer[];
  bridgeReadiness: ExternalOrderBridgeReadiness[];
  statusReconciliation: OrderStatusReconciliation[];
};

function formatCurrencyValue(
  value: number | string,
  locale: string,
) {
  const parsed = Number(value);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(parsed) ? parsed : 0);
}


function formatExternalAmountValue(
  value: number | string | null,
  currency: string | null,
  locale: string,
) {
  if (value === null) {
    return "â€”";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "â€”";
  }

  if (!currency) {
    return String(parsed);
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(parsed);
  } catch {
    return `${currency} ${parsed}`;
  }
}

function formatDateValue(
  value: string,
  locale: string,
) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function supportsTokopediaShopConnector(provider: string) {
  const normalized = provider
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return (
    normalized.includes("tokopedia") ||
    normalized.includes("tiktok shop")
  );
}

export default function MarketplaceIntegrationManager({
  organizationId,
  account,
  products,
  variants,
  listings,
  orders,
  orderLinks,
  logs,
  connection,
  authorizedShops,
  catalogProducts,
  externalOrders,
  webhookEvents,
  customers,
  bridgeReadiness,
  statusReconciliation,
}: MarketplaceIntegrationManagerProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = getDictionary(locale).marketplaces.detail.manager;
  const localeTag = locale === "id" ? "id-ID" : "en-US";

  const formatCurrency = (
    value: number | string,
  ) => formatCurrencyValue(value, localeTag);

  const formatExternalAmount = (
    value: number | string | null,
    currency: string | null,
  ) =>
    formatExternalAmountValue(
      value,
      currency,
      localeTag,
    );

  const formatDate = (value: string) =>
    formatDateValue(value, localeTag);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingListingId, setEditingListingId] =
    useState<string | null>(null);
  const [editingOrderLinkId, setEditingOrderLinkId] =
    useState<string | null>(null);

  const [bridgeCustomerByOrderId, setBridgeCustomerByOrderId] =
    useState<Record<string, string>>({});

  const productNames = new Map(
    products.map((product) => [
      product.id,
      product.sku ? `${product.name} (${product.sku})` : product.name,
    ]),
  );

  const variantNames = new Map(
    variants.map((variant) => [
      variant.id,
      `${productNames.get(variant.product_id) ?? copy.common.product} â€” ${variant.name} (${variant.sku})`,
    ]),
  );

  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const linkedOrderIds = new Set(orderLinks.map((item) => item.order_id));

  const bridgeReadinessByOrderId = new Map(
    bridgeReadiness.map((item) => [
      item.external_order_row_id,
      item,
    ]),
  );

  const availableOrders = orders.filter(
    (order) => !linkedOrderIds.has(order.id),
  );

  const editingListing =
    listings.find((item) => item.id === editingListingId) ?? null;

  const editingOrderLink =
    orderLinks.find((item) => item.id === editingOrderLinkId) ?? null;

  const supportsTokopediaShop =
    supportsTokopediaShopConnector(account.provider);

  function listingTargetName(item: Listing) {
    if (item.target_type === "product" && item.product_id) {
      return productNames.get(item.product_id) ?? copy.common.unknownProduct;
    }

    if (item.target_type === "variant" && item.variant_id) {
      return variantNames.get(item.variant_id) ?? copy.common.unknownVariant;
    }

    return copy.common.unknownTarget;
  }

  async function handleSyncAuthorizedShops() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/marketplaces/tiktok-shop/shops/sync",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            account_id: account.id,
          }),
        },
      );

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copy.errors.syncAuthorizedShops,
        );
      }

      router.refresh();
    } catch {
      setErrorMessage(copy.errors.generic);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelectAuthorizedShop(
    shop: AuthorizedShop,
  ) {
    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "select_marketplace_authorized_shop",
      {
        p_marketplace_account_id: account.id,
        p_authorized_shop_id: shop.id,
      },
    );

    if (error) {
      setErrorMessage(copy.errors.generic);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  const selectedAuthorizedShop =
    authorizedShops.find((shop) => shop.is_selected) ??
    null;

  async function handleSyncProductCatalog() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/marketplaces/tiktok-shop/products/sync",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            account_id: account.id,
          }),
        },
      );

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copy.errors.syncProductCatalog,
        );
      }

      router.refresh();
    } catch {
      setErrorMessage(copy.errors.generic);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSyncExternalOrders() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/marketplaces/tiktok-shop/orders/sync",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            account_id: account.id,
          }),
        },
      );

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copy.errors.syncExternalOrders,
        );
      }

      router.refresh();
    } catch {
      setErrorMessage(copy.errors.generic);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProcessWebhookQueue() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/marketplaces/tiktok-shop/webhook/process",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            account_id: account.id,
          }),
        },
      );

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copy.errors.processWebhook,
        );
      }

      router.refresh();
    } catch {
      setErrorMessage(copy.errors.generic);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBridgeExternalOrder(
    order: ExternalOrder,
  ) {
    const customerId =
      bridgeCustomerByOrderId[order.id] ?? "";

    if (!customerId) {
      setErrorMessage(
        copy.errors.customerRequired,
      );
      return;
    }

    if (
      !window.confirm(
        `${copy.confirm.createPendingOrder} ${order.external_order_id}?`,
      )
    ) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "bridge_marketplace_external_order",
      {
        p_external_order_row_id: order.id,
        p_customer_id: customerId,
      },
    );

    if (error) {
      setErrorMessage(copy.errors.generic);
      setIsSubmitting(false);
      return;
    }

    setBridgeCustomerByOrderId((current) => {
      const next = { ...current };
      delete next[order.id];
      return next;
    });

    setIsSubmitting(false);
    router.refresh();
  }

  async function handleApplyStatusReconciliation(
    item: OrderStatusReconciliation,
  ) {
    if (!item.proposed_status || !item.action_required) {
      return;
    }

    if (
      !window.confirm(
        `${copy.confirm.approveOrder} ${item.internal_order_id.slice(
          0,
          8,
        )} ${copy.confirm.status} ${item.internal_status} â†’ ${item.proposed_status} ${copy.confirm.basedOnMarketplaceStatus} ${item.external_status}?`,
      )
    ) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "apply_marketplace_order_status_reconciliation",
      {
        p_external_order_row_id:
          item.external_order_row_id,
        p_expected_external_status:
          item.external_status,
        p_expected_target_status:
          item.proposed_status,
      },
    );

    if (error) {
      setErrorMessage(copy.errors.generic);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  async function handleAddListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const target = String(formData.get("target") ?? "");
    const [targetType, targetId] = target.split(":");

    if (
      !targetId ||
      (targetType !== "product" && targetType !== "variant")
    ) {
      setErrorMessage(copy.errors.invalidListingTarget);
      setIsSubmitting(false);
      return;
    }

    const externalListingId = String(
      formData.get("external_listing_id") ?? "",
    ).trim();
    const externalSku = String(
      formData.get("external_sku") ?? "",
    ).trim();

    const supabase = createClient();

    const { error } = await supabase
      .from("marketplace_listings")
      .insert({
        organization_id: organizationId,
        marketplace_account_id: account.id,
        target_type: targetType,
        product_id: targetType === "product" ? targetId : null,
        variant_id: targetType === "variant" ? targetId : null,
        external_listing_id: externalListingId || null,
        external_sku: externalSku || null,
        listing_status: "active",
        sync_enabled: formData.get("sync_enabled") === "on",
      });

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? copy.errors.listingAlreadyMapped
          : copy.errors.generic,
      );
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleEditListing(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingListing) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const externalListingId = String(
      formData.get("external_listing_id") ?? "",
    ).trim();
    const externalSku = String(
      formData.get("external_sku") ?? "",
    ).trim();

    const supabase = createClient();

    const { data, error } = await supabase
      .from("marketplace_listings")
      .update({
        external_listing_id: externalListingId || null,
        external_sku: externalSku || null,
        listing_status: String(
          formData.get("listing_status") ?? "active",
        ),
        sync_enabled: formData.get("sync_enabled") === "on",
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingListing.id)
      .eq("organization_id", organizationId)
      .eq("marketplace_account_id", account.id)
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? copy.errors.externalListingIdUsed
          : copy.errors.generic,
      );
      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage(copy.errors.listingNotFound);
      setIsSubmitting(false);
      return;
    }

    setEditingListingId(null);
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleDeleteListing(item: Listing) {
    if (
      !window.confirm(
        `${copy.confirm.deleteMapping} ${listingTargetName(item)}?`,
      )
    ) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("marketplace_listings")
      .delete()
      .eq("id", item.id)
      .eq("organization_id", organizationId)
      .eq("marketplace_account_id", account.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      setErrorMessage(copy.errors.listingNotFound);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  async function handleAddOrderLink(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const orderId = String(formData.get("order_id") ?? "");
    const externalOrderId = String(
      formData.get("external_order_id") ?? "",
    ).trim();
    const externalStatus = String(
      formData.get("external_status") ?? "",
    ).trim();

    if (!orderId || !externalOrderId) {
      setErrorMessage(copy.errors.orderFieldsRequired);
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("marketplace_order_links")
      .insert({
        organization_id: organizationId,
        marketplace_account_id: account.id,
        order_id: orderId,
        external_order_id: externalOrderId,
        external_status: externalStatus || null,
      });

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? copy.errors.orderAlreadyLinked
          : copy.errors.generic,
      );
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleEditOrderLink(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingOrderLink) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const externalOrderId = String(
      formData.get("external_order_id") ?? "",
    ).trim();
    const externalStatus = String(
      formData.get("external_status") ?? "",
    ).trim();

    if (!externalOrderId) {
      setErrorMessage(copy.errors.externalOrderIdRequired);
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("marketplace_order_links")
      .update({
        external_order_id: externalOrderId,
        external_status: externalStatus || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingOrderLink.id)
      .eq("organization_id", organizationId)
      .eq("marketplace_account_id", account.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      setErrorMessage(
        error?.code === "23505"
          ? copy.errors.externalOrderIdUsed
          : copy.errors.orderLinkNotFound,
      );
      setIsSubmitting(false);
      return;
    }

    setEditingOrderLinkId(null);
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleDeleteOrderLink(item: OrderLink) {
    if (
      !window.confirm(
        `${copy.confirm.deleteOrderLink} ${item.external_order_id}?`,
      )
    ) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("marketplace_order_links")
      .delete()
      .eq("id", item.id)
      .eq("organization_id", organizationId)
      .eq("marketplace_account_id", account.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      setErrorMessage(copy.errors.orderLinkNotFound);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {supportsTokopediaShop ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {copy.connector.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.connector.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border px-2.5 py-1 font-medium capitalize">
                  {connection?.status ?? copy.connector.notConnected}
                </span>

                {connection?.access_token_expires_at ? (
                  <span className="rounded-full border px-2.5 py-1 text-muted-foreground">
                    {copy.connector.accessTokenExpires}{" "}
                    {formatDate(connection.access_token_expires_at)}
                  </span>
                ) : null}

                {connection?.granted_scopes?.length ? (
                  <span className="rounded-full border px-2.5 py-1 text-muted-foreground">
                    {connection.granted_scopes.length} {copy.connector.scopes}
                  </span>
                ) : null}
              </div>
            </div>

            {account.status === "inactive" ? (
              <span className="text-sm text-muted-foreground">
                {copy.connector.activateFirst}
              </span>
            ) : (
              <Link
                href={`/api/marketplaces/tiktok-shop/authorize?account_id=${encodeURIComponent(account.id)}`}
                className="inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                {connection
                  ? copy.connector.reconnect
                  : copy.connector.connect}
              </Link>
            )}
          </div>
        </div>
      ) : null}

      {supportsTokopediaShop ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {copy.authorizedShops.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.authorizedShops.description}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={
                isSubmitting ||
                connection?.status !== "active"
              }
              onClick={handleSyncAuthorizedShops}
            >
              {isSubmitting
                ? copy.common.syncing
                : copy.authorizedShops.syncAction}
            </Button>
          </div>

          {connection?.status !== "active" ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {copy.authorizedShops.connectFirst}
            </p>
          ) : authorizedShops.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {copy.authorizedShops.empty}
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {copy.authorizedShops.shop}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {copy.authorizedShops.region}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {copy.authorizedShops.sellerType}
                    </th>
                    <th className="px-4 py-3 font-medium">{copy.common.status}</th>
                    <th className="px-4 py-3 font-medium">
                      {copy.authorizedShops.mapping}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {authorizedShops.map((shop) => (
                    <tr key={shop.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {shop.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {shop.external_shop_id}
                          {shop.shop_code
                            ? ` â€¢ ${shop.shop_code}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {shop.region ?? "â€”"}
                      </td>
                      <td className="px-4 py-3">
                        {shop.seller_type ?? "â€”"}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {shop.status}
                      </td>
                      <td className="px-4 py-3">
                        {shop.is_selected ? (
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                            {copy.authorizedShops.selected}
                          </span>
                        ) : shop.status === "active" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleSelectAuthorizedShop(
                                shop,
                              )
                            }
                          >
                            {copy.authorizedShops.useShop}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {copy.authorizedShops.unavailable}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {supportsTokopediaShop ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {copy.catalog.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.catalog.description}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={
                isSubmitting ||
                connection?.status !== "active" ||
                !selectedAuthorizedShop
              }
              onClick={handleSyncProductCatalog}
            >
              {isSubmitting
                ? copy.common.syncing
                : copy.catalog.syncAction}
            </Button>
          </div>

          {!selectedAuthorizedShop ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {copy.catalog.selectShopFirst}
            </p>
          ) : catalogProducts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {copy.catalog.empty}
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {copy.catalog.product}
                    </th>
                    <th className="px-4 py-3 font-medium">{copy.common.status}</th>
                    <th className="px-4 py-3 font-medium">
                      {copy.catalog.skus}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {copy.catalog.lastSeen}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {catalogProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {product.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.external_product_id}
                        </div>
                        {product.seller_skus.length ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {product.seller_skus
                              .slice(0, 3)
                              .join(", ")}
                            {product.seller_skus.length > 3
                              ? ` +${product.seller_skus.length - 3}`
                              : ""}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {product.external_status}
                      </td>
                      <td className="px-4 py-3">
                        {Number(product.sku_count)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(product.last_seen_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            {copy.catalog.note}
          </p>
        </div>
      ) : null}

      {supportsTokopediaShop ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {copy.externalOrders.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.externalOrders.description}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={
                isSubmitting ||
                connection?.status !== "active" ||
                !selectedAuthorizedShop
              }
              onClick={handleSyncExternalOrders}
            >
              {isSubmitting
                ? copy.common.syncing
                : copy.externalOrders.syncAction}
            </Button>
          </div>

          {!selectedAuthorizedShop ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {copy.externalOrders.selectShopFirst}
            </p>
          ) : externalOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {copy.externalOrders.empty}
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {copy.externalOrders.externalOrder}
                    </th>
                    <th className="px-4 py-3 font-medium">{copy.common.status}</th>
                    <th className="px-4 py-3 font-medium">
                      {copy.externalOrders.amount}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {copy.externalOrders.items}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {copy.externalOrders.internalLink}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {copy.externalOrders.bridge}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {copy.externalOrders.updated}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {externalOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3 font-medium">
                        {order.external_order_id}
                      </td>
                      <td className="px-4 py-3">
                        {order.external_status}
                      </td>
                      <td className="px-4 py-3">
                        {formatExternalAmount(
                          order.payment_total_amount ??
                            order.payment_subtotal,
                          order.payment_currency,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {Number(order.item_count)}
                      </td>
                      <td className="px-4 py-3">
                        {order.linked_internal_order_id ? (
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                            {order.linked_internal_order_id.slice(
                              0,
                              8,
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {copy.externalOrders.notLinked}
                          </span>
                        )}
                      </td>
                      <td className="min-w-64 px-4 py-3">
                        {(() => {
                          const readiness =
                            bridgeReadinessByOrderId.get(
                              order.id,
                            );

                          if (
                            order.linked_internal_order_id ||
                            readiness?.linked_internal_order_id
                          ) {
                            return (
                              <span className="text-xs text-muted-foreground">
                                {copy.externalOrders.alreadyLinked}
                              </span>
                            );
                          }

                          if (!readiness?.ready) {
                            return (
                              <div className="text-xs text-muted-foreground">
                                <div>
                                  {copy.externalOrders.mappingIncomplete}
                                </div>
                                <div className="mt-1">
                                  {Number(
                                    readiness?.mapped_items ?? 0,
                                  )}
                                  /
                                  {Number(
                                    readiness?.total_items ?? 0,
                                  )}{" "}
                                  {copy.externalOrders.mapped}
                                  {Number(
                                    readiness?.ambiguous_items ?? 0,
                                  ) > 0
                                    ? ` â€¢ ${Number(
                                        readiness?.ambiguous_items ??
                                          0,
                                      )} ${copy.externalOrders.ambiguous}`
                                    : ""}
                                </div>
                              </div>
                            );
                          }

                          if (customers.length === 0) {
                            return (
                              <span className="text-xs text-muted-foreground">
                                {copy.externalOrders.addCustomerFirst}
                              </span>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              <select
                                value={
                                  bridgeCustomerByOrderId[
                                    order.id
                                  ] ?? ""
                                }
                                onChange={(event) =>
                                  setBridgeCustomerByOrderId(
                                    (current) => ({
                                      ...current,
                                      [order.id]:
                                        event.target.value,
                                    }),
                                  )
                                }
                                disabled={isSubmitting}
                                className="h-9 w-full rounded-lg border bg-background px-2 text-xs"
                              >
                                <option value="">
                                  {copy.externalOrders.selectCustomer}
                                </option>
                                {customers.map(
                                  (customer) => (
                                    <option
                                      key={customer.id}
                                      value={customer.id}
                                    >
                                      {customer.name}
                                    </option>
                                  ),
                                )}
                              </select>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={
                                  isSubmitting ||
                                  !bridgeCustomerByOrderId[
                                    order.id
                                  ]
                                }
                                onClick={() =>
                                  handleBridgeExternalOrder(
                                    order,
                                  )
                                }
                              >
                                {copy.externalOrders.createPendingOrder}
                              </Button>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatDate(
                          order.external_update_time ??
                            order.last_seen_at,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            {copy.externalOrders.note}
          </p>
        </div>
      ) : null}

      {supportsTokopediaShop ? (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              {copy.reconciliation.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.reconciliation.description}
            </p>
          </div>

          {statusReconciliation.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-medium">
                {copy.reconciliation.emptyTitle}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.reconciliation.emptyDescription}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">
                      {copy.reconciliation.externalOrder}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {copy.reconciliation.marketplace}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {copy.reconciliation.internal}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {copy.reconciliation.proposal}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {copy.reconciliation.reason}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {copy.reconciliation.action}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {statusReconciliation.map((item) => (
                    <tr key={item.external_order_row_id}>
                      <td className="px-6 py-4 font-medium">
                        {item.external_order_id}
                      </td>
                      <td className="px-6 py-4">
                        {item.external_status}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium capitalize">
                          {item.internal_status}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {item.internal_order_id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize">
                        {item.proposed_status ?? copy.reconciliation.noAction}
                      </td>
                      <td className="max-w-md px-6 py-4 text-muted-foreground">
                        {item.reason}
                      </td>
                      <td className="px-6 py-4">
                        {item.action_required &&
                        item.proposed_status ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleApplyStatusReconciliation(
                                item,
                              )
                            }
                          >
                            {copy.reconciliation.approve} â†’ {item.proposed_status}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {copy.reconciliation.noApproval}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t px-6 py-4 text-xs text-muted-foreground">
            {copy.reconciliation.note}
          </div>
        </div>
      ) : null}

      {supportsTokopediaShop ? (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {copy.webhooks.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.webhooks.description}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={
                isSubmitting ||
                connection?.status !== "active" ||
                !selectedAuthorizedShop
              }
              onClick={handleProcessWebhookQueue}
            >
              {isSubmitting
                ? copy.common.processing
                : copy.webhooks.processAction}
            </Button>
          </div>

          {webhookEvents.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-medium">
                {copy.webhooks.emptyTitle}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.webhooks.emptyDescription}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">
                      {copy.webhooks.received}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {copy.webhooks.type}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {copy.webhooks.entity}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {copy.webhooks.externalStatus}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {copy.webhooks.processing}
                    </th>
                    <th className="px-6 py-3 font-medium">
                      {copy.webhooks.attempts}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {webhookEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        {formatDate(event.received_at)}
                      </td>
                      <td className="px-6 py-4">
                        {event.notification_type ?? "â€”"}
                      </td>
                      <td className="px-6 py-4">
                        {event.external_entity_id ??
                          event.external_shop_id}
                      </td>
                      <td className="px-6 py-4">
                        {event.external_status ?? "â€”"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="capitalize">
                          {event.processing_status}
                        </div>
                        {event.processing_message ? (
                          <div className="mt-1 max-w-sm text-xs text-muted-foreground">
                            {event.processing_message}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        {event.attempt_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{copy.listingMapping.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.listingMapping.description}
        </p>

        <form onSubmit={handleAddListing} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <select
              name="target"
              required
              defaultValue=""
              className="h-10 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="" disabled>{copy.listingMapping.selectTarget}</option>
              {products
                .filter((item) => item.status === "active")
                .map((product) => (
                  <option
                    key={`product-${product.id}`}
                    value={`product:${product.id}`}
                  >
                    {copy.common.product} â€” {productNames.get(product.id)}
                  </option>
                ))}
              {variants
                .filter((item) => item.status === "active")
                .map((variant) => (
                  <option
                    key={`variant-${variant.id}`}
                    value={`variant:${variant.id}`}
                  >
                    {copy.common.variant} â€” {variantNames.get(variant.id)}
                  </option>
                ))}
            </select>

            <Input
              name="external_listing_id"
              placeholder={copy.listingMapping.externalListingId}
            />

            <Input
              name="external_sku"
              placeholder={copy.listingMapping.externalSku}
            />

            <label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm">
              <input
                type="checkbox"
                name="sync_enabled"
                defaultChecked
              />
              {copy.listingMapping.syncEnabled}
            </label>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {copy.listingMapping.add}
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">{copy.listings.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {listings.length} {copy.listings.countSuffix}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-6 py-3">{copy.listings.target}</th>
                <th className="px-6 py-3">{copy.listings.externalId}</th>
                <th className="px-6 py-3">{copy.listings.externalSku}</th>
                <th className="px-6 py-3">{copy.common.status}</th>
                <th className="px-6 py-3">{copy.listings.sync}</th>
                <th className="px-6 py-3">{copy.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-medium">
                    {listingTargetName(item)}
                  </td>
                  <td className="px-6 py-4">
                    {item.external_listing_id ?? "â€”"}
                  </td>
                  <td className="px-6 py-4">
                    {item.external_sku ?? "â€”"}
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {item.listing_status}
                  </td>
                  <td className="px-6 py-4">
                    {item.sync_enabled ? copy.common.enabled : copy.common.disabled}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingListingId(item.id)}
                        disabled={isSubmitting}
                      >
                        {copy.common.edit}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteListing(item)}
                        disabled={isSubmitting}
                      >
                        {copy.common.delete}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingListing ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{copy.listings.editTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {listingTargetName(editingListing)}
          </p>

          <form onSubmit={handleEditListing} className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Input
                name="external_listing_id"
                defaultValue={editingListing.external_listing_id ?? ""}
                placeholder={copy.listingMapping.externalListingId}
              />
              <Input
                name="external_sku"
                defaultValue={editingListing.external_sku ?? ""}
                placeholder={copy.listingMapping.externalSku}
              />
              <select
                name="listing_status"
                defaultValue={editingListing.listing_status}
                className="h-10 rounded-lg border bg-background px-3 text-sm"
              >
                <option value="active">{copy.common.active}</option>
                <option value="inactive">{copy.common.inactive}</option>
                <option value="error">{copy.common.error}</option>
              </select>
              <label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm">
                <input
                  type="checkbox"
                  name="sync_enabled"
                  defaultChecked={editingListing.sync_enabled}
                />
                {copy.listingMapping.syncEnabled}
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {copy.listings.save}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingListingId(null)}
              >
                {copy.common.cancel}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{copy.orderLink.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.orderLink.description}
        </p>

        <form onSubmit={handleAddOrderLink} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <select
              name="order_id"
              required
              defaultValue=""
              className="h-10 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="" disabled>{copy.orderLink.selectInternalOrder}</option>
              {availableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id.slice(0, 8)} â€” {order.status} â€”{" "}
                  {formatCurrency(order.total)}
                </option>
              ))}
            </select>

            <Input
              name="external_order_id"
              placeholder={copy.orderLink.externalOrderId}
              required
            />

            <Input
              name="external_status"
              placeholder={copy.orderLink.externalStatusOptional}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {copy.orderLink.link}
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">{copy.orderLinks.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {orderLinks.length} {copy.orderLinks.countSuffix}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-6 py-3">{copy.orderLinks.externalOrder}</th>
                <th className="px-6 py-3">{copy.orderLinks.internalOrder}</th>
                <th className="px-6 py-3">{copy.orderLinks.internalStatus}</th>
                <th className="px-6 py-3">{copy.orderLinks.externalStatus}</th>
                <th className="px-6 py-3">{copy.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orderLinks.map((item) => {
                const order = orderMap.get(item.order_id);

                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-medium">
                      {item.external_order_id}
                    </td>
                    <td className="px-6 py-4">
                      {item.order_id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {order?.status ?? copy.common.unknown}
                    </td>
                    <td className="px-6 py-4">
                      {item.external_status ?? "â€”"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingOrderLinkId(item.id)}
                          disabled={isSubmitting}
                        >
                          {copy.common.edit}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteOrderLink(item)}
                          disabled={isSubmitting}
                        >
                          {copy.common.delete}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingOrderLink ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{copy.orderLinks.editTitle}</h2>

          <form onSubmit={handleEditOrderLink} className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                name="external_order_id"
                defaultValue={editingOrderLink.external_order_id}
                required
              />
              <Input
                name="external_status"
                defaultValue={editingOrderLink.external_status ?? ""}
                placeholder={copy.orderLink.externalStatus}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit">{copy.orderLinks.save}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingOrderLinkId(null)}
              >
                {copy.common.cancel}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">{copy.syncHistory.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.syncHistory.description}
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium">{copy.syncHistory.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3">{copy.syncHistory.time}</th>
                  <th className="px-6 py-3">{copy.syncHistory.direction}</th>
                  <th className="px-6 py-3">{copy.syncHistory.entity}</th>
                  <th className="px-6 py-3">{copy.syncHistory.operation}</th>
                  <th className="px-6 py-3">{copy.common.status}</th>
                  <th className="px-6 py-3">{copy.syncHistory.message}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {log.direction}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {log.entity_type}
                    </td>
                    <td className="px-6 py-4">{log.operation}</td>
                    <td className="px-6 py-4 capitalize">{log.status}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.message ?? "â€”"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
