-- AICommerceOS
-- Marketplace Connector M6 — Controlled Webhook Reconciliation
--
-- Permanent schema migration.
-- This migration intentionally COMMITs.
--
-- M6 converts authenticated webhook events into a controlled reconciliation queue.
-- Only verified Order Status Change events are used to trigger a server-side
-- Get Order Detail re-fetch. The webhook payload itself is never commerce authority.
--
-- No internal order/order_items/inventory mutation is introduced.

begin;

alter table public.marketplace_webhook_events
  add column if not exists attempt_count integer
  not null default 0;

alter table public.marketplace_webhook_events
  add column if not exists last_attempt_at timestamptz;

alter table public.marketplace_webhook_events
  drop constraint if exists
    marketplace_webhook_events_processing_status_check;

alter table public.marketplace_webhook_events
  add constraint marketplace_webhook_events_processing_status_check
  check (
    processing_status in (
      'received',
      'processing',
      'processed',
      'ignored',
      'error'
    )
  );

alter table public.marketplace_webhook_events
  drop constraint if exists
    marketplace_webhook_events_attempt_count_check;

alter table public.marketplace_webhook_events
  add constraint marketplace_webhook_events_attempt_count_check
  check (attempt_count >= 0);


create or replace function public.claim_marketplace_webhook_events(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_user_id uuid,
  p_limit integer default 20
)
returns table (
  id uuid,
  notification_id text,
  notification_type integer,
  external_entity_id text,
  external_status text,
  external_update_time timestamptz,
  authorized_shop_id uuid,
  attempt_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception 'user is not an organization member';
  end if;

  if not exists (
    select 1
    from public.marketplace_accounts a
    where a.id = p_marketplace_account_id
      and a.organization_id = p_organization_id
  ) then
    raise exception 'marketplace account not found';
  end if;

  return query
  with candidates as (
    select e.id
    from public.marketplace_webhook_events e
    where e.organization_id = p_organization_id
      and e.marketplace_account_id =
            p_marketplace_account_id
      and e.attempt_count < 5
      and (
        e.processing_status in ('received', 'error')
        or (
          e.processing_status = 'processing'
          and e.last_attempt_at <
              now() - interval '10 minutes'
        )
      )
    order by e.received_at asc
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
    for update skip locked
  )
  update public.marketplace_webhook_events e
  set
    processing_status = 'processing',
    attempt_count = e.attempt_count + 1,
    last_attempt_at = now(),
    processing_message = null
  from candidates c
  where e.id = c.id
  returning
    e.id,
    e.notification_id,
    e.notification_type,
    e.external_entity_id,
    e.external_status,
    e.external_update_time,
    e.authorized_shop_id,
    e.attempt_count;
end;
$$;


create or replace function public.complete_marketplace_webhook_event(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_user_id uuid,
  p_event_id uuid,
  p_status text,
  p_message text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_status not in ('processed', 'ignored', 'error') then
    raise exception 'invalid completion status';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception 'user is not an organization member';
  end if;

  update public.marketplace_webhook_events e
  set
    processing_status = p_status,
    processed_at =
      case
        when p_status in ('processed', 'ignored')
          then now()
        else null
      end,
    processing_message =
      nullif(left(coalesce(p_message, ''), 500), '')
  where e.id = p_event_id
    and e.organization_id = p_organization_id
    and e.marketplace_account_id =
          p_marketplace_account_id
    and e.processing_status = 'processing';

  return found;
end;
$$;


drop function if exists public.get_marketplace_webhook_events(
  uuid,
  integer
);

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
  attempt_count integer,
  last_attempt_at timestamptz,
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
    e.attempt_count,
    e.last_attempt_at,
    e.processing_message,
    e.received_at
  from public.marketplace_webhook_events e
  where e.marketplace_account_id =
        p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = e.organization_id
        and m.user_id = auth.uid()
    )
  order by e.received_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;


revoke all on function public.claim_marketplace_webhook_events(
  uuid, uuid, uuid, integer
) from public, anon, authenticated;

grant execute on function public.claim_marketplace_webhook_events(
  uuid, uuid, uuid, integer
) to service_role;


revoke all on function public.complete_marketplace_webhook_event(
  uuid, uuid, uuid, uuid, text, text
) from public, anon, authenticated;

grant execute on function public.complete_marketplace_webhook_event(
  uuid, uuid, uuid, uuid, text, text
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
  column_name,
  data_type,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'marketplace_webhook_events'
  and column_name in (
    'attempt_count',
    'last_attempt_at'
  )
order by column_name;

select
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'claim_marketplace_webhook_events',
    'complete_marketplace_webhook_event',
    'get_marketplace_webhook_events'
  )
order by routine_name;
