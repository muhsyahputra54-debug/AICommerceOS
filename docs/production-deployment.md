# AICommerceOS — Production Deployment

## Phase 16 Scope

Phase 16 prepares AICommerceOS for a production runtime
without coupling the application to a specific hosting
provider.

No Vercel, Netlify, Docker, or other provider configuration
is assumed until a deployment target is explicitly selected.

## Production Architecture

Application:

- Next.js web application
- Supabase authentication and PostgreSQL
- Tenant isolation through organization membership and RLS
- Protected commerce RPCs
- Server-side AI provider calls
- Provider-neutral billing foundation

## Environment Configuration

Use:

`apps/web/production.env.example`

as the production environment variable template.

The template intentionally contains no credential values.

Never commit:

- Supabase secrets
- OpenAI API keys
- payment-provider secrets
- webhook secrets
- production passwords

Environment values must be configured directly in the
selected production platform.

## Required Infrastructure

The application requires the Supabase variables referenced
by the current application source.

AI-related functionality additionally requires an
OpenAI API key when real provider execution is enabled.

Without an OpenAI API key, AI provider execution remains
unavailable by design while the rest of the commerce
application continues to operate.

## Health Endpoints

Liveness:

`GET /api/health`

Expected response:

HTTP 200

with:

`status: ok`

Readiness:

`GET /api/readiness`

Expected production response:

HTTP 200

with:

`status: ready`

A missing required runtime configuration returns HTTP 503.

Neither endpoint exposes credential values.

## Security Headers

The Next.js production configuration enables:

- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security in production

The default Next.js powered-by header is disabled.

## Database Deployment

Database schema changes must be applied intentionally.

Do not automatically execute destructive development or QA
SQL against production.

Transactional destructive tests used during development must
continue to end in ROLLBACK.

Protected SECURITY DEFINER functions must preserve:

`SET search_path = public, pg_temp`

Core order and automated-commerce mutation authority must
remain inside the protected RPC architecture established in
earlier phases.

## Production Build

From the web application directory:

```text
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

All commands must exit successfully before release.

## Production Runtime

The existing production script is:

```text
pnpm start
```

The hosting platform may invoke the equivalent Next.js
production start command when applicable.

## Release Verification

Before production release verify:

1. TypeScript passes.
2. ESLint passes.
3. Next.js production build passes.
4. `/api/health` returns HTTP 200.
5. `/api/readiness` returns HTTP 200.
6. Authentication works.
7. Organization tenant isolation works.
8. Products and inventory load correctly.
9. Order lifecycle uses protected RPCs.
10. Price monitoring remains operational.
11. Automated-commerce protected execution remains intact.
12. Analytics pages load.
13. Billing page loads.
14. No production secrets exist in Git.
15. Git working tree is clean and synchronized.

## Deferred External Integrations

The following require real provider credentials or an
explicit deployment target and are therefore external
release dependencies rather than local implementation
assumptions:

- production hosting provider
- production domain / DNS
- real OpenAI execution
- commercial payment provider
- billing checkout
- payment webhooks
- invoice/payment settlement

These integrations must be verified separately when their
providers and credentials are available.
