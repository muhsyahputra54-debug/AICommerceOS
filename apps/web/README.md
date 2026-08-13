# AICommerceOS Web

Web application utama AICommerceOS.

## Stack

- Next.js
- TypeScript
- Supabase
- PostgreSQL
- Tailwind CSS

## Development

Jalankan dari folder web:

```bash
cd apps/web
pnpm dev
```

Development server:

```text
http://localhost:3000
```

## Verification

TypeScript:

```bash
pnpm exec tsc --noEmit
```

ESLint:

```bash
pnpm lint
```

Production build:

```bash
pnpm build
```

## Main Application Areas

- `/products` — product management
- `/inventory` — inventory intelligence dan movement history
- `/analytics` — sales dan product performance
- `/orders` — order management
- `/orders/new` — create product atau variant order

Product-specific routes juga menyediakan:

- variants
- product images
- inventory adjustment
- product performance

## Product Variants

Order form mendukung base product dan product variant.

Base product menggunakan `product_id` dengan `variant_id = NULL`.

Variant menggunakan parent `product_id` dan selected `variant_id`.

Harga final dan cost snapshot ditentukan oleh database, bukan client.

## Security

Supabase Row Level Security merupakan database security boundary utama.

Order creation dan lifecycle status dilakukan melalui RPC:

- `create_order(...)`
- `update_order_status(...)`

Authenticated client tidak melakukan direct mutation terhadap tabel `orders` dan `order_items`.

## Documentation

Dokumentasi architecture, Phase 5, QA, database records, dan roadmap tersedia di root `README.md`.
