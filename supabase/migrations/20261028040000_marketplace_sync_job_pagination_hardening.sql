-- LAKUVO M1.5-P0
-- Pagination-safe marketplace sync lifecycle hardening.
-- Source migration only until separately authorized for staging DB apply.
begin;

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

  v_processed_count integer;
  v_existing_total integer;
  v_effective_total integer;
  v_next_processed bigint;
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

  -- Lock the currently owned lease before validating cumulative
  -- pagination state. This preserves one-writer ownership while
  -- checking the page against already committed progress.
  select
    j.processed_count,
    j.total_count
  into
    v_processed_count,
    v_existing_total
  from public.marketplace_sync_jobs j
  where
    j.id = p_job_id
    and j.status = 'running'
    and j.lease_token = p_lease_token
    and j.lease_expires_at is not null
    and j.lease_expires_at > now()
  for update;

  if not found then
    raise exception
      'marketplace sync job lease is stale or unavailable'
      using errcode = '55000';
  end if;

  v_next_processed :=
    v_processed_count::bigint +
    p_synced_count::bigint;

  if
    v_next_processed >
    2147483647
  then
    raise exception
      'marketplace sync cumulative processed count exceeds integer capacity';
  end if;

  v_effective_total :=
    coalesce(
      p_total_count,
      v_existing_total
    );

  if
    v_effective_total is not null
    and
    v_effective_total::bigint <
      v_next_processed
  then
    raise exception
      'marketplace sync cumulative processed count cannot exceed total count';
  end if;

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
      v_next_processed::integer,

    total_count =
      coalesce(
        p_total_count,
        j.total_count
      ),

    -- attempt_count represents retry budget for the current page,
    -- not the number of successfully completed pagination pages.
    -- A successful continuation starts the next page with a fresh
    -- retry budget; the next claim will increment 0 -> 1.
    attempt_count =
      case
        when v_cursor_kind is null
          then j.attempt_count
        else 0
      end,

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

commit;