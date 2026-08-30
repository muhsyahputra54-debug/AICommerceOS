import type { MarketplaceProviderCapabilities } from "./provider-contract";

export const TIKTOK_SHOP_CAPABILITIES: MarketplaceProviderCapabilities =
  Object.freeze({
    oauth: true,
    "shops.read": true,
    "products.read": true,
    "products.write": false,
    "orders.read": true,
    "orders.write": false,
    "inventory.read": true,
    "inventory.write": false,
    webhooks: true,
  });

export const SHOPEE_CAPABILITIES: MarketplaceProviderCapabilities =
  Object.freeze({
    oauth: true,
    "shops.read": true,
    "products.read": false,
    "products.write": false,
    "orders.read": false,
    "orders.write": false,
    "inventory.read": false,
    "inventory.write": false,
    webhooks: false,
  });
