# Tokopedia & Shop Connector — M2 Authorized Shops

M2 adds the first real read-only business API integration on top of M1 seller OAuth.

Official API target:

- GET `https://open-api.tiktokglobalshop.com/authorization/202309/shops`
- required seller access token header: `x-tts-access-token`
- required query parameters: `app_key`, `timestamp`, `sign`
- required scope: `seller.authorization.info` or `test.scope.public`

M2 behavior:

1. Authenticated AICommerceOS member requests an Authorized Shops sync.
2. Server validates organization/account membership.
3. Service-role RPC returns only the encrypted seller connection envelope.
4. Server decrypts the seller access token in memory.
5. Server signs and calls Get Authorized Shops.
6. Every returned `shop_cipher` is encrypted with the existing marketplace token encryption key.
7. Safe shop metadata is persisted in `marketplace_authorized_shops`.
8. Browser can view safe shop metadata through a membership-checked RPC.
9. Browser can select one active shop; this writes only `marketplace_accounts.external_shop_id` and safe metadata.
10. No product, order, stock, price, or customer data is mutated.

Real runtime testing remains blocked until a Partner Center development app / seller authorization is available.
