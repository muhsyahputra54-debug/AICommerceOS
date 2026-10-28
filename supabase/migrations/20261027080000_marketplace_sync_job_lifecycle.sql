-- LAKUVO M1.4B
-- Durable marketplace sync job lifecycle.
-- Source migration only until separately authorized for staging DB apply.
begin;

CREATE OR REPLACE FUNCTION public.claim_marketplace_sync_job (
  p_job_id uuid DEFAULT NULL
)
  RETURNS TABLE (
    id uuid,
    organization_id uuid,
    marketplace_account_id uuid,
    authorized_shop_id uuid,
    provider text,
    entity text,
    cursor_kind text,
    cursor_value text,
    processed_count integer,
    total_count integer,
    attempt_count integer,
    max_attempts integer,
    lease_token uuid,
    lease_expires_at timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception
      'service_role_required'
      using errcode = '42501';
  end if;

  -- Fail closed on exhausted active jobs so a worker crash on
  -- the final permitted attempt cannot leave a job running forever.
  update public.marketplace_sync_jobs j
  set
    status = 'failed',
    finished_at = now(),
    lease_token = null,
    lease_expires_at = null,
    last_error_code = 'persistence_error',
    last_error_message =
      'Marketplace sync job exhausted its maximum attempts.',
    updated_at = now()
  where
    (
      p_job_id is null
      or j.id = p_job_id
    )
    and j.attempt_count >= j.max_attempts
    and (
      (
        j.status = 'queued'
        and j.available_at <= now()
      )
      or
      (
        j.status = 'running'
        and j.lease_expires_at is not null
        and j.lease_expires_at <= now()
      )
    );

  return query
  with candidate as (
    select
      j.id
    from public.marketplace_sync_jobs j
    where
      (
        p_job_id is null
        or j.id = p_job_id
      )
      and j.attempt_count < j.max_attempts
      and (
        (
          j.status = 'queued'
          and j.available_at <= now()
        )
        or
        (
          j.status = 'running'
          and j.lease_expires_at is not null
          and j.lease_expires_at <= now()
        )
      )
    order by
      case
        when j.status = 'running' then 0
        else 1
      end,
      j.available_at asc,
      j.created_at asc,
      j.id asc
    for update skip locked
    limit 1
  )
  update public.marketplace_sync_jobs j
  set
    status = 'running',
    attempt_count =
      j.attempt_count + 1,
    started_at =
      coalesce(
        j.started_at,
        now()
      ),
    finished_at = null,
    lease_token =
      gen_random_uuid(),
    lease_expires_at =
      now() + interval '5 minutes',
    last_error_code = null,
    last_error_message = null,
    updated_at = now()
  from candidate c
  where j.id = c.id
  returning
    j.id,
    j.organization_id,
    j.marketplace_account_id,
    j.authorized_shop_id,
    j.provider,
    j.entity,
    j.cursor_kind,
    j.cursor_value,
    j.processed_count,
    j.total_count,
    j.attempt_count,
    j.max_attempts,
    j.lease_token,
    j.lease_expires_at;
end;
$function$;

CREATE OR REPLACE FUNCTION public.complete_marketplace_sync_job_page (
  p_job_id uuid,
  p_lease_token uuid,
  p_synced_count integer,
  p_total_count integer,
  p_cursor_kind text,
  p_cursor_value text,
  p_request_id text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_cursor_kind text;
  v_cursor_value text;
  v_request_id text;
  v_status text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception
      'service_role_required'
      using errcode = '42501';
  end if;

  if
    p_job_id is null
    or p_lease_token is null
  then
    raise exception
      'marketplace sync job and lease token are required';
  end if;

  if
    p_synced_count is null
    or p_synced_count < 0
  then
    raise exception
      'marketplace sync synced count must be non-negative';
  end if;

  if
    p_total_count is not null
    and p_total_count < 0
  then
    raise exception
      'marketplace sync total count must be non-negative';
  end if;

  if
    p_total_count is not null
    and p_total_count < p_synced_count
  then
    raise exception
      'marketplace sync total count cannot be smaller than synced count';
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

  v_request_id :=
    nullif(
      btrim(
        coalesce(
          p_request_id,
          ''
        )
      ),
      ''
    );

  update public.marketplace_sync_jobs j
  set
    status =
      case
        when v_cursor_kind is null
          then 'succeeded'
        else 'queued'
      end,
    cursor_kind =
      v_cursor_kind,
    cursor_value =
      v_cursor_value,
    processed_count =
      j.processed_count +
      p_synced_count,
    total_count =
      coalesce(
        p_total_count,
        j.total_count
      ),
    available_at =
      now(),
    finished_at =
      case
        when v_cursor_kind is null
          then now()
        else null
      end,
    lease_token = null,
    lease_expires_at = null,
    last_request_id =
      v_request_id,
    last_error_code = null,
    last_error_message = null,
    updated_at = now()
  where
    j.id = p_job_id
    and j.status = 'running'
    and j.lease_token = p_lease_token
    and j.lease_expires_at is not null
    and j.lease_expires_at > now()
  returning
    j.status
  into
    v_status;

  if v_status is null then
    raise exception
      'marketplace sync job lease is stale or unavailable'
      using errcode = '55000';
  end if;

  return v_status;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fail_marketplace_sync_job_attempt (
  p_job_id uuid,
  p_lease_token uuid,
  p_error_code text,
  p_error_message text,
  p_retryable boolean
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_error_code text;
  v_error_message text;
  v_status text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception
      'service_role_required'
      using errcode = '42501';
  end if;

  if
    p_job_id is null
    or p_lease_token is null
  then
    raise exception
      'marketplace sync job and lease token are required';
  end if;

  if p_retryable is null then
    raise exception
      'marketplace sync retryable flag is required';
  end if;

  v_error_code :=
    nullif(
      lower(
        btrim(
          coalesce(
            p_error_code,
            ''
          )
        )
      ),
      ''
    );

  if
    v_error_code is null
    or v_error_code not in (
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
  then
    raise exception
      'invalid marketplace sync error code';
  end if;

  if
    p_retryable
    and v_error_code not in (
      'provider_error',
      'persistence_error'
    )
  then
    raise exception
      'marketplace sync retryable flag is invalid for error code';
  end if;

  v_error_message :=
    left(
      coalesce(
        nullif(
          btrim(
            coalesce(
              p_error_message,
              ''
            )
          ),
          ''
        ),
        'Marketplace sync execution failed.'
      ),
      500
    );

  update public.marketplace_sync_jobs j
  set
    status =
      case
        when
          p_retryable
          and j.attempt_count < j.max_attempts
        then 'queued'
        else 'failed'
      end,
    available_at =
      case
        when
          p_retryable
          and j.attempt_count < j.max_attempts
        then
          now() +
          make_interval(
            secs =>
              least(
                900,
                (
                  15 *
                  power(
                    2::numeric,
                    greatest(
                      j.attempt_count - 1,
                      0
                    )
                  )
                )::integer
              )
          )
        else
          now()
      end,
    finished_at =
      case
        when
          p_retryable
          and j.attempt_count < j.max_attempts
        then null
        else now()
      end,
    lease_token = null,
    lease_expires_at = null,
    last_error_code =
      v_error_code,
    last_error_message =
      v_error_message,
    updated_at = now()
  where
    j.id = p_job_id
    and j.status = 'running'
    and j.lease_token = p_lease_token
    and j.lease_expires_at is not null
    and j.lease_expires_at > now()
  returning
    j.status
  into
    v_status;

  if v_status is null then
    raise exception
      'marketplace sync job lease is stale or unavailable'
      using errcode = '55000';
  end if;

  return v_status;
end;
$function$;

REVOKE ALL
ON FUNCTION public.claim_marketplace_sync_job(uuid)
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL
ON FUNCTION public.complete_marketplace_sync_job_page(
  uuid,
  uuid,
  integer,
  integer,
  text,
  text,
  text
)
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL
ON FUNCTION public.fail_marketplace_sync_job_attempt(
  uuid,
  uuid,
  text,
  text,
  boolean
)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE
ON FUNCTION public.claim_marketplace_sync_job(uuid)
TO service_role;

GRANT EXECUTE
ON FUNCTION public.complete_marketplace_sync_job_page(
  uuid,
  uuid,
  integer,
  integer,
  text,
  text,
  text
)
TO service_role;

GRANT EXECUTE
ON FUNCTION public.fail_marketplace_sync_job_attempt(
  uuid,
  uuid,
  text,
  text,
  boolean
)
TO service_role;

commit;