import {
  describe,
  expect,
  it,
} from "vitest";
import {
  readFileSync,
} from "node:fs";
import {
  resolve,
} from "node:path";

const managerSource = readFileSync(
  resolve(
    process.cwd(),
    "src/components/marketplaces/MarketplaceIntegrationManager.tsx",
  ),
  "utf8",
);

describe(
  "MarketplaceIntegrationManager provider identity contract",
  () => {
    it(
      "uses the canonical provider identity boundary",
      () => {
        expect(managerSource).toContain(
          'from "@/lib/marketplaces/provider-identity"',
        );

        expect(managerSource).toContain(
          "resolveMarketplaceProviderIdentity(",
        );

        expect(managerSource).toContain(
          "connectorIdentity?.definition",
        );

        expect(managerSource).toContain(
          'connectorIdentity?.provider === "tiktok_shop"',
        );

        expect(managerSource).toContain(
          "connectorRoutes",
        );

        expect(managerSource).not.toContain(
          'from "@/lib/marketplaces/provider-registry"',
        );

        expect(managerSource).not.toContain(
          "getMarketplaceProviderDefinition(",
        );
      },
    );

    it(
      "does not alias Tokopedia to the TikTok Shop connector",
      () => {
        expect(
          managerSource.toLowerCase(),
        ).not.toContain(
          "tokopedia",
        );

        expect(managerSource).not.toContain(
          "supportsTokopediaShopConnector",
        );

        expect(managerSource).not.toContain(
          "supportsTokopediaShop",
        );
      },
    );

    it(
      "does not hardcode TikTok Shop API routes in the marketplace UI",
      () => {
        for (const route of [
          "/api/marketplaces/tiktok-shop/authorize",
          "/api/marketplaces/tiktok-shop/shops/sync",
          "/api/marketplaces/tiktok-shop/products/sync",
          "/api/marketplaces/tiktok-shop/orders/sync",
          "/api/marketplaces/tiktok-shop/webhook/process",
        ]) {
          expect(managerSource).not.toContain(
            route,
          );
        }
      },
    );

    it(
      "fails closed through explicit route resolution",
      () => {
        expect(managerSource).toContain(
          "requireMarketplaceProviderRoute(",
        );

        expect(managerSource).toContain(
          "connectorRoutes?.shopsSync",
        );

        expect(managerSource).toContain(
          "connectorRoutes?.productsSync",
        );

        expect(managerSource).toContain(
          "connectorRoutes?.ordersSync",
        );

        expect(managerSource).toContain(
          "connectorRoutes?.webhookProcess",
        );

        expect(managerSource).toContain(
          "connectorRoutes?.authorize",
        );
      },
    );
  },
);