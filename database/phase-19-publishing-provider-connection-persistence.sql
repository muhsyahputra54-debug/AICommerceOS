-- LAKUVO Phase 19
-- Publishing provider connection + encrypted credential persistence.
--
-- DRAFT ONLY. DO NOT APPLY WITHOUT A NEW EXPLICIT DATABASE AUTHORIZATION.
--
-- R1 contract:
--   * stable credential reference lives in safe connection metadata
--   * encrypted credential row may be destroyed on revocation
--   * authenticated safe read never joins the secret table
--   * service_role receives RPC execute only, no direct table privileges
--   * no OAuth execution, provider HTTP, destination linkage, or publication executor

begin;

create table if not exists public.publishing_provider_connections (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  provider text not null,
  external_account_id text not null,

  authorization_status text not null
    check (
      authorization_status in (
        'authorized',
        'reauthorization_required',
        'revoked'
      )
    ),

  granted_scopes text[] not null default '{}'::text[],
  supported_capabilities text[] not null default '{}'::text[],

  credential_reference_id uuid not null default gen_random_uuid(),
  credential_expires_at timestamptz,
  credential_updated_at timestamptz not null default now(),

  connected_by_user_id uuid,
  authorized_at timestamptz not null default now(),
  revoked_at timestamptz,

  version bigint not null default 1
    check (version >= 1),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint publishing_provider_connections_provider_nonempty
    check (btrim(provider) <> ''),

  constraint publishing_provider_connections_external_account_nonempty
    check (btrim(external_account_id) <> ''),

  constraint publishing_provider_connections_provider_normalized
    check (provider = lower(btrim(provider))),

  constraint publishing_provider_connections_revocation_consistent
    check (
      (
        authorization_status = 'revoked'
        and revoked_at is not null
      )
      or
      (
        authorization_status <> 'revoked'
        and revoked_at is null
      )
    ),

  constraint publishing_provider_connections_capabilities_valid
    check (
      supported_capabilities <@ array[
        'publish_text',
        'publish_image',
        'publish_video'
      ]::text[]
    ),

  constraint publishing_provider_connections_identity_unique
    unique (
      organization_id,
      provider,
      external_account_id
    ),

  constraint publishing_provider_connections_credential_reference_unique
    unique (credential_reference_id),

  constraint publishing_provider_connections_id_credential_reference_unique
    unique (id, credential_reference_id)
);

create index if not exists
  publishing_provider_connections_org_provider_idx
on public.publishing_provider_connections (
  organization_id,
  provider,
  authorization_status
);

create table if not exists public.publishing_provider_credentials (
  id uuid primary key,

  connection_id uuid not null unique,

  credential_kind text not null default 'publishing_provider_oauth'
    check (credential_kind = 'publishing_provider_oauth'),

  storage_kind text not null default 'server_encrypted'
    check (storage_kind = 'server_encrypted'),

  access_token_ciphertext text not null,
  refresh_token_ciphertext text,

  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,

  token_type text,
  encryption_key_version text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rotated_at timestamptz not null default now(),

  constraint publishing_provider_credentials_connection_reference_fk
    foreign key (connection_id, id)
    references public.publishing_provider_connections (
      id,
      credential_reference_id
    )
    on delete cascade,

  constraint publishing_provider_credentials_access_ciphertext_nonempty
    check (btrim(access_token_ciphertext) <> ''),

  constraint publishing_provider_credentials_refresh_ciphertext_nonempty
    check (
      refresh_token_ciphertext is null
      or btrim(refresh_token_ciphertext) <> ''
    ),

  constraint publishing_provider_credentials_key_version_nonempty
    check (btrim(encryption_key_version) <> '')
);

alter table public.publishing_provider_connections
  enable row level security;

alter table public.publishing_provider_credentials
  enable row level security;

revoke all on table public.publishing_provider_connections
from public, anon, authenticated, service_role;

revoke all on table public.publishing_provider_credentials
from public, anon, authenticated, service_role;

