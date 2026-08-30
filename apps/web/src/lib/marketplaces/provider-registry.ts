import {
  SHOPEE_CAPABILITIES,
  TIKTOK_SHOP_CAPABILITIES,
} from "./provider-capabilities";
import type {
  MarketplaceCapability,
  MarketplaceProviderDefinition,
  MarketplaceProviderId,
} from "./provider-contract";

const PROVIDERS: Readonly<Record<MarketplaceProviderId, MarketplaceProviderDefinition>> =
  Object.freeze({
    tiktok_shop: Object.freeze({
      provider: "tiktok_shop",
      label: "TikTok Shop",
      capabilities: TIKTOK_SHOP_CAPABILITIES,
      routes: Object.freeze({
        authorize: "/api/marketplaces/tiktok-shop/authorize",
        shopsSync: "/api/marketplaces/tiktok-shop/shops/sync",
        productsSync: "/api/marketplaces/tiktok-shop/products/sync",
        ordersSync: "/api/marketplaces/tiktok-shop/orders/sync",
        webhookProcess: "/api/marketplaces/tiktok-shop/webhook/process",
      }),
    }),
    shopee: Object.freeze({
      provider: "shopee",
      label: "Shopee",
      capabilities: SHOPEE_CAPABILITIES,
      routes: Object.freeze({
        authorize: "/api/marketplaces/shopee/authorize",
        shopsSync: "/api/marketplaces/shopee/shops/sync",
        productsSync: null,
        ordersSync: null,
        webhookProcess: null,
      }),
    }),
  });

function providerLookupKey(provider: string): string {
  return provider.trim().toLowerCase().replace(/[\s-]+/gu, "_");
}

export function normalizeMarketplaceProvider(
  provider: string,
): MarketplaceProviderId | null {
  const normalized = providerLookupKey(provider);

  if (normalized === "tiktok_shop" || normalized === "tiktokshop") {
    return "tiktok_shop";
  }

  if (normalized === "shopee") {
    return "shopee";
  }

  return null;
}

export function getMarketplaceProviderDefinition(
  provider: string,
): MarketplaceProviderDefinition | null {
  const providerId = normalizeMarketplaceProvider(provider);
  return providerId ? PROVIDERS[providerId] : null;
}

export function marketplaceProviderSupports(
  provider: string,
  capability: MarketplaceCapability,
): boolean {
  return getMarketplaceProviderDefinition(provider)?.capabilities[capability] ?? false;
}

export function getRegisteredMarketplaceProviders(): readonly MarketplaceProviderDefinition[] {
  return Object.freeze([PROVIDERS.tiktok_shop, PROVIDERS.shopee]);
}
