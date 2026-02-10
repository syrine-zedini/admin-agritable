import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  sku: string;
  name_fr: string;
  name_ar: string | null;
  name_tn: string | null;
  description_fr: string | null;
  unit: string;
  price: number;
  cost_price: number | null;
  stock_quantity: number;
  min_order_quantity: number;
  max_order_quantity: number | null;
  is_featured: boolean;
  is_seasonal: boolean;
  is_active: boolean;
  is_available: boolean;
  category_id: string | null;
  category_name_fr?: string;
  images: any[];
  created_at: string;
}

export interface ProductFilters {
  searchQuery?: string;
  categoryId?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isSeasonal?: boolean;
}

export const useProductCatalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch products with optional filters
   */
  const fetchProducts = useCallback(async (filters?: ProductFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories!products_category_id_fkey (
            name_fr
          )
        `)
        .is('deleted_at', null)
        .order('name_fr', { ascending: true });

      // Apply filters
      if (filters?.searchQuery) {
        query = query.or(`name_fr.ilike.%${filters.searchQuery}%,name_ar.ilike.%${filters.searchQuery}%,name_tn.ilike.%${filters.searchQuery}%,sku.ilike.%${filters.searchQuery}%`);
      }

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.isAvailable !== undefined) {
        query = query.eq('is_available', filters.isAvailable);
      }

      if (filters?.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
      }

      if (filters?.isSeasonal !== undefined) {
        query = query.eq('is_seasonal', filters.isSeasonal);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const transformedProducts: Product[] = (data || []).map((product: any) => ({
        id: product.id,
        sku: product.sku,
        name_fr: product.name_fr,
        name_ar: product.name_ar,
        name_tn: product.name_tn,
        description_fr: product.description_fr,
        unit: product.unit,
        price: product.price,
        cost_price: product.cost_price,
        stock_quantity: product.stock_quantity || 0,
        min_order_quantity: product.min_order_quantity || 1,
        max_order_quantity: product.max_order_quantity,
        is_featured: product.is_featured || false,
        is_seasonal: product.is_seasonal || false,
        is_active: product.is_active !== false,
        is_available: product.is_available !== false,
        category_id: product.category_id,
        category_name_fr: product.categories?.name_fr,
        images: product.images || [],
        created_at: product.created_at,
      }));

      setProducts(transformedProducts);
      return transformedProducts;
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to fetch products');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch a single product by ID
   */
  const fetchProductById = useCallback(async (productId: string): Promise<Product | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          categories!products_category_id_fkey (
            name_fr
          )
        `)
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const product: Product = {
        id: data.id,
        sku: data.sku,
        name_fr: data.name_fr,
        name_ar: data.name_ar,
        name_tn: data.name_tn,
        description_fr: data.description_fr,
        unit: data.unit,
        price: data.price,
        cost_price: data.cost_price,
        stock_quantity: data.stock_quantity || 0,
        min_order_quantity: data.min_order_quantity || 1,
        max_order_quantity: data.max_order_quantity,
        is_featured: data.is_featured || false,
        is_seasonal: data.is_seasonal || false,
        is_active: data.is_active !== false,
        is_available: data.is_available !== false,
        category_id: data.category_id,
        category_name_fr: data.categories?.name_fr,
        images: data.images || [],
        created_at: data.created_at,
      };

      return product;
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to fetch product');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch products on mount
  useEffect(() => {
    fetchProducts({ isActive: true, isAvailable: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    fetchProductById,
  };
};
