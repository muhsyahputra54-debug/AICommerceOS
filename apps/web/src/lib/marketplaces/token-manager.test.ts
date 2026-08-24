import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => {
  return {
    rpc: vi.fn(),
    createAdminClient: vi.fn(),
    decryptMarketplaceSecret: vi.fn(),
    encryptMarketplaceSecret: vi.fn(),
    refreshTikTokShopAuthorization: vi.fn(),
    refreshShopeeAuthorization: vi.fn(),
  };
});

vi.mock(
  "@/lib/supabase/admin",
  () => ({
    createAdminClient:
      mocks.createAdminClient,
  }),
);

vi.mock(
  "@/lib/marketplaces/crypto",
  () => ({
    decryptMarketplaceSecret:
      mocks.decryptMarketplaceSecret,
    encryptMarketplaceSecret:
      mocks.encryptMarketplaceSecret,
  }),
);

vi.mock(
  "@/lib/marketplaces/tiktok-shop",
  () => ({
    TIKTOK_SHOP_PROVIDER:
      "tiktok_shop",
    refreshTikTokShopAuthorization:
      mocks.refreshTikTokShopAuthorization,
  }),
);

vi.mock(
  "@/lib/marketplaces/shopee",
  () => ({
    SHOPEE_PROVIDER:
      "shopee",
    refreshShopeeAuthorization:
      mocks.refreshShopeeAuthorization,
  }),
);

import {
  getValidShopeeAccessToken,
  getValidTikTokShopAccessToken,
} from "./token-manager";

const input = {
  organizationId:
    "00000000-0000-4000-8000-000000000001",
  marketplaceAccountId:
    "00000000-0000-4000-8000-000000000002",
  userId:
    "00000000-0000-4000-8000-000000000003",
};

function farFuture() {
  return new Date(
    Date.now() +
      7 * 24 * 60 * 60 * 1000,
  ).toISOString();
}

function nearFuture() {
  return new Date(
    Date.now() +
      60 * 60 * 1000,
  ).toISOString();
}

function tiktokContext(
  overrides: Record<string, unknown> = {},
) {
  return {
    provider:
      "tiktok_shop",
    status:
      "active",
    open_id:
      "tiktok-open-id",
    user_type:
      1,
    access_token_ciphertext:
      "encrypted-access",
    refresh_token_ciphertext:
      "encrypted-refresh",
    access_token_expires_at:
      farFuture(),
    refresh_token_expires_at:
      null,
    granted_scopes: [
      "product",
      "order",
    ],
    ...overrides,
  };
}

function shopeeContext(
  overrides: Record<string, unknown> = {},
) {
  return {
    provider:
      "shopee",
    status:
      "active",
    open_id:
      "987654",
    user_type:
      null,
    access_token_ciphertext:
      "encrypted-access",
    refresh_token_ciphertext:
      "encrypted-refresh",
    access_token_expires_at:
      farFuture(),
    refresh_token_expires_at:
      null,
    granted_scopes: [],
    ...overrides,
  };
}

