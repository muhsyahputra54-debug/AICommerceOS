import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildShopeeAuthorizationUrl,
  exchangeShopeeAuthorizationCode,
  getShopeeShopInfo,  isShopeeProvider,
  refreshShopeeAuthorization,
  signShopeeRequest,
} from "./shopee";

const originalPartnerId =
  process.env.SHOPEE_PARTNER_ID;

const originalPartnerKey =
  process.env.SHOPEE_PARTNER_KEY;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();

  if (originalPartnerId === undefined) {
    delete process.env.SHOPEE_PARTNER_ID;
  } else {
    process.env.SHOPEE_PARTNER_ID =
      originalPartnerId;
  }

  if (originalPartnerKey === undefined) {
    delete process.env.SHOPEE_PARTNER_KEY;
  } else {
    process.env.SHOPEE_PARTNER_KEY =
      originalPartnerKey;
  }
});

describe("Shopee provider identity", () => {
  it("accepts only the Shopee provider", () => {
    expect(isShopeeProvider("Shopee")).toBe(true);
    expect(isShopeeProvider("shopee")).toBe(true);
    expect(isShopeeProvider("SHOPEE")).toBe(true);

    expect(
      isShopeeProvider("TikTok Shop"),
    ).toBe(false);

    expect(
      isShopeeProvider("Tokopedia"),
    ).toBe(false);

    expect(
      isShopeeProvider("Shopee Express"),
    ).toBe(false);
  });
});

describe("Shopee HMAC signing", () => {
  it("matches a fixed public-request signature vector", () => {
    expect(
      signShopeeRequest({
        partnerId: 123456,
        partnerKey: "secret-key",
        path: "/api/v2/shop/auth_partner",
        timestamp: 1700000000,
      }),
    ).toBe(
      "e98f981ceabdf259e27bbf7601cabff56bad31ffe33a147444168dbbd034450e",
    );
  });

  it("matches a fixed private-request signature vector", () => {
    expect(
      signShopeeRequest({
        partnerId: 123456,
        partnerKey: "secret-key",
        path: "/api/v2/order/get_order_list",
        timestamp: 1700000000,
        accessToken: "access-token",
        shopId: 987654,
      }),
    ).toBe(
      "89bc6267a0591e9128cd57aff0b33c028f9ee90359b8da52dcc40f2a0e2043cc",
    );
  });

  it("rejects incomplete private signing context", () => {
    expect(() =>
      signShopeeRequest({
        partnerId: 123456,
        partnerKey: "secret-key",
        path: "/api/v2/order/get_order_list",
        timestamp: 1700000000,
        accessToken: "access-token",
      }),
    ).toThrow(
      /access_token dan shop_id/,
    );
  });
});

describe("Shopee authorization URL", () => {
  it("builds the production shop authorization endpoint", () => {
    process.env.SHOPEE_PARTNER_ID =
      "123456";

    process.env.SHOPEE_PARTNER_KEY =
      "secret-key";

    const url =
      buildShopeeAuthorizationUrl(
        "https://lakuvo.com/api/marketplaces/shopee/callback",
        1700000000,
      );

    expect(url.origin).toBe(
      "https://partner.shopeemobile.com",
    );

    expect(url.pathname).toBe(
      "/api/v2/shop/auth_partner",
    );

    expect(
      url.searchParams.get("partner_id"),
    ).toBe("123456");

    expect(
      url.searchParams.get("timestamp"),
    ).toBe("1700000000");

    expect(
      url.searchParams.get("sign"),
    ).toBe(
      "e98f981ceabdf259e27bbf7601cabff56bad31ffe33a147444168dbbd034450e",
    );

    expect(
      url.searchParams.get("redirect"),
    ).toBe(
      "https://lakuvo.com/api/marketplaces/shopee/callback",
    );
  });

  it("rejects non-HTTPS redirect URLs", () => {
    process.env.SHOPEE_PARTNER_ID =
      "123456";

    process.env.SHOPEE_PARTNER_KEY =
      "secret-key";

    expect(() =>
      buildShopeeAuthorizationUrl(
        "http://localhost:3000/api/marketplaces/shopee/callback",
        1700000000,
      ),
    ).toThrow(/HTTPS/);
  });
});

