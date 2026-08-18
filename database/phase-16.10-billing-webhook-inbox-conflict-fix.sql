-- Phase 16.10 - Billing webhook inbox conflict fix
--
-- billing_events_provider_external_key is a partial unique index:
--   UNIQUE (provider, external_event_id)
--   WHERE external_event_id IS NOT NULL
--
-- PostgreSQL ON CONFLICT inference therefore needs the same
-- predicate in the conflict target.

create or replace function public.record_billing_webhook_event(
  p_organization_id uuid,
  p_provider text,
  p_external_event_id text,
  p_event_type text,
  p_payload jsonb
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_organization_id is null then
    raise exception 'organization id is required';
  end if;

  if length(btrim(coalesce(p_provider, ''))) = 0 then
    raise exception 'provider is required';
  end if;

  if length(btrim(coalesce(p_external_event_id, ''))) = 0 then
    raise exception 'external event id is required';
  end if;

  if length(btrim(coalesce(p_event_type, ''))) = 0 then
    raise exception 'event type is required';
  end if;

  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'payload must be a json object';
  end if;

  insert into public.billing_events (
    organization_id,
    provider,
    external_event_id,
    event_type,
    status,
    payload
  )
  values (
    p_organization_id,
    lower(btrim(p_provider)),
    btrim(p_external_event_id),
    btrim(p_event_type),
    'received',
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (provider, external_event_id)
  where external_event_id is not null
  do nothing;

  if not found then
    return 'duplicate';
  end if;

  return 'recorded';
end;
$$;

revoke all on function public.record_billing_webhook_event(
  uuid, text, text, text, jsonb
) from public, anon, authenticated;

grant execute on function public.record_billing_webhook_event(
  uuid, text, text, text, jsonb
) to service_role;
