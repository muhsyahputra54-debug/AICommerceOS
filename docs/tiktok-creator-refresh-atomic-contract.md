# TikTok Creator atomic refresh contract (draft)

Baseline: staging `f157606` (PR #6). The reviewed SQL is now copied into
`supabase/migrations/20261003151000_phase_19_2_tiktok_creator_refresh_atomic_contract.sql`.
Only the first comment differs from the reviewed draft. The test harness asserts
this parity and executes the migration itself. Adding the file does not apply it
to a remote database. No route invokes these RPCs; automatic refresh remains inactive.

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
fixtures and loads the actual Phase 19, 19.1 and Phase 19.2 migration SQL. It does not read
application env files or real credentials. Tests cover privileges, RLS, state transitions,
replacement token pair, rollback, stale ownership and revoke/reconnect ordering.
PGlite has one backend connection: the parallel-connection cases are explicitly skipped.

The new CI workflow uses disposable PostgreSQL 17 and runs all parallel tests using
separate `pg` clients. CI must pass before treating concurrency as verified. The harness
rejects non-loopback URLs and database names other than `lakuvo_test_refresh`.

## Remaining integration

Before applying the migration, verify the linked staging target
`ogqsmnurtbexpvbyrvtn`, compare local/remote migration history, and inspect
`supabase db push --linked --dry-run`. The expected pending migration is only
`20261003151000`. Stop if another pending migration appears. Record CI and dry-run
results before applying and verify history plus RPC privileges afterwards.

Then implement the authenticated server coordinator and POST route,
bind the response identity to the claimed account, cancel only before dispatch, and
persist success before returning safe metadata. Keep health GET read-only. Update
dashboard handling for busy/uncertain/reauthorization states and test everything with
mock transport before any live sandbox verification. Production is outside this change.
