-- LAKUVO M1.3A
-- Durable marketplace sync job persistence.
-- Source migration only until separately authorized for staging DB apply.
begin;

CREATE TABLE public.marketplace_sync_jobs (
  id                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  organization_id        uuid                     NOT NULL,
  marketplace_account_id uuid                     NOT NULL,
  authorized_shop_id     uuid,
  requested_by           uuid,
  provider               text                     NOT NULL,
  entity                 text                     NOT NULL,
  status                 text                     NOT NULL DEFAULT 'queued'::text,
  cursor_kind            text,
  cursor_value           text,
  processed_count        integer                  NOT NULL DEFAULT 0,
  total_count            integer,
  attempt_count          integer                  NOT NULL DEFAULT 0,
  max_attempts           integer                  NOT NULL DEFAULT 5,
  available_at           timestamp with time zone NOT NULL DEFAULT now(),
  started_at             timestamp with time zone,
  finished_at            timestamp with time zone,
  lease_token            uuid,
  lease_expires_at       timestamp with time zone,
  last_request_id        text,
  last_error_code        text,
  last_error_message     text,
  metadata               jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  created_at             timestamp with time zone NOT NULL DEFAULT now(),
  updated_at             timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT marketplace_sync_jobs_pkey
    PRIMARY KEY (id),

  CONSTRAINT marketplace_sync_jobs_provider_entity_check
    CHECK (
      (
        provider = 'tiktok_shop'
        AND entity IN (
          'shops',
          'products',
          'orders',
          'inventory'
        )
      )
      OR
      (
        provider = 'shopee'
        AND entity = 'shops'
      )
    ),

  CONSTRAINT marketplace_sync_jobs_status_check
    CHECK (
      status IN (
        'queued',
        'running',
        'succeeded',
        'failed',
        'cancelled'
      )
    ),

  CONSTRAINT marketplace_sync_jobs_cursor_contract
    CHECK (
      (
        cursor_kind IS NULL
        AND cursor_value IS NULL
      )
      OR
      (
        cursor_kind IS NOT NULL
        AND cursor_kind IN (
          'page_token',
          'time_window',
          'opaque'
        )
        AND cursor_value IS NOT NULL
        AND length(btrim(cursor_value)) > 0
      )
    ),

  CONSTRAINT marketplace_sync_jobs_processed_count_check
    CHECK (processed_count >= 0),

  CONSTRAINT marketplace_sync_jobs_total_count_check
    CHECK (
      total_count IS NULL
      OR total_count >= 0
    ),

  CONSTRAINT marketplace_sync_jobs_attempt_count_check
    CHECK (
      attempt_count >= 0
      AND attempt_count <= max_attempts
    ),

  CONSTRAINT marketplace_sync_jobs_max_attempts_check
    CHECK (
      max_attempts >= 1
      AND max_attempts <= 20
    ),

  CONSTRAINT marketplace_sync_jobs_metadata_object
    CHECK (
      jsonb_typeof(metadata) = 'object'
    ),

  CONSTRAINT marketplace_sync_jobs_error_code_check
    CHECK (
      last_error_code IS NULL
      OR last_error_code IN (
        'unsupported',
        'not_configured',
        'not_connected',
        'account_inactive',
        'shop_required',
        'scope_missing',
        'invalid_response',
        'provider_error',
        'persistence_error'
      )
    )
);

ALTER TABLE public.marketplace_sync_jobs
  ADD CONSTRAINT marketplace_sync_jobs_account_organization_fkey
  FOREIGN KEY (
    marketplace_account_id,
    organization_id
  )
  REFERENCES public.marketplace_accounts(
    id,
    organization_id
  )
  ON DELETE CASCADE;

ALTER TABLE public.marketplace_sync_jobs
  ADD CONSTRAINT marketplace_sync_jobs_authorized_shop_fkey
  FOREIGN KEY (authorized_shop_id)
  REFERENCES public.marketplace_authorized_shops(id)
  ON DELETE SET NULL;

CREATE UNIQUE INDEX
  marketplace_sync_jobs_one_active_per_account_entity_uidx
ON public.marketplace_sync_jobs (
  marketplace_account_id,
  entity
)
WHERE status IN (
  'queued',
  'running'
);

CREATE INDEX
  marketplace_sync_jobs_org_account_created_idx
ON public.marketplace_sync_jobs (
  organization_id,
  marketplace_account_id,
  created_at DESC
);

CREATE INDEX
  marketplace_sync_jobs_queue_idx
ON public.marketplace_sync_jobs (
  status,
  available_at,
  created_at
);

CREATE INDEX
  marketplace_sync_jobs_shop_status_idx
ON public.marketplace_sync_jobs (
  authorized_shop_id,
  status
)
WHERE authorized_shop_id IS NOT NULL;

ALTER TABLE public.marketplace_sync_jobs
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY
  "Members can view organization marketplace sync jobs"
ON public.marketplace_sync_jobs
FOR SELECT
TO authenticated
USING (
  public.is_organization_member(
    organization_id
  )
);

CREATE POLICY
  "Service role can view marketplace sync jobs"
