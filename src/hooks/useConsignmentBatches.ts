/**
 * useConsignmentBatches Hook
 * 
 * Manages consignment batch operations for the Dépôt-Vente workflow:
 * - Fetching batches with filters
 * - Creating new batches
 * - Verifying batches (moving to in_stock)
 * - Recording returns
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  ConsignmentBatch,
  ConsignmentBatchFilters,
  CreateBatchInput,
  enrichBatch,
} from '@/types/consignment';

export interface UseConsignmentBatchesParams extends ConsignmentBatchFilters {}

export function useConsignmentBatches(params: UseConsignmentBatchesParams = {}) {
  const { supplier_id, product_id, status, date_from, date_to } = params;

  const [batches, setBatches] = useState<ConsignmentBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRecordingReturn, setIsRecordingReturn] = useState(false);

  // Fetch batches with filters
  const fetchBatches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('consignment_batches')
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
          ),
          product:products!product_id(
            id,
            name_fr,
            sku,
            unit,
            price,
            stock_quantity,
            consignment_stock
          )
        `)
        .order('received_at', { ascending: false });

      // Apply filters
      if (supplier_id) {
        query = query.eq('supplier_id', supplier_id);
      }

      if (product_id) {
        query = query.eq('product_id', product_id);
      }

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      if (date_from) {
        query = query.gte('received_at', date_from);
      }

      if (date_to) {
        query = query.lte('received_at', date_to);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Enrich batches with computed fields
      const enrichedBatches = (data || []).map(enrichBatch);
      setBatches(enrichedBatches);
    } catch (err: any) {
      console.error('Error fetching consignment batches:', err);
      setError(err);
      toast.error('Erreur lors du chargement des lots de consignation');
    } finally {
      setIsLoading(false);
    }
  }, [supplier_id, product_id, status, date_from, date_to]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Create a new consignment batch
  const createBatch = useCallback(async (input: CreateBatchInput): Promise<ConsignmentBatch> => {
    try {
      setIsCreating(true);

      // Validate supplier has is_depot_vente = true
      const { data: supplier, error: supplierError } = await supabase
        .from('users')
        .select('id, is_depot_vente')
        .eq('id', input.supplier_id)
        .single();

      if (supplierError) throw new Error('Fournisseur non trouvé');
      if (!supplier.is_depot_vente) {
        throw new Error('Ce fournisseur n\'est pas activé pour le Dépôt-Vente');
      }

      // Validate product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', input.product_id)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      // Calculate total_value if not provided or verify consistency
      const calculatedTotal = input.unit_cost * input.initial_quantity;
      const totalValue = input.total_value || calculatedTotal;

      // Create the batch
      const { data: newBatch, error: createError } = await supabase
        .from('consignment_batches')
        .insert({
          supplier_id: input.supplier_id,
          product_id: input.product_id,
          initial_quantity: input.initial_quantity,
          unit: input.unit,
          unit_cost: input.unit_cost,
          total_value: totalValue,
          notes: input.notes || null,
          status: 'received',
        })
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
          ),
          product:products!product_id(
            id,
            name_fr,
            sku,
            unit,
            price,
            stock_quantity,
            consignment_stock
          )
        `)
        .single();

      if (createError) throw createError;

      toast.success('Lot de consignation créé avec succès');
      
      // Refresh the list
      await fetchBatches();

      return enrichBatch(newBatch);
    } catch (err: any) {
      console.error('Error creating consignment batch:', err);
      toast.error(err.message || 'Erreur lors de la création du lot');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [fetchBatches]);

  // Verify a batch (move to in_stock and update product consignment_stock)
  const verifyBatch = useCallback(async (batchId: string): Promise<void> => {
    try {
      setIsVerifying(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get the batch
      const { data: batch, error: batchError } = await supabase
        .from('consignment_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError || !batch) throw new Error('Lot non trouvé');
      if (batch.status !== 'received') {
        throw new Error('Ce lot a déjà été vérifié');
      }

      // Update batch status
      const { error: updateBatchError } = await supabase
        .from('consignment_batches')
        .update({
          status: 'in_stock',
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .eq('id', batchId);

      if (updateBatchError) throw updateBatchError;

      // Update product consignment_stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('consignment_stock')
        .eq('id', batch.product_id)
        .single();

      if (productError) throw productError;

      const newConsignmentStock = (product.consignment_stock || 0) + batch.initial_quantity;

      const { error: updateProductError } = await supabase
        .from('products')
        .update({ consignment_stock: newConsignmentStock })
        .eq('id', batch.product_id);

      if (updateProductError) throw updateProductError;

      // TODO: Send notification to supplier (Task 28)

      toast.success('Lot vérifié et ajouté au stock');
      await fetchBatches();
    } catch (err: any) {
      console.error('Error verifying batch:', err);
      toast.error(err.message || 'Erreur lors de la vérification du lot');
      throw err;
    } finally {
      setIsVerifying(false);
    }
  }, [fetchBatches]);

  // Record a return
  const recordReturn = useCallback(async (
    batchId: string, 
    returnQuantity: number, 
    notes?: string
  ): Promise<void> => {
    try {
      setIsRecordingReturn(true);

      // Get the batch
      const { data: batch, error: batchError } = await supabase
        .from('consignment_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError || !batch) throw new Error('Lot non trouvé');

      // Calculate remaining quantity
      const quantityRemaining = batch.initial_quantity - batch.quantity_sold - batch.quantity_returned;

      // Validate return quantity
      if (returnQuantity <= 0) {
        throw new Error('La quantité de retour doit être positive');
      }
      if (returnQuantity > quantityRemaining) {
        throw new Error(`Quantité de retour (${returnQuantity}) supérieure à la quantité disponible (${quantityRemaining})`);
      }

      // Determine new status
      const newQuantityReturned = batch.quantity_returned + returnQuantity;
      const newQuantityRemaining = batch.initial_quantity - batch.quantity_sold - newQuantityReturned;
      
      let newStatus = batch.status;
      if (newQuantityRemaining === 0) {
        newStatus = 'returned';
      } else if (newQuantityReturned > 0) {
        newStatus = 'partially_returned';
      }

      // Update batch
      const { error: updateBatchError } = await supabase
        .from('consignment_batches')
        .update({
          quantity_returned: newQuantityReturned,
          status: newStatus,
          return_date: new Date().toISOString(),
          notes: notes ? `${batch.notes || ''}\nRetour: ${notes}`.trim() : batch.notes,
        })
        .eq('id', batchId);

      if (updateBatchError) throw updateBatchError;

      // Update product consignment_stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('consignment_stock')
        .eq('id', batch.product_id)
        .single();

      if (productError) throw productError;

      const newConsignmentStock = Math.max(0, (product.consignment_stock || 0) - returnQuantity);

      const { error: updateProductError } = await supabase
        .from('products')
        .update({ consignment_stock: newConsignmentStock })
        .eq('id', batch.product_id);

      if (updateProductError) throw updateProductError;

      // TODO: Send notification to supplier (Task 28)

      toast.success('Retour enregistré avec succès');
      await fetchBatches();
    } catch (err: any) {
      console.error('Error recording return:', err);
      toast.error(err.message || 'Erreur lors de l\'enregistrement du retour');
      throw err;
    } finally {
      setIsRecordingReturn(false);
    }
  }, [fetchBatches]);

  return {
    batches,
    isLoading,
    error,
    isCreating,
    isVerifying,
    isRecordingReturn,
    createBatch,
    verifyBatch,
    recordReturn,
    refetch: fetchBatches,
  };
}
