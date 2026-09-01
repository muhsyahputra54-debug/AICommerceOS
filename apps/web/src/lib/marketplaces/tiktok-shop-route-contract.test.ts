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

function readSource(relativePath: string) {
  return readFileSync(
    resolve(process.cwd(), relativePath),
    "utf8",
  );
}

describe("TikTok Shop fail-closed route contract", () => {
  const authorize = readSource(
    "src/app/api/marketplaces/tiktok-shop/authorize/route.ts",
  );

  const callback = readSource(
    "src/app/api/marketplaces/tiktok-shop/callback/route.ts",
  );

  const webhookProcess = readSource(
    "src/app/api/marketplaces/tiktok-shop/webhook/process/route.ts",
  );

  it("preflights OAuth configuration before state persistence", () => {
    const preflightIndex = authorize.indexOf(
      'assertTikTokShopConfigured("oauth")',
    );

    const stateIndex = authorize.indexOf(
      '"create_marketplace_oauth_state"',
    );

    expect(preflightIndex).toBeGreaterThan(-1);
    expect(stateIndex).toBeGreaterThan(preflightIndex);
  });

  it("preflights API configuration before webhook claims", () => {
    const preflightIndex = webhookProcess.indexOf(
      'assertTikTokShopConfigured("api")',
    );

    const claimIndex = webhookProcess.indexOf(
      '"claim_marketplace_webhook_events"',
    );

    expect(preflightIndex).toBeGreaterThan(-1);
    expect(claimIndex).toBeGreaterThan(preflightIndex);
  });

  it("preserves callback replay protection before token exchange", () => {
    const consumeIndex = callback.indexOf(
      '"consume_marketplace_oauth_state"',
    );

    const exchangeIndex = callback.indexOf(
      "await exchangeAuthorizationCode",
    );

    expect(consumeIndex).toBeGreaterThan(-1);
    expect(exchangeIndex).toBeGreaterThan(consumeIndex);
  });
});