describe("Shopee shop info", () => {
  it("builds a signed private GET request", async () => {
    process.env.SHOPEE_PARTNER_ID =
      "123456";

    process.env.SHOPEE_PARTNER_KEY =
      "secret-key";

    const fetchMock =
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            shop_name: "Lakuvo Test Shop",
            request_id: "req-shop-info",
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
      );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    const result =
      await getShopeeShopInfo(
        "access-token",
        987654,
        1700000000,
      );

    expect(
      result.shop_name,
    ).toBe(
      "Lakuvo Test Shop",
    );

    expect(
      fetchMock,
    ).toHaveBeenCalledTimes(1);

    const [
      requestUrl,
      requestInit,
    ] =
      fetchMock.mock.calls[0];

    const url =
      new URL(
        String(requestUrl),
      );

    expect(
      url.origin,
    ).toBe(
      "https://partner.shopeemobile.com",
    );

    expect(
      url.pathname,
    ).toBe(
      "/api/v2/shop/get_shop_info",
    );

    expect(
      url.searchParams.get(
        "partner_id",
      ),
    ).toBe("123456");

    expect(
      url.searchParams.get(
        "timestamp",
      ),
    ).toBe("1700000000");

    expect(
      url.searchParams.get(
        "access_token",
      ),
    ).toBe("access-token");

    expect(
      url.searchParams.get(
        "shop_id",
      ),
    ).toBe("987654");

    expect(
      url.searchParams.get(
        "sign",
      ),
    ).toBe(
      signShopeeRequest({
        partnerId: 123456,
        partnerKey: "secret-key",
        path:
          "/api/v2/shop/get_shop_info",
        timestamp: 1700000000,
        accessToken:
          "access-token",
        shopId: 987654,
      }),
    );

    expect(
      requestInit.method,
    ).toBe("GET");
  });

  it("rejects an empty access token before network access", async () => {
    process.env.SHOPEE_PARTNER_ID =
      "123456";

    process.env.SHOPEE_PARTNER_KEY =
      "secret-key";

    const fetchMock =
      vi.fn();

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    await expect(
      getShopeeShopInfo(
        "",
        987654,
        1700000000,
      ),
    ).rejects.toThrow(
      /access token/,
    );

    expect(
      fetchMock,
    ).not.toHaveBeenCalled();
  });
});
describe("Shopee token exchange", () => {
  it("exchanges code and validates returned shop_id", async () => {
    process.env.SHOPEE_PARTNER_ID =
      "123456";

    process.env.SHOPEE_PARTNER_KEY =
      "secret-key";

    const fetchMock =
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: "access-1",
            refresh_token: "refresh-1",
            expire_in: 14400,
            shop_id: 987654,
            request_id: "request-1",
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
      );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    const result =
      await exchangeShopeeAuthorizationCode(
        "auth-code",
        987654,
      );

    expect(result.accessToken).toBe(
      "access-1",
    );

    expect(result.refreshToken).toBe(
      "refresh-1",
    );

    expect(result.shopId).toBe(
      987654,
    );

    expect(
      result.refreshTokenExpiresAt,
    ).toBeNull();

    const [
      requestUrl,
      requestInit,
    ] =
      fetchMock.mock.calls[0];

    const url =
      new URL(
        String(requestUrl),
      );

    expect(url.pathname).toBe(
      "/api/v2/auth/token/get",
    );

    expect(
      requestInit.method,
    ).toBe("POST");

    expect(
      JSON.parse(
        String(requestInit.body),
      ),
    ).toEqual({
      code: "auth-code",
      shop_id: 987654,
      partner_id: 123456,
    });
  });

  it("rejects token response for another shop", async () => {
    process.env.SHOPEE_PARTNER_ID =
      "123456";

    process.env.SHOPEE_PARTNER_KEY =
      "secret-key";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: "access-1",
            refresh_token: "refresh-1",
            expire_in: 14400,
            shop_id: 111111,
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
      ),
    );

    await expect(
      exchangeShopeeAuthorizationCode(
        "auth-code",
        987654,
      ),
    ).rejects.toThrow(
      /shop_id tidak cocok/,
    );
  });
});

describe("Shopee token refresh", () => {
  it("rotates access and refresh tokens", async () => {
    process.env.SHOPEE_PARTNER_ID =
      "123456";

    process.env.SHOPEE_PARTNER_KEY =
      "secret-key";

    const fetchMock =
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: "access-2",
            refresh_token: "refresh-2",
            expire_in: 14400,
            shop_id: 987654,
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
      );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    const result =
      await refreshShopeeAuthorization(
        "refresh-1",
        987654,
      );

    expect(result.accessToken).toBe(
      "access-2",
    );

    expect(result.refreshToken).toBe(
      "refresh-2",
    );

    const [
      requestUrl,
      requestInit,
    ] =
      fetchMock.mock.calls[0];

    const url =
      new URL(
        String(requestUrl),
      );

    expect(url.pathname).toBe(
      "/api/v2/auth/access_token/get",
    );

    expect(
      JSON.parse(
        String(requestInit.body),
      ),
    ).toEqual({
      refresh_token: "refresh-1",
      shop_id: 987654,
      partner_id: 123456,
    });
  });
});