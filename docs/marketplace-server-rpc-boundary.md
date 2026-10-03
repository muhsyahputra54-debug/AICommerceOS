# Marketplace server RPC boundary

Baseline: staging `aab973b`. Staging catalog output confirmed that seven shared
Shopee/TikTok Shop SECURITY DEFINER RPCs were executable by anon/authenticated.
The baseline secret readers accept `p_user_id` as membership identity instead of
binding it to a calling session. RLS on tables does not prevent that RPC path.

The new migration `20261004001000_marketplace_server_rpc_boundary.sql`:

- revokes PUBLIC/anon/authenticated privileges on the seven exact signatures;
- grants execution to service_role;
- checks `coalesce(auth.role(), '') = 'service_role'` before any read/mutation;
- converts the two SQL credential readers to guarded PL/pgSQL RETURN QUERY;
- retains existing membership, provider, identity, token concurrency, state
  consumption, and shop-cipher business checks;
- leaves dashboard metadata RPCs and table schemas unchanged.

The targeted functions are create/consume marketplace OAuth state,
get_marketplace_connection_secret, get_marketplace_connection_refresh_context,
upsert_marketplace_connection, apply_marketplace_connection_token_refresh,
and sync_marketplace_authorized_shops. Application callers for these functions
use the admin client. The guard trusts the server role JWT supplied by Supabase;
it must not use current_user because SECURITY DEFINER changes effective identity.

## Verification

`npm ci --ignore-scripts --no-audit --no-fund` then `npm test` inside
`scripts/marketplace-rpc-db-tests` runs disposable in-memory PGlite by default.
An optional LAKUVO_MARKETPLACE_TEST_DATABASE_URL is accepted only for loopback
and database lakuvo_test_marketplace. CI runs the same suite on PostgreSQL 17.

Fixtures and original function definitions/grants are extracted from the tracked
baseline. Tests reproduce the old anonymous read with synthetic credentials,
then verify exact grants, denial for both browser roles, defense after an
accidental regrant, missing-role denial, service-role membership boundaries,
one-use OAuth state, connection persistence, Shopee token rotation/shop sync,
and retained TikTok Shop seller/expiry/shop-cipher checks.

No provider HTTP or real credentials are used. Local passing tests do not prove
remote deployment; CI PostgreSQL results and a catalog postflight are separate.

## Applying on staging

Review and merge the patch, verify linked project is ogqsmnurtbexpvbyrvtn, and
perform `supabase db push --linked --dry-run`. Only this new migration should be
pending. Apply in a separate explicitly authorized staging step. Never edit an
already-applied baseline, run a reset, or target production.

Postflight should show anon_execute=false, authenticated_execute=false,
server_execute=true and security_definer=true for all seven signatures.
This patch does not certify or harden every other SECURITY DEFINER function in
the baseline. Follow-up audit of additional marketplace and commerce RPCs is
still needed; no broader security certification is implied.

OAuth environment preflight, Shopee refresh window/concurrency/recovery, and
product/order/inventory support remain separate work. TikTok Creator publishing
uses separate RPCs and its refresh flag remains off.
