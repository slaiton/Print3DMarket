import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';
import { Product } from '../types';

export function useMyProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getMyProducts();
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { products, loading, error, reload: load };
}
