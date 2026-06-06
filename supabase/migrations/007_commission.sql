-- ============================================================
-- 007_commission.sql
-- Agrega porcentaje de comisión por vendedor y funciones
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 1. Columna commission_pct en profiles ─────────────────────
alter table public.profiles
  add column if not exists commission_pct numeric(5,2) not null default 0
    check (commission_pct >= 0 and commission_pct <= 100);

comment on column public.profiles.commission_pct
  is '% de comisión del vendedor sobre sus ventas (0-100)';

-- ── 2. Recrear get_seller_stats con comisión incluida ─────────
drop function if exists public.get_seller_stats(uuid);

create function public.get_seller_stats(seller_id uuid)
returns json language plpgsql security definer as $$
declare result json;
begin
  if auth.uid() != seller_id and not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select json_build_object(
    'my_products',
      (select count(*) from public.products
        where public.products.seller_id = get_seller_stats.seller_id),
    'my_sales',
      (select count(*) from public.sales
        where public.sales.seller_id = get_seller_stats.seller_id),
    'my_revenue',
      (select coalesce(sum(total_amount), 0) from public.sales
        where public.sales.seller_id = get_seller_stats.seller_id
          and status != 'cancelled'),
    'my_revenue_this_month',
      (select coalesce(sum(total_amount), 0) from public.sales
        where public.sales.seller_id = get_seller_stats.seller_id
          and status != 'cancelled'
          and created_at >= date_trunc('month', now())),
    'pending_sales',
      (select count(*) from public.sales
        where public.sales.seller_id = get_seller_stats.seller_id
          and status = 'pending'),
    'printing_sales',
      (select count(*) from public.sales
        where public.sales.seller_id = get_seller_stats.seller_id
          and status = 'printing'),
    'commission_pct',
      (select commission_pct from public.profiles
        where id = get_seller_stats.seller_id),
    'my_commission',
      (select coalesce(sum(total_amount), 0)
             * (select commission_pct from public.profiles where id = get_seller_stats.seller_id)
             / 100
        from public.sales
        where public.sales.seller_id = get_seller_stats.seller_id
          and status != 'cancelled')
  ) into result;

  return result;
end;
$$;

grant execute on function public.get_seller_stats(uuid) to authenticated;

-- ── 3. Función: comisiones de todos los vendedores (solo admin) ─
create or replace function public.get_seller_commissions()
returns json language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  return (
    select coalesce(json_agg(row_to_json(t)), '[]'::json)
    from (
      select
        p.id,
        p.full_name,
        p.commission_pct,
        p.is_active,
        coalesce(
          sum(s.total_amount) filter (where s.status != 'cancelled'), 0
        ) as revenue,
        coalesce(
          sum(s.total_amount) filter (where s.status != 'cancelled'), 0
        ) * p.commission_pct / 100 as commission
      from public.profiles p
      left join public.sales s on s.seller_id = p.id
      where p.role = 'seller'
      group by p.id, p.full_name, p.commission_pct, p.is_active
      order by commission desc, p.full_name
    ) t
  );
end;
$$;

grant execute on function public.get_seller_commissions() to authenticated;
