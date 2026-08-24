import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentOrganization:
    vi.fn(),

  getUser:
    vi.fn(),

  from:
    vi.fn(),

  rpc:
    vi.fn(),

  getValidShopeeAccessToken:
    vi.fn(),

  getShopeeShopInfo:
    vi.fn(),

  isShopeeProvider:
    vi.fn(),
}));

vi.mock(
  "@/lib/supabase/current-organization",
  () => ({
    getCurrentOrganization:
      mocks.getCurrentOrganization,
  }),
);

vi.mock(
  "@/lib/supabase/server",
  () => ({
    createClient:
      vi.fn(
        async () => ({
          auth: {
            getUser:
              mocks.getUser,
          },
          from:
            mocks.from,
        }),
      ),
  }),
);

vi.mock(
  "@/lib/supabase/admin",
  () => ({
    createAdminClient:
      vi.fn(() => ({
        rpc:
          mocks.rpc,
      })),
  }),
);

vi.mock(
  "@/lib/marketplaces/token-manager",
  () => ({
    getValidShopeeAccessToken:
      mocks.getValidShopeeAccessToken,
  }),
);

vi.mock(
  "@/lib/marketplaces/shopee",
  () => ({
    SHOPEE_PROVIDER:
      "shopee",

    isShopeeProvider:
      mocks.isShopeeProvider,

    getShopeeShopInfo:
      mocks.getShopeeShopInfo,
  }),
);

import {
  POST,
} from "./route";

function createAccountQuery(
  account: {
    id: string;
    provider: string;
    status: string;
  } | null = {
    id: "account-1",
    provider: "shopee",
    status: "active",
  },
) {
  const query = {
    select:
      vi.fn(),

    eq:
      vi.fn(),

    maybeSingle:
      vi.fn(),
  };

  query.select.mockReturnValue(
    query,
  );

  query.eq.mockReturnValue(
    query,
  );

  query.maybeSingle.mockResolvedValue({
    data:
      account,

    error:
      null,
  });

  return query;
}

function createRequest(
  body: unknown = {
    account_id:
      "account-1",
  },
) {
  return new Request(
    "http://localhost/api/marketplaces/shopee/shops/sync",
    {
      method:
        "POST",

      headers: {
        "content-type":
          "application/json",
      },

      body:
        JSON.stringify(
          body,
        ),
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.getCurrentOrganization
    .mockResolvedValue({
      organizationId:
        "org-1",
    });

  mocks.getUser
    .mockResolvedValue({
      data: {
        user: {
          id:
            "user-1",
        },
      },
      error:
        null,
    });

  mocks.from.mockImplementation(
    (table: string) => {
      expect(table).toBe(
        "marketplace_accounts",
      );

      return createAccountQuery();
    },
  );

  mocks.isShopeeProvider
    .mockImplementation(
      (provider: unknown) =>
        provider ===
        "shopee",
    );

  mocks.getValidShopeeAccessToken
    .mockResolvedValue({
      accessToken:
        "access-token",

      accessTokenExpiresAt:
        "2099-01-01T00:00:00.000Z",

      refreshTokenExpiresAt:
        null,

      grantedScopes:
        [],

      shopId:
        987654,

      refreshed:
        false,
    });

  mocks.getShopeeShopInfo
    .mockResolvedValue({
      shop_name:
        "Lakuvo Test Shop",

      request_id:
        "req-shop-info",
    });

  mocks.rpc.mockResolvedValue({
    data:
      1,

    error:
      null,
  });
});

describe(
  "Shopee shops sync route",
  () => {
    it(
      "persists one Shopee shop without TikTok-only cipher fields",
      async () => {
        const response =
          await POST(
            createRequest(),
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          mocks.getValidShopeeAccessToken,
        ).toHaveBeenCalledWith({
          organizationId:
            "org-1",

          marketplaceAccountId:
            "account-1",

          userId:
            "user-1",
        });

        expect(
          mocks.getShopeeShopInfo,
        ).toHaveBeenCalledWith(
          "access-token",
          987654,
        );

        expect(
          mocks.rpc,
        ).toHaveBeenCalledTimes(
          1,
        );

        const [
          rpcName,
          rpcInput,
        ] =
          mocks.rpc.mock.calls[0];

        expect(
          rpcName,
        ).toBe(
          "sync_marketplace_authorized_shops",
        );

        expect(
          rpcInput,
        ).toEqual({
          p_organization_id:
            "org-1",

          p_marketplace_account_id:
            "account-1",

          p_user_id:
            "user-1",

          p_provider:
            "shopee",

          p_shops: [
            {
              external_shop_id:
                "987654",

              name:
                "Lakuvo Test Shop",
            },
          ],

          p_request_id:
            "req-shop-info",
        });

        expect(
          JSON.stringify(
            rpcInput.p_shops,
          ),
        ).not.toContain(
          "shop_cipher",
        );

        expect(
          JSON.stringify(
            rpcInput.p_shops,
          ),
        ).not.toContain(
          "region",
        );

        const payload =
          await response.json();

        expect(payload).toEqual({
          ok:
            true,

          token_refreshed:
            false,

          synced_count:
            1,

          request_id:
            "req-shop-info",

          shops: [
            {
              external_shop_id:
                "987654",

              name:
                "Lakuvo Test Shop",
            },
          ],
        });
      },
    );

    it(
      "rejects a non-Shopee marketplace account before token access",
      async () => {
        mocks.from.mockReturnValue(
          createAccountQuery({
            id:
              "account-1",

            provider:
              "tiktok_shop",

            status:
              "active",
          }),
        );

        const response =
          await POST(
            createRequest(),
          );

        expect(
          response.status,
        ).toBe(409);

        expect(
          mocks.getValidShopeeAccessToken,
        ).not.toHaveBeenCalled();

        expect(
          mocks.getShopeeShopInfo,
        ).not.toHaveBeenCalled();

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns token validation errors without calling Shopee shop info",
      async () => {
        mocks.getValidShopeeAccessToken
          .mockRejectedValue(
            new Error(
              "Shopee token invalid.",
            ),
          );

        const response =
          await POST(
            createRequest(),
          );

        expect(
          response.status,
        ).toBe(409);

        expect(
          mocks.getShopeeShopInfo,
        ).not.toHaveBeenCalled();

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();

        const payload =
          await response.json();

        expect(
          payload.error,
        ).toBe(
          "Shopee token invalid.",
        );
      },
    );

    it(
      "rejects shop info without a usable shop_name",
      async () => {
        mocks.getShopeeShopInfo
          .mockResolvedValue({
            shop_name:
              "   ",

            request_id:
              "req-empty-name",
          });

        const response =
          await POST(
            createRequest(),
          );

        expect(
          response.status,
        ).toBe(502);

        expect(
          mocks.rpc,
        ).not.toHaveBeenCalled();

        const payload =
          await response.json();

        expect(
          payload.error,
        ).toMatch(
          /shop_name/,
        );
      },
    );

    it(
      "propagates authorized-shop RPC failure as a gateway error",
      async () => {
        mocks.rpc.mockResolvedValue({
          data:
            null,

          error: {
            message:
              "provider mismatch",
          },
        });

        const response =
          await POST(
            createRequest(),
          );

        expect(
          response.status,
        ).toBe(502);

        const payload =
          await response.json();

        expect(
          payload.error,
        ).toBe(
          "provider mismatch",
        );
      },
    );
  },
);