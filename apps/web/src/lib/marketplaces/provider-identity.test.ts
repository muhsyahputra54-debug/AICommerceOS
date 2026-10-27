import {
  describe,
  expect,
  it,
} from "vitest";

import {
  marketplaceProviderIs,
  requireMarketplaceProviderIdentity,
  resolveMarketplaceProviderIdentity,
} from "./provider-identity";

describe(
  "marketplace provider identity boundary",
  () => {
    it(
      "resolves implemented aliases to one canonical provider identity",
      () => {
        const tiktok =
          requireMarketplaceProviderIdentity(
            "TikTok Shop",
          );

        expect(tiktok.provider).toBe(
          "tiktok_shop",
        );

        expect(
          tiktok.definition.provider,
        ).toBe("tiktok_shop");

        expect(
          tiktok.definition.label,
        ).toBe("TikTok Shop");

        const shopee =
          requireMarketplaceProviderIdentity(
            "SHOPEE",
          );

        expect(shopee.provider).toBe(
          "shopee",
        );

        expect(
          shopee.definition.provider,
        ).toBe("shopee");
      },
    );

    it(
      "fails closed for unimplemented marketplace identities",
      () => {
        expect(
          resolveMarketplaceProviderIdentity(
            "Tokopedia",
          ),
        ).toBeNull();

        expect(
          resolveMarketplaceProviderIdentity(
            "Lazada",
          ),
        ).toBeNull();

        expect(() =>
          requireMarketplaceProviderIdentity(
            "Tokopedia",
          ),
        ).toThrow(
          /identity unavailable/i,
        );
      },
    );

    it(
      "matches providers only through canonical registered identities",
      () => {
        expect(
          marketplaceProviderIs(
            "TikTok Shop",
            "tiktok_shop",
          ),
        ).toBe(true);

        expect(
          marketplaceProviderIs(
            "tiktok-shop",
            "tiktok_shop",
          ),
        ).toBe(true);

        expect(
          marketplaceProviderIs(
            "Shopee",
            "shopee",
          ),
        ).toBe(true);

        expect(
          marketplaceProviderIs(
            "Tokopedia",
            "tiktok_shop",
          ),
        ).toBe(false);

        expect(
          marketplaceProviderIs(
            "Shopee Express",
            "shopee",
          ),
        ).toBe(false);
      },
    );

    it(
      "returns an immutable identity wrapper",
      () => {
        const identity =
          requireMarketplaceProviderIdentity(
            "Shopee",
          );

        expect(
          Object.isFrozen(identity),
        ).toBe(true);
      },
    );
  },
);