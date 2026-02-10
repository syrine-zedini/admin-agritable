import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PhysicalCrate {
  id: string;
  name_fr: string;
  name_ar: string | null;
  name_tn: string | null;
  description_fr: string | null;
  description_ar: string | null;
  description_tn: string | null;
  price_per_crate: number;
  fee_per_day_late: number;
  capacity_liters: number | null;
  dimensions_cm: string | null;
  is_active: boolean;
  total_inventory: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePhysicalCrateInput {
  name_fr: string;
  name_ar?: string;
  name_tn?: string;
  description_fr?: string;
  description_ar?: string;
  description_tn?: string;
  price_per_crate: number;
  fee_per_day_late?: number;
  capacity_liters?: number;
  dimensions_cm?: string;
  is_active?: boolean;
  total_inventory?: number;
}

export interface UpdatePhysicalCrateInput extends Partial<CreatePhysicalCrateInput> {
  id: string;
}

export interface PhysicalCratesFilters {
  is_active?: boolean;
  search?: string;
}

/**
 * Hook for managing physical crate types
 * Physical crates are reusable delivery containers (NOT product baskets)
 */
export function usePhysicalCratesData(filters: PhysicalCratesFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch all physical crate types
  const {
    data: crates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['physical_crates', filters],
    queryFn: async (): Promise<PhysicalCrate[]> => {
      let query = supabase
        .from('physical_crates')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.search) {
        query = query.or(
          `name_fr.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%,name_tn.ilike.%${filters.search}%`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data as PhysicalCrate[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get statistics
  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['physical_crates_stats'],
    queryFn: async () => {
      const { data: allCrates, error: cratesError } = await supabase
        .from('physical_crates')
        .select('is_active, total_inventory');

      if (cratesError) throw cratesError;

      const activeCrates = allCrates?.filter((c) => c.is_active).length || 0;
      const inactiveCrates = allCrates?.filter((c) => !c.is_active).length || 0;
      const totalInventory = allCrates?.reduce((sum, c) => sum + (c.total_inventory || 0), 0) || 0;

      return {
        total: allCrates?.length || 0,
        active: activeCrates,
        inactive: inactiveCrates,
        totalInventory,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  // Create new physical crate type
  const createCrateMutation = useMutation({
    mutationFn: async (input: CreatePhysicalCrateInput) => {
      const { data, error } = await supabase
        .from('physical_crates')
        .insert({
          name_fr: input.name_fr,
          name_ar: input.name_ar,
          name_tn: input.name_tn,
          description_fr: input.description_fr,
          description_ar: input.description_ar,
          description_tn: input.description_tn,
          price_per_crate: input.price_per_crate,
          fee_per_day_late: input.fee_per_day_late || 0,
          capacity_liters: input.capacity_liters,
          dimensions_cm: input.dimensions_cm,
          is_active: input.is_active ?? true,
          total_inventory: input.total_inventory || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical_crates'] });
      queryClient.invalidateQueries({ queryKey: ['physical_crates_stats'] });
    },
  });

  // Update existing physical crate type
  const updateCrateMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdatePhysicalCrateInput) => {
      const { data, error } = await supabase
        .from('physical_crates')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical_crates'] });
      queryClient.invalidateQueries({ queryKey: ['physical_crates_stats'] });
    },
  });

  // Delete (or deactivate) physical crate type
  const deleteCrateMutation = useMutation({
    mutationFn: async (crateId: string) => {
      // Soft delete by setting is_active to false
      const { data, error } = await supabase
        .from('physical_crates')
        .update({ is_active: false })
        .eq('id', crateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical_crates'] });
      queryClient.invalidateQueries({ queryKey: ['physical_crates_stats'] });
    },
  });

  // Reactivate physical crate type
  const reactivateCrateMutation = useMutation({
    mutationFn: async (crateId: string) => {
      const { data, error } = await supabase
        .from('physical_crates')
        .update({ is_active: true })
        .eq('id', crateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical_crates'] });
      queryClient.invalidateQueries({ queryKey: ['physical_crates_stats'] });
    },
  });

  return {
    crates: crates || [],
    isLoading,
    error,
    stats: stats || { total: 0, active: 0, inactive: 0, totalInventory: 0 },
    isLoadingStats,
    createCrate: createCrateMutation.mutate,
    isCreating: createCrateMutation.isPending,
    updateCrate: updateCrateMutation.mutate,
    isUpdating: updateCrateMutation.isPending,
    deleteCrate: deleteCrateMutation.mutate,
    isDeleting: deleteCrateMutation.isPending,
    reactivateCrate: reactivateCrateMutation.mutate,
    isReactivating: reactivateCrateMutation.isPending,
  };
}
