import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getMarketplaceTokenResolver,
  getValidShopeeAccessToken,
  getValidTikTokShopAccessToken,
} from "./token-manager";

describe(
  "marketplace token resolver registry dispatch",
  () => {
    it(
      "resolves TikTok Shop through the established token implementation",
      () => {
        expect(
          getMarketplaceTokenResolver(
            "TikTok Shop",
          ),
        ).toBe(
          getValidTikTokShopAccessToken,
        );

        expect(
          getMarketplaceTokenResolver(
            "tiktok_shop",
          ),
        ).toBe(
          getValidTikTokShopAccessToken,
        );
      },
    );

    it(
      "resolves Shopee through the established token implementation",
      () => {
        expect(
          getMarketplaceTokenResolver(
            "Shopee",
          ),
        ).toBe(
          getValidShopeeAccessToken,
        );
      },
    );

    it(
      "fails closed for an unimplemented provider",
      () => {
        expect(() =>
          getMarketplaceTokenResolver(
            "Lazada",
          ),
        ).toThrow(
          /token strategy unavailable/i,
        );

        expect(() =>
          getMarketplaceTokenResolver(
            "Tokopedia",
          ),
        ).toThrow(
          /token strategy unavailable/i,
        );
      },
    );
  },
);
