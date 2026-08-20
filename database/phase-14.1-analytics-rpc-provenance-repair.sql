-- AICommerceOS
-- Analytics RPC provenance repair
--
-- Source: pg_get_functiondef() from the active Supabase database
-- captured during Phase 8D contract resolution.
--
-- Purpose:
-- - restore executable analytics RPC definitions to repository provenance
-- - preserve the currently deployed function behavior
-- - preserve authenticated-only EXECUTE access
--
-- This migration recreates the four currently deployed analytics RPCs.

-- ============================================================
-- get_sales_performance_summary
-- Remote signature: get_sales_performance_summary(uuid)
-- Return type: jsonb
-- SECURITY DEFINER: false
-- Function config: ["search_path=public"]
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_sales_performance_summary(p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_completed_orders bigint;
  v_units_sold bigint;
  v_revenue numeric;
  v_cost numeric;
  v_profit numeric;
  v_margin numeric;
  v_products_sold bigint;
begin

  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;


  select
    count(distinct o.id)::bigint,

    coalesce(
      sum(oi.quantity),
      0
    )::bigint,

    coalesce(
      sum(
        oi.quantity::numeric *
        oi.price
      ),
      0
    )::numeric,

    coalesce(
      sum(
        oi.quantity::numeric *
        oi.cost_price_snapshot
      ),
      0
    )::numeric,

    count(
      distinct oi.product_id
    )::bigint

  into
    v_completed_orders,
    v_units_sold,
    v_revenue,
    v_cost,
    v_products_sold

  from public.orders o

  join public.order_items oi
    on oi.order_id = o.id

  where o.organization_id =
          p_organization_id

    and o.status = 'completed';


  v_profit :=
    v_revenue - v_cost;


  v_margin :=
    case
      when v_revenue > 0 then
        round(
          (
            v_profit /
            v_revenue
          ) * 100,
          2
        )

      else 0::numeric
    end;


  return jsonb_build_object(
    'completed_orders',
      v_completed_orders,

    'units_sold',
      v_units_sold,

    'products_sold',
      v_products_sold,

    'revenue',
      v_revenue,

    'cost',
      v_cost,

    'profit',
      v_profit,

    'margin',
      v_margin,

    'average_order_value',
      case
        when v_completed_orders > 0
        then round(
          v_revenue /
          v_completed_orders,
          2
        )
        else 0::numeric
      end
  );

end;
$function$;

revoke all on function public.get_sales_performance_summary(uuid) from public;
grant execute on function public.get_sales_performance_summary(uuid) to authenticated;

-- ============================================================
-- get_product_performance
-- Remote signature: get_product_performance(uuid,uuid)
-- Return type: TABLE(product_id uuid, product_name text, sku text, stock integer, total_units_sold bigint, revenue numeric, cost numeric, profit numeric, margin numeric)
-- SECURITY DEFINER: false
-- Function config: ["search_path=public"]
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_product_performance(p_organization_id uuid, p_product_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(product_id uuid, product_name text, sku text, stock integer, total_units_sold bigint, revenue numeric, cost numeric, profit numeric, margin numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin

  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;


  return query

  with completed_sales as (

    select
      oi.product_id,

      sum(oi.quantity)::bigint
        as units_sold,

      sum(
        oi.quantity::numeric * oi.price
      )
        as sales_revenue,

      sum(
        oi.quantity::numeric *
        oi.cost_price_snapshot
      )
        as sales_cost

    from public.orders o

    join public.order_items oi
      on oi.order_id = o.id

    where o.organization_id =
            p_organization_id

      and o.status = 'completed'

    group by oi.product_id
  )

  select
    p.id,
    p.name,
    p.sku,
    p.stock,

    coalesce(
      cs.units_sold,
      0
    )::bigint,

    coalesce(
      cs.sales_revenue,
      0
    )::numeric,

    coalesce(
      cs.sales_cost,
      0
    )::numeric,

    (
      coalesce(
        cs.sales_revenue,
        0
      )
      -
      coalesce(
        cs.sales_cost,
        0
      )
    )::numeric,

    case
      when coalesce(
        cs.sales_revenue,
        0
      ) > 0
      then round(
        (
          (
            coalesce(
              cs.sales_revenue,
              0
            )
            -
            coalesce(
              cs.sales_cost,
              0
            )
          )
          /
          cs.sales_revenue
        ) * 100,
        2
      )
      else 0::numeric
    end

  from public.products p

  left join completed_sales cs
    on cs.product_id = p.id

  where p.organization_id =
          p_organization_id

    and (
      p_product_id is null
      or p.id = p_product_id
    )

  order by
    coalesce(
      cs.sales_revenue,
      0
    ) desc,
    p.name asc;

end;
$function$;

revoke all on function public.get_product_performance(uuid, uuid) from public;
grant execute on function public.get_product_performance(uuid, uuid) to authenticated;

-- ============================================================
-- get_sales_trend
-- Remote signature: get_sales_trend(uuid,integer)
-- Return type: TABLE(sale_date date, units_sold bigint, revenue numeric, cost numeric, profit numeric, margin numeric)
-- SECURITY DEFINER: false
-- Function config: ["search_path=public"]
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_sales_trend(p_organization_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(sale_date date, units_sold bigint, revenue numeric, cost numeric, profit numeric, margin numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin

  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception
      'User is not a member of this organization'
      using errcode = '42501';
  end if;


  if p_days is null
     or p_days < 1
     or p_days > 365 then
    raise exception
      'p_days must be between 1 and 365'
      using errcode = 'P0001';
  end if;


  return query

  with date_series as (

    select
      generate_series(
        current_date -
          (p_days - 1),
        current_date,
        interval '1 day'
      )::date as day

  ),

  daily_sales as (

    select
      o.completed_at::date
        as day,

      sum(oi.quantity)::bigint
        as daily_units,

      sum(
        oi.quantity::numeric *
        oi.price
      )::numeric
        as daily_revenue,

      sum(
        oi.quantity::numeric *
        oi.cost_price_snapshot
      )::numeric
        as daily_cost

    from public.orders o

    join public.order_items oi
      on oi.order_id = o.id

    where o.organization_id =
            p_organization_id

      and o.status = 'completed'

      and o.completed_at >=
          (
            current_date -
            (p_days - 1)
          )

    group by
      o.completed_at::date
  )

  select
    ds.day,

    coalesce(
      d.daily_units,
      0
    )::bigint,

    coalesce(
      d.daily_revenue,
      0
    )::numeric,

    coalesce(
      d.daily_cost,
      0
    )::numeric,

    (
      coalesce(
        d.daily_revenue,
        0
      )
      -
      coalesce(
        d.daily_cost,
        0
      )
    )::numeric,

    case

      when coalesce(
        d.daily_revenue,
        0
      ) > 0

      then round(
        (
          (
            coalesce(
              d.daily_revenue,
              0
            )
            -
            coalesce(
              d.daily_cost,
              0
            )
          )
          /
          d.daily_revenue
        ) * 100,
        2
      )

      else 0::numeric

    end

  from date_series ds

  left join daily_sales d
    on d.day = ds.day

  order by ds.day;

end;
$function$;

revoke all on function public.get_sales_trend(uuid, integer) from public;
grant execute on function public.get_sales_trend(uuid, integer) to authenticated;

-- ============================================================
-- get_commerce_analytics
-- Remote signature: get_commerce_analytics(uuid,integer)
-- Return type: jsonb
-- SECURITY DEFINER: true
-- Function config: ["search_path=public, pg_temp"]
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_commerce_analytics(p_organization_id uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_start timestamptz;

  v_orders bigint := 0;
  v_completed bigint := 0;
  v_pending bigint := 0;
  v_processing bigint := 0;
  v_cancelled bigint := 0;

  v_revenue numeric := 0;
  v_cogs numeric := 0;
  v_gross_profit numeric := 0;
  v_aov numeric := 0;

  v_products bigint := 0;
  v_active_products bigint := 0;

  v_base_stock numeric := 0;
  v_base_retail_value numeric := 0;
  v_base_cost_value numeric := 0;

  v_variants bigint := 0;
  v_variant_stock numeric := 0;
  v_variant_retail_value numeric := 0;
  v_variant_cost_value numeric := 0;

  v_research_total bigint := 0;
  v_research_shortlisted bigint := 0;
  v_research_approved bigint := 0;
  v_research_rejected bigint := 0;
  v_avg_opportunity numeric := 0;

  v_price_targets bigint := 0;
  v_active_price_targets bigint := 0;
  v_price_observations bigint := 0;
  v_price_alerts bigint := 0;

  v_automation_rules bigint := 0;
  v_active_automation_rules bigint := 0;
  v_automation_runs bigint := 0;
  v_automation_executed bigint := 0;
  v_automation_proposed bigint := 0;
  v_automation_failed bigint := 0;
  v_pending_actions bigint := 0;

  v_research_ai_runs bigint := 0;
  v_description_ai_runs bigint := 0;
  v_agent_runs bigint := 0;
  v_agent_completed bigint := 0;
  v_agent_failed bigint := 0;

  v_daily_sales jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_organization_id is null then
    raise exception 'Organization is required';
  end if;

  if not public.is_organization_member(
    p_organization_id
  ) then
    raise exception 'Organization access denied';
  end if;

  if p_days is null
     or p_days < 1
     or p_days > 365 then
    raise exception
      'Analytics period must be between 1 and 365 days';
  end if;

  v_start :=
    now() - make_interval(days => p_days);


  -- =======================================================
  -- ORDERS
  -- =======================================================

  select
    count(*),

    count(*) filter (
      where status = 'completed'
    ),

    count(*) filter (
      where status = 'pending'
    ),

    count(*) filter (
      where status = 'processing'
    ),

    count(*) filter (
      where status = 'cancelled'
    )
  into
    v_orders,
    v_completed,
    v_pending,
    v_processing,
    v_cancelled
  from public.orders
  where organization_id =
      p_organization_id
    and created_at >= v_start;


  -- =======================================================
  -- COMPLETED SALES
  --
  -- order_items has:
  -- price
  -- cost_price_snapshot
  --
  -- Tenant ownership comes from orders.organization_id.
  -- =======================================================

  select
    coalesce(
      sum(
        oi.quantity::numeric *
        oi.price::numeric
      ),
      0
    ),

    coalesce(
      sum(
        oi.quantity::numeric *
        oi.cost_price_snapshot::numeric
      ),
      0
    )
  into
    v_revenue,
    v_cogs
  from public.order_items oi

  join public.orders o
    on o.id = oi.order_id

  where o.organization_id =
      p_organization_id

    and o.status =
      'completed'

    and o.created_at >=
      v_start;


  v_gross_profit :=
    v_revenue - v_cogs;


  if v_completed > 0 then
    v_aov :=
      v_revenue /
      v_completed;
  end if;


  -- =======================================================
  -- CATALOG
  -- =======================================================

  select
    count(*),

    count(*) filter (
      where status = 'active'
    ),

    coalesce(
      sum(stock::numeric),
      0
    ),

    coalesce(
      sum(
        stock::numeric *
        price::numeric
      ),
      0
    ),

    coalesce(
      sum(
        stock::numeric *
        cost_price::numeric
      ),
      0
    )
  into
    v_products,
    v_active_products,
    v_base_stock,
    v_base_retail_value,
    v_base_cost_value
  from public.products
  where organization_id =
    p_organization_id;


  select
    count(*),

    coalesce(
      sum(stock::numeric),
      0
    ),

    coalesce(
      sum(
        stock::numeric *
        price::numeric
      ),
      0
    ),

    coalesce(
      sum(
        stock::numeric *
        cost_price::numeric
      ),
      0
    )
  into
    v_variants,
    v_variant_stock,
    v_variant_retail_value,
    v_variant_cost_value
  from public.product_variants
  where organization_id =
    p_organization_id;


  -- =======================================================
  -- PRODUCT RESEARCH
  -- =======================================================

  select
    count(*),

    count(*) filter (
      where status = 'shortlisted'
    ),

    count(*) filter (
      where status = 'approved'
    ),

    count(*) filter (
      where status = 'rejected'
    ),

    coalesce(
      avg(opportunity_score),
      0
    )
  into
    v_research_total,
    v_research_shortlisted,
    v_research_approved,
    v_research_rejected,
    v_avg_opportunity
  from public.product_research_items
  where organization_id =
    p_organization_id;


  -- =======================================================
  -- PRICE MONITORING
  -- =======================================================

  select
    count(*),

    count(*) filter (
      where is_active
    )
  into
    v_price_targets,
    v_active_price_targets
  from public.price_monitor_targets
  where organization_id =
    p_organization_id;


  select
    count(*),

    count(*) filter (
      where threshold_triggered
    )
  into
    v_price_observations,
    v_price_alerts
  from public.price_observations
  where organization_id =
      p_organization_id
    and observed_at >= v_start;


  -- =======================================================
  -- AUTOMATION
  -- =======================================================

  select
    count(*),

    count(*) filter (
      where is_active
    )
  into
    v_automation_rules,
    v_active_automation_rules
  from public.automation_rules
  where organization_id =
    p_organization_id;


  select
    count(*),

    count(*) filter (
      where status = 'executed'
    ),

    count(*) filter (
      where status = 'proposed'
    ),

    count(*) filter (
      where status = 'failed'
    )
  into
    v_automation_runs,
    v_automation_executed,
    v_automation_proposed,
    v_automation_failed
  from public.automation_runs
  where organization_id =
      p_organization_id
    and created_at >= v_start;


  select
    count(*)
  into
    v_pending_actions
  from public.automation_actions
  where organization_id =
      p_organization_id
    and status = 'pending';


  -- =======================================================
  -- AI ACTIVITY
  -- =======================================================

  select count(*)
  into v_research_ai_runs
  from public.product_research_ai_runs
  where organization_id =
      p_organization_id
    and created_at >= v_start;


  select count(*)
  into v_description_ai_runs
  from public.product_description_generations
  where organization_id =
      p_organization_id
    and created_at >= v_start;


  select
    count(*),

    count(*) filter (
      where status = 'completed'
    ),

    count(*) filter (
      where status = 'failed'
    )
  into
    v_agent_runs,
    v_agent_completed,
    v_agent_failed
  from public.ai_agent_runs
  where organization_id =
      p_organization_id
    and created_at >= v_start;


  -- =======================================================
  -- DAILY SALES TREND
  -- =======================================================

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'date',
          x.day,

          'orders',
          x.order_count,

          'completed_orders',
          x.completed_count,

          'revenue',
          x.revenue
        )
        order by x.day
      ),
      '[]'::jsonb
    )
  into
    v_daily_sales
  from (
    select
      d.day::date as day,

      count(
        distinct o.id
      ) as order_count,

      count(
        distinct o.id
      ) filter (
        where o.status =
          'completed'
      ) as completed_count,

      coalesce(
        sum(
          oi.quantity::numeric *
          oi.price::numeric
        ) filter (
          where o.status =
            'completed'
        ),
        0
      ) as revenue

    from generate_series(
      current_date -
        (p_days - 1),

      current_date,

      interval '1 day'
    ) as d(day)

    left join public.orders o
      on o.organization_id =
           p_organization_id

     and o.created_at::date =
           d.day::date

    left join public.order_items oi
      on oi.order_id =
           o.id

    group by
      d.day::date
  ) x;


  -- =======================================================
  -- RESPONSE
  -- =======================================================

  return jsonb_build_object(
    'generated_at',
    now(),

    'period_days',
    p_days,

    'period_start',
    v_start,

    'sales',
    jsonb_build_object(
      'orders',
      v_orders,

      'completed_orders',
      v_completed,

      'pending_orders',
      v_pending,

      'processing_orders',
      v_processing,

      'cancelled_orders',
      v_cancelled,

      'revenue',
      v_revenue,

      'cogs',
      v_cogs,

      'gross_profit',
      v_gross_profit,

      'average_order_value',
      v_aov
    ),

    'catalog',
    jsonb_build_object(
      'products',
      v_products,

      'active_products',
      v_active_products,

      'base_stock_units',
      v_base_stock,

      'base_retail_value',
      v_base_retail_value,

      'base_cost_value',
      v_base_cost_value,

      'variants',
      v_variants,

      'variant_stock_units',
      v_variant_stock,

      'variant_retail_value',
      v_variant_retail_value,

      'variant_cost_value',
      v_variant_cost_value
    ),

    'research',
    jsonb_build_object(
      'total',
      v_research_total,

      'shortlisted',
      v_research_shortlisted,

      'approved',
      v_research_approved,

      'rejected',
      v_research_rejected,

      'average_opportunity_score',
      v_avg_opportunity
    ),

    'price_monitoring',
    jsonb_build_object(
      'targets',
      v_price_targets,

      'active_targets',
      v_active_price_targets,

      'observations',
      v_price_observations,

      'threshold_alerts',
      v_price_alerts
    ),

    'automation',
    jsonb_build_object(
      'rules',
      v_automation_rules,

      'active_rules',
      v_active_automation_rules,

      'runs',
      v_automation_runs,

      'executed_runs',
      v_automation_executed,

      'proposed_runs',
      v_automation_proposed,

      'failed_runs',
      v_automation_failed,

      'pending_actions',
      v_pending_actions
    ),

    'ai_activity',
    jsonb_build_object(
      'research_runs',
      v_research_ai_runs,

      'description_runs',
      v_description_ai_runs,

      'agent_runs',
      v_agent_runs,

      'agent_completed',
      v_agent_completed,

      'agent_failed',
      v_agent_failed
    ),

    'daily_sales',
    v_daily_sales
  );
end;
$function$;

revoke all on function public.get_commerce_analytics(uuid, integer) from public;
grant execute on function public.get_commerce_analytics(uuid, integer) to authenticated;
