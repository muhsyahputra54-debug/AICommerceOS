-- Phase 19.2: reviewed TikTok Creator atomic refresh contract.
-- No provider HTTP. TikTok Creator only; existing YouTube RPCs are unchanged.
begin;

create table public.tiktok_creator_refresh_attempts (
  connection_id uuid primary key references public.publishing_provider_connections(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  attempt_id uuid not null unique,
  credential_reference_id uuid not null,
  expected_connection_version bigint not null check (expected_connection_version >= 1),
  status text not null check (status in (
    'prepared', 'dispatched', 'succeeded', 'cancelled', 'uncertain', 'reauthorization_required'
  )),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);
alter table public.tiktok_creator_refresh_attempts enable row level security;
revoke all on table public.tiktok_creator_refresh_attempts from public, anon, authenticated, service_role;

create function public.claim_tiktok_creator_refresh(
  p_organization_id uuid, p_connection_id uuid, p_expected_connection_version bigint
)
returns table (
  attempt_id uuid, credential_reference_id uuid, external_account_id text,
  refresh_token_ciphertext text, refresh_token_expires_at timestamptz,
  encryption_key_version text, connection_version bigint
)
language plpgsql security definer set search_path = public, auth as $$
declare
  c public.publishing_provider_connections%rowtype;
  k public.publishing_provider_credentials%rowtype;
  a public.tiktok_creator_refresh_attempts%rowtype;
  v_attempt_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  select * into c from public.publishing_provider_connections x
    where x.id = p_connection_id and x.organization_id = p_organization_id for update;
  if not found or c.provider <> 'tiktok' or c.authorization_status <> 'authorized'
      or c.revoked_at is not null or c.version is distinct from p_expected_connection_version then
    raise exception 'refresh_connection_conflict' using errcode = '40001';
  end if;
  if not ('video.publish' = any(c.granted_scopes)) then
    raise exception 'refresh_scope_missing' using errcode = '22023';
  end if;
  select * into k from public.publishing_provider_credentials x
    where x.id = c.credential_reference_id and x.connection_id = c.id for update;
  if not found or nullif(btrim(k.refresh_token_ciphertext), '') is null
      or k.refresh_token_expires_at is null or not isfinite(k.refresh_token_expires_at)
      or k.refresh_token_expires_at <= clock_timestamp() then
    raise exception 'refresh_credential_unavailable' using errcode = '22023';
  end if;
  select * into a from public.tiktok_creator_refresh_attempts x
    where x.connection_id = c.id for update;
  if found and a.expected_connection_version = c.version
      and a.credential_reference_id = c.credential_reference_id and a.status <> 'cancelled' then
    -- Never reclaim on elapsed time: a missing response may have rotated the token.
    raise exception 'refresh_attempt_blocked' using errcode = '55000';
  end if;
  v_attempt_id := gen_random_uuid();
  insert into public.tiktok_creator_refresh_attempts as target (
    connection_id, organization_id, attempt_id, credential_reference_id,
    expected_connection_version, status
  ) values (c.id, c.organization_id, v_attempt_id, c.credential_reference_id, c.version, 'prepared')
  on conflict (connection_id) do update set
    organization_id = excluded.organization_id, attempt_id = excluded.attempt_id,
    credential_reference_id = excluded.credential_reference_id,
    expected_connection_version = excluded.expected_connection_version,
    status = 'prepared', created_at = clock_timestamp(), updated_at = clock_timestamp();
  return query select v_attempt_id, k.id, c.external_account_id,
    k.refresh_token_ciphertext, k.refresh_token_expires_at, k.encryption_key_version, c.version;
end;
$$;

create function public.dispatch_tiktok_creator_refresh(
  p_organization_id uuid, p_connection_id uuid, p_attempt_id uuid
)
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare
  c public.publishing_provider_connections%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  select * into c from public.publishing_provider_connections x
    where x.id = p_connection_id and x.organization_id = p_organization_id for update;
  if not found or c.provider <> 'tiktok' or c.authorization_status <> 'authorized'
      or c.revoked_at is not null then return false; end if;
  if not exists (select 1 from public.publishing_provider_credentials k
      where k.id = c.credential_reference_id and k.connection_id = c.id
        and nullif(btrim(k.refresh_token_ciphertext), '') is not null
        and isfinite(k.refresh_token_expires_at)
        and k.refresh_token_expires_at > clock_timestamp()) then return false; end if;
  update public.tiktok_creator_refresh_attempts x set status = 'dispatched', updated_at = clock_timestamp()
    where x.connection_id = c.id and x.organization_id = c.organization_id
      and x.attempt_id = p_attempt_id and x.status = 'prepared'
      and x.expected_connection_version = c.version
      and x.credential_reference_id = c.credential_reference_id;
  return found;
end;
$$;

create function public.finalize_tiktok_creator_refresh(
  p_organization_id uuid, p_connection_id uuid, p_attempt_id uuid,
  p_access_token_ciphertext text, p_refresh_token_ciphertext text,
  p_access_token_expires_at timestamptz, p_refresh_token_expires_at timestamptz,
  p_encryption_key_version text, p_granted_scopes text[]
)
returns bigint language plpgsql security definer set search_path = public, auth as $$
declare
  c public.publishing_provider_connections%rowtype;
  a public.tiktok_creator_refresh_attempts%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if nullif(btrim(p_access_token_ciphertext), '') is null
      or nullif(btrim(p_refresh_token_ciphertext), '') is null
      or nullif(btrim(p_encryption_key_version), '') is null
      or p_access_token_expires_at is null or not isfinite(p_access_token_expires_at)
      or p_refresh_token_expires_at is null or not isfinite(p_refresh_token_expires_at)
      or p_access_token_expires_at <= clock_timestamp()
      or p_refresh_token_expires_at <= clock_timestamp()
      or p_granted_scopes is null or not ('video.publish' = any(p_granted_scopes))
      or exists (select 1 from unnest(p_granted_scopes) s where s is null or btrim(s) = '') then
    raise exception 'refresh_rotation_invalid' using errcode = '22023';
  end if;
  select * into c from public.publishing_provider_connections x
    where x.id = p_connection_id and x.organization_id = p_organization_id for update;
  if not found or c.provider <> 'tiktok' or c.authorization_status <> 'authorized'
      or c.revoked_at is not null then
    raise exception 'refresh_connection_conflict' using errcode = '40001';
  end if;
  select * into a from public.tiktok_creator_refresh_attempts x
    where x.connection_id = c.id and x.organization_id = c.organization_id
      and x.attempt_id = p_attempt_id for update;
  if not found or a.status <> 'dispatched' or a.expected_connection_version <> c.version
      or a.credential_reference_id <> c.credential_reference_id then
    raise exception 'refresh_attempt_conflict' using errcode = '40001';
  end if;
  -- Recheck after row-lock waits: values valid at entry may now be expired.
  if p_access_token_expires_at <= clock_timestamp() or p_refresh_token_expires_at <= clock_timestamp() then
    raise exception 'refresh_rotation_invalid' using errcode = '22023';
  end if;
  update public.publishing_provider_credentials x set
    access_token_ciphertext = p_access_token_ciphertext,
    refresh_token_ciphertext = p_refresh_token_ciphertext,
    access_token_expires_at = p_access_token_expires_at,
    refresh_token_expires_at = p_refresh_token_expires_at,
    encryption_key_version = p_encryption_key_version, token_type = 'Bearer',
    updated_at = clock_timestamp(), rotated_at = clock_timestamp()
    where x.id = a.credential_reference_id and x.connection_id = c.id;
  if not found then
    raise exception 'refresh_credential_conflict' using errcode = '40001';
  end if;
  update public.publishing_provider_connections x set
    credential_expires_at = p_access_token_expires_at,
    credential_updated_at = clock_timestamp(), granted_scopes = p_granted_scopes,
    version = x.version + 1, updated_at = clock_timestamp() where x.id = c.id;
  update public.tiktok_creator_refresh_attempts x set status = 'succeeded', updated_at = clock_timestamp()
    where x.connection_id = c.id and x.attempt_id = p_attempt_id;
  return c.version + 1;
end;
$$;

create function public.finish_tiktok_creator_refresh_failure(
  p_organization_id uuid, p_connection_id uuid, p_attempt_id uuid, p_outcome text
)
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare
  c public.publishing_provider_connections%rowtype;
  a public.tiktok_creator_refresh_attempts%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_outcome is null or p_outcome not in ('cancelled', 'uncertain', 'reauthorization_required') then
    raise exception 'refresh_outcome_invalid' using errcode = '22023';
  end if;
  select * into c from public.publishing_provider_connections x
    where x.id = p_connection_id and x.organization_id = p_organization_id for update;
  if not found or c.provider <> 'tiktok' or c.authorization_status <> 'authorized'
      or c.revoked_at is not null then return false; end if;
  select * into a from public.tiktok_creator_refresh_attempts x
    where x.connection_id = c.id and x.organization_id = c.organization_id
      and x.attempt_id = p_attempt_id for update;
  if not found or a.expected_connection_version <> c.version
      or a.credential_reference_id <> c.credential_reference_id then return false; end if;
  if (p_outcome = 'cancelled' and a.status <> 'prepared')
      or (p_outcome <> 'cancelled' and a.status <> 'dispatched') then return false; end if;
  if p_outcome = 'reauthorization_required' then
    update public.publishing_provider_connections x set
      authorization_status = 'reauthorization_required', version = x.version + 1,
      credential_updated_at = clock_timestamp(), updated_at = clock_timestamp() where x.id = c.id;
  end if;
  update public.tiktok_creator_refresh_attempts x set status = p_outcome, updated_at = clock_timestamp()
    where x.connection_id = c.id and x.attempt_id = p_attempt_id;
  return true;
end;
$$;

revoke all on function public.claim_tiktok_creator_refresh(uuid, uuid, bigint) from public, anon, authenticated, service_role;
revoke all on function public.dispatch_tiktok_creator_refresh(uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.finalize_tiktok_creator_refresh(uuid, uuid, uuid, text, text, timestamptz, timestamptz, text, text[]) from public, anon, authenticated, service_role;
revoke all on function public.finish_tiktok_creator_refresh_failure(uuid, uuid, uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.claim_tiktok_creator_refresh(uuid, uuid, bigint) to service_role;
grant execute on function public.dispatch_tiktok_creator_refresh(uuid, uuid, uuid) to service_role;
grant execute on function public.finalize_tiktok_creator_refresh(uuid, uuid, uuid, text, text, timestamptz, timestamptz, text, text[]) to service_role;
grant execute on function public.finish_tiktok_creator_refresh_failure(uuid, uuid, uuid, text) to service_role;

comment on table public.tiktok_creator_refresh_attempts is
  'Server-only refresh ownership. No token data. Never reclaim a dispatched or uncertain attempt by elapsed time.';
commit;
