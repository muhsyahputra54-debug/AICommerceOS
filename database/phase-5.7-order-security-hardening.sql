-- AICommerceOS
-- Phase 5.7 Security
-- Order lifecycle privilege hardening
--
-- This change has already been applied and verified against
-- the active Supabase database.
--
-- Security intent:
-- - authenticated users may SELECT their own orders/order_items via RLS
-- - direct INSERT/UPDATE/DELETE is blocked
-- - mutations must use create_order() / update_order_status()
-- - RPCs execute as SECURITY DEFINER with locked search_path
-- - PUBLIC and anon cannot execute the order mutation RPCs

begin;

alter function public.create_order(
  uuid,
  uuid,
  jsonb
)
security definer;

alter function public.create_order(
  uuid,
  uuid,
  jsonb
)
set search_path = public, pg_temp;


alter function public.update_order_status(
  uuid,
  uuid,
  text
)
security definer;

alter function public.update_order_status(
  uuid,
  uuid,
  text
)
set search_path = public, pg_temp;


revoke all
on table public.orders
from public, anon, authenticated;

revoke all
on table public.order_items
from public, anon, authenticated;


grant select
on table public.orders
to authenticated;

grant select
on table public.order_items
to authenticated;


revoke all
on function public.create_order(uuid, uuid, jsonb)
from public, anon;

grant execute
on function public.create_order(uuid, uuid, jsonb)
to authenticated;


revoke all
on function public.update_order_status(uuid, uuid, text)
from public, anon;

grant execute
on function public.update_order_status(uuid, uuid, text)
to authenticated;

commit;
