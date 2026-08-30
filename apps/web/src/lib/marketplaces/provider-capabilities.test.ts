import { describe, expect, it } from "vitest";
import {
  SHOPEE_CAPABILITIES,
  TIKTOK_SHOP_CAPABILITIES,
} from "./provider-capabilities";

describe("marketplace provider capabilities", () => {
  it("matches current TikTok Shop read-side capabilities", () => {
    expect(TIKTOK_SHOP_CAPABILITIES).toEqual({
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
  });

  it("matches current Shopee connection and shop-sync capabilities", () => {
    expect(SHOPEE_CAPABILITIES).toEqual({
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
  });

  it("keeps commerce writes fail-closed", () => {
    for (const capabilities of [
      TIKTOK_SHOP_CAPABILITIES,
      SHOPEE_CAPABILITIES,
    ]) {
      expect(capabilities["products.write"]).toBe(false);
      expect(capabilities["orders.write"]).toBe(false);
      expect(capabilities["inventory.write"]).toBe(false);
    }
  });
});