create or replace function public.get_publishing_provider_connections(
  p_organization_id uuid,
  p_provider text default null
)
returns table (
  id uuid,
  organization_id uuid,
  provider text,
  external_account_id text,
  authorization_status text,
  granted_scopes text[],
  supported_capabilities text[],
  credential_reference_id uuid,
  credential_expires_at timestamptz,
  credential_updated_at timestamptz,
  revoked_at timestamptz,
  version bigint,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_provider text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    raise exception 'organization_required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'organization_owner_or_admin_required'
      using errcode = '42501';
  end if;

  v_provider :=
    case
      when p_provider is null then null
      else lower(btrim(p_provider))
    end;

  if v_provider = '' then
    raise exception 'provider_invalid'
      using errcode = '22023';
  end if;

  return query
  select
    c.id,
    c.organization_id,
    c.provider,
    c.external_account_id,
    c.authorization_status,
    c.granted_scopes,
    c.supported_capabilities,
    c.credential_reference_id,
    c.credential_expires_at,
    c.credential_updated_at,
    c.revoked_at,
    c.version,
    c.updated_at
  from public.publishing_provider_connections c
  where c.organization_id = p_organization_id
    and (
      v_provider is null
      or c.provider = v_provider
    )
  order by c.provider, c.created_at, c.id;
end;
$$;

create or replace function public.upsert_publishing_provider_connection(
  p_organization_id uuid,
  p_provider text,
  p_external_account_id text,
  p_connected_by_user_id uuid,
  p_granted_scopes text[],
  p_supported_capabilities text[],
  p_access_token_ciphertext text,
  p_refresh_token_ciphertext text,
  p_access_token_expires_at timestamptz,
  p_refresh_token_expires_at timestamptz,
  p_token_type text,
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
  v_external_account_id text;
  v_granted_scopes text[];
  v_supported_capabilities text[];
  v_connection_id uuid;
  v_credential_reference_id uuid;
  v_connection_version bigint;
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
    lower(btrim(coalesce(p_provider, '')));

  v_external_account_id :=
    btrim(coalesce(p_external_account_id, ''));

  if v_provider = '' then
    raise exception 'provider_required'
      using errcode = '22023';
  end if;

  if v_external_account_id = '' then
    raise exception 'external_account_required'
      using errcode = '22023';
  end if;

  if btrim(coalesce(p_access_token_ciphertext, '')) = '' then
    raise exception 'access_token_ciphertext_required'
      using errcode = '22023';
  end if;

  if (
    p_refresh_token_ciphertext is not null
    and btrim(p_refresh_token_ciphertext) = ''
  ) then
    raise exception 'refresh_token_ciphertext_invalid'
      using errcode = '22023';
  end if;

  if btrim(coalesce(p_encryption_key_version, '')) = '' then
    raise exception 'encryption_key_version_required'
      using errcode = '22023';
  end if;

  select coalesce(
    array_agg(
      distinct btrim(scope_value)
      order by btrim(scope_value)
    ),
    '{}'::text[]
  )
  into v_granted_scopes
  from unnest(
    coalesce(p_granted_scopes, '{}'::text[])
  ) as scope_value
  where btrim(scope_value) <> '';

  select coalesce(
    array_agg(
      distinct btrim(capability_value)
      order by btrim(capability_value)
    ),
    '{}'::text[]
  )
  into v_supported_capabilities
  from unnest(
    coalesce(p_supported_capabilities, '{}'::text[])
  ) as capability_value
  where btrim(capability_value) <> '';

  if not (
    v_supported_capabilities <@ array[
      'publish_text',
      'publish_image',
      'publish_video'
    ]::text[]
  ) then
    raise exception 'unsupported_capability'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      p_organization_id::text
      || ':'
      || v_provider
      || ':'
      || v_external_account_id,
      0
    )
  );

  insert into public.publishing_provider_connections (
    organization_id,
    provider,
    external_account_id,
    authorization_status,
    granted_scopes,
    supported_capabilities,
    credential_expires_at,
    credential_updated_at,
    connected_by_user_id,
    authorized_at,
    revoked_at,
    version,
    created_at,
    updated_at
  )
  values (
    p_organization_id,
    v_provider,
    v_external_account_id,
    'authorized',
    v_granted_scopes,
    v_supported_capabilities,
    p_access_token_expires_at,
    now(),
    p_connected_by_user_id,
    now(),
    null,
    1,
    now(),
    now()
  )
  on conflict (
    organization_id,
    provider,
    external_account_id
  )
  do update set
    authorization_status = 'authorized',
    granted_scopes = excluded.granted_scopes,
    supported_capabilities = excluded.supported_capabilities,
    credential_expires_at = excluded.credential_expires_at,
    credential_updated_at = now(),
    connected_by_user_id = excluded.connected_by_user_id,
    authorized_at = now(),
    revoked_at = null,
    version =
      public.publishing_provider_connections.version + 1,
    updated_at = now()
  returning
    public.publishing_provider_connections.id,
    public.publishing_provider_connections.credential_reference_id,
    public.publishing_provider_connections.version
  into
    v_connection_id,
    v_credential_reference_id,
    v_connection_version;

  insert into public.publishing_provider_credentials (
    id,
    connection_id,
    credential_kind,
    storage_kind,
    access_token_ciphertext,
    refresh_token_ciphertext,
    access_token_expires_at,
    refresh_token_expires_at,
    token_type,
    encryption_key_version,
    created_at,
    updated_at,
    rotated_at
  )
  values (
    v_credential_reference_id,
    v_connection_id,
    'publishing_provider_oauth',
    'server_encrypted',
    p_access_token_ciphertext,
    p_refresh_token_ciphertext,
    p_access_token_expires_at,
    p_refresh_token_expires_at,
    nullif(btrim(coalesce(p_token_type, '')), ''),
    p_encryption_key_version,
    now(),
    now(),
    now()
  )
  on conflict (id)
  do update set
    connection_id = excluded.connection_id,
    credential_kind = 'publishing_provider_oauth',
    storage_kind = 'server_encrypted',
    access_token_ciphertext = excluded.access_token_ciphertext,
    refresh_token_ciphertext = excluded.refresh_token_ciphertext,
    access_token_expires_at = excluded.access_token_expires_at,
    refresh_token_expires_at = excluded.refresh_token_expires_at,
    token_type = excluded.token_type,
    encryption_key_version = excluded.encryption_key_version,
    updated_at = now(),
    rotated_at = now();

  return query
  select
    v_connection_id,
    v_credential_reference_id,
    v_connection_version;
