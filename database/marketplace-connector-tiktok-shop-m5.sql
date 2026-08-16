-- AICommerceOS
-- Marketplace Connector M5 — Webhook Foundation
--
-- Permanent schema migration.
-- This migration intentionally COMMITs.
--
-- Design:
-- - webhook signature is verified in the server route using TikTok Shop HMAC-SHA256
-- - DB receives only already-authenticated webhook metadata through service-role RPC
-- - idempotency uses provider + dedupe_key
-- - raw webhook payload is NOT stored
-- - recipient PII is NOT stored
-- - webhook events never mutate orders/order_items/inventory directly
-- - downstream processing is a later phase

begin;

create table if not exists public.marketplace_webhook_events (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  marketplace_account_id uuid not null,
  authorized_shop_id uuid not null,

  provider text not null,

  dedupe_key text not null,
  notification_id text,
  notification_type integer,
  external_shop_id text not null,

  external_entity_id text,
  external_status text,
  external_update_time timestamptz,

  payload_sha256 text not null,

  processing_status text not null default 'received',
  processed_at timestamptz,
  processing_message text,

  metadata jsonb not null default '{}'::jsonb,

  received_at timestamptz not null default now(),

  constraint marketplace_webhook_events_account_organization_fkey
    foreign key (marketplace_account_id, organization_id)
    references public.marketplace_accounts(id, organization_id)
    on delete cascade,

  constraint marketplace_webhook_events_shop_fkey
    foreign key (authorized_shop_id)
    references public.marketplace_authorized_shops(id)
    on delete cascade,

  constraint marketplace_webhook_events_provider_not_blank
    check (length(btrim(provider)) > 0),

  constraint marketplace_webhook_events_dedupe_not_blank
    check (length(btrim(dedupe_key)) > 0),

  constraint marketplace_webhook_events_shop_id_not_blank
    check (length(btrim(external_shop_id)) > 0),

  constraint marketplace_webhook_events_payload_hash_check
    check (payload_sha256 ~ '^[a-f0-9]{64}$'),

  constraint marketplace_webhook_events_processing_status_check
    check (
      processing_status in (
        'received',
        'processed',
        'ignored',
        'error'
      )
    ),

  constraint marketplace_webhook_events_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists
  marketplace_webhook_events_provider_dedupe_uidx
  on public.marketplace_webhook_events (
    provider,
    dedupe_key
  );

create index if not exists
  marketplace_webhook_events_account_received_idx
  on public.marketplace_webhook_events (
    marketplace_account_id,
    received_at desc
  );

create index if not exists
  marketplace_webhook_events_processing_idx
  on public.marketplace_webhook_events (
    processing_status,
    received_at
  );


alter table public.marketplace_webhook_events
  enable row level security;

revoke all on table public.marketplace_webhook_events
  from public, anon, authenticated, service_role;


create or replace function public.record_marketplace_webhook_event(
  p_provider text,
  p_external_shop_id text,
  p_dedupe_key text,
  p_notification_id text,
  p_notification_type integer,
  p_external_entity_id text,
  p_external_status text,
  p_external_update_time timestamptz,
  p_payload_sha256 text,
  p_metadata jsonb
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_shop public.marketplace_authorized_shops%rowtype;
begin
  if length(btrim(coalesce(p_provider, ''))) = 0
     or length(btrim(coalesce(p_external_shop_id, ''))) = 0
     or length(btrim(coalesce(p_dedupe_key, ''))) = 0 then
    raise exception 'provider, external shop id, and dedupe key are required';
  end if;

  if coalesce(p_payload_sha256, '') !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid payload sha256';
  end if;

  select s.*
  into v_shop
  from public.marketplace_authorized_shops s
  where s.provider = lower(btrim(p_provider))
    and s.external_shop_id = btrim(p_external_shop_id)
    and s.status = 'active'
  order by
    s.is_selected desc,
    s.updated_at desc
  limit 1;

  if v_shop.id is null then
    return 'unmatched_shop';
  end if;

  insert into public.marketplace_webhook_events (
    organization_id,
    marketplace_account_id,
    authorized_shop_id,
    provider,
    dedupe_key,
    notification_id,
    notification_type,
    external_shop_id,
    external_entity_id,
    external_status,
    external_update_time,
    payload_sha256,
    processing_status,
    metadata
  )
  values (
    v_shop.organization_id,
    v_shop.marketplace_account_id,
    v_shop.id,
    lower(btrim(p_provider)),
    btrim(p_dedupe_key),
    nullif(btrim(coalesce(p_notification_id, '')), ''),
    p_notification_type,
    btrim(p_external_shop_id),
    nullif(btrim(coalesce(p_external_entity_id, '')), ''),
    nullif(btrim(coalesce(p_external_status, '')), ''),
    p_external_update_time,
    lower(p_payload_sha256),
    'received',
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (provider, dedupe_key)
  do nothing;

  if not found then
    return 'duplicate';
  end if;

  insert into public.marketplace_sync_logs (
    organization_id,
    marketplace_account_id,
    direction,
    entity_type,
    operation,
    status,
    external_id,
    message,
    metadata
  )
  values (
    v_shop.organization_id,
    v_shop.marketplace_account_id,
    'inbound',
    case
      when p_external_entity_id is not null then 'order'
      else 'account'
    end,
    'webhook_received',
    'success',
    nullif(btrim(coalesce(p_external_entity_id, '')), ''),
    'Authenticated marketplace webhook received.',
    jsonb_build_object(
      'provider', lower(btrim(p_provider)),
      'notification_id',
        nullif(btrim(coalesce(p_notification_id, '')), ''),
      'notification_type', p_notification_type,
      'dedupe_key', btrim(p_dedupe_key)
    )
  );

  return 'recorded';
end;
$$;


create or replace function public.get_marketplace_webhook_events(
  p_marketplace_account_id uuid,
  p_limit integer default 100
)
returns table (
  id uuid,
  notification_id text,
  notification_type integer,
  external_shop_id text,
  external_entity_id text,
  external_status text,
  external_update_time timestamptz,
  processing_status text,
  processing_message text,
  received_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    e.id,
    e.notification_id,
    e.notification_type,
    e.external_shop_id,
    e.external_entity_id,
    e.external_status,
    e.external_update_time,
    e.processing_status,
    e.processing_message,
    e.received_at
  from public.marketplace_webhook_events e
  where e.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = e.organization_id
        and m.user_id = auth.uid()
    )
  order by e.received_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;


revoke all on function public.record_marketplace_webhook_event(
  text, text, text, text, integer, text, text,
  timestamptz, text, jsonb
) from public, anon, authenticated;

grant execute on function public.record_marketplace_webhook_event(
  text, text, text, text, integer, text, text,
  timestamptz, text, jsonb
) to service_role;


revoke all on function public.get_marketplace_webhook_events(
  uuid, integer
) from public, anon;

grant execute on function public.get_marketplace_webhook_events(
  uuid, integer
) to authenticated;

commit;


-- Read-only verification
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'marketplace_webhook_events';

select
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'record_marketplace_webhook_event',
    'get_marketplace_webhook_events'
  )
order by routine_name;
