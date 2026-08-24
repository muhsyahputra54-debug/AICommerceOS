import {
  readFileSync,
} from "node:fs";
import {
  resolve,
} from "node:path";

import {
  describe,
  expect,
  it,
} from "vitest";

function readSource(
  relativePath: string,
) {
  return readFileSync(
    resolve(
      process.cwd(),
      relativePath,
    ),
    "utf8",
  );
}

describe(
  "Shopee OAuth route contract",
  () => {
    const authorize =
      readSource(
        "src/app/api/marketplaces/shopee/authorize/route.ts",
      );

    const callback =
      readSource(
        "src/app/api/marketplaces/shopee/callback/route.ts",
      );

    const proxy =
      readSource(
        "src/proxy.ts",
      );

    it(
      "creates secure one-time authorization correlation",
      () => {
        expect(authorize).toContain(
          "create_marketplace_oauth_state",
        );

        expect(authorize).toContain(
          "SHOPEE_PROVIDER",
        );

        expect(authorize).toContain(
          "callbackUrl.searchParams.set",
        );

        expect(authorize).toContain(
          'response.cookies.set(',
        );

        expect(authorize).toContain(
          "httpOnly: true",
        );

        expect(authorize).toContain(
          "secure: true",
        );

        expect(authorize).toContain(
          'sameSite: "lax"',
        );
      },
    );

    it(
      "requires callback query and cookie correlation before token exchange",
      () => {
        expect(callback).toContain(
          'url.searchParams.get("code")',
        );

        expect(callback).toContain(
          'url.searchParams.get("shop_id")',
        );

        expect(callback).toContain(
          'url.searchParams.get("state")',
        );

        expect(callback).toContain(
          "request.cookies",
        );

        expect(callback).toContain(
          "callbackState !== cookieState",
        );

        const consumeIndex =
          callback.indexOf(
            '"consume_marketplace_oauth_state"',
          );

        const exchangeIndex =
          callback.indexOf(
            "await exchangeShopeeAuthorizationCode",
          );

        expect(
          consumeIndex,
        ).toBeGreaterThan(-1);

        expect(
          exchangeIndex,
        ).toBeGreaterThan(
          consumeIndex,
        );
      },
    );

    it(
      "encrypts tokens and persists the Shopee connection",
      () => {
        const encryptionSignals =
          callback.match(
            /encryptMarketplaceSecret/g,
          ) ?? [];

        expect(
          encryptionSignals.length,
        ).toBeGreaterThanOrEqual(3);

        expect(callback).toContain(
          '"upsert_marketplace_connection"',
        );

        expect(callback).toContain(
          "SHOPEE_PROVIDER",
        );

        expect(callback).toContain(
          "String(authorization.shopId)",
        );

        expect(callback).toContain(
          'p_user_type:',
        );

        expect(callback).toContain(
          '"shop_oauth"',
        );
      },
    );

    it(
      "keeps authorize protected while making callback public",
      () => {
        expect(proxy).toContain(
          '"/api/marketplaces/tiktok-shop/callback"',
        );

        expect(proxy).toContain(
          '"/api/marketplaces/shopee/callback"',
        );

        expect(proxy).not.toContain(
          '"/api/marketplaces/shopee/authorize"',
        );
      },
    );
  },
);