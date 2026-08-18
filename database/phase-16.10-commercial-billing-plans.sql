-- Phase 16.10 - LAKUVO Commercial Billing Plans
--
-- Pricing policy:
-- Free    : IDR 0
-- Starter : IDR 199,000/month or IDR 1,990,000/year
-- Pro     : IDR 499,000/month or IDR 4,990,000/year
--
-- Commercial plans remain PRIVATE during provider integration.
-- Set is_public = true only after checkout + webhook +
-- subscription lifecycle are production-verified.
--
-- Quota values are catalog metadata only at this stage.
-- Commercial quota enforcement remains disabled.

insert into public.billing_plans (
  slug,
  name,
  description,
  currency,
  price_monthly,
  price_annual,
  features,
  limits,
  is_active,
  is_public,
  sort_order
)
values
(
  'free',
  'Free',
  'Untuk seller yang ingin mulai mengenal workflow LAKUVO.',
  'IDR',
  0,
  0,
  '[
    "core_commerce",
    "product_research",
    "price_monitoring",
    "automation",
    "analytics"
  ]'::jsonb,
  '{
    "products": 25,
    "monthly_orders": 100,
    "research_items": 10,
    "price_monitor_targets": 5,
    "automation_rules": 2,
    "monthly_ai_runs": 20
  }'::jsonb,
  true,
  false,
  10
),
(
  'starter',
  'Starter',
  'Untuk UMKM dan seller yang mulai mengelola operasi commerce secara terstruktur.',
  'IDR',
  199000,
  1990000,
  '[
    "core_commerce",
    "product_research",
    "price_monitoring",
    "automation",
    "analytics"
  ]'::jsonb,
  '{
    "products": 200,
    "monthly_orders": 2000,
    "research_items": 100,
    "price_monitor_targets": 30,
    "automation_rules": 10,
    "monthly_ai_runs": 300
  }'::jsonb,
  true,
  false,
  20
),
(
  'pro',
  'Pro',
  'Untuk seller dan brand yang membutuhkan kapasitas commerce, AI, dan automation lebih besar.',
  'IDR',
  499000,
  4990000,
  '[
    "core_commerce",
    "product_research",
    "price_monitoring",
    "automation",
    "analytics"
  ]'::jsonb,
  '{
    "products": 1000,
    "monthly_orders": 10000,
    "research_items": 1000,
    "price_monitor_targets": 200,
    "automation_rules": 50,
    "monthly_ai_runs": 1500
  }'::jsonb,
  true,
  false,
  30
)
on conflict (slug)
do update set
  name = excluded.name,
  description = excluded.description,
  currency = excluded.currency,
  price_monthly = excluded.price_monthly,
  price_annual = excluded.price_annual,
  features = excluded.features,
  limits = excluded.limits,
  is_active = excluded.is_active,
  is_public = excluded.is_public,
  sort_order = excluded.sort_order;
