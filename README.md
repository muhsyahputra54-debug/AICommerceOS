# AICommerceOS

AICommerceOS adalah platform commerce multi-tenant berbasis Next.js, TypeScript, Supabase, dan PostgreSQL.

## Architecture

Core architecture:
- Authentication dan organization-aware multi-tenancy
- Row Level Security sebagai database security boundary
- Product dan product variant management
- Customer dan order management
- Inventory ledger dan stock lifecycle
- Product image management
- Product dan sales performance analytics
- Product variant integration dengan order

## Phase 5 — Product & Inventory Intelligence

Status: Complete

Milestone:
- 5.1 Product Data Architecture
- 5.2 Product Management
- 5.3 Inventory Architecture
- 5.4 Inventory Intelligence
- 5.5 Product Images
- 5.6 Product Performance
- 5.7 Security
- 5.8 Integration
- 5.9 QA
- 5.10 Completion

## Product & Variant Model

Base product order item:
- `product_id` = parent product
- `variant_id` = `NULL`

Variant order item:
- `product_id` = parent product
- `variant_id` = selected variant

Price dan cost disimpan sebagai historical snapshot dari database.

## Inventory Lifecycle

Inventory ledger disimpan melalui `inventory_movements` dengan movement utama:
- `opening`
- `adjustment`
- `order_deduction`
- `order_restore`

Lifecycle order:
- `pending -> processing`: stock deducted
- `processing -> cancelled`: stock restored
- `processing -> completed`: stock remains deducted

Base product menggunakan `products.stock`. Variant menggunakan `product_variants.stock`.

## Security

Order mutation dilakukan melalui:
- `create_order(...)`
- `update_order_status(...)`

Authenticated client tidak memiliki direct INSERT, UPDATE, atau DELETE terhadap `orders` dan `order_items`.

Order RPC menggunakan `SECURITY DEFINER`, locked `search_path`, authentication validation, dan organization membership validation.

## Analytics

Analytics menggunakan completed orders dan mencakup completed orders, units sold, revenue, cost, profit, margin, average order value, product performance, dan daily sales trend.

Variant sales tetap teraggregasi ke parent product.

## Main Routes

- `/products`
- `/products/new`
- `/products/[id]/edit`
- `/products/[id]/variants`
- `/products/[id]/images`
- `/products/[id]/inventory/adjust`
- `/products/[id]/performance`
- `/inventory`
- `/analytics`
- `/orders`
- `/orders/new`

## Database Records

Database hardening dan integration records:
- `database/phase-5.7-order-security-hardening.sql`
- `database/phase-5.8-variant-order-integration.sql`

## Development

```bash
pnpm install
cd apps/web
pnpm dev
```

Verification:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

## Phase 5 QA

Phase 5 telah lulus:
- TypeScript
- ESLint
- Next.js production build
- RLS dan security tests
- cross-organization isolation
- privilege audit
- product dan variant order lifecycle
- inventory deduction dan restore
- historical price/cost snapshots
- analytics integrity
- edge cases
- runtime UI smoke test

Database destructive/security tests dilakukan dalam transaction dan diakhiri dengan `ROLLBACK`.

## Roadmap

Setelah Phase 5:
- Phase 6 Supplier Management
- Phase 7 Marketplace Integration
- Phase 8 Product Research
- Phase 9 AI Product Research
- Phase 10 AI Description Generator
- Phase 11 Price Monitoring
- Phase 12 Automated Commerce
- Phase 13 AI Agents
- Phase 14 Analytics & Intelligence
- Phase 15 Billing / SaaS
- Phase 16 Production / Deployment