ON public.marketplace_sync_jobs
FOR SELECT
TO service_role
USING (true);
-- Job mutations are RPC-only.
REVOKE ALL
ON TABLE public.marketplace_sync_jobs
FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT
ON TABLE public.marketplace_sync_jobs
TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enqueue_marketplace_sync_job (
  p_organization_id        uuid,
  p_marketplace_account_id uuid,
  p_requested_by           uuid,
  p_provider               text,
  p_entity                 text,
  p_cursor_kind            text DEFAULT NULL,
  p_cursor_value           text DEFAULT NULL,
  p_metadata               jsonb DEFAULT '{}'::jsonb
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_provider       text;
  v_entity         text;
  v_cursor_kind    text;
  v_cursor_value   text;
  v_authorized_shop_id uuid;
  v_job_id         uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception
      'service_role_required'
      using errcode = '42501';
  end if;

  if
    p_organization_id is null
    or p_marketplace_account_id is null
  then
    raise exception
      'organization and marketplace account are required';
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

  v_entity :=
    lower(
      btrim(
        coalesce(
          p_entity,
          ''
        )
      )
    );

  if v_provider not in (
    'tiktok_shop',
    'shopee'
  ) then
    raise exception
      'unsupported marketplace sync provider';
  end if;

  if v_entity not in (
    'shops',
    'products',
    'orders',
    'inventory'
  ) then
    raise exception
      'unsupported marketplace sync entity';
  end if;

  if
    v_provider = 'shopee'
    and v_entity <> 'shops'
  then
    raise exception
      'unsupported marketplace sync provider/entity';
  end if;

  v_cursor_kind :=
    nullif(
      lower(
        btrim(
          coalesce(
            p_cursor_kind,
            ''
          )
        )
      ),
      ''
    );

  v_cursor_value :=
    nullif(
      btrim(
        coalesce(
          p_cursor_value,
          ''
        )
      ),
      ''
    );

  if
    (v_cursor_kind is null)
    <>
    (v_cursor_value is null)
  then
    raise exception
      'marketplace sync cursor kind and value must be provided together';
  end if;

  if
    v_cursor_kind is not null
    and v_cursor_kind not in (
      'page_token',
      'time_window',
      'opaque'
    )
  then
    raise exception
      'invalid marketplace sync cursor kind';
  end if;

  if
    p_metadata is not null
    and jsonb_typeof(p_metadata) <> 'object'
  then
    raise exception
      'marketplace sync job metadata must be an object';
  end if;

  if
    p_requested_by is not null
    and not exists (
      select 1
      from public.organization_members m
      where
        m.organization_id =
          p_organization_id
        and m.user_id =
          p_requested_by
    )
  then
    raise exception
      'requesting user is not an organization member'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.marketplace_accounts a
    where
      a.id =
        p_marketplace_account_id
      and a.organization_id =
        p_organization_id
      and a.status = 'active'
  ) then
    raise exception
      'marketplace account is not active or unavailable';
  end if;

  if not exists (
    select 1
    from public.marketplace_connections c
    where
      c.marketplace_account_id =
        p_marketplace_account_id
      and c.organization_id =
        p_organization_id
      and c.status = 'active'
      and lower(
        btrim(
          coalesce(
            c.provider,
            ''
          )
        )
      ) =
        v_provider
  ) then
    raise exception
      'active marketplace connection not found for provider';
  end if;

  if v_entity = 'shops' then
    v_authorized_shop_id :=
      null;
  else
    select
      s.id
    into
      v_authorized_shop_id
    from public.marketplace_authorized_shops s
    where
      s.organization_id =
        p_organization_id
      and s.marketplace_account_id =
        p_marketplace_account_id
      and lower(
        btrim(
          coalesce(
            s.provider,
            ''
          )
        )
      ) =
        v_provider
      and s.status = 'active'
      and s.is_selected = true
    order by
      s.updated_at desc,
      s.id asc
    limit 1;

    if v_authorized_shop_id is null then
      raise exception
        'selected marketplace shop is required';
    end if;
  end if;

  insert into public.marketplace_sync_jobs (
    organization_id,
    marketplace_account_id,
    authorized_shop_id,
    requested_by,
    provider,
    entity,
    status,
    cursor_kind,
    cursor_value,
    metadata
  )
  values (
    p_organization_id,
    p_marketplace_account_id,
    v_authorized_shop_id,
    p_requested_by,
    v_provider,
    v_entity,
    'queued',
    v_cursor_kind,
    v_cursor_value,
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
  )
  on conflict do nothing
  returning id
  into v_job_id;

  if v_job_id is null then
    select
      j.id
    into
      v_job_id
    from public.marketplace_sync_jobs j
    where
      j.marketplace_account_id =
        p_marketplace_account_id
      and j.organization_id =
        p_organization_id
      and j.provider =
        v_provider
      and j.entity =
        v_entity
      and j.status in (
        'queued',
        'running'
      )
      and j.authorized_shop_id
          is not distinct from
          v_authorized_shop_id
    order by
      j.created_at asc,
      j.id asc
    limit 1;
  end if;

  if v_job_id is null then
    raise exception
      'active marketplace sync job targets a different shop';
  end if;

  return v_job_id;
end;
$function$;

REVOKE ALL
ON FUNCTION public.enqueue_marketplace_sync_job(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  jsonb
)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.enqueue_marketplace_sync_job(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  jsonb
)
TO service_role;

commit;