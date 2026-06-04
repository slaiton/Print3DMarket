-- ============================================================
-- 004_functions.sql
-- Ejecutar en Supabase SQL Editor DESPUÉS de 001, 002, 003
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- Vista pública del catálogo (join products + category + seller)
-- Útil para queries simples sin tener que repetir el join
-- ──────────────────────────────────────────────────────────────
create or replace view public.catalog_view as
select
  p.id,
  p.name,
  p.description,
  p.price,
  p.material,
  p.color,
  p.print_time_hrs,
  p.weight_grams,
  p.stock,
  p.is_available,
  p.is_customizable,
  p.images,
  p.tags,
  p.created_at,
  p.updated_at,
  p.seller_id,
  pr.full_name  as seller_name,
  p.category_id,
  c.name        as category_name,
  c.slug        as category_slug,
  c.icon        as category_icon
from public.products p
left join public.profiles  pr on pr.id = p.seller_id
left join public.categories c  on c.id  = p.category_id
where p.is_available = true;

-- ──────────────────────────────────────────────────────────────
-- Función: stats globales para admin
-- ──────────────────────────────────────────────────────────────
create or replace function public.get_dashboard_stats()
returns json language plpgsql security definer as $$
declare
  result json;
begin
  select json_build_object(
    'total_products',       (select count(*) from public.products),
    'available_products',   (select count(*) from public.products where is_available = true),
    'total_sales',          (select count(*) from public.sales),
    'sales_this_month',     (select count(*) from public.sales
                              where created_at >= date_trunc('month', now())),
    'revenue_total',        (select coalesce(sum(total_amount), 0) from public.sales
                              where status != 'cancelled'),
    'revenue_this_month',   (select coalesce(sum(total_amount), 0) from public.sales
                              where status != 'cancelled'
                                and created_at >= date_trunc('month', now())),
    'total_sellers',        (select count(*) from public.profiles where role = 'seller' and is_active = true),
    'total_customers',      (select count(*) from public.customers),
    'sales_by_status',      (select json_agg(row_to_json(t)) from (
                                select status, count(*) as count
                                from public.sales
                                group by status
                              ) t),
    'top_products',         (select json_agg(row_to_json(t)) from (
                                select si.product_name,
                                       sum(si.quantity) as units_sold,
                                       sum(si.subtotal) as revenue
                                from public.sale_items si
                                group by si.product_name
                                order by units_sold desc
                                limit 5
                              ) t),
    'revenue_last_6_months',(select json_agg(row_to_json(t)) from (
                                select to_char(date_trunc('month', created_at), 'Mon') as month,
                                       extract(month from created_at)::int as month_num,
                                       coalesce(sum(total_amount), 0) as revenue
                                from public.sales
                                where status != 'cancelled'
                                  and created_at >= now() - interval '6 months'
                                group by date_trunc('month', created_at),
                                         extract(month from created_at)
                                order by date_trunc('month', created_at)
                              ) t)
  ) into result;
  return result;
end;
$$;

-- ──────────────────────────────────────────────────────────────
-- Función: stats por vendedor (para su propio dashboard)
-- ──────────────────────────────────────────────────────────────
create or replace function public.get_seller_stats(p_seller_id uuid)
returns json language plpgsql security definer as $$
declare
  result json;
begin
  -- Validar que el que consulta es el mismo vendedor o un admin
  if auth.uid() != p_seller_id and not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select json_build_object(
    'my_products',          (select count(*) from public.products where seller_id = p_seller_id),
    'my_sales',             (select count(*) from public.sales where seller_id = p_seller_id),
    'my_revenue',           (select coalesce(sum(total_amount), 0)
                              from public.sales
                              where seller_id = p_seller_id and status != 'cancelled'),
    'my_revenue_this_month',(select coalesce(sum(total_amount), 0)
                              from public.sales
                              where seller_id = p_seller_id
                                and status != 'cancelled'
                                and created_at >= date_trunc('month', now())),
    'pending_sales',        (select count(*) from public.sales
                              where seller_id = p_seller_id and status = 'pending'),
    'printing_sales',       (select count(*) from public.sales
                              where seller_id = p_seller_id and status = 'printing')
  ) into result;
  return result;
end;
$$;