end;
$$;

create or replace function public.revoke_publishing_provider_connection(
  p_organization_id uuid,
  p_connection_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, auth
as $$
declare
  v_provider text;
  v_external_account_id text;
  v_connection_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    raise exception 'organization_required'
      using errcode = '22023';
  end if;

  if p_connection_id is null then
    raise exception 'connection_required'
      using errcode = '22023';
  end if;

  select
    c.provider,
    c.external_account_id
  into
    v_provider,
    v_external_account_id
  from public.publishing_provider_connections c
  where c.id = p_connection_id
    and c.organization_id = p_organization_id;

  if v_provider is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      p_organization_id::text
      || ':'
      || v_provider
      || ':'
      || v_external_account_id,
      0
    )
  );

  select c.id
  into v_connection_id
  from public.publishing_provider_connections c
  where c.id = p_connection_id
    and c.organization_id = p_organization_id
  for update;

  if v_connection_id is null then
    return false;
  end if;

  update public.publishing_provider_connections
  set
    authorization_status = 'revoked',
    revoked_at = now(),
    credential_updated_at = now(),
    version = version + 1,
    updated_at = now()
  where id = v_connection_id;

  delete from public.publishing_provider_credentials
  where connection_id = v_connection_id;

  return true;
end;
$$;

comment on table public.publishing_provider_connections is
  'Safe creator/social publishing connection metadata. Contains no OAuth token material.';

comment on column
  public.publishing_provider_connections.credential_reference_id is
  'Stable non-secret credential reference retained across revoke and reauthorization.';

comment on table public.publishing_provider_credentials is
  'Server-only application-encrypted OAuth credential ciphertext.';

comment on column
  public.publishing_provider_credentials.access_token_ciphertext is
  'Opaque application-encrypted access-token ciphertext. Never expose through client RPCs.';

comment on column
  public.publishing_provider_credentials.refresh_token_ciphertext is
  'Opaque application-encrypted refresh-token ciphertext. Never expose through client RPCs.';

revoke all on function
  public.get_publishing_provider_connections(uuid, text)
from public, anon, authenticated, service_role;

grant execute on function
  public.get_publishing_provider_connections(uuid, text)
to authenticated;

revoke all on function
  public.upsert_publishing_provider_connection(
    uuid,
    text,
    text,
    uuid,
    text[],
    text[],
    text,
    text,
    timestamptz,
    timestamptz,
    text,
    text
  )
from public, anon, authenticated, service_role;

grant execute on function
  public.upsert_publishing_provider_connection(
    uuid,
    text,
    text,
    uuid,
    text[],
    text[],
    text,
    text,
    timestamptz,
    timestamptz,
    text,
    text
  )
to service_role;

revoke all on function
  public.revoke_publishing_provider_connection(uuid, uuid)
from public, anon, authenticated, service_role;

grant execute on function
  public.revoke_publishing_provider_connection(uuid, uuid)
to service_role;

commit;
