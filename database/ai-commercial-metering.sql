Saturday 10:29 PM
AICommerceOS-PROJECT-HANDOFF.md
File
"Ini adalah project handoff AICommerceOS. Baca seluruh dokumen dan lanjutkan dari posisi terakhir. Jangan mengulang pekerjaan yang sudah selesai. Kita sedang di 3.3.9.5.6.2 — DELETE RLS Test. Setelah selesai lanjutkan 3.3.9.5.7 — Cross-Organization Isolation Test. Kerjakan bertahap dan tunggu hasil setiap langkah sebelum lanjut."
Pasted text.txt
Document

Bagus. Final Data Audit berhasil, dan screenshot menunjukkan masih ada beberapa fixture permanen dari pengujian Phase 3:

Data utama
✅ Organization A — My Commerce Store
✅ Membership owner User A

Fixture pengujian
⚠️ Organization B — RLS Isolation Test Organization B
⚠️ Membership owner User B
⚠️ Product — RLS Delete Test Product 2

Kita tidak akan menghapus apa pun dulu. Sesuai SOP, sebelum cleanup kita pastikan tidak ada data lain yang masih bergantung pada fixture tersebut.

Phase 3 Closure — Pre-Cleanup Dependency Audit

Jalankan hanya query read-only ini:

select
  'memberships_in_test_org_b' as check_name,
  count(*) as row_count
from public.organization_members
where organization_id = 'd9e167f8-707a-489f-b851-76be094d2ab6'

union all

select
  'memberships_for_user_b',
  count(*)
from public.organization_members
where user_id = '0679aa22-c8ce-400c-8113-3837d4af1cbe'

union all

select
  'products_in_test_org_b',
  count(*)
from public.products
where organization_id = 'd9e167f8-707a-489f-b851-76be094d2ab6'

union all

select
  'customers_in_test_org_b',
  count(*)
from public.customers
where organization_id = 'd9e167f8-707a-489f-b851-76be094d2ab6'

union all

select
  'orders_in_test_org_b',
  count(*)
from public.orders
where organization_id = 'd9e167f8-707a-489f-b851-76be094d2ab6'

union all

select
  'order_items_using_test_product',
  count(*)
from public.order_items
where product_id = '91f535b8-917c-4b87-bd87-e8949c0c1a61';

Yang kemungkinan kita harapkan adalah hanya membership User B yang masih terikat ke Organization B, sedangkan product/customer/order/order-item test lain = 0. Tapi kita tidak akan mengasumsikan hasilnya.

Kirim keenam hasil row_count tersebut. Setelah itu baru kita susun cleanup yang aman, tetap satu langkah per satu langkah.

Pasted text(1).txt
Document

Bagus. Sekarang orders_status_check sudah terbaca lengkap ✅.

Status yang valid adalah:

pending
processing
completed
cancelled

Jadi aturan Add Order yang sudah terverifikasi:

orders.status        ∈ pending | processing | completed | cancelled
orders.total         >= 0
order_items.quantity > 0
order_items.price    >= 0

Sebelum kita menulis Add Order, ada satu hal penting yang harus diaudit: apakah database sudah memiliki function/RPC atau trigger untuk membuat order + order items secara atomik. Kita tidak mau membuat flow dua insert terpisah lalu berisiko order tersimpan tanpa items.

Jalankan hanya query read-only ini di Supabase SQL Editor:

select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    p.proname ilike '%order%'
    or pg_get_functiondef(p.oid) ilike '%order_items%'
  )
order by p.proname;

Kirim seluruh hasilnya. Dari situ kita tentukan apakah Add Order memakai RPC yang sudah ada atau perlu merancang transaksi database baru.

