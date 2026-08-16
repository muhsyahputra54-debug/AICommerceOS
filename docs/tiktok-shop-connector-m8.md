# Tokopedia & Shop Connector — M8 Controlled Order Status Reconciliation

M8 adds a human-approved reconciliation layer between the external marketplace
order mirror and AICommerceOS internal order lifecycle.

## Live internal authority audit

The live database confirms:

- `update_order_status(p_organization_id uuid, p_order_id uuid, p_new_status text) -> text`
- function is SECURITY DEFINER with `search_path=public, pg_temp`
- accepted target statuses are `processing`, `completed`, and `cancelled`
- `pending -> processing` deducts product/variant inventory
- `pending -> cancelled` does not deduct inventory
- `processing -> completed` leaves inventory deducted
- `processing -> cancelled` restores inventory
- terminal `completed` and `cancelled` orders cannot transition again
- `orders.completed_at` must be populated only when status is `completed`

M8 does not reproduce that lifecycle logic. It delegates every approved internal
transition to `public.update_order_status(...)`.

## Marketplace status mapping

Conservative mapping:

| Marketplace | Internal pending | Internal processing |
| --- | --- | --- |
| UNPAID | no action | no action |
| ON_HOLD | no action | no action |
| AWAITING_SHIPMENT | propose processing | no action |
| PARTIALLY_SHIPPING | propose processing | no action |
| AWAITING_COLLECTION | propose processing | no action |
| IN_TRANSIT | propose processing | no action |
| DELIVERED | propose processing | no action |
| COMPLETED | propose processing first | propose completed |
| CANCEL / CANCELLED | propose cancelled | propose cancelled |

`DELIVERED` deliberately does not complete the internal order. M8 waits until the
marketplace reports `COMPLETED`, which is the terminal marketplace completion
state.

Both `CANCEL` and `CANCELLED` are accepted because TikTok Shop documentation
surfaces both spellings across webhook/order documentation.

## Human approval and stale-state protection

The UI only presents a proposal. The operator must approve it explicitly.

The apply RPC:

1. Locks the external order row.
2. Validates organization membership.
3. Loads the linked internal order.
4. Recomputes the proposal from current database state.
5. Verifies both expected external status and expected internal target status.
6. Calls `public.update_order_status(...)`.
7. Updates safe order-link reconciliation metadata.
8. Appends a marketplace sync log.

If the marketplace mirror changed after the UI was rendered, approval fails and
the operator must refresh before trying again.

## Deliberate exclusions

- no automatic status mutation from webhook processing
- no direct `UPDATE orders`
- no direct product/variant stock mutation
- no marketplace write-back
- no multi-step pending -> completed transition in one approval
- no assumption that unobserved marketplace runtime data is already validated

The live audit had no synchronized external order statuses yet, so M8 should be
treated as implemented-but-not-runtime-validated until real Partner Center
credentials and orders are available.
