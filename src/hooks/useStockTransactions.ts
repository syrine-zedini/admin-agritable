import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface StockTransaction {
  id: string;
  product_id: string;
  quantity_change: number;
  transaction_type: 'collection' | 'order' | 'adjustment' | 'damage' | 'expiry' | 'return' | 'manual';
  reference_type: string | null;
  reference_id: string | null;
  previous_stock: number;
  new_stock: number;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
  product?: {
    id: string;
    sku: string;
    name_fr: string;
    category?: {
      name_fr: string;
    };
  };
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface StockTransactionFilters {
  product_id?: string;
  transaction_type?: StockTransaction['transaction_type'] | 'all';
  date_from?: string;
  date_to?: string;
  performed_by?: string;
}

/**
 * Hook for managing stock transactions (inventory audit trail)
 */
export function useStockTransactions(filters: StockTransactionFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch stock transactions with filters
  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['stock_transactions', filters],
    queryFn: async (): Promise<StockTransaction[]> => {
      let query = supabase
        .from('stock_transactions')
        .select(
          `
          *,
          product:products!product_id(id, sku, name_fr, category:categories(name_fr)),
          user:users!performed_by(id, first_name, last_name)
        `
        )
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters.transaction_type && filters.transaction_type !== 'all') {
        query = query.eq('transaction_type', filters.transaction_type);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.performed_by) {
        query = query.eq('performed_by', filters.performed_by);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data as StockTransaction[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Manual stock adjustment mutation
  const createManualAdjustmentMutation = useMutation({
    mutationFn: async ({
      productId,
      quantityChange,
      reason,
      notes,
    }: {
      productId: string;
      quantityChange: number;
      reason: 'adjustment' | 'damage' | 'expiry' | 'return';
      notes: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      const previousStock = product.stock_quantity || 0;
      const newStock = previousStock + quantityChange;

      // Validate that new stock is not negative
      if (newStock < 0) {
        throw new Error(`Cannot adjust stock: would result in negative stock (${newStock})`);
      }

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Create stock transaction record
      const { data, error } = await supabase
        .from('stock_transactions')
        .insert({
          product_id: productId,
          quantity_change: quantityChange,
          transaction_type: reason,
          reference_type: 'manual_adjustment',
          reference_id: null,
          previous_stock: previousStock,
          new_stock: newStock,
          notes: notes,
          performed_by: user.id,
        })
        .select(
          `
          *,
          product:products!product_id(id, sku, name_fr),
          user:users!performed_by(id, first_name, last_name)
        `
        )
        .single();

      if (error) throw error;

      return data as StockTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pricing_spreadsheet'] });
    },
  });

  // Create transaction for collection verification (called from backend)
  const logCollectionTransactionMutation = useMutation({
    mutationFn: async ({
      productId,
      collectionId,
      verifiedQuantity,
      notes,
    }: {
      productId: string;
      collectionId: string;
      verifiedQuantity: number;
      notes: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      const previousStock = product.stock_quantity || 0;
      const newStock = previousStock + verifiedQuantity;

      // Create stock transaction record
      const { data, error } = await supabase
        .from('stock_transactions')
        .insert({
          product_id: productId,
          quantity_change: verifiedQuantity,
          transaction_type: 'collection',
          reference_type: 'route_stop',
          reference_id: collectionId,
          previous_stock: previousStock,
          new_stock: newStock,
          notes: notes,
          performed_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return data as StockTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_transactions'] });
    },
  });

  // Get statistics
  const getStats = () => {
    if (!transactions) {
      return {
        total_additions: 0,
        total_deductions: 0,
        net_change: 0,
        total_transactions: 0,
        by_type: {
          collection: 0,
          order: 0,
          adjustment: 0,
          damage: 0,
          expiry: 0,
          return: 0,
          manual: 0,
        },
      };
    }

    const additions = transactions
      .filter((t) => t.quantity_change > 0)
      .reduce((sum, t) => sum + t.quantity_change, 0);

    const deductions = transactions
      .filter((t) => t.quantity_change < 0)
      .reduce((sum, t) => sum + Math.abs(t.quantity_change), 0);

    return {
      total_additions: additions,
      total_deductions: deductions,
      net_change: additions - deductions,
      total_transactions: transactions.length,
      by_type: {
        collection: transactions.filter((t) => t.transaction_type === 'collection').length,
        order: transactions.filter((t) => t.transaction_type === 'order').length,
        adjustment: transactions.filter((t) => t.transaction_type === 'adjustment').length,
        damage: transactions.filter((t) => t.transaction_type === 'damage').length,
        expiry: transactions.filter((t) => t.transaction_type === 'expiry').length,
        return: transactions.filter((t) => t.transaction_type === 'return').length,
        manual: transactions.filter((t) => t.transaction_type === 'manual').length,
      },
    };
  };

  return {
    transactions: transactions || [],
    isLoading,
    error,
    stats: getStats(),
    createManualAdjustment: createManualAdjustmentMutation.mutate,
    isCreatingAdjustment: createManualAdjustmentMutation.isPending,
    logCollectionTransaction: logCollectionTransactionMutation.mutate,
    isLoggingCollection: logCollectionTransactionMutation.isPending,
  };
}