Wednesday 11:03 PM
AICommerceOS — Master Prompt Phase 5_ Product & Inventory Intelligence.md
File
Pasted text(2).txt
Document
Pasted text(3).txt
Document
Pasted code.json
File
Pasted code(1).json
File
tidak kelihatan images
Pasted code(2).json
File
Pasted text(4).txt
Document
Pasted text(5).txt
Document
Supabase Snippet Untitled Query
Pasted text(6).txt
Document
Pasted text(7).txt
Document
Pasted text(8).txt
Document
Pasted text(9).txt
Document
Pasted text(10).txt
Document
=== REPOSITORY ===
PS C:\Project\AICommerceOS> git status -sb
## main...origin/main
PS C:\Project\AICommerceOS> git status --short
PS C:\Project\AICommerceOS> git log -1 --oneline --decorate
c17357f (HEAD -> main, origin/main, origin/HEAD) complete phase 8 product research
PS C:\Project\AICommerceOS>
 malah jadi kacau nih
ya berhenti dulu dan istirahat saja dulu... besok lanjutkan ke bagian lain saja. 
deploy ya ? 
Supabase Snippet Untitled Query (1)
agent-run-route.ts
TypeScript
current-organization.ts
TypeScript
description-route.ts
TypeScript
package.json
File
production.env.example
File
research-ai-route.ts
TypeScript
supabase-server.ts
TypeScript
arahkan kesini?

Bagus. Patch application PASS ✅. Enam file berhasil diterapkan dan script juga mengonfirmasi bahwa SQL serta secrets tidak disentuh otomatis. Jadi sekarang source project sudah berada pada tahap AI metering integration candidate.

Sekarang lakukan consolidated QA. Jangan commit atau push dulu. Dari root project jalankan:

cd C:\Project\AICommerceOS

Write-Host "`n=== TYPESCRIPT ==="
pnpm --dir .\apps\web exec tsc --noEmit

Write-Host "`n=== DIFF CHECK ==="
git diff --check

Write-Host "`n=== DIFF STAT ==="
git diff --stat

Write-Host "`n=== GIT STATUS ==="
git status --short

Target pertama:

TYPESCRIPT
→ tidak ada error

DIFF CHECK
→ tidak ada output

GIT STATUS
→ hanya file yang memang kita ubah/tambahkan

Saya juga masih perlu memastikan pricing correction di Supabase sudah benar-benar dijalankan. Kalau tadi sudah dijalankan, cukup cek dengan query read-only ini di SQL Editor:

select
  model,
  input_usd_per_million,
  cached_input_usd_per_million,
  cache_write_usd_per_million,
  output_usd_per_million
from public.ai_model_pricing
where provider = 'openai'
  and model in (
    'gpt-5.6-luna',
    'gpt-5.6-terra',
    'gpt-5.6-sol'
  )
order by model;

Target:

gpt-5.6-luna   0.20   0.02   0.25   1.20
gpt-5.6-sol    5.00   0.50   6.25  30.00
gpt-5.6-terra  2.00   0.20   2.50  12.00

Setelah Anda kirim output QA PowerShell + hasil query pricing, saya review satu kali secara menyeluruh. Kalau semuanya PASS, baru kita masuk konfigurasi server-only SUPABASE_SERVICE_ROLE_KEY, runtime metering test, lalu Git checkpoint.

=== GIT STATUS ===
PS C:\Project\AICommerceOS> git status --short
 M apps/web/production.env.example
 M apps/web/src/app/api/agents/[id]/run/route.ts
 M apps/web/src/app/api/products/[id]/description/route.ts
 M apps/web/src/app/api/research/[id]/ai/route.ts
?? ai-metering-patch/
?? ai-metering-source.zip
?? ai-metering-source/
?? apps/web/src/lib/ai/
?? apps/web/src/lib/supabase/admin.ts
PS C:\Project\AICommerceOS>  

Pricing correction di Supabase PASS ✅. Screenshot menunjukkan nilai yang kita targetkan:

gpt-5.6-luna   0.20   0.02   0.25   1.20
gpt-5.6-sol    5.00   0.50   6.25  30.00
gpt-5.6-terra  2.00   0.20   2.50  12.00

