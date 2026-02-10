import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SupplierPayment {
  id: string;
  collection_id: string;
  supplier_id: string;
  amount_owed: number;
  amount_paid: number;
  payment_status: 'pending' | 'partial' | 'paid';
  payment_method?: 'cash' | 'bank_transfer' | 'check';
  payment_date?: string;
  payment_notes?: string;
  verified_at: string;
  supplier?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    phone: string | null;
  };
  collection?: {
    id: string;
    collection_products: {
      product_name: string;
      unit: string;
    }[];
    admin_verification: {
      verified_quantity: number;
      payment_amount: number;
    };
  };
}

export interface SupplierPaymentSummary {
  supplier_id: string;
  supplier_name: string;
  supplier_company: string | null;
  supplier_phone: string | null;
  total_owed: number;
  total_paid: number;
  outstanding_balance: number;
  collection_count: number;
}

export interface SupplierPaymentsFilters {
  supplier_id?: string;
  payment_status?: 'pending' | 'partial' | 'paid' | 'all';
  date_from?: string;
  date_to?: string;
}

/**
 * Hook for managing supplier payments (tracking and recording payments for verified collections)
 */
export function useSupplierPayments(filters: SupplierPaymentsFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch supplier payments (from verified collections)
  const {
    data: payments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['supplier_payments', filters],
    queryFn: async (): Promise<SupplierPayment[]> => {
      let query = supabase
        .from('route_stops')
        .select(
          `
          *,
          supplier:users!supplier_id(id, first_name, last_name, company_name, phone)
        `
        )
        .eq('stop_type', 'collection')
        .eq('collection_status', 'verified')
        .not('admin_verification', 'is', null)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      if (filters.date_from) {
        query = query.gte('updated_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('updated_at', filters.date_to);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data into SupplierPayment format
      const transformedPayments: SupplierPayment[] = data.map((collection: any) => {
        const adminVerification = collection.admin_verification;
        const amountOwed = adminVerification.payment_amount || 0;
        const amountPaid = collection.payment_amount_paid || 0;

        let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
        if (amountPaid >= amountOwed) {
          paymentStatus = 'paid';
        } else if (amountPaid > 0) {
          paymentStatus = 'partial';
        }

        return {
          id: collection.id,
          collection_id: collection.id,
          supplier_id: collection.supplier_id,
          amount_owed: amountOwed,
          amount_paid: amountPaid,
          payment_status: paymentStatus,
          payment_method: collection.payment_method,
          payment_date: collection.payment_date,
          payment_notes: collection.payment_notes,
          verified_at: adminVerification.verified_at,
          supplier: collection.supplier,
          collection: {
            id: collection.id,
            collection_products: collection.collection_products,
            admin_verification: adminVerification,
          },
        };
      });

      // Apply payment status filter
      if (filters.payment_status && filters.payment_status !== 'all') {
        return transformedPayments.filter((p) => p.payment_status === filters.payment_status);
      }

      return transformedPayments;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch supplier payment summaries (aggregated by supplier)
  const {
    data: supplierSummaries,
    isLoading: isLoadingSummaries,
  } = useQuery({
    queryKey: ['supplier_payment_summaries'],
    queryFn: async (): Promise<SupplierPaymentSummary[]> => {
      const { data, error } = await supabase
        .from('route_stops')
        .select(
          `
          supplier_id,
          admin_verification,
          payment_amount_paid,
          supplier:users!supplier_id(id, first_name, last_name, company_name, phone)
        `
        )
        .eq('stop_type', 'collection')
        .eq('collection_status', 'verified')
        .not('admin_verification', 'is', null);

      if (error) throw error;

      // Group by supplier
      const supplierMap = new Map<string, SupplierPaymentSummary>();

      data.forEach((collection: any) => {
        const supplierId = collection.supplier_id;
        const amountOwed = collection.admin_verification?.payment_amount || 0;
        const amountPaid = collection.payment_amount_paid || 0;

        if (!supplierMap.has(supplierId)) {
          const supplier = collection.supplier;
          const supplierName = `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim() || 'Unknown';

          supplierMap.set(supplierId, {
            supplier_id: supplierId,
            supplier_name: supplierName,
            supplier_company: supplier.company_name,
            supplier_phone: supplier.phone,
            total_owed: 0,
            total_paid: 0,
            outstanding_balance: 0,
            collection_count: 0,
          });
        }

        const summary = supplierMap.get(supplierId)!;
        summary.total_owed += amountOwed;
        summary.total_paid += amountPaid;
        summary.outstanding_balance = summary.total_owed - summary.total_paid;
        summary.collection_count += 1;
      });

      return Array.from(supplierMap.values()).sort(
        (a, b) => b.outstanding_balance - a.outstanding_balance
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async ({
      collectionId,
      paymentAmount,
      paymentMethod,
      paymentNotes,
    }: {
      collectionId: string;
      paymentAmount: number;
      paymentMethod: 'cash' | 'bank_transfer' | 'check';
      paymentNotes?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch current collection to get current payment amount
      const { data: collection, error: fetchError } = await supabase
        .from('route_stops')
        .select('payment_amount_paid, admin_verification')
        .eq('id', collectionId)
        .single();

      if (fetchError) throw fetchError;

      const currentPaid = collection.payment_amount_paid || 0;
      const newTotalPaid = currentPaid + paymentAmount;

      const { error } = await supabase
        .from('route_stops')
        .update({
          payment_amount_paid: newTotalPaid,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          payment_notes: paymentNotes || null,
        })
        .eq('id', collectionId);

      if (error) throw error;

      return { collectionId, newTotalPaid };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_payments'] });
      queryClient.invalidateQueries({ queryKey: ['supplier_payment_summaries'] });
    },
  });

  // Get statistics
  const getStats = () => {
    if (!payments) return { pending: 0, partial: 0, paid: 0, total: 0, totalOwed: 0, totalPaid: 0, outstanding: 0 };

    const pending = payments.filter((p) => p.payment_status === 'pending').length;
    const partial = payments.filter((p) => p.payment_status === 'partial').length;
    const paid = payments.filter((p) => p.payment_status === 'paid').length;

    const totalOwed = payments.reduce((sum, p) => sum + p.amount_owed, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);
    const outstanding = totalOwed - totalPaid;

    return {
      pending,
      partial,
      paid,
      total: payments.length,
      totalOwed,
      totalPaid,
      outstanding,
    };
  };

  return {
    payments: payments || [],
    supplierSummaries: supplierSummaries || [],
    isLoading,
    isLoadingSummaries,
    error,
    stats: getStats(),
    recordPayment: recordPaymentMutation.mutate,
    isRecordingPayment: recordPaymentMutation.isPending,
  };
}
