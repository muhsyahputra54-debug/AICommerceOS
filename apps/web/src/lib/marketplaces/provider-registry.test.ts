import { describe, expect, it } from "vitest";
import {
  getMarketplaceProviderDefinition,
  getRegisteredMarketplaceProviders,
  marketplaceProviderSupports,
  normalizeMarketplaceProvider,
} from "./provider-registry";

describe("marketplace provider registry", () => {
  it("normalizes only implemented provider identities", () => {
    expect(normalizeMarketplaceProvider("TikTok Shop")).toBe("tiktok_shop");
    expect(normalizeMarketplaceProvider("tiktok-shop")).toBe("tiktok_shop");
    expect(normalizeMarketplaceProvider("tiktokshop")).toBe("tiktok_shop");
    expect(normalizeMarketplaceProvider("SHOPEE")).toBe("shopee");
    expect(normalizeMarketplaceProvider("Shopee Express")).toBeNull();
    expect(normalizeMarketplaceProvider("Tokopedia")).toBeNull();
    expect(normalizeMarketplaceProvider("Lazada")).toBeNull();
  });

  it("centralizes current provider API routes", () => {
    expect(getMarketplaceProviderDefinition("TikTok Shop")?.routes).toEqual({
      authorize: "/api/marketplaces/tiktok-shop/authorize",
      shopsSync: "/api/marketplaces/tiktok-shop/shops/sync",
      productsSync: "/api/marketplaces/tiktok-shop/products/sync",
      ordersSync: "/api/marketplaces/tiktok-shop/orders/sync",
      webhookProcess: "/api/marketplaces/tiktok-shop/webhook/process",
    });

    expect(getMarketplaceProviderDefinition("Shopee")?.routes).toEqual({
      authorize: "/api/marketplaces/shopee/authorize",
      shopsSync: "/api/marketplaces/shopee/shops/sync",
      productsSync: null,
      ordersSync: null,
      webhookProcess: null,
    });
  });

  it("fails closed for unknown providers and unsupported capabilities", () => {
    expect(marketplaceProviderSupports("Lazada", "oauth")).toBe(false);
    expect(marketplaceProviderSupports("Shopee", "products.read")).toBe(false);
    expect(marketplaceProviderSupports("TikTok Shop", "orders.read")).toBe(true);
  });

  it("registers only implemented connectors", () => {
    expect(getRegisteredMarketplaceProviders().map((item) => item.provider)).toEqual([
      "tiktok_shop",
      "shopee",
    ]);
  });
});
