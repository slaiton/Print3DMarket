-- ============================================================
-- 006_set_admin_role.sql
-- Convierte el/los usuarios existentes en administradores.
-- Ejecutar una sola vez en el proyecto inicial.
-- ============================================================

-- 1. Actualiza todos los perfiles actuales a admin
--    (en este punto solo existe el usuario fundador)
update public.profiles
set role = 'admin'
where true;

-- 2. Asegura que futuros invitados sigan siendo 'seller' por defecto
--    (el CHECK constraint ya lo garantiza; el default ya es 'seller')

-- 3. Confirma el cambio
do $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.profiles where role = 'admin';
  raise notice '% perfil(es) configurado(s) como admin', cnt;
end;
$$;
