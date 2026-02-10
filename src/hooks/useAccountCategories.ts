/**
 * useAccountCategories Hook
 * 
 * React Query hook for managing account categories in the income statement system
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type {
  AccountCategory,
  CreateAccountCategoryInput,
  UpdateAccountCategoryInput,
} from '@/types/income-statement';

const QUERY_KEY = 'account_categories';

export function useAccountCategories() {
  const queryClient = useQueryClient();

  // Fetch all active account categories ordered by sort_order
  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<AccountCategory[]> => {
      const { data, error } = await supabase
        .from('account_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add new category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (input: CreateAccountCategoryInput): Promise<AccountCategory> => {
      const { data, error } = await supabase
        .from('account_categories')
        .insert({
          name: input.name,
          type: input.type,
          color_hex: input.color_hex || null,
          icon: input.icon || null,
          sort_order: input.sort_order || 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Account category created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAccountCategoryInput;
    }): Promise<AccountCategory> => {
      const { data, error } = await supabase
        .from('account_categories')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Account category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });

  // Delete (soft delete by setting is_active = false) mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('account_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Account category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });

  return {
    categories,
    isLoading,
    error: error as Error | null,
    refetch,
    addCategory: (input: CreateAccountCategoryInput) => addCategoryMutation.mutateAsync(input),
    updateCategory: (id: string, input: UpdateAccountCategoryInput) =>
      updateCategoryMutation.mutateAsync({ id, input }),
    deleteCategory: (id: string) => deleteCategoryMutation.mutateAsync(id),
    isAddingCategory: addCategoryMutation.isPending,
    isUpdatingCategory: updateCategoryMutation.isPending,
    isDeletingCategory: deleteCategoryMutation.isPending,
  };
}
