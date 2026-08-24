import { NextResponse } from "next/server";

import {
  getShopeeShopInfo,
  isShopeeProvider,
  SHOPEE_PROVIDER,
} from "@/lib/marketplaces/shopee";
import {
  getValidShopeeAccessToken,
} from "@/lib/marketplaces/token-manager";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return NextResponse.json(
      {
        error:
          "Organization aktif tidak ditemukan.",
      },
      { status: 401 },
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        error:
          "Authentication required.",
      },
      { status: 401 },
    );
  }

  let accountId = "";

  try {
    const body =
      (await request.json()) as {
        account_id?: string;
      };

    accountId =
      body.account_id?.trim() ?? "";
  } catch {
    return NextResponse.json(
      {
        error:
          "Request body tidak valid.",
      },
      { status: 400 },
    );
  }

  if (!accountId) {
    return NextResponse.json(
      {
        error:
          "Marketplace account wajib diisi.",
      },
      { status: 400 },
    );
  }

  const {
    data: account,
    error: accountError,
  } =
    await supabase
      .from("marketplace_accounts")
      .select(
        "id, provider, status",
      )
      .eq(
        "id",
        accountId,
      )
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .maybeSingle();

  if (accountError) {
    return NextResponse.json(
      {
        error:
          accountError.message,
      },
      { status: 500 },
    );
  }

  if (!account) {
    return NextResponse.json(
      {
        error:
          "Marketplace account tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  if (
    !isShopeeProvider(
      account.provider,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Provider account ini bukan Shopee connector.",
      },
      { status: 409 },
    );
  }

  if (
    account.status ===
    "inactive"
  ) {
    return NextResponse.json(
      {
        error:
          "Marketplace account inactive. Aktifkan terlebih dahulu.",
      },
      { status: 409 },
    );
  }

  let tokenContext: Awaited<
    ReturnType<
      typeof getValidShopeeAccessToken
    >
  >;

  try {
    tokenContext =
      await getValidShopeeAccessToken({
        organizationId:
          currentOrganization.organizationId,

        marketplaceAccountId:
          account.id,

        userId:
          user.id,
      });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Shopee token validation gagal.",
      },
      { status: 409 },
    );
  }

  const admin =
    createAdminClient();

  try {
    const shopInfo =
      await getShopeeShopInfo(
        tokenContext.accessToken,
        tokenContext.shopId,
      );

    const shopName =
      typeof shopInfo.shop_name ===
      "string"
        ? shopInfo.shop_name.trim()
        : "";

    if (!shopName) {
      throw new Error(
        "Shopee shop info tidak memiliki shop_name yang valid.",
      );
    }

    const requestId =
      typeof shopInfo.request_id ===
      "string"
        ? shopInfo.request_id.trim()
        : "";

    const persistedShop = {
      external_shop_id:
        String(
          tokenContext.shopId,
        ),

      name:
        shopName,
    };

    const {
      data: syncedCount,
      error: syncError,
    } =
      await admin.rpc(
        "sync_marketplace_authorized_shops",
        {
          p_organization_id:
            currentOrganization.organizationId,

          p_marketplace_account_id:
            account.id,

          p_user_id:
            user.id,

          p_provider:
            SHOPEE_PROVIDER,

          p_shops:
            [persistedShop],

          p_request_id:
            requestId,
        },
      );

    if (syncError) {
      throw new Error(
        syncError.message,
      );
    }

    return NextResponse.json({
      ok: true,

      token_refreshed:
        tokenContext.refreshed,

      synced_count:
        typeof syncedCount ===
        "number"
          ? syncedCount
          : 1,

      request_id:
        requestId || null,

      shops: [
        persistedShop,
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Shopee authorized shop sync gagal.",
      },
      { status: 502 },
    );
  }
}