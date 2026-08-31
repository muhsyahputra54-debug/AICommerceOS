-- LAKUVO Phase 19.1 / YT-M3-R5A
-- Server-only OAuth refresh readiness and atomic access-token rotation.
--
-- DRAFT ONLY. DO NOT APPLY WITHOUT A NEW EXPLICIT DATABASE AUTHORIZATION.
-- No provider HTTP, video upload, or publication is performed by this SQL.

begin;

create or replace function public.get_publishing_provider_refresh_credentials(
  p_organization_id uuid,
  p_provider text
)
returns table (
  connection_id uuid,
  external_account_id text,
  refresh_token_ciphertext text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  encryption_key_version text,
  connection_version bigint
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_provider text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    raise exception 'organization_required'
      using errcode = '22023';
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

  if v_provider = '' then
    raise exception 'provider_required'
      using errcode = '22023';
  end if;

  return query
  select
    c.id,
    c.external_account_id,
    pc.refresh_token_ciphertext,
    pc.access_token_expires_at,
    pc.refresh_token_expires_at,
    pc.encryption_key_version,
    c.version
  from public.publishing_provider_connections c
  join public.publishing_provider_credentials pc
    on pc.id = c.credential_reference_id
   and pc.connection_id = c.id
  where c.organization_id = p_organization_id
    and c.provider = v_provider
    and c.authorization_status = 'authorized'
    and c.revoked_at is null
    and pc.refresh_token_ciphertext is not null
  order by
    c.updated_at desc,
    c.id;
end;
$$;

revoke all on function
  public.get_publishing_provider_refresh_credentials(uuid, text)
from public, anon, authenticated, service_role;

grant execute on function
  public.get_publishing_provider_refresh_credentials(uuid, text)
to service_role;

create or replace function public.rotate_publishing_provider_access_token(
  p_organization_id uuid,
  p_provider text,
  p_connection_id uuid,
  p_expected_connection_version bigint,
  p_access_token_ciphertext text,
  p_access_token_expires_at timestamptz,
  p_encryption_key_version text
)
returns table (
  connection_id uuid,
  credential_reference_id uuid,
  connection_version bigint
)
language plpgsql
volatile
security definer
set search_path = public, auth
as $$
declare
  v_provider text;
  v_credential_reference_id uuid;
  v_connection_version bigint;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required'
      using errcode = '42501';
  end if;

  if p_organization_id is null or p_connection_id is null then
    raise exception 'connection_identity_required'
      using errcode = '22023';
  end if;

  if p_expected_connection_version is null
     or p_expected_connection_version < 1 then
    raise exception 'connection_version_required'
      using errcode = '22023';
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

  if v_provider = '' then
    raise exception 'provider_required'
      using errcode = '22023';
  end if;

  if btrim(coalesce(p_access_token_ciphertext, '')) = '' then
    raise exception 'access_token_ciphertext_required'
      using errcode = '22023';
  end if;

  if p_access_token_expires_at is null then
    raise exception 'access_token_expiry_required'
      using errcode = '22023';
  end if;

  if btrim(coalesce(p_encryption_key_version, '')) = '' then
    raise exception 'encryption_key_version_required'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      p_connection_id::text,
      0
    )
  );

  update public.publishing_provider_connections
  set
    credential_expires_at = p_access_token_expires_at,
    credential_updated_at = now(),
    version = version + 1,
    updated_at = now()
  where id = p_connection_id
    and organization_id = p_organization_id
    and provider = v_provider
    and authorization_status = 'authorized'
    and revoked_at is null
    and version = p_expected_connection_version
  returning
    credential_reference_id,
    version
  into
    v_credential_reference_id,
    v_connection_version;

  if not found then
    raise exception 'connection_refresh_conflict'
      using errcode = '40001';
  end if;

  update public.publishing_provider_credentials
  set
    access_token_ciphertext = p_access_token_ciphertext,
    access_token_expires_at = p_access_token_expires_at,
    encryption_key_version = p_encryption_key_version,
    updated_at = now(),
    rotated_at = now()
  where id = v_credential_reference_id
    and connection_id = p_connection_id
    and encryption_key_version = p_encryption_key_version;

  if not found then
    raise exception 'credential_rotation_conflict'
      using errcode = '40001';
  end if;

  return query
  select
    p_connection_id,
    v_credential_reference_id,
    v_connection_version;
end;
$$;

revoke all on function
  public.rotate_publishing_provider_access_token(
    uuid,
    text,
    uuid,
    bigint,
    text,
    timestamptz,
    text
  )
from public, anon, authenticated, service_role;

grant execute on function
  public.rotate_publishing_provider_access_token(
    uuid,
    text,
    uuid,
    bigint,
    text,
    timestamptz,
    text
  )
to service_role;

create or replace function public.mark_publishing_provider_reauthorization_required(
  p_organization_id uuid,
  p_provider text,
  p_connection_id uuid,
  p_expected_connection_version bigint
)
returns table (
  connection_id uuid,
  connection_version bigint
)
language plpgsql
volatile
security definer
set search_path = public, auth
as $$
declare
  v_provider text;
  v_connection_version bigint;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required'
      using errcode = '42501';
  end if;

  if p_organization_id is null or p_connection_id is null then
    raise exception 'connection_identity_required'
      using errcode = '22023';
  end if;

  if p_expected_connection_version is null
     or p_expected_connection_version < 1 then
    raise exception 'connection_version_required'
      using errcode = '22023';
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

  if v_provider = '' then
    raise exception 'provider_required'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      p_connection_id::text,
      0
    )
  );

  update public.publishing_provider_connections
  set
    authorization_status = 'reauthorization_required',
    credential_updated_at = now(),
    version = version + 1,
    updated_at = now()
  where id = p_connection_id
    and organization_id = p_organization_id
    and provider = v_provider
    and authorization_status = 'authorized'
    and revoked_at is null
    and version = p_expected_connection_version
  returning version
  into v_connection_version;

  if not found then
    raise exception 'connection_reauthorization_conflict'
      using errcode = '40001';
  end if;

  return query
  select
    p_connection_id,
    v_connection_version;
end;
$$;

revoke all on function
  public.mark_publishing_provider_reauthorization_required(
    uuid,
    text,
    uuid,
    bigint
  )
from public, anon, authenticated, service_role;

grant execute on function
  public.mark_publishing_provider_reauthorization_required(
    uuid,
    text,
    uuid,
    bigint
  )
to service_role;

comment on function
  public.get_publishing_provider_refresh_credentials(uuid, text)
is
  'Service-role-only encrypted refresh context. Never exposed to browser clients.';

comment on function
  public.rotate_publishing_provider_access_token(
    uuid,
    text,
    uuid,
    bigint,
    text,
    timestamptz,
    text
  )
is
  'Atomically rotates only the encrypted access token using an optimistic version guard.';

comment on function
  public.mark_publishing_provider_reauthorization_required(
    uuid,
    text,
    uuid,
    bigint
  )
is
  'Fail-closes an authorized connection after a terminal OAuth refresh rejection.';

commit;
