-- LAKUVO G6-R8V.30A | P1 Inventory Movement Tenant Integrity
-- DRAFT FOR SOURCE REVIEW / LOCAL TESTING ONLY. DO NOT APPLY TO STAGING OR PRODUCTION.
-- Preconditions: products and product_variants each have UNIQUE (id, organization_id),
-- and inventory_movements.organization_id is NOT NULL.
-- This migration changes constraints, not inventory movement rows.

BEGIN;

-- Serialize inventory_movement writes during validation and constraint replacement.
-- AccessExclusiveLock also prevents concurrent writes until COMMIT/ROLLBACK.
LOCK TABLE public.inventory_movements IN ACCESS EXCLUSIVE MODE;

-- Fail before any constraint changes if historical movements already reference
-- entities belonging to another organization.
DO $guard$
DECLARE
  invalid_product_count bigint;
  invalid_variant_count bigint;
BEGIN
  SELECT count(*) INTO invalid_product_count
  FROM public.inventory_movements AS im
  JOIN public.products AS p ON p.id = im.product_id
  WHERE im.organization_id IS DISTINCT FROM p.organization_id;

  SELECT count(*) INTO invalid_variant_count
  FROM public.inventory_movements AS im
  JOIN public.product_variants AS pv ON pv.id = im.variant_id
  WHERE im.organization_id IS DISTINCT FROM pv.organization_id;

  IF invalid_product_count > 0 OR invalid_variant_count > 0 THEN
    RAISE EXCEPTION
      'inventory tenant-integrity preflight failed: cross-org product refs %, variant refs %',
      invalid_product_count, invalid_variant_count
      USING ERRCODE = '23514';
  END IF;
END;
$guard$;

-- Keep existing single-column FKs: they implement historical ON DELETE SET NULL.
-- Add organization-bound FKs with the same per-target delete behavior.
-- Column-list SET NULL is supported on PostgreSQL 15+.
ALTER TABLE public.inventory_movements
  ADD CONSTRAINT inventory_movements_product_org_fkey
  FOREIGN KEY (product_id, organization_id)
  REFERENCES public.products (id, organization_id)
  MATCH SIMPLE
  ON UPDATE NO ACTION
  ON DELETE SET NULL (product_id);

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT inventory_movements_variant_org_fkey
  FOREIGN KEY (variant_id, organization_id)
  REFERENCES public.product_variants (id, organization_id)
  MATCH SIMPLE
  ON UPDATE NO ACTION
  ON DELETE SET NULL (variant_id);

-- Do not add a NOT NULL requirement to product_id or variant_id:
-- deleted historical targets must remain representable by NULL references.
COMMIT;
