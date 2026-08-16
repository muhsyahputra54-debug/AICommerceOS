# Tokopedia & Shop Connector — M5 Webhook Foundation

M5 adds a secure, idempotent webhook intake endpoint.

Official behavior used by this implementation:

- Partner Center sends webhook notifications as HTTPS POST requests.
- The webhook signature is carried in the `Authorization` request header.
- Signature verification uses HMAC-SHA256.
- Signature base string is `{app_key}{raw webhook payload}`.
- The HMAC key is the TikTok Shop app secret.
- A successful webhook receiver should return HTTP 200 with an empty body within 3 seconds.
- Authentication failure should return HTTP 401.
- Failed deliveries are retried by TikTok Shop.
- Webhooks should not be treated as the only source of truth; polling/scheduled reconciliation remains necessary.

Endpoint:

`POST /api/marketplaces/tiktok-shop/webhook`

Security and privacy:

- signature is verified before JSON processing
- constant-time signature comparison
- idempotency uses notification id, falling back to SHA-256 of the exact raw payload
- raw payload is NOT stored
- address/name/phone/email are NOT stored
- only operational identifiers/status/timestamps are persisted
- webhook does NOT mutate internal orders, order items, products, or inventory
- webhook does NOT write back to the marketplace

Partner Center configuration is intentionally deferred until the development app credentials are available.

Recommended staging URL:

`https://<staging-host>/api/marketplaces/tiktok-shop/webhook`

For the first live test, subscribe only to non-PII operational topics such as order status change. Do not subscribe to recipient-address update during the M5 foundation test.