Ada satu hal penting yang saya tangkap dari git status: migration database yang sudah kita jalankan di Supabase belum tersimpan di repository. Jangan commit dulu. Kita harus menjaga database live dan Git tetap sinkron.

Jalankan satu blok ini dari root:

cd C:\Project\AICommerceOS

# Simpan pricing correction ke repository
Copy-Item `
  ".\ai-metering-patch\database\ai-metering-pricing-correction-2026-08-15.sql" `
  ".\database\ai-metering-pricing-correction-2026-08-15.sql" `
  -Force

Write-Host "`n=== TYPESCRIPT ==="
pnpm --dir .\apps\web exec tsc --noEmit

Write-Host "`n=== DIFF CHECK ==="
git diff --check

Write-Host "`n=== DIFF STAT ==="
git diff --stat

Write-Host "`n=== STATUS ==="
git status --short

Jangan hapus ai-metering-patch dulu, karena saya juga ingin memastikan migration pertama ai-commercial-metering.sql yang membuat:

ai_model_pricing
ai_usage_ledger
ai_credit_ledger
organization_ai_controls

ikut masuk repository. Saat ini git status Anda belum menunjukkan file migration foundation itu.

Kalau TYPESCRIPT dan DIFF CHECK kosong/tanpa error, kirim output blok di atas. Setelah itu saya berikan satu langkah untuk memasukkan migration foundation ke database/, membersihkan:

ai-metering-patch/
ai-metering-source/
ai-metering-source.zip

dan baru kita lakukan runtime test + Git checkpoint.

Untuk saat ini statusnya:

Supabase schema migration       ✅
Pricing correction              ✅
Patch source applied            ✅
Pricing verified                ✅
TypeScript QA                   ⏳
Migration files in Git          ⚠️ belum lengkap
Git checkpoint                  ⏳

Kita sudah dekat dengan checkpoint, tapi saya tidak mau database production memiliki perubahan yang tidak tercatat di Git.


=== STATUS ===
PS C:\Project\AICommerceOS> git status --short
 M apps/web/production.env.example
 M apps/web/src/app/api/agents/[id]/run/route.ts
 M apps/web/src/app/api/products/[id]/description/route.ts
 M apps/web/src/app/api/research/[id]/ai/route.ts
?? ai-metering-patch/
?? ai-metering-source.zip
?? ai-metering-source/
?? apps/web/src/lib/ai/
?? apps/web/src/lib/supabase/admin.ts
?? database/ai-metering-pricing-correction-2026-08-15.sql
PS C:\Project\AICommerceOS>

Status Git-nya sudah sesuai ekspektasi. Yang perlu kita bereskan sebelum runtime test hanya dua hal: migration foundation harus masuk Git, lalu folder/file audit sementara dibersihkan. File pricing correction sudah masuk sebagai untracked database/ai-metering-pricing-correction-2026-08-15.sql ✅.

Pertama, download kembali migration foundation ini lalu simpan persis sebagai:

Download AI Commercial Metering Foundation

C:\Project\AICommerceOS\database\ai-commercial-metering.sql

Setelah file itu ada, jalankan satu blok PowerShell berikut:

cd C:\Project\AICommerceOS

# Pastikan dua migration permanen sudah ada
Write-Host "`n=== DATABASE MIGRATIONS ==="
Get-Item `
  ".\database\ai-commercial-metering.sql", `
  ".\database\ai-metering-pricing-correction-2026-08-15.sql" |
Select-Object Name, Length

# Hapus hanya artefak audit/patch sementara
Remove-Item ".\ai-metering-patch" -Recurse -Force
Remove-Item ".\ai-metering-source" -Recurse -Force
Remove-Item ".\ai-metering-source.zip" -Force

Write-Host "`n=== TYPESCRIPT ==="
pnpm --dir .\apps\web exec tsc --noEmit

Write-Host "`n=== DIFF CHECK ==="
git diff --check

Write-Host "`n=== ENV PLACEHOLDER CHECK ==="
Select-String `
  -Path ".\apps\web\production.env.example" `
  -Pattern 'SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|OPENAI_MODEL'

