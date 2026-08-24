-- ============================================================
-- LAKUVO — Marketplace Connector
-- Shopee M1 — Provider-neutral connection metadata
--
-- Purpose:
--   Existing public.upsert_marketplace_connection accepts
--   p_provider but historically wrote marketplace_accounts
--   metadata.connector as the literal 'tiktok_shop'.
--
-- This migration makes that metadata provider-neutral:
--
--   connector = lower(btrim(p_provider))
--
-- TikTok behavior is preserved:
--   p_provider = 'tiktok_shop'
--   -> connector = 'tiktok_shop'
--
-- Shopee becomes safe:
--   p_provider = 'shopee'
--   -> connector = 'shopee'
--
-- No table/schema change.
-- No credential value.
-- ============================================================

begin;

create or replace function public.upsert_marketplace_connection(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_connected_by uuid,
  p_provider text,
  p_open_id text,
  p_access_token_ciphertext text,
  p_refresh_token_ciphertext text,
  p_access_token_expires_at timestamptz,
  p_refresh_token_expires_at timestamptz,
  p_granted_scopes text[],
  p_user_type integer,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_connection_id uuid;
begin
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_connected_by
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

  if length(btrim(coalesce(p_access_token_ciphertext, ''))) = 0
     or length(btrim(coalesce(p_refresh_token_ciphertext, ''))) = 0 then
    raise exception 'encrypted marketplace tokens are required';
  end if;

  insert into public.marketplace_connections (
    organization_id,
    marketplace_account_id,
    provider,
    open_id,
    access_token_ciphertext,
    refresh_token_ciphertext,
    access_token_expires_at,
    refresh_token_expires_at,
    granted_scopes,
    user_type,
    status,
    connected_by,
    connected_at,
    last_refreshed_at,
    metadata,
    updated_at
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    lower(btrim(p_provider)),
    nullif(btrim(coalesce(p_open_id, '')), ''),
    p_access_token_ciphertext,
    p_refresh_token_ciphertext,
    p_access_token_expires_at,
    p_refresh_token_expires_at,
    coalesce(p_granted_scopes, '{}'::text[]),
    p_user_type,
    'active',
    p_connected_by,
    now(),
    null,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (marketplace_account_id)
  do update set
    provider = excluded.provider,
    open_id = excluded.open_id,
    access_token_ciphertext = excluded.access_token_ciphertext,
    refresh_token_ciphertext = excluded.refresh_token_ciphertext,
    access_token_expires_at = excluded.access_token_expires_at,
    refresh_token_expires_at = excluded.refresh_token_expires_at,
    granted_scopes = excluded.granted_scopes,
    user_type = excluded.user_type,
    status = 'active',
    connected_by = excluded.connected_by,
    connected_at = now(),
    metadata = excluded.metadata,
    updated_at = now()
  returning id into v_connection_id;

  update public.marketplace_accounts
  set
    status = 'active',
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'connector', lower(btrim(p_provider)),
        'connection_status', 'connected'
      ),
    updated_at = now()
  where id = p_marketplace_account_id
    and organization_id = p_organization_id;

  return v_connection_id;
end;
$$;

revoke all on function public.upsert_marketplace_connection(
  uuid, uuid, uuid, text, text, text, text,
  timestamptz, timestamptz, text[], integer, jsonb
) from public, anon, authenticated;

grant execute on function public.upsert_marketplace_connection(
  uuid, uuid, uuid, text, text, text, text,
  timestamptz, timestamptz, text[], integer, jsonb
) to service_role;

commit;

-- Read-only verification after migration execution.
select
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'upsert_marketplace_connection';