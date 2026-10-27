import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isMarketplaceSyncPreflightError,
  MarketplaceSyncPreflightError,
  requireMarketplaceSyncPreflight,
} from "./provider-preflight";

describe(
  "marketplace provider sync preflight",
  () => {
    it(
      "allows every currently supported TikTok Shop read entity",
      () => {
        for (
          const entity of [
            "shops",
            "products",
            "orders",
            "inventory",
          ] as const
        ) {
          const preflight =
            requireMarketplaceSyncPreflight(
              "TikTok Shop",
              entity,
            );

          expect(
            preflight.provider,
          ).toBe("tiktok_shop");

          expect(
            preflight.entity,
          ).toBe(entity);

          expect(
            preflight.definition.provider,
          ).toBe("tiktok_shop");

          expect(
            preflight.adapter.provider,
          ).toBe("tiktok_shop");

          expect(
            Object.isFrozen(preflight),
          ).toBe(true);
        }
      },
    );

    it(
      "allows Shopee shop sync through the canonical adapter",
      () => {
        const preflight =
          requireMarketplaceSyncPreflight(
            "SHOPEE",
            "shops",
          );

        expect(
          preflight.provider,
        ).toBe("shopee");

        expect(
          preflight.entity,
        ).toBe("shops");

        expect(
          preflight.adapter.syncReadSupport,
        ).toEqual({
          shops: true,
          products: false,
          orders: false,
          inventory: false,
        });
      },
    );

    it(
      "fails closed for unsupported Shopee sync entities",
      () => {
        for (
          const entity of [
            "products",
            "orders",
            "inventory",
          ] as const
        ) {
          expect(() =>
            requireMarketplaceSyncPreflight(
              "Shopee",
              entity,
            ),
          ).toThrow(
            MarketplaceSyncPreflightError,
          );

          try {
            requireMarketplaceSyncPreflight(
              "Shopee",
              entity,
            );

            throw new Error(
              "Expected preflight failure.",
            );
          } catch (error) {
            expect(
              isMarketplaceSyncPreflightError(
                error,
              ),
            ).toBe(true);

            if (
              isMarketplaceSyncPreflightError(
                error,
              )
            ) {
              expect(
                error.code,
              ).toBe("unsupported");
            }
          }
        }
      },
    );

    it(
      "fails closed for unknown or heuristic provider identities",
      () => {
        for (
          const provider of [
            "Tokopedia",
            "Shopee Express",
            "Lazada",
          ]
        ) {
          expect(() =>
            requireMarketplaceSyncPreflight(
              provider,
              "shops",
            ),
          ).toThrow(
            MarketplaceSyncPreflightError,
          );

          try {
            requireMarketplaceSyncPreflight(
              provider,
              "shops",
            );
          } catch (error) {
            expect(
              isMarketplaceSyncPreflightError(
                error,
              ),
            ).toBe(true);

            if (
              isMarketplaceSyncPreflightError(
                error,
              )
            ) {
              expect(
                error.code,
              ).toBe("unsupported");
            }
          }
        }
      },
    );

    it(
      "normalizes only registered provider aliases before capability checks",
      () => {
        expect(
          requireMarketplaceSyncPreflight(
            "tiktok-shop",
            "orders",
          ).provider,
        ).toBe("tiktok_shop");

        expect(
          requireMarketplaceSyncPreflight(
            "shopee",
            "shops",
          ).provider,
        ).toBe("shopee");
      },
    );
  },
);