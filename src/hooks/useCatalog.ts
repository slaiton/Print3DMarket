// src/hooks/useCatalog.ts
import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';
import { categoryService } from '../services/index';
import type { Product, Category, CatalogFilters } from '../types';

export function useCatalog(initialFilters: CatalogFilters = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await categoryService.getAll();
      setCategories(cats);
    } catch {
      // categorías no críticas, no bloquear
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getCatalog(filters);
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const updateFilters = useCallback((updates: Partial<CatalogFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  return {
    products,
    categories,
    filters,
    loading,
    error,
    updateFilters,
    clearFilters,
    reload: loadProducts,
  };
}

