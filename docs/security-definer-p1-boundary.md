# SECURITY DEFINER P1 privilege boundary

Baseline: staging `408d7c2a77e623ce6476a45a64058dcb3f1a0760`.

## Why this patch exists

After the P0 server-only boundary was applied to staging, a catalog postflight
showed 52 remaining `public` `SECURITY DEFINER` functions with effective
`anon EXECUTE`.

P1 narrows that remaining surface without changing function bodies.

## Classification

### Server-only (6)

These functions are not browser authority boundaries:

- `check_ai_allowance(uuid)` — active runtime caller uses `createAdminClient()`.
- `claim_billing_checkout_intent(uuid,text,text,text,jsonb)` — active billing
  checkout caller uses `createAdminClient()`.
- `create_billing_checkout_session(uuid,text,text,text,text,jsonb)` — legacy
  checkout persistence function; no active non-test runtime caller was found.
- `get_ai_usage_summary(uuid,timestamptz,timestamptz)` — legacy AI usage read;
  no active non-test runtime caller was found.
- `provision_publishing_channel_destination(...)` — function body already
  requires `auth.role() = 'service_role'`; no active runtime caller was found.
- `revoke_publishing_channel_destination(uuid,uuid)` — function body already
  requires `auth.role() = 'service_role'`; no active runtime caller was found.

For these six functions P1 revokes `PUBLIC`, `anon`, and `authenticated`, then
explicitly grants `service_role`.

### System-only trigger (1)

`record_inventory_stock_movement()` returns `TRIGGER` and is invoked by database
triggers, not as an application RPC. P1 revokes direct EXECUTE from `PUBLIC`,
`anon`, `authenticated`, and `service_role`. The function owner retains the
rights required for trigger execution.

### Authenticated-user functions (45)

The remaining 45 functions use `auth.uid()` as part of their user/session
contract. P1 removes `PUBLIC` and `anon` execution while preserving explicit
`authenticated` and `service_role` execution.

This is an anonymous-access hardening step, not a claim that every
authenticated `SECURITY DEFINER` function has completed a least-privilege
review. A later audit should review whether any of these functions can become
`SECURITY INVOKER`, move to a private schema, or require a narrower server-only
boundary.

## Runtime caller audit

The staging source audit scanned 299 non-test `.ts` / `.tsx` runtime files.

Among the six non-user functions:

- `claim_billing_checkout_intent` is called by
  `apps/web/src/app/api/billing/checkout/route.ts` through the admin client.
- `check_ai_allowance` is called by
  `apps/web/src/lib/ai/metering.ts` through the admin client.
- No runtime caller was found for
  `create_billing_checkout_session`,
  `get_ai_usage_summary`,
  `provision_publishing_channel_destination`, or
  `revoke_publishing_channel_destination`.

## Migration contract

Migration `20261027060000_security_definer_p1_boundary.sql` changes ACLs only.

It must not:

- create, replace, or drop function bodies;
- grant any reviewed function to `anon` or `PUBLIC`;
- remove `authenticated` access from the 45 reviewed authenticated-user
  contracts;
- grant direct application-role execution to the inventory trigger function.

## Validation before push

Run:

1. targeted P1 contract test;
2. full Vitest suite;
3. TypeScript;
4. ESLint with zero warnings;
5. production build.

Do not apply the migration during local review or CI.

## Staging database postflight after merge and authorized apply

Expected state:

- 6 server-only functions:
  `anon=false`, `authenticated=false`, `service_role=true`;
- `record_inventory_stock_movement()`:
  `anon=false`, `authenticated=false`, `service_role=false`;
- 45 authenticated-user functions:
  `anon=false`, `authenticated=true`, `service_role=true`.

Production and `main` remain out of scope.
