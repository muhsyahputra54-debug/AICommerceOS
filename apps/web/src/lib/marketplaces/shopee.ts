import { createHmac } from "node:crypto";

const SHOPEE_API_BASE_URL =
  "https://partner.shopeemobile.com";

const SHOPEE_AUTH_PARTNER_PATH =
  "/api/v2/shop/auth_partner";

const SHOPEE_TOKEN_GET_PATH =
  "/api/v2/auth/token/get";

const SHOPEE_TOKEN_REFRESH_PATH =
  "/api/v2/auth/access_token/get";

const SHOPEE_GET_SHOP_INFO_PATH =
  "/api/v2/shop/get_shop_info";
export const SHOPEE_PROVIDER = "shopee";

type ShopeeTokenEnvelope = {
  error?: string;
  message?: string;
  request_id?: string;
  access_token?: string;
  refresh_token?: string;
  expire_in?: number | string;
  shop_id?: number;
  merchant_id?: number;
};

export type ShopeeShopInfo = {
  error?: string;
  message?: string;
  request_id?: string;
  [key: string]: unknown;
};
export type ShopeeAuthorization = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: null;
  shopId: number;
  requestId: string | null;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} belum dikonfigurasi pada server.`,
    );
  }

  return value;
}

function requiredPartnerId() {
  const value =
    requiredEnv("SHOPEE_PARTNER_ID");

  if (!/^\d+$/.test(value)) {
    throw new Error(
      "SHOPEE_PARTNER_ID harus berupa integer positif.",
    );
  }

  const partnerId = Number(value);

  if (
    !Number.isSafeInteger(partnerId) ||
    partnerId <= 0
  ) {
    throw new Error(
      "SHOPEE_PARTNER_ID tidak valid.",
    );
  }

  return partnerId;
}

function requirePositiveShopId(
  shopId: number,
) {
  if (
    !Number.isSafeInteger(shopId) ||
    shopId <= 0
  ) {
    throw new Error(
      "Shopee shop_id tidak valid.",
    );
  }

  return shopId;
}

function accessTokenExpiry(
  expireIn: number | string | undefined,
) {
  const seconds = Number(expireIn);

  if (
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    throw new Error(
      "Shopee token response tidak memiliki expire_in yang valid.",
    );
  }

  return new Date(
    Date.now() +
      Math.trunc(seconds) * 1000,
  ).toISOString();
}

function normalizeProvider(
  provider: string,
) {
  return provider
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isShopeeProvider(
  provider: string,
) {
  return normalizeProvider(provider) === "shopee";
}

export function signShopeeRequest(input: {
  partnerId: number;
  partnerKey: string;
  path: string;
  timestamp: number;
  accessToken?: string;
  shopId?: number;
}) {
  if (
    !Number.isSafeInteger(input.partnerId) ||
    input.partnerId <= 0
  ) {
    throw new Error(
      "Shopee partner_id tidak valid.",
    );
  }

  if (!input.partnerKey.trim()) {
    throw new Error(
      "Shopee partner_key tidak valid.",
    );
  }

  if (!input.path.startsWith("/api/v2/")) {
    throw new Error(
      "Shopee API path tidak valid.",
    );
  }

  if (
    !Number.isSafeInteger(input.timestamp) ||
    input.timestamp <= 0
  ) {
    throw new Error(
      "Shopee timestamp tidak valid.",
    );
  }

  const hasAccessToken =
    typeof input.accessToken === "string" &&
    input.accessToken.length > 0;

  const hasShopId =
    typeof input.shopId === "number";

  if (hasAccessToken !== hasShopId) {
    throw new Error(
      "Shopee private request membutuhkan access_token dan shop_id bersama-sama.",
    );
  }

  let baseString =
    `${input.partnerId}` +
    input.path +
    `${input.timestamp}`;

  if (
    hasAccessToken &&
    hasShopId
  ) {
    baseString +=
      input.accessToken +
      `${requirePositiveShopId(input.shopId!)}`;
  }

  return createHmac(
    "sha256",
    input.partnerKey,
  )
    .update(baseString)
    .digest("hex");
}

function signedPublicUrl(
  path: string,
  timestamp: number,
) {
  const partnerId =
    requiredPartnerId();

  const partnerKey =
    requiredEnv("SHOPEE_PARTNER_KEY");

  const sign =
    signShopeeRequest({
      partnerId,
      partnerKey,
      path,
      timestamp,
    });

  const url =
    new URL(
      path,
      SHOPEE_API_BASE_URL,
    );

  url.searchParams.set(
    "partner_id",
    `${partnerId}`,
  );

  url.searchParams.set(
    "timestamp",
    `${timestamp}`,
  );

  url.searchParams.set(
    "sign",
    sign,
  );

  return {
    partnerId,
    url,
  };
}

function signedPrivateUrl(
  path: string,
  accessTokenInput: string,
  shopIdInput: number,
  timestamp: number,
) {
  const accessToken =
    accessTokenInput.trim();

  if (!accessToken) {
    throw new Error(
      "Shopee access token tidak tersedia.",
    );
  }

  const shopId =
    requirePositiveShopId(shopIdInput);

  const partnerId =
    requiredPartnerId();

  const partnerKey =
    requiredEnv("SHOPEE_PARTNER_KEY");

  const sign =
    signShopeeRequest({
      partnerId,
      partnerKey,
      path,
      timestamp,
      accessToken,
      shopId,
    });

  const url =
    new URL(
      path,
      SHOPEE_API_BASE_URL,
    );

  url.searchParams.set(
    "partner_id",
    `${partnerId}`,
  );

  url.searchParams.set(
    "timestamp",
    `${timestamp}`,
  );

  url.searchParams.set(
    "sign",
    sign,
  );

  url.searchParams.set(
    "access_token",
    accessToken,
  );

  url.searchParams.set(
    "shop_id",
    `${shopId}`,
  );

  return {
    partnerId,
    shopId,
    accessToken,
    url,
  };
}
export function buildShopeeAuthorizationUrl(
  redirectUrl: string,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const redirect =
    new URL(redirectUrl);

  if (redirect.protocol !== "https:") {
    throw new Error(
      "Shopee redirect URL production harus menggunakan HTTPS.",
    );
  }

  const { url } =
    signedPublicUrl(
      SHOPEE_AUTH_PARTNER_PATH,
      timestamp,
    );

  url.searchParams.set(
    "redirect",
    redirect.toString(),
  );

  return url;
}

async function readTokenResponse(
  response: Response,
) {
  const payload =
    (await response.json()) as ShopeeTokenEnvelope;

  if (
    !response.ok ||
    Boolean(payload.error)
  ) {
    throw new Error(
      payload.message ||
        payload.error ||
        `Shopee token request failed (${response.status}).`,
    );
  }

  const accessToken =
    payload.access_token?.trim();

  const refreshToken =
    payload.refresh_token?.trim();

  if (
    !accessToken ||
    !refreshToken
  ) {
    throw new Error(
      "Shopee token response tidak lengkap.",
    );
  }

  return {
    payload,
    accessToken,
    refreshToken,
  };
}

export async function getShopeeShopInfo(
  accessTokenInput: string,
  shopIdInput: number,
  timestamp = Math.floor(Date.now() / 1000),
): Promise<ShopeeShopInfo> {
  const { url } =
    signedPrivateUrl(
      SHOPEE_GET_SHOP_INFO_PATH,
      accessTokenInput,
      shopIdInput,
      timestamp,
    );

  const response =
    await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

  const payload =
    (await response.json()) as ShopeeShopInfo;

  if (
    !response.ok ||
    Boolean(payload.error)
  ) {
    throw new Error(
      payload.message?.trim() ||
        payload.error?.trim() ||
        `Shopee shop-info request failed (${response.status}).`,
    );
  }

  return payload;
}
export async function exchangeShopeeAuthorizationCode(
  codeInput: string,
  shopIdInput: number,
): Promise<ShopeeAuthorization> {
  const code =
    codeInput.trim();

  if (!code) {
    throw new Error(
      "Shopee authorization code tidak tersedia.",
    );
  }

  const shopId =
    requirePositiveShopId(shopIdInput);

  const timestamp =
    Math.floor(Date.now() / 1000);

  const {
    partnerId,
    url,
  } =
    signedPublicUrl(
      SHOPEE_TOKEN_GET_PATH,
      timestamp,
    );

  const response =
    await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        shop_id: shopId,
        partner_id: partnerId,
      }),
    });

  const {
    payload,
    accessToken,
    refreshToken,
  } =
    await readTokenResponse(response);

  const returnedShopId =
    payload.shop_id ?? shopId;

  if (returnedShopId !== shopId) {
    throw new Error(
      "Shopee token response shop_id tidak cocok.",
    );
  }

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt:
      accessTokenExpiry(
        payload.expire_in,
      ),
    refreshTokenExpiresAt: null,
    shopId,
    requestId:
      payload.request_id?.trim() || null,
  };
}

export async function refreshShopeeAuthorization(
  refreshTokenInput: string,
  shopIdInput: number,
): Promise<ShopeeAuthorization> {
  const refreshToken =
    refreshTokenInput.trim();

  if (!refreshToken) {
    throw new Error(
      "Shopee refresh token tidak tersedia.",
    );
  }

  const shopId =
    requirePositiveShopId(shopIdInput);

  const timestamp =
    Math.floor(Date.now() / 1000);

  const {
    partnerId,
    url,
  } =
    signedPublicUrl(
      SHOPEE_TOKEN_REFRESH_PATH,
      timestamp,
    );

  const response =
    await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        shop_id: shopId,
        partner_id: partnerId,
      }),
    });

  const {
    payload,
    accessToken,
    refreshToken: nextRefreshToken,
  } =
    await readTokenResponse(response);

  const returnedShopId =
    payload.shop_id ?? shopId;

  if (returnedShopId !== shopId) {
    throw new Error(
      "Shopee refresh response shop_id tidak cocok.",
    );
  }

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    accessTokenExpiresAt:
      accessTokenExpiry(
        payload.expire_in,
      ),
    refreshTokenExpiresAt: null,
    shopId,
    requestId:
      payload.request_id?.trim() || null,
  };
}