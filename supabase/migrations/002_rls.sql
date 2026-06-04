-- ============================================================
-- 002_rls.sql — Row Level Security
-- Ejecutar DESPUÉS de 001_schema.sql
-- ============================================================

-- ============================================================
-- Habilitar RLS en todas las tablas
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.customers  enable row level security;
alter table public.sales      enable row level security;
alter table public.sale_items enable row level security;

-- ============================================================
-- Helper: saber si el usuario actual es admin
-- ============================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- PROFILES policies
-- ============================================================
-- Cualquiera puede ver perfiles activos (para el catálogo público)
create policy "profiles_select_public"
  on public.profiles for select
  using (is_active = true);

-- Cada usuario ve/edita su propio perfil; admin ve todos
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- ============================================================
-- CATEGORIES policies (solo lectura pública, escritura admin)
-- ============================================================
create policy "categories_select_all"
  on public.categories for select
  using (true);

create policy "categories_insert_admin"
  on public.categories for insert
  with check (public.is_admin());

create policy "categories_update_admin"
  on public.categories for update
  using (public.is_admin());

create policy "categories_delete_admin"
  on public.categories for delete
  using (public.is_admin());

-- ============================================================
-- PRODUCTS policies
-- ============================================================
-- Catálogo público: todos ven productos disponibles
create policy "products_select_available"
  on public.products for select
  using (is_available = true or auth.uid() = seller_id or public.is_admin());

-- Solo el vendedor dueño o admin puede crear
create policy "products_insert_seller"
  on public.products for insert
  with check (auth.uid() = seller_id or public.is_admin());

-- Solo el dueño o admin puede editar
create policy "products_update_seller"
  on public.products for update
  using (auth.uid() = seller_id or public.is_admin());

-- Solo el dueño o admin puede eliminar
create policy "products_delete_seller"
  on public.products for delete
  using (auth.uid() = seller_id or public.is_admin());

-- ============================================================
-- CUSTOMERS policies
-- ============================================================
-- Vendedores ven clientes que ellos crearon; admin ve todos
create policy "customers_select"
  on public.customers for select
  using (auth.uid() = created_by or public.is_admin());

create policy "customers_insert"
  on public.customers for insert
  with check (auth.uid() = created_by or public.is_admin());

create policy "customers_update"
  on public.customers for update
  using (auth.uid() = created_by or public.is_admin());

-- ============================================================
-- SALES policies
-- ============================================================
-- Vendedor ve sus propias ventas; admin ve todas
create policy "sales_select"
  on public.sales for select
  using (auth.uid() = seller_id or public.is_admin());

create policy "sales_insert"
  on public.sales for insert
  with check (auth.uid() = seller_id or public.is_admin());

create policy "sales_update"
  on public.sales for update
  using (auth.uid() = seller_id or public.is_admin());

-- ============================================================
-- SALE_ITEMS policies (hereda visibilidad de la venta)
-- ============================================================
create policy "sale_items_select"
  on public.sale_items for select
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id
        and (s.seller_id = auth.uid() or public.is_admin())
    )
  );

create policy "sale_items_insert"
  on public.sale_items for insert
  with check (
    exists (
      select 1 from public.sales s
      where s.id = sale_id
        and (s.seller_id = auth.uid() or public.is_admin())
    )
  );

create policy "sale_items_update"
  on public.sale_items for update
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id
        and (s.seller_id = auth.uid() or public.is_admin())
    )
  );

create policy "sale_items_delete"
  on public.sale_items for delete
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id
        and (s.seller_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================
-- STORAGE: bucket product-images
-- Crear manualmente en Supabase Dashboard → Storage
-- Nombre: product-images | Público: SÍ
-- ============================================================
-- Política para que cualquiera pueda ver imágenes
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "storage_images_select_public"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "storage_images_insert_seller"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images' and auth.role() = 'authenticated'
  );

create policy "storage_images_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
