import {
  describe,
  expect,
  it,
} from "vitest";

import {
  assertMarketplaceConnectorAdapter,
  marketplaceConnectorSupportsSyncEntity,
} from "./provider-adapter";
import {
  getMarketplaceConnectorAdapter,
  getRegisteredMarketplaceConnectorAdapters,
  requireMarketplaceConnectorAdapter,
} from "./provider-adapter-registry";
import {
  getValidShopeeAccessToken,
  getValidTikTokShopAccessToken,
} from "./token-manager";

describe(
  "marketplace connector adapter registry",
  () => {
    it(
      "wraps TikTok Shop without changing its existing connector contract",
      () => {
        const adapter =
          requireMarketplaceConnectorAdapter(
            "TikTok Shop",
          );

        expect(adapter.provider).toBe(
          "tiktok_shop",
        );

        expect(
          adapter.definition.capabilities[
            "products.read"
          ],
        ).toBe(true);

        expect(
          adapter.definition.capabilities[
            "orders.read"
          ],
        ).toBe(true);

        expect(
          adapter.definition.capabilities[
            "products.write"
          ],
        ).toBe(false);

        expect(
          adapter.getTokenResolver(),
        ).toBe(
          getValidTikTokShopAccessToken,
        );
      },
    );

    it(
      "binds TikTok Shop read capabilities to canonical sync entities",
      () => {
        const adapter =
          requireMarketplaceConnectorAdapter(
            "TikTok Shop",
          );

        expect(
          adapter.syncReadSupport,
        ).toEqual({
          shops: true,
          products: true,
          orders: true,
          inventory: true,
        });

        expect(
          marketplaceConnectorSupportsSyncEntity(
            adapter,
            "products",
          ),
        ).toBe(true);

        expect(
          marketplaceConnectorSupportsSyncEntity(
            adapter,
            "orders",
          ),
        ).toBe(true);
      },
    );

    it(
      "wraps Shopee through the same adapter contract",
      () => {
        const adapter =
          requireMarketplaceConnectorAdapter(
            "Shopee",
          );

        expect(adapter.provider).toBe(
          "shopee",
        );

        expect(
          adapter.definition.capabilities[
            "shops.read"
          ],
        ).toBe(true);

        expect(
          adapter.definition.capabilities[
            "products.read"
          ],
        ).toBe(false);

        expect(
          adapter.definition.capabilities[
            "orders.read"
          ],
        ).toBe(false);

        expect(
          adapter.syncReadSupport,
        ).toEqual({
          shops: true,
          products: false,
          orders: false,
          inventory: false,
        });

        expect(
          adapter.getTokenResolver(),
        ).toBe(
          getValidShopeeAccessToken,
        );
      },
    );

    it(
      "fails closed when adapter sync bindings diverge from provider capabilities",
      () => {
        const adapter =
          requireMarketplaceConnectorAdapter(
            "TikTok Shop",
          );

        expect(() =>
          assertMarketplaceConnectorAdapter({
            ...adapter,
            syncReadSupport: {
              ...adapter.syncReadSupport,
              products: false,
            },
          }),
        ).toThrow(
          /sync capability mismatch/i,
        );
      },
    );

    it(
      "fails closed for Lazada and Tokopedia before implementation",
      () => {
        expect(
          getMarketplaceConnectorAdapter(
            "Lazada",
          ),
        ).toBeNull();

        expect(
          getMarketplaceConnectorAdapter(
            "Tokopedia",
          ),
        ).toBeNull();

        expect(() =>
          requireMarketplaceConnectorAdapter(
            "Lazada",
          ),
        ).toThrow(
          /adapter unavailable/i,
        );
      },
    );

    it(
      "registers only implemented marketplace adapters",
      () => {
        expect(
          getRegisteredMarketplaceConnectorAdapters().map(
            (adapter) =>
              adapter.provider,
          ),
        ).toEqual([
          "tiktok_shop",
          "shopee",
        ]);
      },
    );
  },
);