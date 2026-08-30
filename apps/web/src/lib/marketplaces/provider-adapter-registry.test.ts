import {
  describe,
  expect,
  it,
} from "vitest";

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
          adapter.getTokenResolver(),
        ).toBe(
          getValidShopeeAccessToken,
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
