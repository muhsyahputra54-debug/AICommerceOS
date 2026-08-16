"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
};

function formatCurrency(value: number | string) {
  const parsed = Number(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(parsed) ? parsed : 0);
}


function formatExternalAmount(
  value: number | string | null,
  currency: string | null,
) {
  if (value === null) {
    return "—";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  if (!currency) {
    return String(parsed);
  }

  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(parsed);
  } catch {
    return `${currency} ${parsed}`;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
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
}: MarketplaceIntegrationManagerProps) {
  const router = useRouter();
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
      `${productNames.get(variant.product_id) ?? "Product"} — ${variant.name} (${variant.sku})`,
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
      return productNames.get(item.product_id) ?? "Unknown product";
    }

    if (item.target_type === "variant" && item.variant_id) {
      return variantNames.get(item.variant_id) ?? "Unknown variant";
    }

    return "Unknown target";
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
            "Authorized Shops sync gagal.",
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Authorized Shops sync gagal.",
      );
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
      setErrorMessage(error.message);
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
            "Product catalog sync gagal.",
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Product catalog sync gagal.",
      );
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
            "External order sync gagal.",
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "External order sync gagal.",
      );
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
            "Webhook reconciliation gagal.",
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Webhook reconciliation gagal.",
      );
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
        "Pilih customer internal sebelum membuat order.",
      );
      return;
    }

    if (
      !window.confirm(
        `Buat internal pending order dari external order ${order.external_order_id}?`,
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
      setErrorMessage(error.message);
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
      setErrorMessage("Target listing tidak valid.");
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
          ? "Target atau external listing tersebut sudah dipetakan."
          : error.message,
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
          ? "External listing ID tersebut sudah digunakan."
          : error.message,
      );
      setIsSubmitting(false);
      return;
    }

    if (!data) {
      setErrorMessage("Listing mapping tidak ditemukan.");
      setIsSubmitting(false);
      return;
    }

    setEditingListingId(null);
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleDeleteListing(item: Listing) {
    if (!window.confirm(`Hapus mapping ${listingTargetName(item)}?`)) {
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
      setErrorMessage(error?.message ?? "Listing mapping tidak ditemukan.");
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
      setErrorMessage("Internal order dan External Order ID wajib diisi.");
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
          ? "External order atau internal order tersebut sudah terhubung."
          : error.message,
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
      setErrorMessage("External Order ID wajib diisi.");
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
          ? "External Order ID tersebut sudah digunakan."
          : error?.message ?? "Order link tidak ditemukan.",
      );
      setIsSubmitting(false);
      return;
    }

    setEditingOrderLinkId(null);
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleDeleteOrderLink(item: OrderLink) {
    if (!window.confirm(`Hapus link order ${item.external_order_id}?`)) {
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
      setErrorMessage(error?.message ?? "Order link tidak ditemukan.");
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
                Tokopedia &amp; Shop Connector
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Seller authorization is handled server-side. Marketplace access
                and refresh tokens are encrypted before storage.
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border px-2.5 py-1 font-medium capitalize">
                  {connection?.status ?? "not connected"}
                </span>

                {connection?.access_token_expires_at ? (
                  <span className="rounded-full border px-2.5 py-1 text-muted-foreground">
                    Access token expires{" "}
                    {formatDate(connection.access_token_expires_at)}
                  </span>
                ) : null}

                {connection?.granted_scopes?.length ? (
                  <span className="rounded-full border px-2.5 py-1 text-muted-foreground">
                    {connection.granted_scopes.length} scope(s)
                  </span>
                ) : null}
              </div>
            </div>

            {account.status === "inactive" ? (
              <span className="text-sm text-muted-foreground">
                Activate this marketplace account before connecting.
              </span>
            ) : (
              <Link
                href={`/api/marketplaces/tiktok-shop/authorize?account_id=${encodeURIComponent(account.id)}`}
                className="inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                {connection
                  ? "Reconnect Tokopedia & Shop"
                  : "Connect Tokopedia & Shop"}
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
                Authorized Shops
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Retrieve the shops authorized by this seller connection.
                Shop cipher remains encrypted and server-only.
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
                ? "Syncing..."
                : "Sync authorized shops"}
            </Button>
          </div>

          {connection?.status !== "active" ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Connect the seller account before retrieving authorized shops.
            </p>
          ) : authorizedShops.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No authorized shop has been synchronized yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      Shop
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Region
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Seller type
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Mapping
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
                            ? ` • ${shop.shop_code}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {shop.region ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {shop.seller_type ?? "—"}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {shop.status}
                      </td>
                      <td className="px-4 py-3">
                        {shop.is_selected ? (
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                            Selected
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
                            Use this shop
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Unavailable
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
                External Product Catalog
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Read-only catalog from the selected marketplace shop.
                Internal products, variants, stock, and orders are not changed.
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
                ? "Syncing..."
                : "Sync first 100 products"}
            </Button>
          </div>

          {!selectedAuthorizedShop ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Select an Authorized Shop before syncing products.
            </p>
          ) : catalogProducts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No external product has been synchronized yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      Product
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium">
                      SKUs
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Last seen
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
            M3 intentionally synchronizes one page (up to 100 products).
            Pagination will be enabled after the first real Partner Center
            runtime validation so we can measure API latency and function limits.
          </p>
        </div>
      ) : null}

      {supportsTokopediaShop ? (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                External Orders
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Read-only operational order mirror. Buyer recipient name,
                address, phone, and email are deliberately not persisted.
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
                ? "Syncing..."
                : "Sync recent orders"}
            </Button>
          </div>

          {!selectedAuthorizedShop ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Select an Authorized Shop before syncing orders.
            </p>
          ) : externalOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No external order has been synchronized yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      External Order
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Amount
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Items
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Internal Link
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Bridge
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Updated
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
                            Not linked
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
                                Already linked
                              </span>
                            );
                          }

                          if (!readiness?.ready) {
                            return (
                              <div className="text-xs text-muted-foreground">
                                <div>
                                  Mapping incomplete
                                </div>
                                <div className="mt-1">
                                  {Number(
                                    readiness?.mapped_items ?? 0,
                                  )}
                                  /
                                  {Number(
                                    readiness?.total_items ?? 0,
                                  )}{" "}
                                  mapped
                                  {Number(
                                    readiness?.ambiguous_items ?? 0,
                                  ) > 0
                                    ? ` • ${Number(
                                        readiness?.ambiguous_items ??
                                          0,
                                      )} ambiguous`
                                    : ""}
                                </div>
                              </div>
                            );
                          }

                          if (customers.length === 0) {
                            return (
                              <span className="text-xs text-muted-foreground">
                                Add an internal customer first
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
                                  Select customer
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
                                Create pending order
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
            External orders remain a read-only mirror. M7 can create an
            internal order only after every line item has one deterministic
            Product/Variant mapping and an operator explicitly selects an
            existing customer. Creation delegates to the protected
            create_order RPC, so the new internal order remains pending and
            no inventory is deducted by this bridge.
          </p>
        </div>
      ) : null}

      {supportsTokopediaShop ? (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Webhook Events
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Authenticated, idempotent intake with controlled read-only
                reconciliation. Raw payload and recipient PII are not persisted.
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
                ? "Processing..."
                : "Process webhook queue"}
            </Button>
          </div>

          {webhookEvents.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-medium">
                No webhook event received yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure the staging webhook URL in Partner Center after app
                credentials are available.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">
                      Received
                    </th>
                    <th className="px-6 py-3 font-medium">
                      Type
                    </th>
                    <th className="px-6 py-3 font-medium">
                      Entity
                    </th>
                    <th className="px-6 py-3 font-medium">
                      External Status
                    </th>
                    <th className="px-6 py-3 font-medium">
                      Processing
                    </th>
                    <th className="px-6 py-3 font-medium">
                      Attempts
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
                        {event.notification_type ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        {event.external_entity_id ??
                          event.external_shop_id}
                      </td>
                      <td className="px-6 py-4">
                        {event.external_status ?? "—"}
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
        <h2 className="text-lg font-semibold">Product Listing Mapping</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Map internal Product/Variant ke listing marketplace.
        </p>

        <form onSubmit={handleAddListing} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <select
              name="target"
              required
              defaultValue=""
              className="h-10 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="" disabled>Select Product / Variant</option>
              {products
                .filter((item) => item.status === "active")
                .map((product) => (
                  <option
                    key={`product-${product.id}`}
                    value={`product:${product.id}`}
                  >
                    Product — {productNames.get(product.id)}
                  </option>
                ))}
              {variants
                .filter((item) => item.status === "active")
                .map((variant) => (
                  <option
                    key={`variant-${variant.id}`}
                    value={`variant:${variant.id}`}
                  >
                    Variant — {variantNames.get(variant.id)}
                  </option>
                ))}
            </select>

            <Input
              name="external_listing_id"
              placeholder="External Listing ID"
            />

            <Input
              name="external_sku"
              placeholder="External SKU"
            />

            <label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm">
              <input
                type="checkbox"
                name="sync_enabled"
                defaultChecked
              />
              Sync enabled
            </label>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            Add listing mapping
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">Listings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {listings.length} mapping ditemukan.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-6 py-3">Target</th>
                <th className="px-6 py-3">External ID</th>
                <th className="px-6 py-3">External SKU</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Sync</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-medium">
                    {listingTargetName(item)}
                  </td>
                  <td className="px-6 py-4">
                    {item.external_listing_id ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    {item.external_sku ?? "—"}
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {item.listing_status}
                  </td>
                  <td className="px-6 py-4">
                    {item.sync_enabled ? "Enabled" : "Disabled"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingListingId(item.id)}
                        disabled={isSubmitting}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteListing(item)}
                        disabled={isSubmitting}
                      >
                        Delete
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
          <h2 className="text-lg font-semibold">Edit Listing Mapping</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {listingTargetName(editingListing)}
          </p>

          <form onSubmit={handleEditListing} className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Input
                name="external_listing_id"
                defaultValue={editingListing.external_listing_id ?? ""}
                placeholder="External Listing ID"
              />
              <Input
                name="external_sku"
                defaultValue={editingListing.external_sku ?? ""}
                placeholder="External SKU"
              />
              <select
                name="listing_status"
                defaultValue={editingListing.listing_status}
                className="h-10 rounded-lg border bg-background px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </select>
              <label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm">
                <input
                  type="checkbox"
                  name="sync_enabled"
                  defaultChecked={editingListing.sync_enabled}
                />
                Sync enabled
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                Save listing
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingListingId(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Marketplace Order Link</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hubungkan external order ke order internal. Tidak mengubah stock.
        </p>

        <form onSubmit={handleAddOrderLink} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <select
              name="order_id"
              required
              defaultValue=""
              className="h-10 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="" disabled>Select internal order</option>
              {availableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id.slice(0, 8)} — {order.status} —{" "}
                  {formatCurrency(order.total)}
                </option>
              ))}
            </select>

            <Input
              name="external_order_id"
              placeholder="External Order ID"
              required
            />

            <Input
              name="external_status"
              placeholder="External status (optional)"
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            Link marketplace order
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">Order Links</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {orderLinks.length} external order link ditemukan.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-6 py-3">External Order</th>
                <th className="px-6 py-3">Internal Order</th>
                <th className="px-6 py-3">Internal Status</th>
                <th className="px-6 py-3">External Status</th>
                <th className="px-6 py-3">Actions</th>
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
                      {order?.status ?? "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      {item.external_status ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingOrderLinkId(item.id)}
                          disabled={isSubmitting}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteOrderLink(item)}
                          disabled={isSubmitting}
                        >
                          Delete
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
          <h2 className="text-lg font-semibold">Edit Order Link</h2>

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
                placeholder="External status"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit">Save order link</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingOrderLinkId(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">Sync History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Append-only marketplace synchronization history.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium">Belum ada sync activity</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Direction</th>
                  <th className="px-6 py-3">Entity</th>
                  <th className="px-6 py-3">Operation</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Message</th>
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
                      {log.message ?? "—"}
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
