import { NextResponse } from "next/server";

import {
  encryptMarketplaceSecret,
} from "@/lib/marketplaces/crypto";
import {
  getAuthorizedShops,
  hasAuthorizedShopsScope,
  isTikTokShopProvider,
  TIKTOK_SHOP_PROVIDER,
} from "@/lib/marketplaces/tiktok-shop";
import {
  getValidTikTokShopAccessToken,
} from "@/lib/marketplaces/token-manager";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const currentOrganization =
    await getCurrentOrganization();

  if (!currentOrganization) {
    return NextResponse.json(
      { error: "Organization aktif tidak ditemukan." },
      { status: 401 },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  let accountId = "";

  try {
    const body = (await request.json()) as {
      account_id?: string;
    };

    accountId = body.account_id?.trim() ?? "";
  } catch {
    return NextResponse.json(
      { error: "Request body tidak valid." },
      { status: 400 },
    );
  }

  if (!accountId) {
    return NextResponse.json(
      { error: "Marketplace account wajib diisi." },
      { status: 400 },
    );
  }

  const { data: account, error: accountError } =
    await supabase
      .from("marketplace_accounts")
      .select("id, provider, status")
      .eq("id", accountId)
      .eq(
        "organization_id",
        currentOrganization.organizationId,
      )
      .maybeSingle();

  if (accountError) {
    return NextResponse.json(
      { error: accountError.message },
      { status: 500 },
    );
  }

  if (!account) {
    return NextResponse.json(
      { error: "Marketplace account tidak ditemukan." },
      { status: 404 },
    );
  }

  if (!isTikTokShopProvider(account.provider)) {
    return NextResponse.json(
      {
        error:
          "Provider account ini bukan TikTok Shop connector.",
      },
      { status: 409 },
    );
  }

  if (account.status === "inactive") {
    return NextResponse.json(
      {
        error:
          "Marketplace account inactive. Aktifkan terlebih dahulu.",
      },
      { status: 409 },
    );
  }

  const admin = createAdminClient();

  let tokenContext: Awaited<
    ReturnType<
      typeof getValidTikTokShopAccessToken
    >
  >;

  try {
    tokenContext =
      await getValidTikTokShopAccessToken({
        organizationId:
          currentOrganization.organizationId,
        marketplaceAccountId: account.id,
        userId: user.id,
      });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "TikTok Shop token validation gagal.",
      },
      { status: 409 },
    );
  }

  const grantedScopes =
    tokenContext.grantedScopes;

  if (!hasAuthorizedShopsScope(grantedScopes)) {
    return NextResponse.json(
      {
        error:
          "Scope seller.authorization.info belum diberikan pada authorization ini.",
      },
      { status: 403 },
    );
  }

  try {
    const result =
      await getAuthorizedShops(
        tokenContext.accessToken,
      );

    const encryptedShops = result.shops.map(
      (shop) => ({
        external_shop_id: shop.externalShopId,
        shop_code: shop.code,
        name: shop.name,
        region: shop.region,
        seller_type: shop.sellerType,
        shop_cipher_ciphertext:
          encryptMarketplaceSecret(shop.cipher),
      }),
    );

    const {
      data: syncedCount,
      error: syncError,
    } = await admin.rpc(
      "sync_marketplace_authorized_shops",
      {
        p_organization_id:
          currentOrganization.organizationId,
        p_marketplace_account_id: account.id,
        p_user_id: user.id,
        p_provider: TIKTOK_SHOP_PROVIDER,
        p_shops: encryptedShops,
        p_request_id: result.requestId,
      },
    );

    if (syncError) {
      throw new Error(syncError.message);
    }

    return NextResponse.json({
      ok: true,
      token_refreshed: tokenContext.refreshed,
      synced_count:
        typeof syncedCount === "number"
          ? syncedCount
          : result.shops.length,
      request_id: result.requestId,
      shops: result.shops.map((shop) => ({
        external_shop_id: shop.externalShopId,
        shop_code: shop.code,
        name: shop.name,
        region: shop.region,
        seller_type: shop.sellerType,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Authorized Shops sync gagal.",
      },
      { status: 502 },
    );
  }
}
