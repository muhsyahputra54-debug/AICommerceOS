# Tokopedia & Shop Connector — M7 Controlled External Order Bridge

M7 adds a human-approved bridge from the read-only marketplace order mirror to AICommerceOS internal orders.

## Existing commerce authority reused

Live audit confirms:

- `create_order(p_organization_id uuid, p_customer_id uuid, p_items jsonb) -> uuid`
- `update_order_status(p_organization_id uuid, p_order_id uuid, p_new_status text) -> text`
- both functions are SECURITY DEFINER with `search_path=public, pg_temp`
- `orders.customer_id` is mandatory
- `order_items.variant_id` is optional
- external marketplace order items contain external product ids, seller SKU, quantity, and price metadata

The existing order UI calls `create_order` with item payload:

- `product_id`
- optional `variant_id`
- `quantity`

M7 preserves that exact contract.

## Controlled mapping

For every external line item:

1. Prefer exactly one active Variant listing mapping where `external_sku` equals the external order item's `seller_sku`.
2. If there is no Variant match, require exactly one active Product listing mapping where `external_listing_id` equals `external_product_id`.
3. Missing or ambiguous mappings block the bridge.

## Human approval

The marketplace mirror intentionally does not store customer PII. Because internal `orders.customer_id` is mandatory, the operator must explicitly select an existing AICommerceOS customer before bridging.

M7 does not auto-create a customer.

## Transaction / authority

`bridge_marketplace_external_order(...)`:

- validates authenticated organization membership
- locks the external order row
- is idempotent if an order link already exists
- validates all line mappings
- calls `public.create_order(...)`
- creates `marketplace_order_links`
- appends a marketplace sync log

It never directly inserts into `orders` or `order_items`.

The internal order remains `pending`. Inventory behavior remains owned by the existing `update_order_status(...)` lifecycle; M7 performs no stock deduction itself.

## Deliberate exclusions

- no automatic order status mapping
- no automatic inventory mutation
- no marketplace write-back
- no automatic customer creation
- sample orders cannot be bridged
