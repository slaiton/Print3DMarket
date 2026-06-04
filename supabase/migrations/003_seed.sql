-- ============================================================
-- 003_seed.sql — Datos de ejemplo para desarrollo
-- Ejecutar DESPUÉS de 001 y 002
-- NOTA: los productos de ejemplo usan imágenes placeholder.
--       Reemplazar con URLs reales de tu Storage.
-- ============================================================

-- Categorías base para impresión 3D
insert into public.categories (name, slug, description, icon) values
  ('Figuras y Miniaturas',  'figuras',     'Personajes, estatuillas y miniaturas coleccionables', '🗿'),
  ('Repuestos y Partes',    'repuestos',   'Piezas de reemplazo para electrodomésticos y equipos', '⚙️'),
  ('Decoración del Hogar',  'decoracion',  'Macetas, lámparas, organizadores y accesorios', '🏠'),
  ('Joyería y Accesorios',  'joyeria',     'Aretes, anillos, pulseras y colgantes', '💎'),
  ('Educación y Ciencia',   'educacion',   'Modelos anatómicos, geométricos y científicos', '🔬'),
  ('Gaming y Coleccionismo','gaming',      'Accesorios para juegos de mesa y videojuegos', '🎮'),
  ('Personalizado',         'personalizado','Diseños a pedido del cliente', '✏️')
on conflict (slug) do nothing;

-- Productos de ejemplo (sin seller_id real — se deben ajustar con un UUID de perfil real)
-- Para usarlos: reemplaza '00000000-0000-0000-0000-000000000001' con el UUID de tu usuario admin
-- Puedes obtenerlo en Supabase → Authentication → Users

/*
-- Descomenta y ajusta el UUID antes de correr:

insert into public.products
  (seller_id, category_id, name, description, price, cost, material, color,
   print_time_hrs, weight_grams, stock, is_available, is_customizable, images, tags)
values
  (
    '00000000-0000-0000-0000-000000000001',
    (select id from public.categories where slug = 'decoracion'),
    'Maceta Geométrica Hexagonal',
    'Maceta con diseño geométrico moderno, perfecta para suculentas. Incluye plato base.',
    25000, 8000, 'PLA', 'Blanco Mate',
    3.5, 85, 10, true, false,
    array['https://placehold.co/600x600/f0f0f0/333?text=Maceta+3D'],
    array['maceta', 'decoracion', 'geometrica', 'suculentas']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    (select id from public.categories where slug = 'figuras'),
    'Dragón Articulado Flexi',
    'Dragón articulado impreso en una sola pieza, sin soportes. Totalmente flexible y coleccionable.',
    45000, 12000, 'PLA', 'Negro',
    6.0, 120, 5, true, true,
    array['https://placehold.co/600x600/1a1a1a/fff?text=Dragon+3D'],
    array['dragon', 'articulado', 'flexi', 'coleccionable']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    (select id from public.categories where slug = 'repuestos'),
    'Soporte para Tablet Universal',
    'Soporte ajustable compatible con tablets de 7" a 13". Impreso en PETG para mayor resistencia.',
    35000, 9000, 'PETG', 'Gris',
    4.0, 95, 8, true, false,
    array['https://placehold.co/600x600/888/fff?text=Soporte+Tablet'],
    array['soporte', 'tablet', 'escritorio', 'petg']
  );
*/
