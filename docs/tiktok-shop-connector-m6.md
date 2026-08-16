# Tokopedia & Shop Connector — M6 Controlled Webhook Reconciliation

M6 turns the M5 webhook inbox into a controlled reconciliation queue.

Verified official behavior used here:

- notification type `1` is Order Status Change
- Order Status Change includes `order_id`, `order_status`, and `update_time`
- Get Order Detail is `GET /order/202309/orders`
- Get Order Detail accepts up to 50 order IDs
- scope is `seller.order.info`
- seller access token is sent in `x-tts-access-token`
- selected `shop_cipher` is required

Important authority rule:

The webhook payload is never treated as the final commerce truth.

For an Order Status Change event M6:

1. claims the event idempotently
2. decrypts the existing seller token and selected shop cipher server-side
3. calls Get Order Detail for the exact order ID
4. updates only the separate read-only `marketplace_external_orders` mirror
5. marks the webhook event `processed`

Other notification types are marked `ignored` in M6. They can receive dedicated processors later.

Retries:

- `received` and `error` events may be claimed again
- max 5 attempts
- a `processing` event older than 10 minutes may be reclaimed
- `FOR UPDATE SKIP LOCKED` prevents concurrent workers from claiming the same queue row

No internal commerce mutation:

- no `orders` mutation
- no `order_items` mutation
- no inventory reservation/deduction
- no stock mutation
- no marketplace write-back

The queue is manually triggered from the marketplace detail screen at this checkpoint. Scheduled/background processing should be added only after real Partner Center runtime validation.
