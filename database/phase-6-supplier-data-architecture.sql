-- AICommerceOS
-- Phase 6 — Supplier Management
-- Supplier Data Architecture
--
-- Applied and verified against the active Supabase database.
--
-- Verification passed:
-- - organization-scoped CRUD
-- - RLS cross-organization isolation
-- - case-insensitive supplier-name uniqueness per organization
-- - blank-name rejection
-- - supplier status validation

begin;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  name text not null,
  contact_name text null,
  email text null,
  phone text null,
  address text null,
  notes text null,

  status text not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint suppliers_name_not_blank
    check (length(btrim(name)) > 0),

  constraint suppliers_status_check
    check (status in ('active', 'inactive'))
);

create index suppliers_organization_id_idx
on public.suppliers (organization_id);

create index suppliers_organization_status_idx
on public.suppliers (organization_id, status);

create unique index suppliers_organization_lower_name_key
on public.suppliers (
  organization_id,
  lower(btrim(name))
);

alter table public.suppliers
enable row level security;

create policy "Members can view organization suppliers"
on public.suppliers
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "Members can create organization suppliers"
on public.suppliers
for insert
to authenticated
with check (
  public.is_organization_member(organization_id)
);

create policy "Members can update organization suppliers"
on public.suppliers
for update
to authenticated
using (
  public.is_organization_member(organization_id)
)
with check (
  public.is_organization_member(organization_id)
);

create policy "Members can delete organization suppliers"
on public.suppliers
for delete
to authenticated
using (
  public.is_organization_member(organization_id)
);

revoke all
on table public.suppliers
from public, anon;

grant select, insert, update, delete
on table public.suppliers
to authenticated;

commit;
