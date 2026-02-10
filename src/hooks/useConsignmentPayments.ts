/**
 * useConsignmentPayments Hook
 * 
 * Manages consignment payment operations:
 * - Fetching payments with filters
 * - Recording payments to suppliers
 * - Calculating supplier summaries
 * - Payment statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  ConsignmentPayment,
  ConsignmentPaymentFilters,
  ConsignmentSupplierSummary,
  ConsignmentPaymentStats,
  RecordPaymentInput,
  ConsignmentBatch,
  enrichBatch,
} from '@/types/consignment';
import { createConsignmentPaymentEntry } from '@/utils/consignment-income-statement';

export interface UseConsignmentPaymentsParams extends ConsignmentPaymentFilters {}

export function useConsignmentPayments(params: UseConsignmentPaymentsParams = {}) {
  const { supplier_id, date_from, date_to } = params;

  const [payments, setPayments] = useState<ConsignmentPayment[]>([]);
  const [supplierSummaries, setSupplierSummaries] = useState<ConsignmentSupplierSummary[]>([]);
  const [stats, setStats] = useState<ConsignmentPaymentStats>({
    total_consignment_value: 0,
    total_sold_value: 0,
    total_owed: 0,
    total_paid: 0,
    batches_count: 0,
    suppliers_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(true);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch payments with filters
  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('consignment_payments')
        .select(`
          *,
          supplier:users!supplier_id(
            id,
            first_name,
            last_name,
            company_name,
            phone,
            email,
            is_depot_vente
          )
        `)
        .order('payment_date', { ascending: false });

      if (supplier_id) {
        query = query.eq('supplier_id', supplier_id);
      }

      if (date_from) {
        query = query.gte('payment_date', date_from);
      }

      if (date_to) {
        query = query.lte('payment_date', date_to);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPayments(data || []);
    } catch (err: any) {
      console.error('Error fetching consignment payments:', err);
      setError(err);
      toast.error('Erreur lors du chargement des paiements');
    } finally {
      setIsLoading(false);
    }
  }, [supplier_id, date_from, date_to]);

  // Fetch supplier summaries and stats
  const fetchSummaries = useCallback(async () => {
    try {
      setIsLoadingSummaries(true);

      // Get all consignment batches with supplier info
      const { data: batches, error: batchesError } = await supabase
        .from('consignment_batches')
        .select(`
          *,
          supplier:users!supplier_id(
            id,
            first_name,
            last_name,
            company_name,
            phone
          )
        `)
        .neq('status', 'received'); // Only verified batches

      if (batchesError) throw batchesError;

      // Group by supplier
      const supplierMap = new Map<string, ConsignmentSupplierSummary>();
      let totalConsignmentValue = 0;
      let totalSoldValue = 0;
      let totalOwed = 0;
      let totalPaid = 0;

      for (const batch of batches || []) {
        const enrichedBatch = enrichBatch(batch);
        const supplierId = batch.supplier_id;
        const supplier = batch.supplier;

        if (!supplierMap.has(supplierId)) {
          const supplierName = supplier
            ? `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim() || supplier.company_name || 'Inconnu'
            : 'Inconnu';

          supplierMap.set(supplierId, {
            supplier_id: supplierId,
            supplier_name: supplierName,
            supplier_company: supplier?.company_name || null,
            supplier_phone: supplier?.phone || null,
            total_batches: 0,
            total_value: 0,
            total_sold_value: 0,
            total_paid: 0,
            outstanding_balance: 0,
          });
        }

        const summary = supplierMap.get(supplierId)!;
        summary.total_batches += 1;
        summary.total_value += batch.total_value;
        
        const soldValue = batch.unit_cost * batch.quantity_sold;
        summary.total_sold_value += soldValue;
        summary.total_paid += batch.amount_paid;
        summary.outstanding_balance = summary.total_sold_value - summary.total_paid;

        // Aggregate totals
        totalConsignmentValue += batch.total_value;
        totalSoldValue += soldValue;
        totalOwed += soldValue;
        totalPaid += batch.amount_paid;
      }

      const summaries = Array.from(supplierMap.values())
        .sort((a, b) => b.outstanding_balance - a.outstanding_balance);

      setSupplierSummaries(summaries);
      setStats({
        total_consignment_value: totalConsignmentValue,
        total_sold_value: totalSoldValue,
        total_owed: totalOwed - totalPaid,
        total_paid: totalPaid,
        batches_count: batches?.length || 0,
        suppliers_count: supplierMap.size,
      });
    } catch (err: any) {
      console.error('Error fetching supplier summaries:', err);
    } finally {
      setIsLoadingSummaries(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchPayments();
    fetchSummaries();
  }, [fetchPayments, fetchSummaries]);

  // Record a payment
  const recordPayment = useCallback(async (input: RecordPaymentInput): Promise<void> => {
    try {
      setIsRecordingPayment(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('consignment_payments')
        .insert({
          supplier_id: input.supplier_id,
          payment_amount: input.payment_amount,
          payment_method: input.payment_method,
          related_batch_ids: input.related_batch_ids,
          notes: input.notes || null,
          recorded_by: user.id,
        })
        .select('id')
        .single();

      if (paymentError) throw paymentError;

      // Get supplier info for income statement entry
      const { data: supplierInfo } = await supabase
        .from('users')
        .select('id, first_name, last_name, company_name')
        .eq('id', input.supplier_id)
        .single();

      const supplierName = supplierInfo
        ? `${supplierInfo.first_name || ''} ${supplierInfo.last_name || ''}`.trim() 
          || supplierInfo.company_name 
          || 'Inconnu'
        : 'Inconnu';

      // Create income statement entry for liability reduction (Task 22.3)
      if (paymentData?.id) {
        await createConsignmentPaymentEntry({
          paymentId: paymentData.id,
          supplierId: input.supplier_id,
          supplierName,
          paymentAmount: input.payment_amount,
          paymentMethod: input.payment_method,
          notes: input.notes,
        });
      }

      // Update related batches amount_paid
      let remainingPayment = input.payment_amount;

      for (const batchId of input.related_batch_ids) {
        if (remainingPayment <= 0) break;

        const { data: batch, error: batchError } = await supabase
          .from('consignment_batches')
          .select('*')
          .eq('id', batchId)
          .single();

        if (batchError || !batch) continue;

        const enrichedBatch = enrichBatch(batch);
        const outstandingBalance = enrichedBatch.outstanding_balance || 0;

        if (outstandingBalance <= 0) continue;

        const paymentForBatch = Math.min(remainingPayment, outstandingBalance);
        const newAmountPaid = batch.amount_paid + paymentForBatch;

        // Determine new status
        const newOutstanding = (batch.unit_cost * batch.quantity_sold) - newAmountPaid;
        let newStatus = batch.status;
        
        if (newOutstanding <= 0 && batch.status === 'fully_sold') {
          newStatus = 'paid';
        }

        await supabase
          .from('consignment_batches')
          .update({
            amount_paid: newAmountPaid,
            status: newStatus,
          })
          .eq('id', batchId);

        remainingPayment -= paymentForBatch;
      }

      // TODO: Send notification to supplier (Task 28)

      toast.success('Paiement enregistré avec succès');
      
      // Refresh data
      await fetchPayments();
      await fetchSummaries();
    } catch (err: any) {
      console.error('Error recording payment:', err);
      toast.error(err.message || 'Erreur lors de l\'enregistrement du paiement');
      throw err;
    } finally {
      setIsRecordingPayment(false);
    }
  }, [fetchPayments, fetchSummaries]);

  // Get batches for a supplier (for payment dialog)
  const getSupplierBatches = useCallback(async (supplierId: string): Promise<ConsignmentBatch[]> => {
    try {
      const { data, error } = await supabase
        .from('consignment_batches')
        .select(`
          *,
          product:products!product_id(
            id,
            name_fr,
            sku,
            unit
          )
        `)
        .eq('supplier_id', supplierId)
        .in('status', ['in_stock', 'partially_sold', 'fully_sold'])
        .order('received_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(enrichBatch);
    } catch (err: any) {
      console.error('Error fetching supplier batches:', err);
      return [];
    }
  }, []);

  return {
    payments,
    supplierSummaries,
    stats,
    isLoading,
    isLoadingSummaries,
    isRecordingPayment,
    error,
    recordPayment,
    getSupplierBatches,
    refetch: fetchPayments,
    refetchSummaries: fetchSummaries,
  };
}
