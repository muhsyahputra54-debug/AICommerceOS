# Tokopedia & Shop Connector — M1

This checkpoint adds only the seller OAuth and secure credential foundation.

## What M1 does

- creates a single-use, expiring OAuth state
- redirects a seller to the TikTok Shop / Tokopedia & Shop seller authorization flow
- exchanges the returned authorization code for seller access/refresh tokens
- encrypts both tokens with AES-256-GCM before database storage
- stores only encrypted token envelopes in `marketplace_connections`
- exposes a safe connection-status RPC without exposing credentials
- adds a Connect / Reconnect action to the marketplace detail screen
- includes the HMAC-SHA256 request signer needed by later business API calls

## What M1 deliberately does not do yet

- no Get Authorized Shops call
- no product import
- no order import
- no stock or price write
- no webhook ingestion
- no customer chat
- no direct mutation of orders/order_items/inventory

## Partner Center configuration

For Indonesia / Rest of World seller authorization, configure your Partner Center app Redirect URL to:

`https://<your-staging-host>/api/marketplaces/tiktok-shop/callback`

The production URL should only be added when the connector has passed staging verification.

Required server-only environment variables:

- `TIKTOK_SHOP_SERVICE_ID`
- `TIKTOK_SHOP_APP_KEY`
- `TIKTOK_SHOP_APP_SECRET`
- `MARKETPLACE_TOKEN_ENCRYPTION_KEY`

Generate the encryption key locally with PowerShell:

```powershell
$key = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($key)
[Convert]::ToBase64String($key)
```

Put the result only in `.env.local` / Vercel server environment.
Never prefix any of these variables with `NEXT_PUBLIC_`.

## Apply order

1. Run `database/marketplace-connector-tiktok-shop-m1.sql` in Supabase SQL Editor.
2. Apply the source patch.
3. Add only placeholder env names to repository; keep real values local/server-only.
4. Run `pnpm --dir .\apps\web exec tsc --noEmit`.
5. Run `git diff --check`.
6. Do not perform real seller OAuth until a Partner Center development app / shop is available.
