# Tokopedia & Shop Connector — M4 Read-Only External Order Import

M4 adds a privacy-minimized, read-only operational order mirror.

Verified API direction:

- Get Order List uses `POST /order/202309/orders/search`
- order access uses `seller.order.info`
- seller authorization uses `x-tts-access-token`
- requests are signed with the existing HMAC-SHA256 signer
- the selected shop cipher is supplied server-side

M4 stores only operational fields needed to build later order workflows:

- external order id and status
- create/update timestamps
- non-PII payment summary
- non-PII line item identifiers, names, SKUs, quantities, and prices
- optional link visibility to an existing AICommerceOS internal order

M4 deliberately does NOT persist:

- recipient name
- shipping address
- buyer phone
- buyer email
- any other recipient PII returned by detailed order APIs

M4 deliberately does NOT:

- create an internal order
- mutate `orders` or `order_items`
- mutate stock or inventory ledger
- change marketplace order status
- write anything back to TikTok Shop / Tokopedia & Shop

Checkpoint runtime is intentionally limited to the most recently updated seven-day window and one page of up to 50 orders. Pagination, detail enrichment, and webhook-driven incremental sync should only be enabled after real Partner Center runtime validation.