Write-Host "`n=== DIFF STAT ==="
git diff --stat

Write-Host "`n=== FINAL STATUS ==="
git status --short

Target akhirnya kira-kira hanya:

M  apps/web/production.env.example
M  apps/web/src/app/api/agents/[id]/run/route.ts
M  apps/web/src/app/api/products/[id]/description/route.ts
M  apps/web/src/app/api/research/[id]/ai/route.ts

?? apps/web/src/lib/ai/
?? apps/web/src/lib/supabase/admin.ts
?? database/ai-commercial-metering.sql
?? database/ai-metering-pricing-correction-2026-08-15.sql

TYPESCRIPT dan DIFF CHECK harus tanpa error.

Setelah itu jangan commit dulu. Tahap berikutnya adalah memasang SUPABASE_SERVICE_ROLE_KEY secara lokal/server-only tanpa memperlihatkan nilainya, lalu menjalankan runtime test untuk memastikan request AI bisa melakukan:

check_ai_allowance()
        ↓
OpenAI
        ↓
record_ai_usage()
        ↓
ai_usage_ledger

Karena Anda belum memasang OpenAI API key untuk real execution, kita akan bedakan antara metering infrastructure PASS dan real OpenAI execution PASS agar checkpoint-nya tidak dibuat seolah-olah sudah selesai penuh.

ai-commercial-metering.sql
Code

Library
/
ai-commercial-metering.sql
-- AICommerceOS - AI Commercial Metering Foundation
-- Permanent schema migration.
-- Purpose:
--   1) meter OpenAI token usage per organization
--   2) keep provider cost separate from internal AI credits
--   3) prepare credit/cost enforcement without enabling it yet
--   4) keep raw provider cost server-only
--
-- IMPORTANT:
-- - This migration intentionally COMMITs permanent schema changes.
-- - Existing billing_usage and Phase 9/10/13 run tables are not modified.
-- - Quota enforcement defaults to OFF until commercial pricing is finalized.

begin;

create table if not exists public.ai_model_pricing (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  input_usd_per_million numeric(20,8) not null,
  cached_input_usd_per_million numeric(20,8) not null,
  cache_write_usd_per_million numeric(20,8) not null,
  output_usd_per_million numeric(20,8) not null,
  effective_from timestamptz not null,
  effective_to timestamptz,
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint ai_model_pricing_provider_not_blank
    check (length(btrim(provider)) > 0),

  constraint ai_model_pricing_model_not_blank
    check (length(btrim(model)) > 0),

  constraint ai_model_pricing_input_nonnegative
    check (input_usd_per_million >= 0),

  constraint ai_model_pricing_cached_input_nonnegative
    check (cached_input_usd_per_million >= 0),

  constraint ai_model_pricing_cache_write_nonnegative
    check (cache_write_usd_per_million >= 0),

  constraint ai_model_pricing_output_nonnegative
    check (output_usd_per_million >= 0),

  constraint ai_model_pricing_window_check
    check (effective_to is null or effective_to > effective_from),

  constraint ai_model_pricing_source_object
    check (jsonb_typeof(source_metadata) = 'object'),

  constraint ai_model_pricing_provider_model_effective_key
    unique (provider, model, effective_from)
);

create index if not exists ai_model_pricing_lookup_idx
  on public.ai_model_pricing (provider, model, effective_from desc);


