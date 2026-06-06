-- ============================================================
-- 005_sales_seller_field.sql
-- Hace el campo seller_id de sales editable por admins,
-- corrige la política de UPDATE con WITH CHECK, añade
-- política de DELETE que faltaba, e índice en profiles(role).
-- ============================================================

-- ── Política UPDATE mejorada ─────────────────────────────────
-- USING  → qué filas se pueden seleccionar para actualizar
-- WITH CHECK → valores nuevos que se permiten guardar
-- Un seller solo puede editar sus propias ventas y no puede
-- reasignar seller_id a otro usuario; el admin puede hacer todo.

drop policy if exists "sales_update" on public.sales;

create policy "sales_update"
  on public.sales for update
  using  (auth.uid() = seller_id or public.is_admin())
  with check (
    -- seller solo puede actualizar sin cambiar seller_id
    (auth.uid() = seller_id and seller_id = (select seller_id from public.sales where id = public.sales.id))
    or public.is_admin()
  );

-- ── Política DELETE (faltaba) ────────────────────────────────
drop policy if exists "sales_delete" on public.sales;

create policy "sales_delete"
  on public.sales for delete
  using (auth.uid() = seller_id or public.is_admin());

-- ── Índice para lookup de vendedores por rol ─────────────────
create index if not exists idx_profiles_role
  on public.profiles(role)
  where is_active = true;

-- ── Comentario en columna ────────────────────────────────────
comment on column public.sales.seller_id
  is 'Vendedor responsable de la venta — asignable por admin';
