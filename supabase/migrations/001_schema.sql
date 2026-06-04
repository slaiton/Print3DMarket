-- ============================================================
-- 001_schema.sql — Tablas principales
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extiende auth.users de Supabase)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null default 'seller' check (role in ('admin', 'seller')),
  phone       text,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada vendedor/admin, vinculado a auth.users';

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  icon        text,                        -- nombre de icono o emoji
  created_at  timestamptz not null default now()
);

comment on table public.categories is 'Categorías del catálogo (figuras, repuestos, decoración, etc.)';

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id              uuid primary key default uuid_generate_v4(),
  seller_id       uuid not null references public.profiles(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  name            text not null,
  description     text,
  price           numeric(12, 2) not null check (price >= 0),
  cost            numeric(12, 2) check (cost >= 0),    -- costo de producción (privado)
  material        text,                                  -- PLA, PETG, ABS, Resina, etc.
  color           text,
  print_time_hrs  numeric(5, 2),                        -- tiempo de impresión en horas
  weight_grams    numeric(7, 2),                        -- peso en gramos
  stock           integer not null default 0 check (stock >= 0),
  is_available    boolean not null default true,
  is_customizable boolean not null default false,
  images          text[] not null default '{}',         -- array de URLs de Storage
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.products is 'Catálogo de productos de impresión 3D';
comment on column public.products.cost is 'Costo de producción — solo visible para el dueño y admins';

-- ============================================================
-- CUSTOMERS (compradores, pueden ser anónimos)
-- ============================================================
create table public.customers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text,
  phone       text,
  address     text,
  notes       text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

comment on table public.customers is 'Base de clientes compartida entre vendedores';

-- ============================================================
-- SALES
-- ============================================================
create table public.sales (
  id            uuid primary key default uuid_generate_v4(),
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  customer_id   uuid references public.customers(id) on delete set null,
  status        text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'printing', 'ready', 'delivered', 'cancelled')),
  notes         text,
  total_amount  numeric(12, 2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.sales is 'Cabecera de venta';

-- ============================================================
-- SALE_ITEMS (líneas de cada venta)
-- ============================================================
create table public.sale_items (
  id            uuid primary key default uuid_generate_v4(),
  sale_id       uuid not null references public.sales(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,                -- snapshot del nombre al momento de venta
  unit_price    numeric(12, 2) not null,
  quantity      integer not null default 1 check (quantity > 0),
  subtotal      numeric(12, 2) generated always as (unit_price * quantity) stored,
  customization text,                         -- descripción de personalización si aplica
  created_at    timestamptz not null default now()
);

comment on table public.sale_items is 'Líneas de producto dentro de cada venta';

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger trg_sales_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

-- ============================================================
-- TRIGGER: recalcular total de venta al insertar/actualizar items
-- ============================================================
create or replace function public.recalculate_sale_total()
returns trigger language plpgsql as $$
begin
  update public.sales
  set total_amount = (
    select coalesce(sum(subtotal), 0)
    from public.sale_items
    where sale_id = coalesce(new.sale_id, old.sale_id)
  )
  where id = coalesce(new.sale_id, old.sale_id);
  return coalesce(new, old);
end;
$$;

create trigger trg_recalc_total_insert
  after insert on public.sale_items
  for each row execute function public.recalculate_sale_total();

create trigger trg_recalc_total_update
  after update on public.sale_items
  for each row execute function public.recalculate_sale_total();

create trigger trg_recalc_total_delete
  after delete on public.sale_items
  for each row execute function public.recalculate_sale_total();

-- ============================================================
-- TRIGGER: crear profile automáticamente al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Sin nombre'),
    coalesce(new.raw_user_meta_data->>'role', 'seller')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ÍNDICES para búsquedas frecuentes
-- ============================================================
create index idx_products_seller      on public.products(seller_id);
create index idx_products_category    on public.products(category_id);
create index idx_products_available   on public.products(is_available) where is_available = true;
create index idx_products_tags        on public.products using gin(tags);
create index idx_sales_seller         on public.sales(seller_id);
create index idx_sales_status         on public.sales(status);
create index idx_sale_items_sale      on public.sale_items(sale_id);
create index idx_sale_items_product   on public.sale_items(product_id);
