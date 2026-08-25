-- ============================================================
-- LAKUVO
-- Phase 16.11-D2
-- Provider-neutral checkout payment event processor
-- ============================================================
--
-- Purpose:
--
-- 1. Process a previously-authenticated billing webhook event.
-- 2. Bind the provider transaction to the authoritative checkout.
-- 3. Verify gross amount and currency against checkout snapshot.
-- 4. Prevent transaction-id substitution.
-- 5. Apply checkout payment lifecycle atomically.
-- 6. Mark billing_events processed only after accepted handling.
-- 7. Prevent terminal-state regression.
--
-- IMPORTANT SECURITY CONTRACT:
--
-- A provider notification signature does not necessarily bind every
-- lifecycle field contained in a webhook payload.
--
-- Therefore terminal payment outcomes require:
--
--   p_verification_method = 'provider_status_api'
--
-- Signature-only processing may record pending / unknown outcomes,
-- but MUST NOT bind provider_transaction_id, mutate checkout
-- lifecycle state, complete, expire, cancel, or deny a checkout.
--
-- This processor intentionally DOES NOT mutate
-- organization_subscriptions.
--
-- One-time checkout payment settlement and recurring subscription
-- lifecycle remain separate concepts.
-- ============================================================


create or replace function
public.process_billing_checkout_payment_event(
  p_organization_id uuid,
  p_provider text,
  p_external_event_id text,
  p_reference_id text,
  p_provider_transaction_id text,
  p_payment_outcome text,
  p_gross_amount numeric,
  p_currency text,
  p_verification_method text,
  p_metadata jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_event public.billing_events%rowtype;

  v_session
    public.billing_checkout_sessions%rowtype;

  v_provider text;
  v_external_event_id text;
  v_reference_id text;
  v_provider_transaction_id text;
  v_payment_outcome text;
  v_currency text;
  v_verification_method text;

  v_result text;

  v_checkout_metadata jsonb;
begin

  -- ==========================================================
  -- NORMALIZE / VALIDATE INPUT
  -- ==========================================================

  if p_organization_id is null then
    raise exception
      'organization id is required';
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


  v_external_event_id :=
    btrim(
      coalesce(
        p_external_event_id,
        ''
      )
    );


  v_reference_id :=
    btrim(
      coalesce(
        p_reference_id,
        ''
      )
    );


  v_provider_transaction_id :=
    btrim(
      coalesce(
        p_provider_transaction_id,
        ''
      )
    );


  v_payment_outcome :=
    lower(
      btrim(
        coalesce(
          p_payment_outcome,
          ''
        )
      )
    );


  v_currency :=
    upper(
      btrim(
        coalesce(
          p_currency,
          ''
        )
      )
    );


  v_verification_method :=
    lower(
      btrim(
        coalesce(
          p_verification_method,
          ''
        )
      )
    );


  if length(v_provider) = 0 then
    raise exception
      'provider is required';
  end if;


  if length(v_external_event_id) = 0 then
    raise exception
      'external event id is required';
  end if;


  if length(v_reference_id) = 0 then
    raise exception
      'reference id is required';
  end if;


  if length(v_provider_transaction_id) = 0 then
    raise exception
      'provider transaction id is required';
  end if;


  if v_payment_outcome not in (
    'pending',
    'completed',
    'expired',
    'canceled',
    'denied',
    'unknown'
  ) then
    raise exception
      'unsupported payment outcome';
  end if;


  if p_gross_amount is null
     or p_gross_amount <= 0 then

    raise exception
      'gross amount must be positive';
  end if;


  if length(v_currency) = 0 then
    raise exception
      'currency is required';
  end if;


  if v_verification_method not in (
    'notification_signature',
    'provider_status_api'
  ) then
    raise exception
      'unsupported verification method';
  end if;


  if jsonb_typeof(
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
  ) <> 'object' then

    raise exception
      'metadata must be a json object';
  end if;


  -- ==========================================================
  -- TERMINAL OUTCOMES REQUIRE PROVIDER STATUS API VERIFICATION
  -- ==========================================================

  if v_payment_outcome in (
    'completed',
    'expired',
    'canceled',
    'denied'
  )
  and v_verification_method <>
      'provider_status_api' then

    return
      'status_verification_required';
  end if;


  -- ==========================================================
  -- LOCK BILLING INBOX EVENT
  -- ==========================================================

  select e.*
  into v_event
  from public.billing_events e
  where e.organization_id =
        p_organization_id
    and e.provider =
        v_provider
    and e.external_event_id =
        v_external_event_id
  for update;


  if v_event.id is null then
    return
      'missing_event';
  end if;


  if v_event.status = 'processed' then
    return
      'already_processed';
  end if;


  if v_event.status <> 'received' then
    return
      'event_not_processable';
  end if;


  -- ==========================================================
  -- LOCK AUTHORITATIVE CHECKOUT
  -- ==========================================================

  select s.*
  into v_session
  from public.billing_checkout_sessions s
  where s.organization_id =
        p_organization_id
    and s.provider =
        v_provider
    and s.reference_id =
        v_reference_id
  for update;


  if v_session.id is null then
    return
      'missing_checkout';
  end if;


  -- ==========================================================
  -- AUTHORITATIVE AMOUNT / CURRENCY CHECK
  -- ==========================================================

  if v_session.amount <>
     p_gross_amount then

    return
      'amount_mismatch';
  end if;


  if v_session.currency <>
     v_currency then

    return
      'currency_mismatch';
  end if;


  -- ==========================================================
  -- PROVIDER TRANSACTION BINDING
  -- ==========================================================

  if nullif(
    btrim(
      coalesce(
        v_session.provider_transaction_id,
        ''
      )
    ),
    ''
  ) is not null
  and btrim(
    v_session.provider_transaction_id
  ) <>
      v_provider_transaction_id then

    return
      'transaction_mismatch';
  end if;


  if exists (
    select 1
    from public.billing_checkout_sessions other_session
    where other_session.provider =
          v_provider
      and other_session.provider_transaction_id =
          v_provider_transaction_id
      and other_session.id <>
          v_session.id
  ) then

    return
      'transaction_conflict';
  end if;


  v_checkout_metadata :=
    coalesce(
      v_session.metadata,
      '{}'::jsonb
    )
    ||
    coalesce(
      p_metadata,
      '{}'::jsonb
    )
    ||
    jsonb_build_object(
      'last_payment_event_id',
        v_external_event_id,

      'last_payment_outcome',
        v_payment_outcome,

      'last_payment_verification_method',
        v_verification_method
    );


  -- ==========================================================
  -- COMPLETED IS NEVER REGRESSED
  -- ==========================================================

  if v_session.status = 'completed' then

    update public.billing_checkout_sessions
    set
      provider_transaction_id =
        coalesce(
          nullif(
            btrim(
              provider_transaction_id
            ),
            ''
          ),
          v_provider_transaction_id
        ),

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    if v_payment_outcome =
       'completed' then

      v_result :=
        'already_completed';

    else

      v_result :=
        'ignored_terminal';

    end if;


    update public.billing_events
    set
      status =
        'processed',

      processed_at =
        now()

    where id =
          v_event.id;


    return
      v_result;
  end if;


  -- ==========================================================
  -- OTHER TERMINAL STATES DO NOT REGRESS
  -- ==========================================================

  if v_session.status in (
    'expired',
    'canceled',
    'failed'
  ) then

    update public.billing_checkout_sessions
    set
      provider_transaction_id =
        coalesce(
          nullif(
            btrim(
              provider_transaction_id
            ),
            ''
          ),
          v_provider_transaction_id
        ),

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    if v_session.status = 'expired'
       and v_payment_outcome =
           'expired' then

      v_result :=
        'already_expired';

    elsif v_session.status = 'canceled'
       and v_payment_outcome =
           'canceled' then

      v_result :=
        'already_canceled';

    elsif v_session.status = 'failed'
       and v_payment_outcome =
           'denied'
       and v_session.failure_code =
           'PAYMENT_PROVIDER_DENIED' then

      v_result :=
        'already_denied';

    else

      v_result :=
        'ignored_terminal';

    end if;


    update public.billing_events
    set
      status =
        'processed',

      processed_at =
        now()

    where id =
          v_event.id;


    return
      v_result;
  end if;


  -- ==========================================================
  -- COMPLETED RACE PROTECTION
  --
  -- Checkout provider session should normally be attached and
  -- status=ready before completion is applied.
  --
  -- If a provider notification races ahead of the checkout route,
  -- keep the billing event as received. A later duplicate delivery
  -- can retry processing after attach reaches ready.
  -- ==========================================================

  if v_payment_outcome = 'completed'
     and v_session.status =
         'created' then

    return
      'checkout_not_ready';
  end if;


  -- ==========================================================
  -- PENDING
  --
  -- Notification signature does not bind transaction_id.
  --
  -- Signature-only pending events are auditable through
  -- billing_events, but MUST NOT bind provider_transaction_id
  -- or mutate checkout metadata/state.
  --
  -- Transaction identity may only be bound after an
  -- authoritative provider status API verification.
  -- ==========================================================

  if v_payment_outcome =
     'pending' then

    if v_verification_method =
       'provider_status_api' then

      update public.billing_checkout_sessions
      set
        provider_transaction_id =
          v_provider_transaction_id,

        metadata =
          v_checkout_metadata,

        updated_at =
          now()

      where id =
            v_session.id;


      v_result :=
        'pending';

    else

      v_result :=
        'pending_unverified';

    end if;

  end if;

  -- ==========================================================
  -- UNKNOWN
  --
  -- Preserve the provider event in billing_events, but do not
  -- mutate checkout identity from signature-only payload fields.
  --
  -- Only an authoritative provider status API response may bind
  -- provider_transaction_id or provider-derived metadata.
  -- ==========================================================

  if v_payment_outcome =
     'unknown' then

    if v_verification_method =
       'provider_status_api' then

      update public.billing_checkout_sessions
      set
        provider_transaction_id =
          v_provider_transaction_id,

        metadata =
          v_checkout_metadata,

        updated_at =
          now()

      where id =
            v_session.id;


      v_result :=
        'ignored_unknown';

    else

      v_result :=
        'ignored_unknown_unverified';

    end if;

  end if;

  -- ==========================================================
  -- COMPLETED
  -- ==========================================================

  if v_payment_outcome =
     'completed' then

    if v_session.status <>
       'ready' then

      return
        'checkout_not_completable';
    end if;


    update public.billing_checkout_sessions
    set
      status =
        'completed',

      provider_transaction_id =
        v_provider_transaction_id,

      completed_at =
        coalesce(
          completed_at,
          now()
        ),

      failure_code =
        null,

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    v_result :=
      'completed';
  end if;


  -- ==========================================================
  -- EXPIRED
  -- ==========================================================

  if v_payment_outcome =
     'expired' then

    if v_session.status not in (
      'created',
      'ready'
    ) then

      return
        'checkout_not_expirable';
    end if;


    update public.billing_checkout_sessions
    set
      status =
        'expired',

      provider_transaction_id =
        v_provider_transaction_id,

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    v_result :=
      'expired';
  end if;


  -- ==========================================================
  -- CANCELED
  -- ==========================================================

  if v_payment_outcome =
     'canceled' then

    if v_session.status not in (
      'created',
      'ready'
    ) then

      return
        'checkout_not_cancelable';
    end if;


    update public.billing_checkout_sessions
    set
      status =
        'canceled',

      provider_transaction_id =
        v_provider_transaction_id,

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    v_result :=
      'canceled';
  end if;


  -- ==========================================================
  -- DENIED
  --
  -- Existing checkout schema has no separate "denied" state.
  -- Provider denial therefore maps to controlled status=failed.
  -- ==========================================================

  if v_payment_outcome =
     'denied' then

    if v_session.status not in (
      'created',
      'ready'
    ) then

      return
        'checkout_not_deniable';
    end if;


    update public.billing_checkout_sessions
    set
      status =
        'failed',

      provider_transaction_id =
        v_provider_transaction_id,

      failure_code =
        'PAYMENT_PROVIDER_DENIED',

      metadata =
        v_checkout_metadata,

      updated_at =
        now()

    where id =
          v_session.id;


    v_result :=
      'denied';
  end if;


  -- ==========================================================
  -- INTERNAL CONTRACT GUARD
  -- ==========================================================

  if v_result is null then
    raise exception
      'payment event processor reached no outcome';
  end if;


  -- ==========================================================
  -- EVENT IS PROCESSED ONLY AFTER ACCEPTED HANDLING
  -- ==========================================================

  update public.billing_events
  set
    status =
      'processed',

    processed_at =
      now()

  where id =
        v_event.id;


  return
    v_result;
end;
$function$;


-- ============================================================
-- ACCESS BOUNDARY
-- ============================================================

revoke all
on function
public.process_billing_checkout_payment_event(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  text,
  text,
  jsonb
)
from public, anon, authenticated;


grant execute
on function
public.process_billing_checkout_payment_event(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  text,
  text,
  jsonb
)
to service_role;


comment on function
public.process_billing_checkout_payment_event(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  text,
  text,
  jsonb
) is
  'Atomically processes an authenticated checkout payment event against authoritative checkout amount/currency. Terminal outcomes require provider status API verification and do not directly mutate recurring subscriptions.';
