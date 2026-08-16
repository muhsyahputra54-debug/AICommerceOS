import { createHmac } from "node:crypto";

const SELLER_AUTHORIZATION_URL =
  "https://services.tiktokshop.com/open/authorize";

const TOKEN_GET_URL =
  "https://auth.tiktok-shops.com/api/v2/token/get";

const BUSINESS_API_BASE_URL =
  "https://open-api.tiktokglobalshop.com";

const AUTHORIZED_SHOPS_PATH =
  "/authorization/202309/shops";

export const TIKTOK_SHOP_PROVIDER = "tiktok_shop";

type TokenData = {
  access_token?: string;
  refresh_token?: string;
  access_token_expire_in?: number | string;
  refresh_token_expire_in?: number | string;
  open_id?: string;
  user_type?: number;
  granted_scopes?: string[] | string;
};

type TokenEnvelope = {
  code?: number;
  message?: string;
  data?: TokenData;
};

export type TikTokShopAuthorization = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  openId: string | null;
  userType: number | null;
  grantedScopes: string[];
};


type AuthorizedShopData = {
  id?: string;
  name?: string;
  region?: string;
  seller_type?: string;
  cipher?: string;
  code?: string;
};

type AuthorizedShopsEnvelope = {
  code?: number;
  message?: string;
  request_id?: string;
  data?: {
    shops?: AuthorizedShopData[];
  };
};

export type TikTokShopAuthorizedShop = {
  externalShopId: string;
  name: string;
  region: string | null;
  sellerType: string | null;
  cipher: string;
  code: string | null;
};

export type TikTokShopAuthorizedShopsResult = {
  shops: TikTokShopAuthorizedShop[];
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

function unixTimestampToIso(
  value: number | string | undefined,
) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return new Date(numeric * 1000).toISOString();
}

function normalizeScopes(
  value: string[] | string | undefined,
) {
  if (Array.isArray(value)) {
    return value
      .map((scope) => String(scope).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map((scope) => scope.trim())
      .filter(Boolean);
  }

  return [];
}

export function isTikTokShopProvider(provider: string) {
  const normalized = provider
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return (
    normalized.includes("tokopedia") ||
    normalized.includes("tiktok shop")
  );
}

export function buildSellerAuthorizationUrl(
  state: string,
) {
  const serviceId = requiredEnv(
    "TIKTOK_SHOP_SERVICE_ID",
  );

  const url = new URL(SELLER_AUTHORIZATION_URL);

  url.searchParams.set("service_id", serviceId);
  url.searchParams.set("state", state);

  return url;
}

export async function exchangeAuthorizationCode(
  authCode: string,
): Promise<TikTokShopAuthorization> {
  const appKey = requiredEnv("TIKTOK_SHOP_APP_KEY");
  const appSecret = requiredEnv(
    "TIKTOK_SHOP_APP_SECRET",
  );

  const url = new URL(TOKEN_GET_URL);

  url.searchParams.set("app_key", appKey);
  url.searchParams.set("app_secret", appSecret);
  url.searchParams.set("auth_code", authCode);
  url.searchParams.set(
    "grant_type",
    "authorized_code",
  );

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const payload =
    (await response.json()) as TokenEnvelope;

  if (
    !response.ok ||
    payload.code !== 0 ||
    !payload.data
  ) {
    throw new Error(
      payload.message ||
        `TikTok Shop token exchange failed (${response.status}).`,
    );
  }

  const {
    access_token: accessToken,
    refresh_token: refreshToken,
    open_id: openId,
    user_type: userType,
  } = payload.data;

  if (!accessToken || !refreshToken) {
    throw new Error(
      "TikTok Shop token response tidak lengkap.",
    );
  }

  if (
    typeof userType === "number" &&
    userType !== 0
  ) {
    throw new Error(
      "Authorization bukan seller authorization.",
    );
  }

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt:
      unixTimestampToIso(
        payload.data.access_token_expire_in,
      ),
    refreshTokenExpiresAt:
      unixTimestampToIso(
        payload.data.refresh_token_expire_in,
      ),
    openId: openId?.trim() || null,
    userType:
      typeof userType === "number"
        ? userType
        : null,
    grantedScopes:
      normalizeScopes(payload.data.granted_scopes),
  };
}

export function signTikTokShopRequest(input: {
  path: string;
  query: Record<
    string,
    string | number | boolean | undefined
  >;
  body?: string;
  contentType?: string;
}) {
  const appSecret = requiredEnv(
    "TIKTOK_SHOP_APP_SECRET",
  );

  const sorted = Object.entries(input.query)
    .filter(
      ([key, value]) =>
        key !== "sign" &&
        key !== "access_token" &&
        value !== undefined,
    )
    .sort(([left], [right]) =>
      left.localeCompare(right),
    );

  let signingInput =
    input.path +
    sorted
      .map(([key, value]) => `${key}${String(value)}`)
      .join("");

  const isMultipart =
    input.contentType
      ?.toLowerCase()
      .startsWith("multipart/form-data") ?? false;

  if (input.body && !isMultipart) {
    signingInput += input.body;
  }

  const message =
    appSecret + signingInput + appSecret;

  return createHmac("sha256", appSecret)
    .update(message)
    .digest("hex");
}

export function hasAuthorizedShopsScope(
  grantedScopes: string[],
) {
  if (grantedScopes.length === 0) {
    return true;
  }

  return (
    grantedScopes.includes("seller.authorization.info") ||
    grantedScopes.includes("test.scope.public")
  );
}

export async function getAuthorizedShops(
  accessToken: string,
): Promise<TikTokShopAuthorizedShopsResult> {
  const token = accessToken.trim();

  if (!token) {
    throw new Error("TikTok Shop access token tidak tersedia.");
  }

  const appKey = requiredEnv("TIKTOK_SHOP_APP_KEY");
  const timestamp = Math.floor(Date.now() / 1000);

  const query = {
    app_key: appKey,
    timestamp,
  };

  const sign = signTikTokShopRequest({
    path: AUTHORIZED_SHOPS_PATH,
    query,
  });

  const url = new URL(
    AUTHORIZED_SHOPS_PATH,
    BUSINESS_API_BASE_URL,
  );

  url.searchParams.set("app_key", appKey);
  url.searchParams.set(
    "timestamp",
    String(timestamp),
  );
  url.searchParams.set("sign", sign);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "content-type": "application/json",
      "x-tts-access-token": token,
    },
  });

  const payload =
    (await response.json()) as AuthorizedShopsEnvelope;

  if (
    !response.ok ||
    payload.code !== 0 ||
    !payload.data
  ) {
    throw new Error(
      payload.message ||
        `Get Authorized Shops failed (${response.status}).`,
    );
  }

  const shops = (payload.data.shops ?? []).map(
    (shop) => {
      const externalShopId = shop.id?.trim();
      const name = shop.name?.trim();
      const cipher = shop.cipher?.trim();

      if (!externalShopId || !name || !cipher) {
        throw new Error(
          "Authorized shop response tidak lengkap.",
        );
      }

      return {
        externalShopId,
        name,
        region: shop.region?.trim() || null,
        sellerType:
          shop.seller_type?.trim() || null,
        cipher,
        code: shop.code?.trim() || null,
      };
    },
  );

  return {
    shops,
    requestId:
      payload.request_id?.trim() || null,
  };
}

