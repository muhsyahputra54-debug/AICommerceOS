-- ============================================================
-- LAKUVO
-- Shopee M3 â€” Provider-neutral authorized-shop persistence
--
-- Purpose:
--   Make public.marketplace_authorized_shops usable by
--   Shopee without weakening TikTok Shop credential safety.
--
-- TikTok Shop:
--   shop_cipher_ciphertext remains REQUIRED and non-blank.
--
-- Shopee / other providers:
--   shop_cipher_ciphertext may be NULL because they do not
--   use TikTok's shop_cipher credential.
--
-- Also overrides public.sync_marketplace_authorized_shops(...)
-- without changing its RPC signature.
--
-- No credential values are included in this migration.
-- ============================================================


-- ============================================================
-- 1. PROVIDER-AWARE SHOP CIPHER COLUMN CONTRACT
-- ============================================================

alter table public.marketplace_authorized_shops
  alter column shop_cipher_ciphertext
  drop not null;


alter table public.marketplace_authorized_shops
  drop constraint if exists
  marketplace_authorized_shops_cipher_not_blank;


alter table public.marketplace_authorized_shops
  add constraint
  marketplace_authorized_shops_cipher_provider_contract
  check (
    (
      lower(btrim(provider)) = 'tiktok_shop'
      and shop_cipher_ciphertext is not null
      and length(
        btrim(shop_cipher_ciphertext)
      ) > 0
    )
    or
    (
      lower(btrim(provider)) <> 'tiktok_shop'
      and (
        shop_cipher_ciphertext is null
        or length(
          btrim(shop_cipher_ciphertext)
        ) > 0
      )
    )
  );


-- ============================================================
-- 2. PROVIDER-NEUTRAL AUTHORIZED SHOP SYNC
--
-- Signature intentionally identical to TikTok Shop M2:
--
--   uuid, uuid, uuid, text, jsonb, text
--
-- ============================================================

create or replace function public.sync_marketplace_authorized_shops(
  p_organization_id uuid,
  p_marketplace_account_id uuid,
  p_user_id uuid,
  p_provider text,
  p_shops jsonb,
  p_request_id text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_shop jsonb;
  v_provider text;
  v_external_shop_id text;
  v_name text;
  v_ciphertext text;
  v_count integer := 0;
begin
  v_provider :=
    lower(
      btrim(
        coalesce(
          p_provider,
          ''
        )
      )
    );

  if length(v_provider) = 0 then
    raise exception
      'marketplace provider is required';
  end if;

  if jsonb_typeof(p_shops) <> 'array' then
    raise exception
      'p_shops must be a json array';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id =
          p_organization_id
      and m.user_id =
          p_user_id
  ) then
    raise exception
      'user is not an organization member';
  end if;

  if not exists (
    select 1
    from public.marketplace_accounts a
    where a.id =
          p_marketplace_account_id
      and a.organization_id =
          p_organization_id
  ) then
    raise exception
      'marketplace account not found';
  end if;

  -- The RPC provider must match the connector identity of
  -- the marketplace account. This prevents a service-role
  -- caller from persisting Shopee shops under a TikTok account
  -- or TikTok shops under a Shopee account.
  if not exists (
    select 1
    from public.marketplace_accounts a
    where a.id =
          p_marketplace_account_id
      and a.organization_id =
          p_organization_id
      and lower(
            btrim(
              coalesce(
                a.provider,
                ''
              )
            )
          ) =
          v_provider
  ) then
    raise exception
      'marketplace account provider does not match sync provider';
  end if;

  -- Preserve existing sync behavior:
  -- all previously authorized shops for this account
  -- are marked inactive before the incoming set is applied.
  update public.marketplace_authorized_shops
  set
    status = 'inactive',
    is_selected = false,
    updated_at = now()
  where organization_id =
        p_organization_id
    and marketplace_account_id =
        p_marketplace_account_id;

  for v_shop in
    select value
    from jsonb_array_elements(p_shops)
  loop
    v_external_shop_id :=
      btrim(
        coalesce(
          v_shop->>'external_shop_id',
          ''
        )
      );

    v_name :=
      btrim(
        coalesce(
          v_shop->>'name',
          ''
        )
      );

    -- Preserve SQL NULL for providers that do not use
    -- TikTok's shop_cipher credential.
    v_ciphertext :=
      nullif(
        btrim(
          coalesce(
            v_shop->>'shop_cipher_ciphertext',
            ''
          )
        ),
        ''
      );

    if length(v_external_shop_id) = 0
       or length(v_name) = 0 then
      raise exception
        'authorized shop payload is incomplete';
    end if;

    -- TikTok Shop keeps its existing credential invariant.
    if v_provider = 'tiktok_shop'
       and v_ciphertext is null then
      raise exception
        'TikTok Shop authorized shop requires encrypted shop cipher';
    end if;

    insert into public.marketplace_authorized_shops (
      organization_id,
      marketplace_account_id,
      provider,
      external_shop_id,
      shop_code,
      name,
      region,
      seller_type,
      shop_cipher_ciphertext,
      status,
      last_seen_at,
      updated_at
    )
    values (
      p_organization_id,
      p_marketplace_account_id,
      v_provider,
      v_external_shop_id,

      nullif(
        btrim(
          coalesce(
            v_shop->>'shop_code',
            ''
          )
        ),
        ''
      ),

      v_name,

      nullif(
        btrim(
          coalesce(
            v_shop->>'region',
            ''
          )
        ),
        ''
      ),

      nullif(
        btrim(
          coalesce(
            v_shop->>'seller_type',
            ''
          )
        ),
        ''
      ),

      v_ciphertext,

      'active',
      now(),
      now()
    )
    on conflict (
      marketplace_account_id,
      external_shop_id
    )
    do update set
      provider =
        excluded.provider,

      shop_code =
        excluded.shop_code,

      name =
        excluded.name,

      region =
        excluded.region,

      seller_type =
        excluded.seller_type,

      shop_cipher_ciphertext =
        excluded.shop_cipher_ciphertext,

      status =
        'active',

      last_seen_at =
        now(),

      updated_at =
        now();

    v_count :=
      v_count + 1;
  end loop;

  update public.marketplace_accounts
  set
    last_synced_at =
      now(),

    metadata =
      coalesce(
        metadata,
        '{}'::jsonb
      )
      || jsonb_build_object(
        'connector',
        v_provider,

        'authorized_shop_count',
        v_count
      ),

    updated_at =
      now()

  where id =
        p_marketplace_account_id
    and organization_id =
        p_organization_id;

  insert into public.marketplace_sync_logs (
    organization_id,
    marketplace_account_id,
    direction,
    entity_type,
    operation,
    status,
    message,
    metadata
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    'inbound',
    'account',
    'authorized_shops_sync',
    'success',

    format(
      'Synced %s authorized shop(s).',
      v_count
    ),

    jsonb_build_object(
      'provider',
      v_provider,

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

      'shop_count',
      v_count
    )
  );

  return v_count;
end;
$$;


-- ============================================================
-- 3. RPC PERMISSIONS
-- ============================================================

revoke all on function public.sync_marketplace_authorized_shops(
  uuid,
  uuid,
  uuid,
  text,
  jsonb,
  text
) from public, anon, authenticated;


grant execute on function public.sync_marketplace_authorized_shops(
  uuid,
  uuid,
  uuid,
  text,
  jsonb,
  text
) to service_role;