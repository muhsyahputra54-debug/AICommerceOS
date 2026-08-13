# Changelog

## 2026-08-14 — Phase 5: Product & Inventory Intelligence

Status: Complete

### 5.1 Product Data Architecture

- Added organization-aware categories.
- Extended products with SKU, cost price, metadata, and category support.
- Added product variants.
- Added organization-wide product and variant SKU namespace protection.

### 5.2 Product Management

- Added enhanced product CRUD.
- Added product search, filtering, sorting, and pagination.
- Added product variant management.

### 5.3 Inventory Architecture

- Added inventory movement ledger.
- Added product and variant stock tracking.
- Added inventory adjustment RPC.
- Integrated stock movements with order lifecycle.

### 5.4 Inventory Intelligence

- Added inventory thresholds and metrics.
- Added inventory alerts and intelligence.
- Added inventory dashboard and movement history.

### 5.5 Product Images

- Added private Supabase Storage product image support.
- Added product image metadata.
- Added primary image and image ordering support.
- Added organization-aware Storage and database security.

### 5.6 Product Performance

- Added historical cost snapshots to order items.
- Added completed order timestamps.
- Added product performance RPC.
- Added sales summary and daily sales trend.
- Added analytics and product performance UI.

### 5.7 Security

- Hardened order mutations.
- Blocked direct authenticated INSERT, UPDATE, and DELETE on orders and order_items.
- Order mutation RPCs use SECURITY DEFINER with locked search_path.
- Cross-organization isolation tests passed.
- Privilege audit passed.

### 5.8 Integration

- Added order_items.variant_id.
- Integrated product variants with create_order.
- Integrated variant inventory with order processing and cancellation.
- Integrated variant revenue, cost, and profit with product performance.
- Added variant selection to Add Order UI.
- Preserved parent product aggregation for variant sales.

### 5.9 QA

Passed:

- TypeScript compile verification
- ESLint
- Next.js production build
- RLS and security tests
- Cross-organization isolation
- Privilege verification
- Product and variant inventory lifecycle
- Order lifecycle edge cases
- Historical price and cost snapshot integrity
- Sales analytics integrity
- Runtime UI smoke tests

Database destructive and security tests were executed inside transactions and finished with ROLLBACK.

### Database Records

- database/phase-5.7-order-security-hardening.sql
- database/phase-5.8-variant-order-integration.sql
