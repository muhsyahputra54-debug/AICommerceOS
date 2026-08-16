# Tokopedia & Shop Connector — M3 Product Catalog Read-Only Sync

M3 adds a deliberately read-only external product catalog.

Official API target:

- POST `https://open-api.tiktokglobalshop.com/product/202502/products/search`
- scope: `seller.product.basic`
- required seller token header: `x-tts-access-token`
- required query parameters include `app_key`, `timestamp`, `sign`, `shop_cipher`, and `page_size`
- page size supports 1–100
- the API returns key product properties and SKUs

M3 safety boundaries:

- seller access token remains encrypted at rest
- selected shop cipher remains encrypted at rest
- neither secret is returned to the browser
- external products are stored separately from internal `products`
- external SKUs are stored separately from internal `product_variants`
- no internal stock mutation
- no internal price mutation
- no order mutation
- no marketplace write-back

M3 intentionally synchronizes the first page only (maximum 100 products). The API supports pagination, but full-catalog pagination is deferred until the first real Partner Center runtime test so timeout and latency behavior can be measured before enabling multi-page background sync.
