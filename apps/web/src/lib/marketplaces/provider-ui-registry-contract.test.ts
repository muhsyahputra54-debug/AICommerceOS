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
  "MarketplaceIntegrationManager provider registry contract",
  () => {
    it(
      "uses the central provider registry",
      () => {
        expect(managerSource).toContain(
          'from "@/lib/marketplaces/provider-registry"',
        );
        expect(managerSource).toContain(
          "getMarketplaceProviderDefinition(",
        );
        expect(managerSource).toContain(
          "connectorRoutes",
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
