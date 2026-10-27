import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createMarketplaceSyncCursor,
  createMarketplaceSyncPage,
  createMarketplaceSyncResult,
  type CanonicalMarketplaceOrder,
  type CanonicalMarketplaceProduct,
} from "./sync-contract";

describe(
  "marketplace sync contract",
  () => {
    it(
      "normalizes provider pagination into one immutable page contract",
      () => {
        const cursor =
          createMarketplaceSyncCursor(
            "page_token",
            " next-page ",
          );

        const page =
          createMarketplaceSyncPage({
            items: [
              {
                externalProductId:
                  "product-1",
              },
            ],
            nextCursor: cursor,
            totalCount: 10,
            requestId:
              " request-1 ",
          });

        expect(page).toEqual({
          items: [
            {
              externalProductId:
                "product-1",
            },
          ],
          nextCursor: {
            kind: "page_token",
            value: "next-page",
          },
          totalCount: 10,
          requestId: "request-1",
        });

        expect(
          Object.isFrozen(page),
        ).toBe(true);

        expect(
          Object.isFrozen(page.items),
        ).toBe(true);

        expect(
          createMarketplaceSyncResult(
            "products",
            page,
          ),
        ).toEqual({
          entity: "products",
          syncedCount: 1,
          totalCount: 10,
          hasMore: true,
          nextCursor: {
            kind: "page_token",
            value: "next-page",
          },
          requestId: "request-1",
        });
      },
    );

    it(
      "fails closed for invalid pagination state",
      () => {
        expect(() =>
          createMarketplaceSyncCursor(
            "page_token",
            "   ",
          ),
        ).toThrow(
          /cursor value is required/i,
        );

        expect(() =>
          createMarketplaceSyncPage({
            items: [],
            totalCount: -1,
          }),
        ).toThrow(
          /non-negative integer/i,
        );

        expect(() =>
          createMarketplaceSyncPage({
            items: [1, 2],
            totalCount: 1,
          }),
        ).toThrow(
          /smaller than page item count/i,
        );
      },
    );

    it(
      "keeps product and order read models provider-neutral",
      () => {
        const product:
          CanonicalMarketplaceProduct =
          {
            externalProductId:
              "product-1",
            title: "Product One",
            status: "ACTIVE",
            externalCreateTime:
              1_700_000_000,
            externalUpdateTime:
              1_700_000_100,
            skus: [
              {
                externalSkuId:
                  "sku-1",
                sellerSku:
                  "SELLER-1",
                currency: "IDR",
                salePrice: "125000",
                taxExclusivePrice:
                  null,
                inventory: [
                  {
                    warehouse_id:
                      "warehouse-1",
                    available: 7,
                  },
                ],
              },
            ],
          };

        const order:
          CanonicalMarketplaceOrder =
          {
            externalOrderId:
              "order-1",
            status:
              "UNPAID",
            externalCreateTime:
              1_700_000_000,
            externalUpdateTime:
              1_700_000_100,
            isSampleOrder:
              false,
            fulfillmentType:
              null,
            deliveryOptionName:
              null,
            payment: {
              currency: "IDR",
              subTotal: "125000",
              shippingFee: "10000",
              originalShippingFee:
                "10000",
              sellerDiscount: "0",
              platformDiscount: "0",
              totalAmount: "135000",
            },
            lineItems: [
              {
                externalLineItemId:
                  "line-1",
                externalProductId:
                  "product-1",
                productName:
                  "Product One",
                externalSkuId:
                  "sku-1",
                skuName: null,
                sellerSku:
                  "SELLER-1",
                quantity: 1,
                originalPrice:
                  "125000",
                salePrice:
                  "125000",
              },
            ],
          };

        expect(
          product.externalProductId,
        ).toBe("product-1");

        expect(
          order.externalOrderId,
        ).toBe("order-1");
      },
    );
  },
);