import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type RecetteDifficulty = 'easy' | 'medium' | 'hard';

export interface RecetteItem {
  id: string;
  recette_id: string;
  product_id: string;
  quantity: number; // DECIMAL in DB, number in TS - supports fractional quantities
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

export interface Recette {
  id: string;
  name_fr: string;
  name_ar: string | null;
  name_tn: string | null;
  description_fr: string | null;
  description_ar: string | null;
  description_tn: string | null;

  // Recipe-specific fields
  servings: number;
  preparation_time_minutes: number | null;
  cooking_time_minutes: number | null;
  difficulty: RecetteDifficulty;
  instructions_fr: string | null;
  instructions_ar: string | null;
  instructions_tn: string | null;

  total_price: number;
  image_url: string | null;
  images: string[];
  is_active: boolean;
  is_available: boolean;
  stock_quantity: number;
  item_count?: number;
  items?: RecetteItem[];
  created_at: string;
  updated_at: string;
}

export interface RecetteStats {
  total_recettes: number;
  active_recettes: number;
  total_stock: number;
}

export interface CreateRecetteInput {
  name_fr: string;
  name_ar?: string;
  name_tn?: string;
  description_fr?: string;
  description_ar?: string;
  description_tn?: string;

  // Recipe-specific
  servings: number;
  preparation_time_minutes?: number;
  cooking_time_minutes?: number;
  difficulty: RecetteDifficulty;
  instructions_fr?: string;
  instructions_ar?: string;
  instructions_tn?: string;

  total_price: number;
  image_url?: string;
  images?: string[];
  items?: Array<{
    product_id: string;
    quantity: number; // Supports decimals (0.001 minimum)
    unit_price: number;
  }>;
  is_active?: boolean;
  stock_quantity?: number;
}

export interface UpdateRecetteInput extends CreateRecetteInput {
  recette_id: string;
}

export function useRecettesData() {
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [stats, setStats] = useState<RecetteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Helper function to call admin-recettes Edge Function
  const callAdminRecettesFunction = async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    queryParams?: Record<string, string>
  ) => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('Not authenticated');
    }

    const url = new URL(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-recettes`
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

  // Fetch all recettes
  const fetchRecettes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await callAdminRecettesFunction('GET');
      setRecettes(result.recettes || []);
    } catch (err: any) {
      console.error('Error fetching recettes:', err);
      setError(err);
      toast.error('Failed to load recettes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const { data: allRecettes, error: recettesError } = await supabase
        .from('recettes')
        .select('is_active, stock_quantity');

      if (recettesError) throw recettesError;

      const totalRecettes = allRecettes?.length || 0;
      const activeRecettes = allRecettes?.filter(r => r.is_active).length || 0;
      const totalStock = allRecettes?.reduce((sum, r) => sum + (r.stock_quantity || 0), 0) || 0;

      setStats({
        total_recettes: totalRecettes,
        active_recettes: activeRecettes,
        total_stock: totalStock
      });
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Create new recette
  const createRecette = async (input: CreateRecetteInput): Promise<void> => {
    try {
      const result = await callAdminRecettesFunction('POST', input);

      if (result.success) {
        toast.success('Recette created successfully');
        await fetchRecettes();
        await fetchStats();
      }
    } catch (err: any) {
      console.error('Error creating recette:', err);
      toast.error(err.message || 'Failed to create recette');
      throw err;
    }
  };

  // Update recette
  const updateRecette = async (input: UpdateRecetteInput): Promise<void> => {
    try {
      const result = await callAdminRecettesFunction('PUT', input);

      if (result.success) {
        toast.success('Recette updated successfully');
        await fetchRecettes();
        await fetchStats();
      }
    } catch (err: any) {
      console.error('Error updating recette:', err);
      toast.error(err.message || 'Failed to update recette');
      throw err;
    }
  };

  // Delete recette
  const deleteRecette = async (recetteId: string): Promise<void> => {
    try {
      const result = await callAdminRecettesFunction('DELETE', {
        recette_id: recetteId
      });

      if (result.success) {
        toast.success('Recette deleted successfully');
        await fetchRecettes();
        await fetchStats();
      }
    } catch (err: any) {
      console.error('Error deleting recette:', err);
      toast.error(err.message || 'Failed to delete recette');
      throw err;
    }
  };

  // Toggle recette active status
  const toggleRecetteStatus = async (recetteId: string, currentStatus: boolean): Promise<void> => {
    try {
      const result = await callAdminRecettesFunction('PUT', {
        recette_id: recetteId,
        is_active: !currentStatus
      });

      if (result.success) {
        toast.success(`Recette ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        await fetchRecettes();
        await fetchStats();
      }
    } catch (err: any) {
      console.error('Error toggling recette status:', err);
      toast.error(err.message || 'Failed to update recette status');
      throw err;
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchRecettes();
    fetchStats();
  }, [fetchRecettes, fetchStats]);

  return {
    recettes,
    stats,
    isLoading,
    error,
    refetch: fetchRecettes,
    refetchStats: fetchStats,
    createRecette,
    updateRecette,
    deleteRecette,
    toggleRecetteStatus
  };
}
