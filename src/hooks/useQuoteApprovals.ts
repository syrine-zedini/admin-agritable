import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface QuoteRequest {
  id: string;
  customer_id: string;
  status: 'quote_pending' | 'quote_modified' | 'quote_approved' | 'quote_rejected';
  total_amount: number;
  original_total_amount: number | null;
  quote_modification_notes: string | null;
  requires_customer_confirmation: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    email: string | null;
    phone: string | null;
  };
  reviewer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
  order_items?: OrderItem[];
  b2b_ledger?: {
    balance: number;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name_fr: string;
    sku: string;
    stock_quantity: number;
    b2b_selling_unit: string;
  };
}

export interface QuoteFilters {
  status?: 'quote_pending' | 'quote_modified' | 'quote_approved' | 'quote_rejected' | 'all';
  customer_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface QuoteStats {
  total: number;
  pending: number;
  modified: number;
  approved: number;
  rejected: number;
  totalValue: number;
  pendingValue: number;
  avgOrderValue: number;
  oldestPending: number; // days
}

/**
 * Hook for managing B2B quote approvals with enhanced stats, search, and batch operations
 */
export function useQuoteApprovals(filters: QuoteFilters = {}) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch quote requests
  const {
    data: quotes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['quote_requests', filters],
    queryFn: async (): Promise<QuoteRequest[]> => {
      let query = supabase
        .from('orders')
        .select(
          `
          *,
          customer:users!user_id(id, first_name, last_name, company_name, email, phone),
          reviewer:users!reviewed_by(id, first_name, last_name),
          order_items (
            id,
            order_id,
            product_id,
            quantity,
            price,
            product:products (id, name_fr, sku, stock_quantity, b2b_selling_unit)
          ),
          b2b_ledger:b2b_ledgers!user_id(balance)
        `
        )
        .in('status', ['quote_pending', 'quote_modified', 'quote_approved', 'quote_rejected'])
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data as QuoteRequest[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Client-side search filtering (instant feedback)
  const filteredQuotes = useMemo(() => {
    if (!quotes || !searchQuery) return quotes;
    const lowerQuery = searchQuery.toLowerCase();
    return quotes.filter((q) => {
      const customerName = q.customer
        ? `${q.customer.first_name || ''} ${q.customer.last_name || ''} ${q.customer.company_name || ''}`
            .toLowerCase()
        : '';
      const customerEmail = q.customer?.email?.toLowerCase() || '';
      const customerId = q.customer_id.toLowerCase();

      return (
        customerName.includes(lowerQuery) ||
        customerEmail.includes(lowerQuery) ||
        customerId.includes(lowerQuery)
      );
    });
  }, [quotes, searchQuery]);

  // Enhanced stats calculation
  const stats: QuoteStats = useMemo(() => {
    const quotesData = quotes || [];

    const pending = quotesData.filter((q) => q.status === 'quote_pending');
    const modified = quotesData.filter((q) => q.status === 'quote_modified');
    const approved = quotesData.filter((q) => q.status === 'quote_approved');
    const rejected = quotesData.filter((q) => q.status === 'quote_rejected');

    const totalValue = quotesData.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const pendingValue = pending.reduce((sum, q) => sum + (q.total_amount || 0), 0);

    const oldestPending =
      pending.length > 0
        ? Math.floor(
            (Date.now() - new Date(pending[pending.length - 1].created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

    return {
      total: quotesData.length,
      pending: pending.length,
      modified: modified.length,
      approved: approved.length,
      rejected: rejected.length,
      totalValue,
      pendingValue,
      avgOrderValue: quotesData.length > 0 ? totalValue / quotesData.length : 0,
      oldestPending,
    };
  }, [quotes]);

  // Approve quote as-is (no modifications)
  const approveAsIsMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'quote_approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', orderId);

      if (error) throw error;

      // TODO: Send notification to customer
      return { orderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote_requests'] });
    },
  });

  // Approve quote with modifications
  const approveWithModificationsMutation = useMutation({
    mutationFn: async ({
      orderId,
      modifiedItems,
      modificationNotes,
    }: {
      orderId: string;
      modifiedItems: Array<{
        id: string;
        quantity: number;
        price: number;
      }>;
      modificationNotes: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch original order to save original_total_amount
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Update order items with modified quantities and prices
      for (const item of modifiedItems) {
        const { error: itemError } = await supabase
          .from('order_items')
          .update({
            quantity: item.quantity,
            price: item.price,
          })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      // Calculate new total
      const newTotal = modifiedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

      // Update order status and metadata
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'quote_modified',
          original_total_amount: order.total_amount,
          total_amount: newTotal,
          quote_modification_notes: modificationNotes,
          requires_customer_confirmation: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // TODO: Send notification to customer
      return { orderId, newTotal };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote_requests'] });
    },
  });

  // Reject quote
  const rejectQuoteMutation = useMutation({
    mutationFn: async ({
      orderId,
      rejectionReason,
    }: {
      orderId: string;
      rejectionReason: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'quote_rejected',
          quote_modification_notes: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', orderId);

      if (error) throw error;

      // TODO: Send notification to customer
      return { orderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote_requests'] });
    },
  });

  // Update quote items (for draft edits)
  const updateQuoteItemsMutation = useMutation({
    mutationFn: async ({
      orderId,
      items,
    }: {
      orderId: string;
      items: Array<{
        id: string;
        quantity: number;
        price: number;
      }>;
    }) => {
      // Update each item
      for (const item of items) {
        const { error } = await supabase
          .from('order_items')
          .update({
            quantity: item.quantity,
            price: item.price,
          })
          .eq('id', item.id);

        if (error) throw error;
      }

      // Calculate new total
      const newTotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

      // Update order total
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          total_amount: newTotal,
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      return { orderId, newTotal };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote_requests'] });
    },
  });

  // Add item to quote
  const addItemToQuoteMutation = useMutation({
    mutationFn: async ({
      orderId,
      productId,
      quantity,
      price,
    }: {
      orderId: string;
      productId: string;
      quantity: number;
      price: number;
    }) => {
      const { data, error } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          product_id: productId,
          quantity,
          price,
        })
        .select()
        .single();

      if (error) throw error;

      // Update order total
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const newTotal = (order.total_amount || 0) + quantity * price;

      const { error: updateError } = await supabase
        .from('orders')
        .update({ total_amount: newTotal })
        .eq('id', orderId);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote_requests'] });
    },
  });

  // Remove item from quote
  const removeItemFromQuoteMutation = useMutation({
    mutationFn: async ({
      orderId,
      itemId,
      itemSubtotal,
    }: {
      orderId: string;
      itemId: string;
      itemSubtotal: number;
    }) => {
      const { error } = await supabase.from('order_items').delete().eq('id', itemId);

      if (error) throw error;

      // Update order total
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const newTotal = (order.total_amount || 0) - itemSubtotal;

      const { error: updateError } = await supabase
        .from('orders')
        .update({ total_amount: Math.max(0, newTotal) })
        .eq('id', orderId);

      if (updateError) throw updateError;

      return { itemId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote_requests'] });
    },
  });

  // Batch approve multiple quotes
  const bulkApproveMutation = useMutation({
    mutationFn: async (quoteIds: string[]) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'quote_approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .in('id', quoteIds);

      if (error) throw error;

      return { count: quoteIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote_requests'] });
      toast.success(`${data.count} quote(s) approved successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve quotes: ${error.message}`);
    },
  });

  // Batch reject multiple quotes
  const bulkRejectMutation = useMutation({
    mutationFn: async ({
      quoteIds,
      rejectionReason,
    }: {
      quoteIds: string[];
      rejectionReason: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'quote_rejected',
          quote_modification_notes: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .in('id', quoteIds);

      if (error) throw error;

      return { count: quoteIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote_requests'] });
      toast.success(`${data.count} quote(s) rejected`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject quotes: ${error.message}`);
    },
  });

  return {
    quotes: filteredQuotes || [],
    isLoading,
    error,
    stats,
    searchQuery,
    setSearchQuery,
    approveAsIs: approveAsIsMutation.mutate,
    isApprovingAsIs: approveAsIsMutation.isPending,
    approveWithModifications: approveWithModificationsMutation.mutate,
    isApprovingWithMods: approveWithModificationsMutation.isPending,
    rejectQuote: rejectQuoteMutation.mutate,
    isRejecting: rejectQuoteMutation.isPending,
    updateQuoteItems: updateQuoteItemsMutation.mutate,
    isUpdatingItems: updateQuoteItemsMutation.isPending,
    addItemToQuote: addItemToQuoteMutation.mutate,
    isAddingItem: addItemToQuoteMutation.isPending,
    removeItemFromQuote: removeItemFromQuoteMutation.mutate,
    isRemovingItem: removeItemFromQuoteMutation.isPending,
    bulkApprove: bulkApproveMutation.mutate,
    isBulkApproving: bulkApproveMutation.isPending,
    bulkReject: bulkRejectMutation.mutate,
    isBulkRejecting: bulkRejectMutation.isPending,
  };
}