create table if not exists public.ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  user_id uuid
    references auth.users(id) on delete set null,

  feature text not null,
  provider text not null,
  model text not null,

  source_kind text,
  source_id uuid,

  provider_request_id text,

  request_status text not null default 'completed',

  input_tokens bigint not null default 0,
  cached_input_tokens bigint not null default 0,
  cache_write_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  total_tokens bigint not null default 0,

  estimated_cost_usd numeric(20,10) not null default 0,
  credits_charged bigint not null default 0,

  pricing_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  constraint ai_usage_ledger_feature_not_blank
    check (length(btrim(feature)) > 0),

  constraint ai_usage_ledger_provider_not_blank
    check (length(btrim(provider)) > 0),

  constraint ai_usage_ledger_model_not_blank
    check (length(btrim(model)) > 0),

  constraint ai_usage_ledger_source_kind_not_blank
    check (source_kind is null or length(btrim(source_kind)) > 0),

  constraint ai_usage_ledger_status_check
    check (request_status in ('completed', 'failed')),

  constraint ai_usage_ledger_input_nonnegative
    check (input_tokens >= 0),

  constraint ai_usage_ledger_cached_nonnegative
    check (cached_input_tokens >= 0),

  constraint ai_usage_ledger_cache_write_nonnegative
    check (cache_write_tokens >= 0),

  constraint ai_usage_ledger_output_nonnegative
    check (output_tokens >= 0),

  constraint ai_usage_ledger_total_nonnegative
    check (total_tokens >= 0),

  constraint ai_usage_ledger_cost_nonnegative
    check (estimated_cost_usd >= 0),

  constraint ai_usage_ledger_credits_nonnegative
    check (credits_charged >= 0),

  constraint ai_usage_ledger_pricing_snapshot_object
    check (jsonb_typeof(pricing_snapshot) = 'object'),

  constraint ai_usage_ledger_metadata_object
    check (jsonb_typeof(metadata) = 'object'),

  constraint ai_usage_ledger_provider_request_key
    unique (provider, provider_request_id)
);

create index if not exists ai_usage_ledger_org_created_idx
  on public.ai_usage_ledger (organization_id, created_at desc);

create index if not exists ai_usage_ledger_org_feature_created_idx
  on public.ai_usage_ledger (organization_id, feature, created_at desc);

create index if not exists ai_usage_ledger_source_idx
  on public.ai_usage_ledger (source_kind, source_id)
  where source_id is not null;


