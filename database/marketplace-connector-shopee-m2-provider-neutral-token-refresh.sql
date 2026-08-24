-- ============================================================
-- LAKUVO
-- Shopee M2 â€” Provider-neutral marketplace token refresh
--
-- Purpose:
--   Override the TikTok-specific
--   public.apply_marketplace_connection_token_refresh(...)
--   implementation introduced by TikTok Shop M9.
--
-- Existing get_marketplace_connection_refresh_context(...)
-- is already provider-neutral and is intentionally NOT replaced.
--
-- Supported providers:
--   - tiktok_shop
--   - shopee
--
-- TikTok invariants preserved:
--   - refresh-token expiry is required and must be future
--   - user_type must be seller authorization type 0
--   - seller open_id identity must remain stable
--
-- Shopee semantics:
--   - refresh_token_expires_at may be NULL because the current
--     Shopee authorization contract does not provide one
--   - user_type must remain NULL
--   - open_id stores the stable Shopee shop_id as text
--
-- Common invariants preserved:
--   - organization membership
--   - active connection
--   - encrypted access + refresh tokens
--   - future access-token expiry
--   - optimistic refresh-token concurrency guard
--   - stable open_id identity
--
-- This migration contains no credential values.
-- ============================================================

create or replace function public.apply_marketplace_connection_token_refresh(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_user_id uuid,
  p_expected_refresh_token_ciphertext text,
  p_access_token_ciphertext text,
  p_refresh_token_ciphertext text,
  p_access_token_expires_at timestamp with time zone,
  p_refresh_token_expires_at timestamp with time zone,
  p_open_id text,
  p_user_type integer,
  p_granted_scopes text[],
  p_request_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_connection public.marketplace_connections%rowtype;
  v_provider text;
begin
  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
  ) then
    raise exception
      'user is not an organization member'
      using errcode = '42501';
  end if;

  select c.*
  into v_connection
  from public.marketplace_connections c
  where c.organization_id = p_organization_id
    and c.marketplace_account_id =
        p_marketplace_account_id
  for update;

  if not found then
    raise exception
      'marketplace connection not found';
  end if;

  v_provider :=
    lower(
      btrim(
        coalesce(v_connection.provider, '')
      )
    );

  if v_provider not in (
    'tiktok_shop',
    'shopee'
  ) then
    raise exception
      'marketplace connection provider does not support token refresh';
  end if;

  if v_connection.status <> 'active' then
    raise exception
      'marketplace connection is not active';
  end if;

  if length(
       btrim(
         coalesce(
           p_expected_refresh_token_ciphertext,
           ''
         )
       )
     ) = 0 then
    raise exception
      'expected refresh-token ciphertext is required';
  end if;

  -- Optimistic concurrency guard.
  -- If another request already rotated the refresh token,
  -- reload rather than overwrite the newer token set.
  if v_connection.refresh_token_ciphertext <>
     p_expected_refresh_token_ciphertext then
    return false;
  end if;

  if length(
       btrim(
         coalesce(
           p_access_token_ciphertext,
           ''
         )
       )
     ) = 0
     or length(
       btrim(
         coalesce(
           p_refresh_token_ciphertext,
           ''
         )
       )
     ) = 0 then
    raise exception
      'encrypted marketplace tokens are required';
  end if;

  if p_access_token_expires_at is null
     or p_access_token_expires_at <= now() then
    raise exception
      'refreshed access token expiry must be in the future';
  end if;

  -- TikTok Shop supplies a bounded refresh-token expiry.
  if v_provider = 'tiktok_shop' then
    if p_refresh_token_expires_at is null
       or p_refresh_token_expires_at <= now() then
      raise exception
        'refreshed refresh token expiry must be in the future';
    end if;
  end if;

  -- Shopee's current token contract has no refresh-token expiry.
  -- NULL is therefore valid. If a future Shopee response supplies
  -- an expiry, it must still be in the future.
  if v_provider = 'shopee'
     and p_refresh_token_expires_at is not null
     and p_refresh_token_expires_at <= now() then
    raise exception
      'Shopee refresh token expiry must be in the future when provided';
  end if;

  if length(
       btrim(
         coalesce(
           p_open_id,
           ''
         )
       )
     ) = 0 then
    raise exception
      'refreshed seller open_id is required';
  end if;

  -- Stable seller/shop identity is common to both providers.
  if v_connection.open_id is not null
     and v_connection.open_id <> p_open_id then
    raise exception
      'refreshed seller identity does not match connection';
  end if;

  -- Preserve existing TikTok seller semantics exactly.
  if v_provider = 'tiktok_shop' then
    if p_user_type is distinct from 0 then
      raise exception
        'refreshed authorization is not a seller authorization';
    end if;

    if v_connection.user_type is not null
       and v_connection.user_type <> p_user_type then
      raise exception
        'refreshed seller user type does not match connection';
    end if;
  end if;

  -- Shopee shop OAuth has no TikTok-style user_type.
  if v_provider = 'shopee'
     and p_user_type is not null then
    raise exception
      'Shopee authorization user_type must be null';
  end if;

  update public.marketplace_connections
  set
    access_token_ciphertext =
      p_access_token_ciphertext,

    refresh_token_ciphertext =
      p_refresh_token_ciphertext,

    access_token_expires_at =
      p_access_token_expires_at,

    refresh_token_expires_at =
      p_refresh_token_expires_at,

    open_id =
      coalesce(
        open_id,
        p_open_id
      ),

    user_type =
      case
        when v_provider = 'shopee'
          then null
        else coalesce(
          user_type,
          p_user_type
        )
      end,

    granted_scopes =
      coalesce(
        p_granted_scopes,
        granted_scopes,
        '{}'::text[]
      ),

    status = 'active',

    last_refreshed_at = now(),

    metadata =
      coalesce(
        metadata,
        '{}'::jsonb
      )
      || jsonb_build_object(
        'last_token_refresh',
        jsonb_strip_nulls(
          jsonb_build_object(
            'request_id',
            nullif(
              btrim(
                coalesce(
                  p_request_id,
                  ''
                )
              ),
              ''
            ),
            'refreshed_at',
            now()
          )
        )
      ),

    updated_at = now()

  where id = v_connection.id;

  return true;
end;
$$;

revoke all on function public.apply_marketplace_connection_token_refresh(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  timestamp with time zone,
  timestamp with time zone,
  text,
  integer,
  text[],
  text
) from public, anon, authenticated;

grant execute on function public.apply_marketplace_connection_token_refresh(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  timestamp with time zone,
  timestamp with time zone,
  text,
  integer,
  text[],
  text
) to service_role;