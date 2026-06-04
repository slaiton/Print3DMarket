// src/services/authService.ts
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'seller' } },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Credenciales incorrectas');
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return null;
    return data as Profile;
  },

  async updateProfile(updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw new Error(error.message);
  },
};

// ============================================================
// src/services/saleService.ts
// ============================================================
import type { Sale, CreateSaleDTO } from '../types';

export const saleService = {
  async getMySales(): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customer:customers(id, name, phone),
        items:sale_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Sale[];
  },

  async create(dto: CreateSaleDTO, sellerId: string): Promise<Sale> {
    // 1. Crear cabecera de venta
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        seller_id: sellerId,
        customer_id: dto.customer_id ?? null,
        notes: dto.notes ?? null,
      })
      .select()
      .single();

    if (saleError) throw new Error(`Error al crear venta: ${saleError.message}`);

    // 2. Insertar líneas
    const items = dto.items.map(item => ({
      sale_id: sale.id,
      product_id: item.product_id ?? null,
      product_name: item.product_name,
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      customization: item.customization ?? null,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(items);
    if (itemsError) throw new Error(`Error al guardar items: ${itemsError.message}`);

    return sale as Sale;
  },

  async updateStatus(id: string, status: Sale['status']): Promise<void> {
    const { error } = await supabase
      .from('sales')
      .update({ status })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  getStatusLabel(status: Sale['status']): string {
    const labels: Record<Sale['status'], string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      printing: 'Imprimiendo',
      ready: 'Lista',
      delivered: 'Entregada',
      cancelled: 'Cancelada',
    };
    return labels[status];
  },
};

// ============================================================
// src/services/categoryService.ts
// ============================================================
import type { Category } from '../types';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw new Error(error.message);
    return (data ?? []) as Category[];
  },
};
