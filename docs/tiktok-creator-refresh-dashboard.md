# TikTok Creator access renewal dashboard

Baseline: staging `9059b9a` (PR #9). Adds a user-controlled renewal panel to the
connection health area. The enable flag remains absent/false; no environment,
migration or production changes are included.

## Read-only availability

GET `/api/ai/publishing-provider-connections/tiktok/refresh` reports availability;
it never claims an attempt, decrypts credentials, invokes the coordinator or calls
TikTok. It verifies the existing owner/admin session context. When disabled, it
returns `disabled` without querying connection metadata. Enabled availability is
restricted by the same Preview/staging project gate as POST and the configured
application origin. OAuth client configuration/keyring must exist.

The response contains only `availability.status` and `availability.target`:
`disabled` or `unavailable` with null target, or `eligible` with connection UUID
and current expected version. This is configuration/connection metadata readiness,
not proof that refresh credentials are valid or that no server attempt is pending.
POST and the SQL ownership contract remain authoritative for those checks.

## Explicit user action

The panel loads availability using GET only, with cancellation on unmount.
Consent is unchecked by default. POST happens only after checking consent and
pressing the renewal button. A synchronous ref prevents duplicate clicks.
No automatic POST, retry, timer or token renewal on mount is added.

Before POST, the client stores a `submitted` marker in sessionStorage keyed by
connection UUID and version. It contains no token, ciphertext, account ID or secret.
Storage failure blocks submission. The marker remains after response loss or success;
a new connection version uses a different key. Reloading in the same tab preserves
the block. Other tabs/devices are fenced by the database claim, not browser storage.
The browser marker is not a database-wide attempt status and does not replace SQL.

Busy, success, reauthorization and recovery views contain no submission button.
Recovery instructs the user not to repeat the request, and to reconnect or seek
administrator review. Success asks the user to check connection health again.
Availability rechecks remain GET-only and never clear an uncertain version marker.
No raw API error is rendered to the user. Copy supports Indonesian and English.

## Verification

Tests mock transport/RPC and use synthetic metadata; they do not call a provider or
remote database. Coverage includes read-only availability, auth/config denial,
strict client parsing, consent, same-version concurrent calls, retained recovery
markers, storage failure, malformed responses and accessible view states.
UI tests verify rendered markup; live browser interaction is still unverified.
No enablement or live refresh is performed when applying or testing this patch.

Future: verify disabled Preview behavior, then separately authorize one deliberate
sandbox request if desired. Persistent cross-device attempt-state display would
require a separate safe server read contract; current SQL already prevents replay.
