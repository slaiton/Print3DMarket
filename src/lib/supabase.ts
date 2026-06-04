// src/lib/supabase.ts
// Cliente Supabase — único punto de contacto con el BaaS

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY\n' +
    'Copia .env.example a .env y completa con tus keys de Supabase.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper para obtener URL pública de imagen en Storage
export function getImageUrl(path: string): string {
  if (!path) return '/placeholder-product.png';
  // Si ya es URL completa (http/https), devolverla directamente
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
