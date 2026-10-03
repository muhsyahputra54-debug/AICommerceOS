-- Marketplace credential/OAuth/sync RPC boundary: shared Shopee and TikTok Shop.
-- New migration; does not edit the applied baseline or expose credentials.
begin;

CREATE OR REPLACE FUNCTION public.create_marketplace_oauth_state (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid,
  p_provider               text,
  p_state_hash             text,
  p_expires_at             timestamp with time zone
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_organization_id is null
     or p_marketplace_account_id is null
     or p_user_id is null then
    raise exception 'organization, account, and user are required';
  end if;

  if length(btrim(coalesce(p_provider, ''))) = 0 then
    raise exception 'provider is required';
  end if;

  if length(btrim(coalesce(p_state_hash, ''))) < 32 then
    raise exception 'invalid oauth state hash';
  end if;

  if p_expires_at <= now()
     or p_expires_at > now() + interval '30 minutes' then
    raise exception 'invalid oauth state expiry';
  end if;

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

  delete from public.marketplace_oauth_states
  where expires_at < now() - interval '1 day';

  insert into public.marketplace_oauth_states (
    organization_id,
    marketplace_account_id,
    provider,
    state_hash,
    initiated_by,
    expires_at
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    lower(btrim(p_provider)),
    btrim(p_state_hash),
    p_user_id,
    p_expires_at
  )
  returning id into v_id;

  return v_id;
end;
$function$;

REVOKE ALL ON FUNCTION public.create_marketplace_oauth_state(uuid, uuid, uuid, text, text, timestamp WITH time zone) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_marketplace_oauth_state(uuid, uuid, uuid, text, text, timestamp WITH time zone) TO service_role;

CREATE OR REPLACE FUNCTION public.consume_marketplace_oauth_state (
  p_state_hash text,
  p_provider   text
)
  RETURNS TABLE (
    organization_id        uuid,
    marketplace_account_id uuid,
    initiated_by           uuid
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  return query
  with candidate as (
    select s.id
    from public.marketplace_oauth_states s
    where s.state_hash = btrim(p_state_hash)
      and s.provider = lower(btrim(p_provider))
      and s.used_at is null
      and s.expires_at > now()
    order by s.created_at desc
    limit 1
    for update
  )
  update public.marketplace_oauth_states s
  set used_at = now()
  from candidate c
  where s.id = c.id
  returning
    s.organization_id,
    s.marketplace_account_id,
    s.initiated_by;
end;
$function$;

REVOKE ALL ON FUNCTION public.consume_marketplace_oauth_state(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_marketplace_oauth_state(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_marketplace_connection_secret (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid
)
  RETURNS TABLE (
    provider                 text,
    status                   text,
    access_token_ciphertext  text,
    refresh_token_ciphertext text,
    access_token_expires_at  timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    granted_scopes           text[]
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  return query
  select
    c.provider,
    c.status,
    c.access_token_ciphertext,
    c.refresh_token_ciphertext,
    c.access_token_expires_at,
    c.refresh_token_expires_at,
    c.granted_scopes
  from public.marketplace_connections c
  where c.organization_id = p_organization_id
    and c.marketplace_account_id = p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = c.organization_id
        and m.user_id = p_user_id
    )
  limit 1;
end;
$function$;

REVOKE ALL ON FUNCTION public.get_marketplace_connection_secret(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_connection_secret(uuid, uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.get_marketplace_connection_refresh_context (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid
)
  RETURNS TABLE (
    provider                 text,
    status                   text,
    open_id                  text,
    user_type                integer,
    access_token_ciphertext  text,
    refresh_token_ciphertext text,
    access_token_expires_at  timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    granted_scopes           text[]
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  return query
  select
    c.provider,
    c.status,
    c.open_id,
    c.user_type,
    c.access_token_ciphertext,
    c.refresh_token_ciphertext,
    c.access_token_expires_at,
    c.refresh_token_expires_at,
    c.granted_scopes
  from public.marketplace_connections c
  where c.organization_id = p_organization_id
    and c.marketplace_account_id =
        p_marketplace_account_id
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = c.organization_id
        and m.user_id = p_user_id
    )
  limit 1;
end;
$function$;

REVOKE ALL ON FUNCTION public.get_marketplace_connection_refresh_context(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_connection_refresh_context(uuid, uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.upsert_marketplace_connection (
  p_organization_id          uuid,
  p_marketplace_account_id   uuid,
  p_connected_by             uuid,
  p_provider                 text,
  p_open_id                  text,
  p_access_token_ciphertext  text,
  p_refresh_token_ciphertext text,
  p_access_token_expires_at  timestamp with time zone,
  p_refresh_token_expires_at timestamp with time zone,
  p_granted_scopes           text[],
  p_user_type                integer,
  p_metadata                 jsonb
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_connection_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
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
$function$;

REVOKE ALL ON FUNCTION public.upsert_marketplace_connection(uuid, uuid, uuid, text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, text[], integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_marketplace_connection(uuid, uuid, uuid, text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, text[], integer, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_marketplace_connection_token_refresh (
  p_organization_id                   uuid,
  p_marketplace_account_id            uuid,
  p_user_id                           uuid,
  p_expected_refresh_token_ciphertext text,
  p_access_token_ciphertext           text,
  p_refresh_token_ciphertext          text,
  p_access_token_expires_at           timestamp with time zone,
  p_refresh_token_expires_at          timestamp with time zone,
  p_open_id                           text,
  p_user_type                         integer,
  p_granted_scopes                    text[],
  p_request_id                        text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_connection public.marketplace_connections%rowtype;
  v_provider text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
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
$function$;

REVOKE ALL ON FUNCTION public.apply_marketplace_connection_token_refresh(uuid, uuid, uuid, text, text, text, timestamp WITH time zone, timestamp
    WITH time zone, text, integer, text[], text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_marketplace_connection_token_refresh(uuid, uuid, uuid, text, text, text, timestamp WITH time zone, timestamp
    WITH time zone, text, integer, text[], text) TO service_role;

CREATE OR REPLACE FUNCTION public.sync_marketplace_authorized_shops (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_user_id                uuid,
  p_provider               text,
  p_shops                  jsonb,
  p_request_id             text
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_shop jsonb;
  v_provider text;
  v_external_shop_id text;
  v_name text;
  v_ciphertext text;
  v_count integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
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
$function$;

REVOKE ALL ON FUNCTION public.sync_marketplace_authorized_shops(uuid, uuid, uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_marketplace_authorized_shops(uuid, uuid, uuid, text, jsonb, text) TO service_role;

commit;
