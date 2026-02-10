import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { LoyaltyConfiguration, LoyaltyProductRule, LoyaltyTier } from '@/types/loyalty';
import { toast } from 'sonner';

export function useLoyaltyConfiguration() {
  const queryClient = useQueryClient();

  // Fetch global configuration (singleton)
  const { data: configuration, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['loyalty_configuration'],
    queryFn: async (): Promise<LoyaltyConfiguration> => {
      const { data, error } = await supabase
        .from('loyalty_configuration')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch product-specific rules
  const { data: productRules, isLoading: isLoadingRules } = useQuery({
    queryKey: ['loyalty_product_rules'],
    queryFn: async (): Promise<LoyaltyProductRule[]> => {
      const { data, error } = await supabase
        .from('loyalty_product_rules')
        .select(`
          *,
          product:products(id, name_fr, sku),
          category:categories(id, name_fr)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LoyaltyProductRule[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch loyalty tiers
  const { data: tiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ['loyalty_tiers'],
    queryFn: async (): Promise<LoyaltyTier[]> => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('tier_level', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update global configuration
  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<LoyaltyConfiguration>) => {
      const { data, error } = await supabase
        .from('loyalty_configuration')
        .update(updates)
        .eq('id', configuration!.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty_configuration'] });
      toast.success('Configuration updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update configuration: ${error.message}`);
    },
  });

  // Create product rule
  const createProductRuleMutation = useMutation({
    mutationFn: async (rule: Omit<LoyaltyProductRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('loyalty_product_rules')
        .insert(rule)
        .select(`
          *,
          product:products(id, name_fr, sku),
          category:categories(id, name_fr)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty_product_rules'] });
      toast.success('Product rule created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });

  // Update product rule
  const updateProductRuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LoyaltyProductRule> }) => {
      const { data, error } = await supabase
        .from('loyalty_product_rules')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          product:products(id, name_fr, sku),
          category:categories(id, name_fr)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty_product_rules'] });
      toast.success('Product rule updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update rule: ${error.message}`);
    },
  });

  // Delete product rule
  const deleteProductRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loyalty_product_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty_product_rules'] });
      toast.success('Product rule deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete rule: ${error.message}`);
    },
  });

  // Create tier
  const createTierMutation = useMutation({
    mutationFn: async (tier: Omit<LoyaltyTier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .insert(tier)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty_tiers'] });
      toast.success('Tier created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create tier: ${error.message}`);
    },
  });

  // Update tier
  const updateTierMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LoyaltyTier> }) => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty_tiers'] });
      toast.success('Tier updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update tier: ${error.message}`);
    },
  });

  // Delete tier
  const deleteTierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loyalty_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty_tiers'] });
      toast.success('Tier deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete tier: ${error.message}`);
    },
  });

  return {
    // Data
    configuration,
    productRules: productRules || [],
    tiers: tiers || [],

    // Loading states
    isLoading: isLoadingConfig || isLoadingRules || isLoadingTiers,

    // Mutations
    updateConfiguration: updateConfigMutation.mutate,
    createProductRule: createProductRuleMutation.mutate,
    updateProductRule: updateProductRuleMutation.mutate,
    deleteProductRule: deleteProductRuleMutation.mutate,
    createTier: createTierMutation.mutate,
    updateTier: updateTierMutation.mutate,
    deleteTier: deleteTierMutation.mutate,

    // Mutation states
    isUpdatingConfig: updateConfigMutation.isPending,
    isCreatingRule: createProductRuleMutation.isPending,
    isUpdatingRule: updateProductRuleMutation.isPending,
    isDeletingRule: deleteProductRuleMutation.isPending,
    isCreatingTier: createTierMutation.isPending,
    isUpdatingTier: updateTierMutation.isPending,
    isDeletingTier: deleteTierMutation.isPending,
  };
}
