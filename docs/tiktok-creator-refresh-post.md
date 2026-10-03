# TikTok Creator staging refresh POST

Baseline: staging `36f2277` (PR #8). Adds POST
`/api/ai/publishing-provider-connections/tiktok/refresh` using the guarded coordinator.
GET now reads availability only (see `tiktok-creator-refresh-dashboard.md`).
It never refreshes tokens. No scheduler or auto-refresh hook is added.

## Default off

All three conditions must hold before configuration/connection reads or any refresh attempt:

- `TIKTOK_CREATOR_REFRESH_ENABLED` equals exactly `true` (missing/false stays disabled).
- `VERCEL_ENV` equals `preview`.
- `NEXT_PUBLIC_SUPABASE_URL` equals `https://ogqsmnurtbexpvbyrvtn.supabase.co`.

This patch does not modify environment settings. Keep the enable flag absent/false
through review and mock verification. Production is rejected even if a flag is set.
Do not enable or call live refresh as part of applying/testing this patch.

## Request and authorization

The existing controlled-action context verifies the signed-in user and owner/admin
role of the active organization. The organization comes exclusively from that session.
The configured `LAKUVO_APP_URL` must pass the OAuth app URL validator; both request
URL origin and Origin header must exactly match its origin. If Sec-Fetch-Site exists,
it must be `same-origin`. No wildcard origins or request-derived trust configuration.

JSON body (stream size limited to 1024 bytes, no extra fields):

```json
{"connectionId":"<uuid>","expectedConnectionVersion":7,"consent":true}
```

A session-authenticated metadata RPC must yield one active authorized TikTok
connection in the current organization with publishing scope and capability.
Only expired access tokens or tokens expiring within ten minutes can be refreshed.
The ID and version must match the body before creating an admin client. SQL claim
and finalize recheck version/ownership to protect against later reconnect/revoke.
The coordinator handles dispatch, token exchange, encryption and atomic persistence.

Success returns only incremented connection version and access expiry. Safe fixed
errors are logged with request correlation; every response is no-store. Failed
coordinator responses use 409, invalid configuration/availability 503, invalid
metadata 502, invalid input 400, and origin/activation denial 403.
No raw database exception, token, ciphertext or client secret is logged/returned.

## Validation and remaining work

Route tests mock session, metadata, admin RPC and coordinator; global fetch is forbidden.
Tests cover activation scope, authorization, origins, consent/body size, missing
configuration, organization binding, stale version, expiry window and safe responses.
The AI route observability census increases from 25 to 26.
No remote database write or provider HTTP is performed by these tests.

Next: expose safe version/refresh availability and recovery state to the dashboard,
add a deliberate user refresh action with no automatic retries, and verify disabled
behavior in Preview. Live sandbox verification is a separate operational step.
