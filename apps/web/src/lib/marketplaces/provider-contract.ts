export type MarketplaceProviderId = "tiktok_shop" | "shopee";

export type MarketplaceCapability =
  | "oauth"
  | "shops.read"
  | "products.read"
  | "products.write"
  | "orders.read"
  | "orders.write"
  | "inventory.read"
  | "inventory.write"
  | "webhooks";

export type MarketplaceProviderCapabilities = Readonly<
  Record<MarketplaceCapability, boolean>
>;

export type MarketplaceProviderRoutes = Readonly<{
  authorize: string;
  shopsSync: string;
  productsSync: string | null;
  ordersSync: string | null;
  webhookProcess: string | null;
}>;

export type MarketplaceProviderDefinition = Readonly<{
  provider: MarketplaceProviderId;
  label: string;
  capabilities: MarketplaceProviderCapabilities;
  routes: MarketplaceProviderRoutes;
}>;
