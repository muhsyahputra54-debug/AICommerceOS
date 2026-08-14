-- AICommerceOS
-- Phase 6 — Supplier Management
-- Supplier Sourcing Architecture
--
-- Applied and verified against the active Supabase database.
--
-- Verified capabilities:
-- - supplier -> product sourcing
-- - supplier -> product variant sourcing
-- - multiple suppliers per target
-- - one preferred supplier per target
-- - duplicate relation protection
-- - same-organization composite foreign keys
-- - RLS cross-tenant isolation
-- - MOQ / unit cost / lead time integrity
--
-- Inventory ledger is intentionally NOT modified by this record.

begin;

-- =========================================================
-- COMPOSITE TENANT KEYS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.suppliers'::regclass
      and conname = 'suppliers_id_organization_id_key'
  ) then
    alter table public.suppliers
      add constraint suppliers_id_organization_id_key
      unique (id, organization_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.product_variants'::regclass
      and conname = 'product_variants_id_organization_id_key'
  ) then
    alter table public.product_variants
      add constraint product_variants_id_organization_id_key
      unique (id, organization_id);
  end if;
end
$$;

-- =========================================================
-- SUPPLIER SOURCING TABLE
-- =========================================================

create table public.supplier_items (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null,
  supplier_id uuid not null,

  target_type text not null,
  product_id uuid null,
  variant_id uuid null,

  supplier_sku text null,
  unit_cost numeric null,
  minimum_order_quantity integer not null default 1,
  lead_time_days integer null,
  is_preferred boolean not null default false,
  notes text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint supplier_items_target_type_check
    check (target_type in ('product', 'variant')),

  constraint supplier_items_target_check
    check (
      (
        target_type = 'product'
        and product_id is not null
        and variant_id is null
      )
      or
      (
        target_type = 'variant'
        and variant_id is not null
        and product_id is null
      )
    ),

  constraint supplier_items_unit_cost_check
    check (
      unit_cost is null
      or unit_cost >= 0
    ),

  constraint supplier_items_minimum_order_quantity_check
    check (minimum_order_quantity > 0),

  constraint supplier_items_lead_time_days_check
    check (
      lead_time_days is null
      or lead_time_days >= 0
    ),

  constraint supplier_items_organization_id_fkey
    foreign key (organization_id)
    references public.organizations(id)
    on delete cascade,

  constraint supplier_items_supplier_organization_fkey
    foreign key (supplier_id, organization_id)
    references public.suppliers(id, organization_id)
    on delete cascade,

  constraint supplier_items_product_organization_fkey
    foreign key (product_id, organization_id)
    references public.products(id, organization_id)
    on delete cascade,

  constraint supplier_items_variant_organization_fkey
    foreign key (variant_id, organization_id)
    references public.product_variants(id, organization_id)
    on delete cascade
);

-- =========================================================
-- INDEXES
-- =========================================================

create index supplier_items_organization_id_idx
on public.supplier_items (organization_id);

create index supplier_items_supplier_id_idx
on public.supplier_items (supplier_id);

create index supplier_items_product_id_idx
on public.supplier_items (product_id)
where product_id is not null;

create index supplier_items_variant_id_idx
on public.supplier_items (variant_id)
where variant_id is not null;

create unique index supplier_items_supplier_product_key
on public.supplier_items (
  organization_id,
  supplier_id,
  product_id
)
where target_type = 'product';

create unique index supplier_items_supplier_variant_key
on public.supplier_items (
  organization_id,
  supplier_id,
  variant_id
)
where target_type = 'variant';

create unique index supplier_items_preferred_product_key
on public.supplier_items (
  organization_id,
  product_id
)
where
  target_type = 'product'
  and is_preferred = true;

create unique index supplier_items_preferred_variant_key
on public.supplier_items (
  organization_id,
  variant_id
)
where
  target_type = 'variant'
  and is_preferred = true;

-- =========================================================
-- RLS
-- =========================================================

alter table public.supplier_items
enable row level security;

create policy "Members can view organization supplier items"
on public.supplier_items
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "Members can create organization supplier items"
on public.supplier_items
for insert
to authenticated
with check (
  public.is_organization_member(organization_id)
);

create policy "Members can update organization supplier items"
on public.supplier_items
for update
to authenticated
using (
  public.is_organization_member(organization_id)
)
with check (
  public.is_organization_member(organization_id)
);

create policy "Members can delete organization supplier items"
on public.supplier_items
for delete
to authenticated
using (
  public.is_organization_member(organization_id)
);

-- =========================================================
-- PRIVILEGES
-- =========================================================

revoke all
on table public.supplier_items
from public, anon;

grant select, insert, update, delete
on table public.supplier_items
to authenticated;

commit;
