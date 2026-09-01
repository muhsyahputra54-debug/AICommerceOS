import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  assertTikTokShopConfigured,
} from "./tiktok-shop";

const environmentKeys = [
  "TIKTOK_SHOP_APP_KEY",
  "TIKTOK_SHOP_APP_SECRET",
  "TIKTOK_SHOP_SERVICE_ID",
] as const;

const originalEnvironment = Object.fromEntries(
  environmentKeys.map((name) => [
    name,
    process.env[name],
  ]),
);

afterEach(() => {
  for (const name of environmentKeys) {
    const originalValue =
      originalEnvironment[name];

    if (originalValue === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = originalValue;
    }
  }
});

describe("TikTok Shop configuration preflight", () => {
  it("rejects API work before credentials are configured", () => {
    delete process.env.TIKTOK_SHOP_APP_KEY;
    delete process.env.TIKTOK_SHOP_APP_SECRET;

    expect(() =>
      assertTikTokShopConfigured("api"),
    ).toThrow(/TIKTOK_SHOP_APP_KEY/);
  });

  it("allows API work without an OAuth service id", () => {
    process.env.TIKTOK_SHOP_APP_KEY =
      "staging-test-app-key";
    process.env.TIKTOK_SHOP_APP_SECRET =
      "staging-test-app-secret";
    delete process.env.TIKTOK_SHOP_SERVICE_ID;

    expect(() =>
      assertTikTokShopConfigured("api"),
    ).not.toThrow();
  });

  it("requires the service id before OAuth state creation", () => {
    process.env.TIKTOK_SHOP_APP_KEY =
      "staging-test-app-key";
    process.env.TIKTOK_SHOP_APP_SECRET =
      "staging-test-app-secret";
    delete process.env.TIKTOK_SHOP_SERVICE_ID;

    expect(() =>
      assertTikTokShopConfigured("oauth"),
    ).toThrow(/TIKTOK_SHOP_SERVICE_ID/);
  });
});
