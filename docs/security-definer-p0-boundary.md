# SECURITY DEFINER P0 privilege boundary

Baseline: staging `ec16cf8`.

## Why this patch exists

The staging catalog audit found a broad legacy EXECUTE surface on `public`
`SECURITY DEFINER` functions. The earlier marketplace credential hardening closed
seven credential/OAuth RPCs, but a second review found server-side billing,
AI-metering, marketplace-sync, and webhook persistence functions that were still
executable by `anon` and `authenticated`.

These functions do not use the browser session as their authority boundary. They
are called by trusted server routes through the Supabase admin/service-role client,
or they implement system-only DDL behavior. In particular, several marketplace
functions accept `p_user_id` only as a membership/business input; that parameter
must not be treated as proof of caller identity.

## Scope

Migration `20261027050000_security_definer_p0_boundary.sql` changes privileges
only. It does not rewrite function bodies or business rules.

Service-role-only groups:

- billing checkout/provider persistence and payment/webhook processing;
- AI usage metering persistence;
- marketplace sync-context reads;
- marketplace catalog/order page persistence;
- marketplace webhook inbox claim/complete/record operations.

`rls_auto_enable()` is an event-trigger implementation, not an application RPC,
so EXECUTE is revoked from browser roles and `service_role`.

## Deliberately not changed in this patch

Authenticated user workflows such as AI-agent steps, controlled marketplace order
reconciliation, marketplace-order bridging, automation actions, and billing-usage
refresh are not changed here. Their function bodies bind access to `auth.uid()` and
organization membership. A separate follow-up audit should remove unnecessary
`anon` EXECUTE grants without conflating that change with the server-only boundary.

## Application caller audit

The staging source uses the admin client for the reviewed active server paths:

- billing checkout attach/failure persistence;
- Midtrans webhook event recording, checkout payment processing, and entitlement
  activation;
- AI usage metering;
- TikTok Shop product/order sync context and page persistence;
- TikTok Shop webhook recording, claiming, completion, and order reconciliation
  persistence.

`process_billing_subscription_event` is retained as server-only because its contract
is provider/webhook subscription processing even when no current active caller is
required by this patch.

## Verification

The Vitest contract
`security-definer-p0-boundary-contract.test.ts` verifies exact reviewed signatures,
service-role grants, browser-role revocations, the system-only event-trigger
boundary, and that this migration does not replace function bodies.

After merge, database application is a separate explicitly authorized staging step.
Before applying:

1. verify linked project is staging (`ogqsmnurtbexpvbyrvtn`);
2. run `supabase migration list --linked`;
3. run `supabase db push --linked --dry-run`;
4. confirm only this migration is pending.

After applying, run a catalog postflight. For the fourteen server-only RPCs,
`anon_execute=false`, `authenticated_execute=false`, and
`service_role_execute=true` are required. For `rls_auto_enable`, all three
application-role EXECUTE checks should be false.

Do not apply this migration to production as part of review or CI.
