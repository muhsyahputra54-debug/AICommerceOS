# TikTok OAuth application URL preflight

Based on staging `f9cfb23` after PR #3.

The callback previously validated `LAKUVO_APP_URL` only when redirecting. A
successful token exchange and connection write could therefore be followed by
HTTP 503 instead of a dashboard redirect.

Both TikTok authorize and callback now validate the configured application
origin after authentication and before OAuth state issuance, state validation,
token exchange, encryption or persistence. Missing/invalid configuration returns
HTTP 503 with `Cache-Control: no-store`. The callback clears its OAuth cookie.
All callback outcomes use the same validated URL captured before processing.

Accepted values are HTTPS origins, or HTTP localhost origins for local development.
Credentials, non-root paths, query strings and fragments are rejected. Do not add
`/growth` or a callback path to this variable. Request headers and callback query
parameters never supply the redirect origin.

Preview staging configuration:

```text
LAKUVO_APP_URL=https://ai-commerce-os-git-staging-aicos1.vercel.app
```

Use a separate branch-specific origin for an audit preview. This patch does not
change environment variables, database schema, production, YouTube OAuth or the
generic `/api/readiness` contract. That readiness endpoint checks core Supabase
environment presence; HTTP 200 there does not certify TikTok OAuth configuration.

Tests mock authentication, provider exchange and database calls. Regression cases
prove that invalid configuration prevents state issuance and credential writes,
clears callback cookies, avoids secret logging, preserves invalid-state rejection
and retains the captured redirect destination after mocked persistence. No live
OAuth, refresh, upload or publishing is part of this validation.
