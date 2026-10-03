# TikTok Creator refresh coordinator foundation

Baseline: staging `27fb4ca` (PR #7). Phase 19.2 staging application and its
four server-only RPC grants plus RLS were verified by the operator on 2026-10-03.

`coordinateTikTokCreatorRefresh` composes the reviewed runtime helpers and atomic
RPC contract. Database, transport and clock must be injected explicitly; there is
no route, scheduler, environment loader, default fetch or automatic refresh hook.
A future authenticated server adapter must derive organization membership from the
session and validate the requested connection before calling this module. Never
supply credentials or an RPC client from a browser.

- Validate configuration before creating an attempt.
- Claim the exact organization, connection and expected version.
- Validate the claimed context and decrypt the refresh token bound to organization,
  account, provider and token kind. Cancel preparation failures only before dispatch.
- Send one provider request only after receiving boolean `true` from dispatch.
  Lost dispatch responses send no request and require recovery.
- Validate response account and publishing scope, then encrypt both returned tokens.
  Derive expiries from the pre-dispatch clock, conservatively including request latency.
- Await atomic finalization and the expected incremented version before success.
  Success contains only version and access expiry, never credentials/ciphertext.
- Lost responses, invalid responses, rate limits and configuration rejection use
  guarded `uncertain` outcome without automatic retries. Only the runtime's terminal
  invalid-grant classification may mark reauthorization; confirm the guarded database
  update before reporting that status. Failed/stale finalization requires recovery.

RPC failures return fixed safe codes; raw database/provider exceptions are not returned.
The coordinator never retries a claim, dispatch, provider request or finalization.
An uncertain claim with no ownership ID cannot be cancelled by this worker. Recovery
remains a future server workflow; reconnect/version fencing protects current credentials.

Tests use mocked RPC/transport and synthetic encrypted tokens. They verify successful
pair rotation, preflight/clock validation, organization/account binding, cancellation,
dispatch confirmation, single request, uncertainty, terminal rejection and persistence
confirmation. No live provider or Supabase request is made by these tests.

Next: authenticated POST adapter with explicit enablement and request-origin checks,
then dashboard busy/recovery/reauthorization states. Health GET remains read-only.
This patch does not activate live refresh and does not change migrations or production.