create table if not exists public.ai_credit_ledger (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  usage_id uuid
    references public.ai_usage_ledger(id) on delete restrict,

  transaction_type text not null,

  -- Positive = grant/top-up/refund.
  -- Negative = usage charge/adjustment.
  amount bigint not null,

  external_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint ai_credit_ledger_type_check
    check (
      transaction_type in (
        'grant',
        'topup',
        'usage',
        'refund',
        'adjustment'
      )
    ),

  constraint ai_credit_ledger_amount_nonzero
    check (amount <> 0),

  constraint ai_credit_ledger_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists ai_credit_ledger_usage_unique
  on public.ai_credit_ledger (usage_id)
  where usage_id is not null;

create index if not exists ai_credit_ledger_org_created_idx
  on public.ai_credit_ledger (organization_id, created_at desc);


create table if not exists public.organization_ai_controls (
  organization_id uuid primary key
    references public.organizations(id) on delete cascade,

  credit_enforcement_enabled boolean not null default false,
  cost_enforcement_enabled boolean not null default false,

  monthly_cost_limit_usd numeric(20,8),

  warning_percent smallint not null default 80,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organization_ai_controls_cost_limit_check
    check (
      monthly_cost_limit_usd is null
      or monthly_cost_limit_usd >= 0
    ),

  constraint organization_ai_controls_warning_check
    check (warning_percent between 1 and 100)
);


alter table public.ai_model_pricing enable row level security;
alter table public.ai_usage_ledger enable row level security;
alter table public.ai_credit_ledger enable row level security;
alter table public.organization_ai_controls enable row level security;

-- Raw provider pricing/cost and credit mutation remain server-only.
revoke all on table public.ai_model_pricing
  from public, anon, authenticated;

revoke all on table public.ai_usage_ledger
  from public, anon, authenticated;

revoke all on table public.ai_credit_ledger
  from public, anon, authenticated;

revoke all on table public.organization_ai_controls
  from public, anon, authenticated;

grant select on table public.ai_model_pricing to service_role;
grant select, insert on table public.ai_usage_ledger to service_role;
grant select, insert on table public.ai_credit_ledger to service_role;
grant select, insert, update on table public.organization_ai_controls to service_role;


-- Pricing snapshot configured for current GPT-5.6 Standard text-token pricing.
-- Cache-write price = 1.25x uncached input rate.
insert into public.ai_model_pricing (
  provider,
  model,
  input_usd_per_million,
  cached_input_usd_per_million,
  cache_write_usd_per_million,
  output_usd_per_million,
  effective_from,
  source_metadata
)
values
  (
    'openai',
    'gpt-5.6-luna',
    1.00,
    0.10,
    1.25,
    6.00,
    '2026-08-15 00:00:00+00',
    jsonb_build_object(
      'basis', 'standard',
      'configured_on', '2026-08-15',
      'source', 'OpenAI API pricing'
    )
  ),
  (
    'openai',
    'gpt-5.6-terra',
    2.50,
    0.25,
    3.125,
    15.00,
    '2026-08-15 00:00:00+00',
    jsonb_build_object(
      'basis', 'standard',
      'configured_on', '2026-08-15',
      'source', 'OpenAI API pricing'
    )
  ),
  (
    'openai',
    'gpt-5.6-sol',
    5.00,
    0.50,
    6.25,
    30.00,
    '2026-08-15 00:00:00+00',
    jsonb_build_object(
      'basis', 'standard',
      'configured_on', '2026-08-15',
      'source', 'OpenAI API pricing'
    )
  )
on conflict (provider, model, effective_from)
do update set
  input_usd_per_million = excluded.input_usd_per_million,
  cached_input_usd_per_million = excluded.cached_input_usd_per_million,
  cache_write_usd_per_million = excluded.cache_write_usd_per_million,
  output_usd_per_million = excluded.output_usd_per_million,
  source_metadata = excluded.source_metadata;


create or replace function public.check_ai_allowance(
  p_organization_id uuid
)
returns table (
  allowed boolean,
  reason text,
  credit_balance bigint,
  month_estimated_cost_usd numeric,
  monthly_cost_limit_usd numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_credit_enforcement boolean := false;
  v_cost_enforcement boolean := false;
  v_cost_limit numeric(20,8);
  v_credit_balance bigint := 0;
  v_month_cost numeric(20,10) := 0;
begin
  select
    c.credit_enforcement_enabled,
    c.cost_enforcement_enabled,
    c.monthly_cost_limit_usd
  into
    v_credit_enforcement,
    v_cost_enforcement,
    v_cost_limit
  from public.organization_ai_controls c
  where c.organization_id = p_organization_id;

  v_credit_enforcement := coalesce(v_credit_enforcement, false);
  v_cost_enforcement := coalesce(v_cost_enforcement, false);

  select coalesce(sum(l.amount), 0)
  into v_credit_balance
  from public.ai_credit_ledger l
  where l.organization_id = p_organization_id;

  select coalesce(sum(u.estimated_cost_usd), 0)
  into v_month_cost
  from public.ai_usage_ledger u
  where u.organization_id = p_organization_id
    and u.created_at >= date_trunc('month', now())
    and u.created_at < date_trunc('month', now()) + interval '1 month';

  if v_credit_enforcement and v_credit_balance <= 0 then
    return query
    select
      false,
      'ai_credit_balance_exhausted'::text,
      v_credit_balance,
      v_month_cost,
      v_cost_limit;
    return;
  end if;

  if v_cost_enforcement
     and v_cost_limit is not null
     and v_month_cost >= v_cost_limit then
    return query
    select
      false,
      'monthly_ai_cost_limit_reached'::text,
      v_credit_balance,
      v_month_cost,
      v_cost_limit;
    return;
  end if;

  return query
  select
    true,
    'allowed'::text,
    v_credit_balance,
    v_month_cost,
    v_cost_limit;
end;
$$;


create or replace function public.record_ai_usage(
  p_organization_id uuid,
  p_user_id uuid,
  p_feature text,
  p_provider text,
  p_model text,
  p_source_kind text default null,
  p_source_id uuid default null,
  p_provider_request_id text default null,
  p_request_status text default 'completed',
  p_input_tokens bigint default 0,
  p_cached_input_tokens bigint default 0,
  p_cache_write_tokens bigint default 0,
  p_output_tokens bigint default 0,
  p_total_tokens bigint default 0,
  p_credits_charged bigint default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  usage_id uuid,
  estimated_cost_usd numeric,
  pricing_found boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pricing public.ai_model_pricing%rowtype;
  v_uncached_input bigint := 0;
  v_cached_input bigint := 0;
  v_cache_write bigint := 0;
  v_output bigint := 0;
  v_cost numeric(20,10) := 0;
  v_usage_id uuid;
  v_existing_cost numeric(20,10);
  v_pricing_found boolean := false;
  v_pricing_snapshot jsonb := '{}'::jsonb;
begin
  if p_organization_id is null then
    raise exception 'organization_id is required';
  end if;

  if length(btrim(coalesce(p_feature, ''))) = 0 then
    raise exception 'feature is required';
  end if;

  if length(btrim(coalesce(p_provider, ''))) = 0 then
    raise exception 'provider is required';
  end if;

  if length(btrim(coalesce(p_model, ''))) = 0 then
    raise exception 'model is required';
  end if;

  if p_request_status not in ('completed', 'failed') then
    raise exception 'invalid request status';
  end if;

  if least(
    p_input_tokens,
    p_cached_input_tokens,
    p_cache_write_tokens,
    p_output_tokens,
    p_total_tokens,
    p_credits_charged
  ) < 0 then
    raise exception 'token and credit quantities must be nonnegative';
  end if;

  -- Idempotency for a provider request that was already recorded.
  if p_provider_request_id is not null then
    select u.id, u.estimated_cost_usd
    into v_usage_id, v_existing_cost
    from public.ai_usage_ledger u
    where u.provider = lower(btrim(p_provider))
      and u.provider_request_id = p_provider_request_id
    limit 1;

    if found then
      return query
      select
        v_usage_id,
        v_existing_cost,
        true;
      return;
    end if;
  end if;

  select p.*
  into v_pricing
  from public.ai_model_pricing p
  where p.provider = lower(btrim(p_provider))
    and (
      lower(p.model) = lower(btrim(p_model))
      or lower(btrim(p_model)) like lower(p.model) || '-%'
    )
    and p.effective_from <= now()
    and (p.effective_to is null or p.effective_to > now())
  order by
    (lower(p.model) = lower(btrim(p_model))) desc,
    length(p.model) desc,
    p.effective_from desc
  limit 1;

  if found then
    v_pricing_found := true;

    v_cached_input :=
      least(p_cached_input_tokens, p_input_tokens);

    v_cache_write :=
      least(
        p_cache_write_tokens,
        greatest(p_input_tokens - v_cached_input, 0)
      );

    v_uncached_input :=
      greatest(
        p_input_tokens - v_cached_input - v_cache_write,
        0
      );

    v_output := p_output_tokens;

    v_cost :=
      (
        (v_uncached_input * v_pricing.input_usd_per_million)
        + (v_cached_input * v_pricing.cached_input_usd_per_million)
        + (v_cache_write * v_pricing.cache_write_usd_per_million)
        + (v_output * v_pricing.output_usd_per_million)
      ) / 1000000.0;

    v_pricing_snapshot :=
      jsonb_build_object(
        'pricing_id', v_pricing.id,
        'provider', v_pricing.provider,
        'model', v_pricing.model,
        'input_usd_per_million', v_pricing.input_usd_per_million,
        'cached_input_usd_per_million', v_pricing.cached_input_usd_per_million,
        'cache_write_usd_per_million', v_pricing.cache_write_usd_per_million,
        'output_usd_per_million', v_pricing.output_usd_per_million,
        'effective_from', v_pricing.effective_from
      );
  else
    v_pricing_snapshot :=
      jsonb_build_object(
        'pricing_status', 'unpriced',
        'provider', lower(btrim(p_provider)),
        'model', btrim(p_model)
      );
  end if;

  insert into public.ai_usage_ledger (
    organization_id,
    user_id,
    feature,
    provider,
    model,
    source_kind,
    source_id,
    provider_request_id,
    request_status,
    input_tokens,
    cached_input_tokens,
    cache_write_tokens,
    output_tokens,
    total_tokens,
    estimated_cost_usd,
    credits_charged,
    pricing_snapshot,
    metadata
  )
  values (
    p_organization_id,
    p_user_id,
    btrim(p_feature),
    lower(btrim(p_provider)),
    btrim(p_model),
    nullif(btrim(coalesce(p_source_kind, '')), ''),
    p_source_id,
    nullif(btrim(coalesce(p_provider_request_id, '')), ''),
    p_request_status,
    p_input_tokens,
    p_cached_input_tokens,
    p_cache_write_tokens,
    p_output_tokens,
    p_total_tokens,
    v_cost,
    p_credits_charged,
    v_pricing_snapshot,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_usage_id;

  if p_credits_charged > 0 then
    insert into public.ai_credit_ledger (
      organization_id,
      usage_id,
      transaction_type,
      amount,
      metadata
    )
    values (
      p_organization_id,
      v_usage_id,
      'usage',
      -p_credits_charged,
      jsonb_build_object(
        'feature', btrim(p_feature),
        'provider', lower(btrim(p_provider)),
        'model', btrim(p_model)
      )
    );
  end if;

  return query
  select
    v_usage_id,
    v_cost,
    v_pricing_found;
end;
$$;


create or replace function public.get_ai_usage_summary(
  p_organization_id uuid,
  p_period_start timestamptz default date_trunc('month', now()),
  p_period_end timestamptz default now()
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'organization_id', p_organization_id,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'requests', count(*),
    'completed_requests',
      count(*) filter (where request_status = 'completed'),
    'failed_requests',
      count(*) filter (where request_status = 'failed'),
    'input_tokens', coalesce(sum(input_tokens), 0),
    'cached_input_tokens', coalesce(sum(cached_input_tokens), 0),
    'cache_write_tokens', coalesce(sum(cache_write_tokens), 0),
    'output_tokens', coalesce(sum(output_tokens), 0),
    'total_tokens', coalesce(sum(total_tokens), 0),
    'estimated_cost_usd', coalesce(sum(estimated_cost_usd), 0),
    'credits_charged', coalesce(sum(credits_charged), 0),
    'credit_balance',
      (
        select coalesce(sum(c.amount), 0)
        from public.ai_credit_ledger c
        where c.organization_id = p_organization_id
      )
  )
  from public.ai_usage_ledger u
  where u.organization_id = p_organization_id
    and u.created_at >= p_period_start
    and u.created_at < p_period_end;
$$;


-- SECURITY DEFINER functions are deliberately service-role only.
revoke all on function public.check_ai_allowance(uuid)
  from public, anon, authenticated;

grant execute on function public.check_ai_allowance(uuid)
  to service_role;

revoke all on function public.record_ai_usage(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  text,
  text,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  jsonb
) from public, anon, authenticated;

grant execute on function public.record_ai_usage(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  text,
  text,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  jsonb
) to service_role;

revoke all on function public.get_ai_usage_summary(
  uuid,
  timestamptz,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.get_ai_usage_summary(
  uuid,
  timestamptz,
  timestamptz
) to service_role;

commit;


-- Verification (read-only)
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'ai_model_pricing',
    'ai_usage_ledger',
    'ai_credit_ledger',
    'organization_ai_controls'
  )
order by table_name;

select
  provider,
  model,
  input_usd_per_million,
  cached_input_usd_per_million,
  cache_write_usd_per_million,
  output_usd_per_million,
  effective_from
from public.ai_model_pricing
order by model;
