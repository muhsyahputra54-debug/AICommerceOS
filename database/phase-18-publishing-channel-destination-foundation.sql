begin;

-- Phase 18 - SG5-B1 provider-neutral publishing destination foundation
--
-- PURPOSE
--   Introduce a destination identity that is separate from seller-commerce
--   marketplace_authorized_shops.
--
-- SAFETY BOUNDARY
--   - NO provider credentials are stored here.
--   - NO OAuth flow is added here.
--   - NO external HTTP/provider call exists here.
--   - NO controlled-publication execute RPC exists here.
--   - NO existing ai_controlled_publications row becomes executable here.
--   - marketplace_authorized_shops remains seller-commerce identity.
--
-- IMPORTANT
--   DO NOT APPLY TO SUPABASE UNTIL A SEPARATE SG5 DATABASE
--   AUTHORIZATION GATE HAS PASSED.

do $$
begin
  if to_regclass(
    'public.publishing_channel_destinations'
  ) is not null then
    raise exception
      'publishing_channel_destinations already exists';
  end if;

  if to_regclass(
    'public.organizations'
  ) is null then
    raise exception
      'Phase 18 requires public.organizations';
  end if;

  if to_regclass(
    'public.organization_members'
  ) is null then
    raise exception
      'Phase 18 requires public.organization_members';
  end if;
end
$$;

create table public.publishing_channel_destinations (
  id uuid primary key
    default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  provider text not null,

  destination_type text not null,

  external_destination_id text not null,

  display_name text not null,

  status text not null
    default 'active',

  capabilities text[] not null
    default array[]::text[],

  is_selected boolean not null
    default false,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint publishing_channel_destinations_provider_check
    check (
      provider =
        lower(
          btrim(
            provider
          )
        )
      and length(provider)
        between 1 and 100
      and provider ~
        '^[a-z0-9][a-z0-9._-]{0,99}$'
    ),

  constraint publishing_channel_destinations_type_check
    check (
      destination_type in (
        'account',
        'page',
        'channel'
      )
    ),

  constraint publishing_channel_destinations_external_id_check
    check (
      external_destination_id =
        btrim(
          external_destination_id
        )
      and length(
        external_destination_id
      ) between 1 and 255
    ),

  constraint publishing_channel_destinations_name_check
    check (
      display_name =
        btrim(
          display_name
        )
      and length(
        display_name
      ) between 1 and 200
    ),

  constraint publishing_channel_destinations_status_check
    check (
      status in (
        'active',
        'revoked'
      )
    ),

  constraint publishing_channel_destinations_capabilities_check
    check (
      cardinality(capabilities) <= 3
      and capabilities <@
        array[
          'publish_text',
          'publish_image',
          'publish_video'
        ]::text[]
      and cardinality(capabilities) =
        (
          case
            when 'publish_text' =
              any(capabilities)
            then 1
            else 0
          end
          +
          case
            when 'publish_image' =
              any(capabilities)
            then 1
            else 0
          end
          +
          case
            when 'publish_video' =
              any(capabilities)
            then 1
            else 0
          end
        )
    ),

  constraint publishing_channel_destinations_selection_check
    check (
      not is_selected
      or status = 'active'
    )
);

create unique index
  publishing_channel_destinations_org_provider_external_uidx
on public.publishing_channel_destinations (
  organization_id,
  provider,
  external_destination_id
);

create unique index
  publishing_channel_destinations_one_selected_provider_uidx
on public.publishing_channel_destinations (
  organization_id,
  provider
)
where
  is_selected
  and status = 'active';

create index
  publishing_channel_destinations_org_status_idx
on public.publishing_channel_destinations (
  organization_id,
  status,
  created_at desc
);

alter table
  public.publishing_channel_destinations
enable row level security;

revoke all
on table
  public.publishing_channel_destinations
from
  public,
  anon,
  authenticated;

create or replace function
  public.get_publishing_channel_destinations(
    p_organization_id uuid,
    p_provider text default null
  )
returns table (
  id uuid,
  provider text,
  destination_type text,
  external_destination_id text,
  display_name text,
  status text,
  capabilities text[],
  is_selected boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path =
  public,
  pg_temp
as $$
declare
  v_provider text;
begin
  if auth.uid() is null then
    raise exception
      'authentication required';
  end if;

  if p_organization_id is null then
    raise exception
      'organization_id is required';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where
      m.organization_id =
        p_organization_id
      and m.user_id =
        auth.uid()
  ) then
    raise exception
      'organization membership required';
  end if;

  v_provider :=
    nullif(
      lower(
        btrim(
          coalesce(
            p_provider,
            ''
          )
        )
      ),
      ''
    );

  if
    v_provider is not null
    and (
      length(v_provider) > 100
      or v_provider !~
        '^[a-z0-9][a-z0-9._-]{0,99}$'
    )
  then
    raise exception
      'invalid publishing provider';
  end if;

  return query
  select
    d.id,
    d.provider,
    d.destination_type,
    d.external_destination_id,
    d.display_name,
    d.status,
    d.capabilities,
    d.is_selected,
    d.created_at,
    d.updated_at
  from
    public.publishing_channel_destinations d
  where
    d.organization_id =
      p_organization_id
    and (
      v_provider is null
      or d.provider =
        v_provider
    )
  order by
    d.is_selected desc,
    d.provider asc,
    d.display_name asc,
    d.id asc;
end
$$;

revoke all
on function
  public.get_publishing_channel_destinations(
    uuid,
    text
  )
from public;

grant execute
on function
  public.get_publishing_channel_destinations(
    uuid,
    text
  )
to authenticated;

comment on table
  public.publishing_channel_destinations
is
  'Provider-neutral safe publishing destination identities. Contains no provider credentials and grants no external execution authority.';

comment on function
  public.get_publishing_channel_destinations(
    uuid,
    text
  )
is
  'Returns safe publishing destination metadata to authenticated organization members. Does not expose credentials or execute provider calls.';

commit;
