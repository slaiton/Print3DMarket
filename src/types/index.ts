// src/types/index.ts
// Interfaces que reflejan exactamente las tablas de Supabase

export type UserRole = 'admin' | 'seller';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;        // solo visible al dueño/admin
  material: string | null;
  color: string | null;
  print_time_hrs: number | null;
  weight_grams: number | null;
  stock: number;
  is_available: boolean;
  is_customizable: boolean;
  images: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joins opcionales
  category?: Category;
  seller?: Pick<Profile, 'id' | 'full_name'>;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type SaleStatus = 'pending' | 'confirmed' | 'printing' | 'ready' | 'delivered' | 'cancelled';

export interface Sale {
  id: string;
  seller_id: string;
  customer_id: string | null;
  status: SaleStatus;
  notes: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
  // Joins opcionales
  customer?: Customer;
  seller?: Pick<Profile, 'id' | 'full_name'>;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  customization: string | null;
  created_at: string;
  // Join opcional
  product?: Product;
}

// DTOs para crear/actualizar
export interface CreateProductDTO {
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  material?: string;
  color?: string;
  print_time_hrs?: number;
  weight_grams?: number;
  stock?: number;
  is_available?: boolean;
  is_customizable?: boolean;
  images?: string[];
  tags?: string[];
}

export interface CreateSaleDTO {
  customer_id?: string;
  notes?: string;
  items: {
    product_id?: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    customization?: string;
  }[];
}

// Filtros para el catálogo público
export interface CatalogFilters {
  category_id?: string;
  search?: string;
  material?: string;
  min_price?: number;
  max_price?: number;
  is_customizable?: boolean;
}
