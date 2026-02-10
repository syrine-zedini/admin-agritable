import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Hook for managing pre-made basket products (couffins)
 * NOTE: This is ONLY for product baskets, NOT physical delivery containers
 * Physical crates are managed separately in usePhysicalCratesData hook
 */

export interface CouffinItem {
  id: string;
  couffin_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products?: {
    id: string;
    sku: string;
    name_fr: string;
    name_ar: string | null;
    name_tn: string | null;
    unit: string;
    price: number;
    images: string[];
  };
}

export interface Couffin {
  id: string;
  name_fr: string;
  name_ar: string | null;
  name_tn: string | null;
  description_fr: string | null;
  description_ar: string | null;
  description_tn: string | null;
  total_price: number;
  image_url: string | null;
  images: string[];
  is_active: boolean;
  is_available: boolean;
  stock_quantity: number;
  item_count?: number;
  items?: CouffinItem[];
  created_at: string;
  updated_at: string;
  discount: number
}

export interface CouffinStats {
  total_couffins: number;
  active_couffins: number;
  total_stock: number;
}

export interface CreateCouffinInput {
  name_fr: string;
  name_ar?: string;
  name_tn?: string;
  description_fr?: string;
  description_ar?: string;
  description_tn?: string;
  total_price: number;
  image_url?: string;
  images?: string[];
  items?: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
  is_active?: boolean;
  stock_quantity?: number;
  discount?: number
}

export interface UpdateCouffinInput extends CreateCouffinInput {
  couffin_id: string;
}

export function useCouffinsData() {
  const [couffins, setCouffins] = useState<Couffin[]>([]);
  const [stats, setStats] = useState<CouffinStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Helper function to call admin-couffins Edge Function
  const callAdminCouffinsFunction = async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    queryParams?: Record<string, string>
  ) => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('Not authenticated');
    }

    const url = new URL(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-couffins`
    );

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.data.session.access_token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.details || 'Request failed');
    }

    return data;
  };

  // Fetch all couffins
  const fetchCouffins = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await callAdminCouffinsFunction('GET');
      setCouffins(result.couffins || []);
    } catch (err: any) {
      console.error('Error fetching couffins:', err);
      setError(err);
      toast.error('Failed to load couffins');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const { data: allCouffins, error: couffinsError } = await supabase
        .from('couffins')
        .select('is_active, stock_quantity');

      if (couffinsError) throw couffinsError;

      const totalCouffins = allCouffins?.length || 0;
      const activeCouffins = allCouffins?.filter(c => c.is_active).length || 0;
      const totalStock = allCouffins?.reduce((sum, c) => sum + (c.stock_quantity || 0), 0) || 0;

      setStats({
        total_couffins: totalCouffins,
        active_couffins: activeCouffins,
        total_stock: totalStock
      });
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Create new couffin
  const createCouffin = async (input: CreateCouffinInput): Promise<void> => {
    try {
      const result = await callAdminCouffinsFunction('POST', input);

      if (result.success) {
        toast.success('Couffin created successfully');
        await fetchCouffins();
        await fetchStats();
      }
    } catch (err: any) {
      console.error('Error creating couffin:', err);
      toast.error(err.message || 'Failed to create couffin');
      throw err;
    }
  };

  // Update couffin
  const updateCouffin = async (input: UpdateCouffinInput): Promise<void> => {
    try {
      const result = await callAdminCouffinsFunction('PUT', input);

      if (result.success) {
        toast.success('Couffin updated successfully');
        await fetchCouffins();
        await fetchStats();
      }
    } catch (err: any) {
      console.error('Error updating couffin:', err);
      toast.error(err.message || 'Failed to update couffin');
      throw err;
    }
  };

  // Delete couffin
  const deleteCouffin = async (couffinId: string): Promise<void> => {
    try {
      const result = await callAdminCouffinsFunction('DELETE', {
        couffin_id: couffinId
      });

      if (result.success) {
        toast.success('Couffin deleted successfully');
        await fetchCouffins();
        await fetchStats();
      }
    } catch (err: any) {
      console.error('Error deleting couffin:', err);
      toast.error(err.message || 'Failed to delete couffin');
      throw err;
    }
  };

  // Toggle couffin active status
  const toggleCouffinStatus = async (couffinId: string, currentStatus: boolean): Promise<void> => {
    try {
      const result = await callAdminCouffinsFunction('PUT', {
        couffin_id: couffinId,
        is_active: !currentStatus
      });

      if (result.success) {
        toast.success(`Couffin ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        await fetchCouffins();
        await fetchStats();
      }
    } catch (err: any) {
      console.error('Error toggling couffin status:', err);
      toast.error(err.message || 'Failed to update couffin status');
      throw err;
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchCouffins();
    fetchStats();
  }, [fetchCouffins, fetchStats]);

  return {
    couffins,
    stats,
    isLoading,
    error,
    refetch: fetchCouffins,
    refetchStats: fetchStats,
    createCouffin,
    updateCouffin,
    deleteCouffin,
    toggleCouffinStatus
  };
}