function mockRefreshContext(
  context: Record<string, unknown>,
) {
  mocks.rpc.mockImplementation(
    async (name: string) => {
      if (
        name ===
        "get_marketplace_connection_refresh_context"
      ) {
        return {
          data: [context],
          error: null,
        };
      }

      throw new Error(
        `Unexpected RPC: ${name}`,
      );
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.createAdminClient.mockReturnValue({
    rpc: mocks.rpc,
  });

  mocks.decryptMarketplaceSecret
    .mockImplementation(
      (value: string) => {
        if (
          value ===
          "encrypted-access"
        ) {
          return "plain-access";
        }

        if (
          value ===
          "encrypted-refresh"
        ) {
          return "plain-refresh";
        }

        return `decrypted:${value}`;
      },
    );

  mocks.encryptMarketplaceSecret
    .mockImplementation(
      (value: string) =>
        `encrypted:${value}`,
    );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(
  "marketplace token-manager provider dispatch",
  () => {
    it(
      "returns a valid Shopee access token without refreshing",
      async () => {
        mockRefreshContext(
          shopeeContext(),
        );

        const result =
          await getValidShopeeAccessToken(
            input,
          );

        expect(
          result,
        ).toEqual({
          accessToken:
            "plain-access",
          accessTokenExpiresAt:
            expect.any(String),
          refreshTokenExpiresAt:
            null,
          grantedScopes: [],
          shopId:
            987654,
          refreshed:
            false,
        });

        expect(
          mocks.refreshShopeeAuthorization,
        ).not.toHaveBeenCalled();

        expect(
          mocks.refreshTikTokShopAuthorization,
        ).not.toHaveBeenCalled();

        expect(
          mocks.rpc,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "refreshes and persists an expiring Shopee token",
      async () => {
        const context =
          shopeeContext({
            access_token_expires_at:
              nearFuture(),
          });

        mocks.rpc.mockImplementation(
          async (
            name: string,
            args?: Record<
              string,
              unknown
            >,
          ) => {
            if (
              name ===
              "get_marketplace_connection_refresh_context"
            ) {
              return {
                data: [context],
                error: null,
              };
            }

            if (
              name ===
              "apply_marketplace_connection_token_refresh"
            ) {
              expect(
                args,
              ).toMatchObject({
                p_organization_id:
                  input.organizationId,

                p_marketplace_account_id:
                  input.marketplaceAccountId,

                p_user_id:
                  input.userId,

                p_expected_refresh_token_ciphertext:
                  "encrypted-refresh",

                p_access_token_ciphertext:
                  "encrypted:next-access",

                p_refresh_token_ciphertext:
                  "encrypted:next-refresh",

                p_open_id:
                  "987654",

                p_user_type:
                  null,

                p_granted_scopes:
                  [],

                p_request_id:
                  "request-shopee-refresh",
              });

              return {
                data: true,
                error: null,
              };
            }

            throw new Error(
              `Unexpected RPC: ${name}`,
            );
          },
        );

        mocks
          .refreshShopeeAuthorization
          .mockResolvedValue({
            accessToken:
              "next-access",
            refreshToken:
              "next-refresh",
            accessTokenExpiresAt:
              farFuture(),
            refreshTokenExpiresAt:
              null,
            shopId:
              987654,
            requestId:
              "request-shopee-refresh",
          });

        const result =
          await getValidShopeeAccessToken(
            input,
          );

        expect(
          mocks.refreshShopeeAuthorization,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.refreshShopeeAuthorization,
        ).toHaveBeenCalledWith(
          "plain-refresh",
          987654,
        );

        expect(
          mocks.refreshTikTokShopAuthorization,
        ).not.toHaveBeenCalled();

        expect(
          result.accessToken,
        ).toBe(
          "next-access",
        );

        expect(
          result.shopId,
        ).toBe(
          987654,
        );

        expect(
          result.refreshed,
        ).toBe(true);

        expect(
          mocks.rpc,
        ).toHaveBeenCalledTimes(2);
      },
    );

    it(
      "rejects a TikTok connection from the Shopee token path",
      async () => {
        mockRefreshContext(
          tiktokContext(),
        );

        await expect(
          getValidShopeeAccessToken(
            input,
          ),
        ).rejects.toThrow(
          /bukan Shopee seller connection/,
        );

        expect(
          mocks.refreshShopeeAuthorization,
        ).not.toHaveBeenCalled();

        expect(
          mocks.refreshTikTokShopAuthorization,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a Shopee connection from the TikTok token path",
      async () => {
        mockRefreshContext(
          shopeeContext(),
        );

        await expect(
          getValidTikTokShopAccessToken(
            input,
          ),
        ).rejects.toThrow(
          /bukan TikTok Shop seller connection/,
        );

        expect(
          mocks.refreshShopeeAuthorization,
        ).not.toHaveBeenCalled();

        expect(
          mocks.refreshTikTokShopAuthorization,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "preserves the existing TikTok current-token path",
      async () => {
        mockRefreshContext(
          tiktokContext(),
        );

        const result =
          await getValidTikTokShopAccessToken(
            input,
          );

        expect(
          result.accessToken,
        ).toBe(
          "plain-access",
        );

        expect(
          result.grantedScopes,
        ).toEqual([
          "product",
          "order",
        ]);

        expect(
          result.refreshed,
        ).toBe(false);

        expect(
          mocks.refreshTikTokShopAuthorization,
        ).not.toHaveBeenCalled();

        expect(
          mocks.refreshShopeeAuthorization,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an invalid persisted Shopee shop_id",
      async () => {
        mockRefreshContext(
          shopeeContext({
            open_id:
              "not-a-shop-id",
          }),
        );

        await expect(
          getValidShopeeAccessToken(
            input,
          ),
        ).rejects.toThrow(
          /shop_id yang valid/,
        );

        expect(
          mocks.refreshShopeeAuthorization,
        ).not.toHaveBeenCalled();
      },
    );
  },
);