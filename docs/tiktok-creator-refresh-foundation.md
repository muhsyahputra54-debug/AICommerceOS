# TikTok Creator refresh foundation

Baseline: staging `de5e9d5e64e98cec81eca0e4b040c9d1cca10add`.

This patch adds an unconnected server runtime foundation, tested using injected mock
transport. It does not enable automatic refresh, add a route, change dashboard
behavior, apply SQL, or change environment variables. Expired access still fails
closed in the existing Creator Info path.

## Response and encryption contract

- POST only to the existing fixed TikTok OAuth v2 token endpoint. Redirects fail;
  timeout is 20 seconds. Transport must be supplied explicitly.
- Use `client_key`, `client_secret`, `grant_type=refresh_token`, `refresh_token`.
- Validate account identity, Bearer type, positive durations and `video.publish`.
- Retain the returned refresh token, including when it differs from the old token.
- Encrypt both returned tokens with the active key and organization/account/token-kind
  binding. Compute both expiries using the supplied timestamp; reject invalid dates.
- Return safe error codes without provider descriptions, token values or raw errors.
- HTTP 400 `invalid_grant` is classified as requiring reauthorization. Other errors
  are not interpreted as revocation. Lost responses are ambiguous, with no retry.

Source: https://developers.tiktok.com/docs/en/oauth-user-access-token-management

## Persistence and concurrency requirements before wiring a route

The existing `rotate_publishing_provider_access_token` RPC preserves the old refresh
token. It is unsuitable for this TikTok response. Do not reuse OAuth connection
upsert to implement refresh: it bypasses refresh ownership/version checks.

Implement a dedicated service-role-only claim/finalize contract in a new migration:

1. Claim by organization, provider and connection, checking authorization, credential
   identity, refresh expiry, and expected connection version. Persist an opaque attempt
   identifier and fencing generation before any provider request. Concurrent callers
   must receive busy and cannot decrypt/send another refresh request.
2. Finalize with the same attempt identifier, fencing generation and version; lock
   and validate the current credential reference. Atomically write both ciphertexts,
   both expiries, key version, granted scopes and connection expiry/version.
3. Reauthorization and revocation must invalidate outstanding claims. A stale result
   must never overwrite a reconnected credential or revive a revoked connection.
4. Timeout, lost JSON response, response validation failure after provider success,
   and persistence failure may follow provider-side rotation. Keep the attempt in an
   uncertain state; lease expiry alone must not permit replay of the old refresh token.
5. Mark reauthorization only for a verified terminal rejection and a still-owned
   attempt. Never mark it on rate limits, network errors or client configuration errors.
6. Add database transaction tests for one winner, duplicate finalize, stale version,
   revoke/reconnect races and rollback when credential update fails. Static SQL tests
   are insufficient to certify this concurrency contract.

Then wire an authenticated organization-scoped POST operation, return metadata only,
and update dashboard status. The metadata GET health endpoint must remain read-only.
The refresh coordinator must not publish content. Live verification is a separate step.

## Validation

Mock tests cover replacement refresh tokens, account/scope mismatch, malformed data,
HTTP errors, one-attempt network failure, encryption round trips, identity binding
and invalid dates. No real credentials or provider calls are used.
