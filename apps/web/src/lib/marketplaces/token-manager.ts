import {
  decryptMarketplaceSecret,
  encryptMarketplaceSecret,
} from "@/lib/marketplaces/crypto";
import {
  refreshTikTokShopAuthorization,
  TIKTOK_SHOP_PROVIDER,
} from "@/lib/marketplaces/tiktok-shop";
import {
  refreshShopeeAuthorization,
  SHOPEE_PROVIDER,
} from "@/lib/marketplaces/shopee";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_REFRESH_WINDOW_MS =
  24 * 60 * 60 * 1000;

type RefreshContextRow = {
  provider: string;
  status: string;
  open_id: string | null;
  user_type: number | null;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  granted_scopes: string[];
};

export type TikTokShopAccessTokenContext = {
  accessToken: string;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  grantedScopes: string[];
  refreshed: boolean;
};

export type ShopeeAccessTokenContext = {
  accessToken: string;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  grantedScopes: string[];
  shopId: number;
  refreshed: boolean;
};

type TokenContextInput = {
  organizationId: string;
  marketplaceAccountId: string;
  userId: string;
};

function timestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : null;
}

async function loadRefreshContext(
  input: TokenContextInput,
  expectedProvider: string,
): Promise<RefreshContextRow> {
  const admin = createAdminClient();

  const {
    data: rows,
    error,
  } = await admin.rpc(
    "get_marketplace_connection_refresh_context",
    {
      p_organization_id: input.organizationId,
      p_marketplace_account_id:
        input.marketplaceAccountId,
      p_user_id: input.userId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  const context =
    Array.isArray(rows) && rows.length > 0
      ? (rows[0] as RefreshContextRow)
      : null;

  if (!context) {
    throw new Error(
      "Marketplace belum memiliki koneksi seller aktif.",
    );
  }

  if (context.provider !== expectedProvider) {
    const providerLabel =
      expectedProvider === TIKTOK_SHOP_PROVIDER
        ? "TikTok Shop"
        : expectedProvider === SHOPEE_PROVIDER
          ? "Shopee"
          : expectedProvider;

    throw new Error(
      `Marketplace connection bukan ${providerLabel} seller connection.`,
    );
  }

  if (context.status !== "active") {
    throw new Error(
      "Marketplace seller connection tidak aktif. Reauthorization mungkin diperlukan.",
    );
  }

  return context;
}

function currentAccessToken(
  context: RefreshContextRow,
): TikTokShopAccessTokenContext {
  return {
    accessToken: decryptMarketplaceSecret(
      context.access_token_ciphertext,
    ),
    accessTokenExpiresAt:
      context.access_token_expires_at,
    refreshTokenExpiresAt:
      context.refresh_token_expires_at,
    grantedScopes: context.granted_scopes ?? [],
    refreshed: false,
  };
}

export async function getValidTikTokShopAccessToken(
  input: TokenContextInput,
): Promise<TikTokShopAccessTokenContext> {
  const context = await loadRefreshContext(input, TIKTOK_SHOP_PROVIDER);

  const now = Date.now();
  const accessExpiresAt = timestamp(
    context.access_token_expires_at,
  );

  if (
    accessExpiresAt === null ||
    accessExpiresAt >
      now + TOKEN_REFRESH_WINDOW_MS
  ) {
    return currentAccessToken(context);
  }

  const refreshExpiresAt = timestamp(
    context.refresh_token_expires_at,
  );

  if (
    refreshExpiresAt !== null &&
    refreshExpiresAt <= now
  ) {
    throw new Error(
      "TikTok Shop authorization sudah kedaluwarsa. Seller harus melakukan reauthorization.",
    );
  }

  const refreshToken =
    decryptMarketplaceSecret(
      context.refresh_token_ciphertext,
    );

  const refreshed =
    await refreshTikTokShopAuthorization(
      refreshToken,
    );

  if (
    context.open_id &&
    refreshed.openId !== context.open_id
  ) {
    throw new Error(
      "TikTok Shop refresh identity mismatch. Reauthorization diperlukan.",
    );
  }

  if (
    context.user_type !== null &&
    refreshed.userType !== context.user_type
  ) {
    throw new Error(
      "TikTok Shop refresh user type mismatch. Reauthorization diperlukan.",
    );
  }

  const grantedScopes =
    refreshed.grantedScopes ??
    context.granted_scopes ??
    [];

  const admin = createAdminClient();

  const {
    data: updated,
    error: updateError,
  } = await admin.rpc(
    "apply_marketplace_connection_token_refresh",
    {
      p_organization_id: input.organizationId,
      p_marketplace_account_id:
        input.marketplaceAccountId,
      p_user_id: input.userId,
      p_expected_refresh_token_ciphertext:
        context.refresh_token_ciphertext,
      p_access_token_ciphertext:
        encryptMarketplaceSecret(
          refreshed.accessToken,
        ),
      p_refresh_token_ciphertext:
        encryptMarketplaceSecret(
          refreshed.refreshToken,
        ),
      p_access_token_expires_at:
        refreshed.accessTokenExpiresAt,
      p_refresh_token_expires_at:
        refreshed.refreshTokenExpiresAt,
      p_open_id: refreshed.openId,
      p_user_type: refreshed.userType,
      p_granted_scopes: grantedScopes,
      p_request_id: refreshed.requestId,
    },
  );

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (updated === true) {
    return {
      accessToken: refreshed.accessToken,
      accessTokenExpiresAt:
        refreshed.accessTokenExpiresAt,
      refreshTokenExpiresAt:
        refreshed.refreshTokenExpiresAt,
      grantedScopes,
      refreshed: true,
    };
  }

  // Another request persisted a newer refresh token first.
  // Reload instead of overwriting the newer credential set.
  const concurrentContext =
    await loadRefreshContext(input, TIKTOK_SHOP_PROVIDER);

  const concurrentAccessExpiresAt =
    timestamp(
      concurrentContext.access_token_expires_at,
    );

  if (
    concurrentAccessExpiresAt !== null &&
    concurrentAccessExpiresAt <= Date.now()
  ) {
    throw new Error(
      "Concurrent TikTok Shop token refresh did not produce a usable access token.",
    );
  }

  return {
    ...currentAccessToken(concurrentContext),
    refreshed: true,
  };
}

function requireShopeeShopId(
  context: RefreshContextRow,
) {
  const shopId =
    Number(context.open_id);

  if (
    !Number.isSafeInteger(shopId) ||
    shopId <= 0
  ) {
    throw new Error(
      "Shopee connection tidak memiliki shop_id yang valid.",
    );
  }

  return shopId;
}

function currentShopeeAccessToken(
  context: RefreshContextRow,
): ShopeeAccessTokenContext {
  return {
    accessToken: decryptMarketplaceSecret(
      context.access_token_ciphertext,
    ),
    accessTokenExpiresAt:
      context.access_token_expires_at,
    refreshTokenExpiresAt:
      context.refresh_token_expires_at,
    grantedScopes:
      context.granted_scopes ?? [],
    shopId:
      requireShopeeShopId(context),
    refreshed: false,
  };
}

export async function getValidShopeeAccessToken(
  input: TokenContextInput,
): Promise<ShopeeAccessTokenContext> {
  const context =
    await loadRefreshContext(
      input,
      SHOPEE_PROVIDER,
    );

  const shopId =
    requireShopeeShopId(context);

  const now = Date.now();

  const accessExpiresAt =
    timestamp(
      context.access_token_expires_at,
    );

  if (
    accessExpiresAt === null ||
    accessExpiresAt >
      now + TOKEN_REFRESH_WINDOW_MS
  ) {
    return currentShopeeAccessToken(
      context,
    );
  }

  const refreshExpiresAt =
    timestamp(
      context.refresh_token_expires_at,
    );

  if (
    refreshExpiresAt !== null &&
    refreshExpiresAt <= now
  ) {
    throw new Error(
      "Shopee authorization sudah kedaluwarsa. Seller harus melakukan reauthorization.",
    );
  }

  const refreshToken =
    decryptMarketplaceSecret(
      context.refresh_token_ciphertext,
    );

  const refreshed =
    await refreshShopeeAuthorization(
      refreshToken,
      shopId,
    );

  if (refreshed.shopId !== shopId) {
    throw new Error(
      "Shopee refresh identity mismatch. Reauthorization diperlukan.",
    );
  }

  const grantedScopes =
    context.granted_scopes ?? [];

  const admin =
    createAdminClient();

  const {
    data: updated,
    error: updateError,
  } = await admin.rpc(
    "apply_marketplace_connection_token_refresh",
    {
      p_organization_id:
        input.organizationId,

      p_marketplace_account_id:
        input.marketplaceAccountId,

      p_user_id:
        input.userId,

      p_expected_refresh_token_ciphertext:
        context.refresh_token_ciphertext,

      p_access_token_ciphertext:
        encryptMarketplaceSecret(
          refreshed.accessToken,
        ),

      p_refresh_token_ciphertext:
        encryptMarketplaceSecret(
          refreshed.refreshToken,
        ),

      p_access_token_expires_at:
        refreshed.accessTokenExpiresAt,

      p_refresh_token_expires_at:
        refreshed.refreshTokenExpiresAt,

      p_open_id:
        String(refreshed.shopId),

      p_user_type:
        context.user_type,

      p_granted_scopes:
        grantedScopes,

      p_request_id:
        refreshed.requestId,
    },
  );

  if (updateError) {
    throw new Error(
      updateError.message,
    );
  }

  if (updated === true) {
    return {
      accessToken:
        refreshed.accessToken,

      accessTokenExpiresAt:
        refreshed.accessTokenExpiresAt,

      refreshTokenExpiresAt:
        refreshed.refreshTokenExpiresAt,

      grantedScopes,

      shopId:
        refreshed.shopId,

      refreshed: true,
    };
  }

  // Another request persisted a newer Shopee token set first.
  // Reload rather than overwriting the newer credentials.
  const concurrentContext =
    await loadRefreshContext(
      input,
      SHOPEE_PROVIDER,
    );

  const concurrentAccessExpiresAt =
    timestamp(
      concurrentContext.access_token_expires_at,
    );

  if (
    concurrentAccessExpiresAt !== null &&
    concurrentAccessExpiresAt <= Date.now()
  ) {
    throw new Error(
      "Concurrent Shopee token refresh did not produce a usable access token.",
    );
  }

  return {
    ...currentShopeeAccessToken(
      concurrentContext,
    ),
    refreshed: true,
  };
}