-- ──────────────────────────────────────────────────────────────
-- RLS: permitir que todos llamen get_dashboard_stats (filtra internamente)
-- ──────────────────────────────────────────────────────────────
grant execute on function public.get_dashboard_stats()       to authenticated;
grant execute on function public.get_seller_stats(uuid)      to authenticated;
grant select  on public.catalog_view                         to anon, authenticated;


-- ============================================================
-- 004_fix.sql — Corrige el error de parámetro en get_seller_stats
-- Corre esto en SQL Editor (reemplaza el 004 anterior)
-- ============================================================
 
-- 1. Eliminar funciones previas
drop function if exists public.get_dashboard_stats();
drop function if exists public.get_seller_stats(uuid);
drop view  if exists public.catalog_view;
 
-- 2. Vista del catálogo
create or replace view public.catalog_view as
select
  p.id, p.name, p.description, p.price, p.material, p.color,
  p.print_time_hrs, p.weight_grams, p.stock, p.is_available,
  p.is_customizable, p.images, p.tags, p.created_at, p.updated_at,
  p.seller_id,
  pr.full_name  as seller_name,
  p.category_id,
  c.name        as category_name,
  c.slug        as category_slug,
  c.icon        as category_icon
from public.products p
left join public.profiles  pr on pr.id = p.seller_id
left join public.categories c  on c.id  = p.category_id
where p.is_available = true;
 
-- 3. Stats admin
create function public.get_dashboard_stats()
returns json language plpgsql security definer as $$
declare result json;
begin
  select json_build_object(
    'total_products',       (select count(*) from public.products),
    'available_products',   (select count(*) from public.products where is_available = true),
    'total_sales',          (select count(*) from public.sales),
    'sales_this_month',     (select count(*) from public.sales where created_at >= date_trunc('month', now())),
    'revenue_total',        (select coalesce(sum(total_amount),0) from public.sales where status != 'cancelled'),
    'revenue_this_month',   (select coalesce(sum(total_amount),0) from public.sales where status != 'cancelled' and created_at >= date_trunc('month', now())),
    'total_sellers',        (select count(*) from public.profiles where role = 'seller' and is_active = true),
    'total_customers',      (select count(*) from public.customers),
    'sales_by_status',      (select json_agg(row_to_json(t)) from (select status, count(*) as count from public.sales group by status) t),
    'top_products',         (select json_agg(row_to_json(t)) from (select si.product_name, sum(si.quantity) as units_sold, sum(si.subtotal) as revenue from public.sale_items si group by si.product_name order by units_sold desc limit 5) t),
    'revenue_last_6_months',(select json_agg(row_to_json(t)) from (select to_char(date_trunc('month', created_at),'Mon') as month, coalesce(sum(total_amount),0) as revenue from public.sales where status != 'cancelled' and created_at >= now() - interval '6 months' group by date_trunc('month', created_at) order by date_trunc('month', created_at)) t)
  ) into result;
  return result;
end;
$$;
 
-- 4. Stats vendedor (nombre de parámetro corregido)
create function public.get_seller_stats(seller_id uuid)
returns json language plpgsql security definer as $$
declare result json;
begin
  if auth.uid() != seller_id and not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  select json_build_object(
    'my_products',           (select count(*) from public.products    where public.products.seller_id = get_seller_stats.seller_id),
    'my_sales',              (select count(*) from public.sales       where public.sales.seller_id    = get_seller_stats.seller_id),
    'my_revenue',            (select coalesce(sum(total_amount),0) from public.sales where public.sales.seller_id = get_seller_stats.seller_id and status != 'cancelled'),
    'my_revenue_this_month', (select coalesce(sum(total_amount),0) from public.sales where public.sales.seller_id = get_seller_stats.seller_id and status != 'cancelled' and created_at >= date_trunc('month', now())),
    'pending_sales',         (select count(*) from public.sales where public.sales.seller_id = get_seller_stats.seller_id and status = 'pending'),
    'printing_sales',        (select count(*) from public.sales where public.sales.seller_id = get_seller_stats.seller_id and status = 'printing')
  ) into result;
  return result;
end;
$$;
 
-- 5. Permisos
grant execute on function public.get_dashboard_stats()  to authenticated;
grant execute on function public.get_seller_stats(uuid) to authenticated;
grant select  on public.catalog_view                    to anon, authenticated;