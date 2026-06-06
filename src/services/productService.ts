// src/services/productService.ts
// Lógica de negocio para productos — no sabe nada de React

import { supabase, getImageUrl } from '../lib/supabase';
import type { Product, CreateProductDTO, CatalogFilters } from '../types';

export const productService = {
  // ── CATÁLOGO PÚBLICO ─────────────────────────────────────────

  async getCatalog(filters: CatalogFilters = {}): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug, icon),
        seller:profiles(id, full_name)
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }
    if (filters.material) {
      query = query.ilike('material', `%${filters.material}%`);
    }
    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }
    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }
    if (filters.is_customizable !== undefined) {
      query = query.eq('is_customizable', filters.is_customizable);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Error al cargar catálogo: ${error.message}`);
    return (data ?? []) as Product[];
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug, icon),
        seller:profiles(id, full_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(`Producto no encontrado: ${error.message}`);
    return data as Product | null;
  },

  // ── GESTIÓN DE PRODUCTOS (requiere auth) ──────────────────────

  async getMyProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`*, category:categories(id, name, slug, icon), seller:profiles(id, full_name)`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Product[];
  },

  async create(dto: CreateProductDTO, sellerId: string): Promise<Product> {
    const payload = {
      ...dto,
      seller_id: sellerId,
      price: Number(dto.price),
      cost: dto.cost ? Number(dto.cost) : null,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(`Error al crear producto: ${error.message}`);
    return data as Product;
  },

  async update(id: string, dto: Partial<CreateProductDTO>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar: ${error.message}`);
    return data as Product;
  },

  async toggleAvailability(id: string, is_available: boolean): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_available })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar: ${error.message}`);
  },

  // ── IMÁGENES ──────────────────────────────────────────────────

  async uploadImage(file: File, sellerId: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${sellerId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: false });

    if (error) throw new Error(`Error al subir imagen: ${error.message}`);
    return getImageUrl(path);
  },

  // ── HELPERS ───────────────────────────────────────────────────

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(price);
  },

  getMaterials(): string[] {
    return ['PLA', 'PETG', 'ABS', 'Resina', 'TPU', 'ASA', 'Nylon'];
  },
};
