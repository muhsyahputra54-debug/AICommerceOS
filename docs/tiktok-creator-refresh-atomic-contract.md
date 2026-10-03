# TikTok Creator atomic refresh contract (draft)

Baseline: staging `0c6d977` (PR #5). The SQL is under `database/`, not under
`supabase/migrations/`: this PR does not apply changes to a remote database.
No route invokes these RPCs. Automatic refresh remains inactive.

## Ownership and transitions

`claim_tiktok_creator_refresh` locks the organization-scoped TikTok connection,
checks its expected version, authorized state, publishing scope and refresh
credential expiry. Only the winner receives the encrypted refresh context and a
new random attempt ID. The attempt table stores no tokens or ciphertext.

`dispatch_tiktok_creator_refresh` transitions prepared to dispatched exactly once.
The future coordinator must commit this RPC and receive `true` before sending the
provider request. An uncertain dispatch response must not send a request.

`finalize_tiktok_creator_refresh` checks ownership, current connection version and
credential reference, then atomically writes both token ciphertexts, both expiries,
key version, returned scopes, connection expiry and incremented version. Returned
tokens must first pass the runtime account/scope validation and encryption helper.
The RPC assumes its trusted server caller supplies actual encrypted values.

`finish_tiktok_creator_refresh_failure` supports:

| Outcome | Allowed prior state | Effect |
| --- | --- | --- |
| cancelled | prepared | A new claim may be issued; no provider request was sent |
| uncertain | dispatched | Blocks reuse of the old token until reconnection |
| reauthorization_required | dispatched | Marks the connection and increments its version |

Dispatched/uncertain attempts are never reclaimed by elapsed time. If a worker dies,
the token may already have rotated remotely. This deliberately requires recovery
or reconnection rather than replay. Definitive rejected requests can initially use
the conservative uncertain path; do not mark reauthorization for network, rate limit
or application configuration errors.

The existing OAuth upsert and revoke paths increment connection version and lock
the connection row. A new OAuth connection version permits a new claim, while old
attempt IDs cannot dispatch, finalize or mark the new connection as invalid.
The original YouTube access-only rotation RPC is unchanged.

## Local tests without Docker or Supabase

```powershell
Set-Location C:\Project\AICommerceOS\scripts\tiktok-refresh-db-tests
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

The default harness creates an in-memory PGlite database with small organization/auth
fixtures and loads the actual Phase 19, 19.1 and draft 19.2 SQL. It does not read
application env files or real credentials. Tests cover privileges, RLS, state transitions,
replacement token pair, rollback, stale ownership and revoke/reconnect ordering.
PGlite has one backend connection: the parallel-connection cases are explicitly skipped.

The new CI workflow uses disposable PostgreSQL 17 and runs all parallel tests using
separate `pg` clients. CI must pass before treating concurrency as verified. The harness
rejects non-loopback URLs and database names other than `lakuvo_test_refresh`.

## Remaining integration

After CI review, convert the reviewed SQL into a staging migration with a verified
staging target. Then implement the authenticated server coordinator and POST route,
bind the response identity to the claimed account, cancel only before dispatch, and
persist success before returning safe metadata. Keep health GET read-only. Update
dashboard handling for busy/uncertain/reauthorization states and test everything with
mock transport before any live sandbox verification. Production is outside this change.
