import { NextResponse } from "next/server";

import {
  decryptMarketplaceSecret,
} from "@/lib/marketplaces/crypto";
import {
  hasProductBasicScope,
  isTikTokShopProvider,
  searchProducts,
  TIKTOK_SHOP_PROVIDER,
} from "@/lib/marketplaces/tiktok-shop";
import {
  getValidTikTokShopAccessToken,
} from "@/lib/marketplaces/token-manager";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrganization } from "@/lib/supabase/current-organization";
import { createClient } from "@/lib/supabase/server";

type ProductSyncContextRow = {
  provider: string;
  connection_status: string;
  authorized_shop_id: string;
  external_shop_id: string;
  shop_cipher_ciphertext: string;
};

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

  const admin = createAdminClient();

  const {
    data: contextRows,
    error: contextError,
  } = await admin.rpc(
    "get_marketplace_product_sync_context",
    {
      p_organization_id:
        currentOrganization.organizationId,
      p_marketplace_account_id: account.id,
      p_user_id: user.id,
    },
  );

  if (contextError) {
    return NextResponse.json(
      { error: contextError.message },
      { status: 500 },
    );
  }

  const context =
    Array.isArray(contextRows) &&
    contextRows.length > 0
      ? (contextRows[0] as ProductSyncContextRow)
      : null;

  if (!context) {
    return NextResponse.json(
      {
        error:
          "Pilih Authorized Shop terlebih dahulu sebelum product sync.",
      },
      { status: 409 },
    );
  }

  if (context.connection_status !== "active") {
    return NextResponse.json(
      {
        error:
          "Marketplace seller connection tidak aktif.",
      },
      { status: 409 },
    );
  }

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

  if (
    !hasProductBasicScope(
      tokenContext.grantedScopes,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Scope seller.product.basic belum diberikan.",
      },
      { status: 403 },
    );
  }

  try {
    const accessToken =
      tokenContext.accessToken;

    const shopCipher =
      decryptMarketplaceSecret(
        context.shop_cipher_ciphertext,
      );

    const result = await searchProducts({
      accessToken,
      shopCipher,
      pageSize: 100,
    });

    const products = result.products.map(
      (product) => ({
        external_product_id:
          product.externalProductId,
        title: product.title,
        status: product.status,
        create_time: product.createTime,
        update_time: product.updateTime,
        skus: product.skus.map((sku) => ({
          external_sku_id: sku.externalSkuId,
          seller_sku: sku.sellerSku,
          currency: sku.currency,
          sale_price: sku.salePrice,
          tax_exclusive_price:
            sku.taxExclusivePrice,
          inventory: sku.inventory,
        })),
      }),
    );

    const {
      data: syncedCount,
      error: syncError,
    } = await admin.rpc(
      "upsert_marketplace_catalog_page",
      {
        p_organization_id:
          currentOrganization.organizationId,
        p_marketplace_account_id: account.id,
        p_authorized_shop_id:
          context.authorized_shop_id,
        p_user_id: user.id,
        p_provider: TIKTOK_SHOP_PROVIDER,
        p_products: products,
        p_request_id: result.requestId,
        p_total_count: result.totalCount,
        p_has_more:
          result.nextPageToken !== null,
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
          : products.length,
      total_count: result.totalCount,
      has_more:
        result.nextPageToken !== null,
      note:
        result.nextPageToken !== null
          ? "M3 checkpoint syncs the first 100 products only; pagination will be enabled after real Partner Center runtime validation."
          : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Product catalog sync gagal.",
      },
      { status: 502 },
    );
  }
}
