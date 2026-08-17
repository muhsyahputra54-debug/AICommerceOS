# TikTok Shop Connector — M9.3 Automatic Token Refresh

M9.3 hardens the server-side TikTok Shop token lifecycle without adding any
marketplace write-back.

## Source audit findings

Before M9.3, the connector already stored encrypted access and refresh tokens,
plus both expiration timestamps. The sync routes decrypted the access token
directly and returned a reconnect error once it was expired.

The live database audit also confirmed that `marketplace_connections` already
contains:

- `access_token_ciphertext`
- `refresh_token_ciphertext`
- `access_token_expires_at`
- `refresh_token_expires_at`
- `last_refreshed_at`
- `open_id`
- `user_type`
- `granted_scopes`

No token-lifecycle columns are added in M9.3.

## Refresh behavior

M9.3 adds a centralized server-only token manager.

For every TikTok Shop operation that needs an access token:

1. Load the encrypted connection through a service-role-only refresh-context RPC.
2. If the access token expires more than 24 hours from now, decrypt and use it.
3. If the access token is within the 24-hour refresh window, check the known
   refresh-token expiration.
4. Decrypt the refresh token only on the server.
5. Call TikTok Shop `GET /api/v2/token/refresh`.
6. Validate a successful seller response, including `open_id`, `user_type`,
   and future expiration timestamps.
7. Re-encrypt both returned tokens with AES-256-GCM.
8. Persist the new credential set through the dedicated service-role-only RPC.
9. Continue the original shop/product/order/webhook reconciliation request with
   the refreshed access token.

If the refresh token is known to be expired, the connector stops and asks for
seller reauthorization.

## Identity protection

A refreshed credential set cannot silently switch seller identity.

The application checks the returned `open_id` and `user_type` against the
existing connection. The database repeats those checks while holding a row lock.
Seller authorization remains restricted to `user_type = 0`.

## Concurrency protection

Token refresh can race when multiple server requests arrive near token expiry.

The persistence RPC receives the previous encrypted refresh token as an
optimistic concurrency value. It updates the connection only if that ciphertext
is still current.

If another request persisted a newer credential set first, the slower request
does not overwrite it. Instead, the application reloads the newer connection
and continues with the access token stored by the winning refresh.

This does not guarantee that two server instances will never call TikTok's
refresh endpoint at the same time, but it prevents stale credentials from
overwriting a newer database state.

## Database authority and grants

New RPCs:

- `get_marketplace_connection_refresh_context(...)`
- `apply_marketplace_connection_token_refresh(...)`

Both are `SECURITY DEFINER`, use `search_path=public, pg_temp`, and are executable
only by `service_role`. `anon` and `authenticated` do not receive direct execute
permission.

Both RPCs still validate that the supplied user belongs to the organization.

`apply_marketplace_connection_token_refresh` changes only token-lifecycle fields:

- access/refresh ciphertext
- access/refresh expiration
- missing seller identity fields when safe
- granted scopes
- `last_refreshed_at`
- non-sensitive refresh metadata
- `updated_at`

It deliberately does not change `connected_at` or `connected_by`.

## Existing runtime paths hardened

Automatic token validation/refresh is used by:

- Authorized Shops sync
- Product catalog sync
- External order sync
- Controlled webhook order reconciliation

The HTTP responses may include `token_refreshed: true|false` for safe runtime
observability. No token value or ciphertext is returned.

## Deliberate exclusions

M9.3 does not add:

- marketplace stock write-back
- marketplace price write-back
- automatic internal commerce mutations
- browser-side token access
- token logging
- background refresh scheduling
- a real Partner Center runtime claim

The connector still lacks real TikTok Shop Partner Center credentials, so the
refresh flow is implemented and statically QA'd but remains pending real runtime
validation.
