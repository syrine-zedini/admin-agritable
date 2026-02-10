import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CompanyCashTransaction, CompanyCashBalance, CashTag } from '@/types/cash';
import { toast } from 'sonner';

export interface CashTransactionFilters {
  type?: 'expense' | 'revenue' | 'all';
  tags?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

export function useCompanyCash(filters: CashTransactionFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch current balance
  const { data: balance } = useQuery({
    queryKey: ['company_cash_balance'],
    queryFn: async (): Promise<CompanyCashBalance> => {
      const { data, error } = await supabase
        .from('company_cash_balance')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  // Fetch transactions with filters
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['company_cash_transactions', filters],
    queryFn: async (): Promise<CompanyCashTransaction[]> => {
      let query = supabase
        .from('company_cash_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (filters.type && filters.type !== 'all') {
        query = query.eq('transaction_type', filters.type);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }

      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,paid_to.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch available tags
  const { data: availableTags } = useQuery({
    queryKey: ['cash_tags'],
    queryFn: async (): Promise<CashTag[]> => {
      const { data, error } = await supabase
        .from('cash_tags')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Add cash transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: {
      type: 'expense' | 'revenue';
      direction: 'in' | 'out';
      amount: number;
      description: string;
      tags: string[];
      payment_method?: string;
      paid_to?: string;
      notes?: string;
      receipt_url?: string;
      reference_number?: string;
    }) => {
      const { data, error } = await supabase.rpc('record_company_cash_transaction', {
        p_type: transaction.type,
        p_direction: transaction.direction,
        p_amount: transaction.amount,
        p_description: transaction.description,
        p_tags: JSON.stringify(transaction.tags),
        p_payment_method: transaction.payment_method || null,
        p_paid_to: transaction.paid_to || null,
        p_notes: transaction.notes || null,
        p_receipt_url: transaction.receipt_url || null,
        p_reference_number: transaction.reference_number || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_cash_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['company_cash_balance'] });
      toast.success('Transaction recorded successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to record transaction: ${error.message}`);
    },
  });

  // Add new tag mutation
  const addTagMutation = useMutation({
    mutationFn: async (tag: { name: string; category: 'expense' | 'revenue' | 'general'; color_hex?: string }) => {
      const { data, error } = await supabase
        .from('cash_tags')
        .insert(tag)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash_tags'] });
      toast.success('Tag added successfully');
    },
  });

  return {
    balance: balance?.current_balance || 0,
    transactions: transactions || [],
    availableTags: availableTags || [],
    isLoading,
    addTransaction: addTransactionMutation.mutate,
    isAddingTransaction: addTransactionMutation.isPending,
    addTag: addTagMutation.mutate,
  };
}
