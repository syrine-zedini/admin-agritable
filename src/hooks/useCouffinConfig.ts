import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CouffinConfig {
  id: string;
  name_fr: string;
  name_ar: string | null;
  name_tn: string | null;
  price_per_crate: number;
  fee_per_day_late: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * useCouffinConfig Hook - Single Standard Couffin Configuration
 *
 * PURPOSE:
 * Manages the singleton configuration for the standard reusable delivery couffin.
 *
 * IMPORTANT:
 * - Single-row table (couffin_config) with unique constraint
 * - Replaces the previous multi-row physical_crates system
 * - Only admins can update the price
 * - All authenticated users can read the config
 *
 * USAGE:
 * - Fetch the standard couffin configuration
 * - Update the price per crate
 * - Auto-invalidates related queries on update
 */
export function useCouffinConfig() {
  const queryClient = useQueryClient();

  // Fetch singleton config
  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['couffin_config'],
    queryFn: async (): Promise<CouffinConfig> => {
      const { data, error } = await supabase
        .from('couffin_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No couffin config found');

      return data as CouffinConfig;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update price
  const updatePriceMutation = useMutation({
    mutationFn: async (newPrice: number) => {
      if (!config) throw new Error('No config loaded');

      const { error } = await supabase
        .from('couffin_config')
        .update({
          price_per_crate: newPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couffin_config'] });
      queryClient.invalidateQueries({ queryKey: ['crate_inventory'] });
      queryClient.invalidateQueries({ queryKey: ['crate_transactions'] });
    },
  });

  return {
    config,
    isLoading,
    error,
    updatePrice: updatePriceMutation.mutate,
    isUpdating: updatePriceMutation.isPending,
  };
}
