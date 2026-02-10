/**
 * useStockAttribution Hook
 * 
 * Manages stock attribution for sales:
 * - Configurable priority (owned first vs consignment first)
 * - FIFO attribution for consignment batches
 * - Manual attribution override
 * - Profit calculation
 */

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  AttributionConfig,
  ConsignmentAttribution,
  OverrideAttributionInput,
  ConsignmentBatch,
} from '@/types/consignment';
import { createConsignmentSaleEntries } from '@/utils/consignment-income-statement';

export function useStockAttribution() {
  // Get attribution configuration
  const getAttributionConfig = useCallback(async (): Promise<AttributionConfig> => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'stock_attribution_priority')
        .single();

      if (error || !data) {
        // Return default if not found
        return { priority: 'owned_first' };
      }

      return data.value as AttributionConfig;
    } catch (err) {
      console.error('Error fetching attribution config:', err);
      return { priority: 'owned_first' };
    }
  }, []);

  // Update attribution configuration
  const updateAttributionConfig = useCallback(async (config: AttributionConfig): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('system_config')
        .upsert({
          key: 'stock_attribution_priority',
          value: config,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      toast.success('Configuration de l\'attribution mise à jour');
    } catch (err: any) {
      console.error('Error updating attribution config:', err);
      toast.error(err.message || 'Erreur lors de la mise à jour de la configuration');
      throw err;
    }
  }, []);

  // Attribute a sale to stock sources
  const attributeSale = useCallback(async (
    orderId: string,
    productId: string,
    quantity: number,
    sellingPrice: number,
    orderItemId?: string
  ): Promise<ConsignmentAttribution[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get attribution config
      const config = await getAttributionConfig();
      const ownedFirst = config.priority === 'owned_first';

      // Get product stock info
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, consignment_stock')
        .eq('id', productId)
        .single();

      if (productError || !product) throw new Error('Produit non trouvé');

      // Calculate owned stock (total - consignment)
      const ownedStock = (product.stock_quantity || 0) - (product.consignment_stock || 0);
      const consignmentStock = product.consignment_stock || 0;

      // Get available consignment batches (FIFO order)
      const { data: batches, error: batchesError } = await supabase
        .from('consignment_batches')
        .select('*')
        .eq('product_id', productId)
        .in('status', ['in_stock', 'partially_sold'])
        .order('received_at', { ascending: true });

      if (batchesError) throw batchesError;

      const attributions: ConsignmentAttribution[] = [];
      let remainingQuantity = quantity;

      // Helper to create attribution record
      const createAttribution = async (
        sourceType: 'owned' | 'consignment',
        qty: number,
        batchId?: string,
        unitCost?: number
      ) => {
        const supplierPortion = sourceType === 'consignment' && unitCost ? unitCost * qty : null;
        const agritableProfit = sourceType === 'consignment' && unitCost 
          ? (sellingPrice - unitCost) * qty 
          : sellingPrice * qty;

        const { data: attribution, error: attrError } = await supabase
          .from('consignment_attributions')
          .insert({
            order_id: orderId,
            order_item_id: orderItemId || null,
            product_id: productId,
            source_type: sourceType,
            consignment_batch_id: batchId || null,
            quantity: qty,
            unit_cost: unitCost || null,
            supplier_portion: supplierPortion,
            agritable_profit: agritableProfit,
            created_by: user.id,
          })
          .select()
          .single();

        if (attrError) throw attrError;
        return attribution;
      };

      // Helper to deduct from owned stock
      const deductFromOwned = async (qty: number) => {
        const attr = await createAttribution('owned', qty);
        attributions.push(attr);
        remainingQuantity -= qty;
      };

      // Helper to deduct from consignment (FIFO)
      const deductFromConsignment = async (qty: number) => {
        let qtyToDeduct = qty;

        for (const batch of batches || []) {
          if (qtyToDeduct <= 0) break;

          const batchRemaining = batch.initial_quantity - batch.quantity_sold - batch.quantity_returned;
          if (batchRemaining <= 0) continue;

          const deductQty = Math.min(qtyToDeduct, batchRemaining);

          // Create attribution
          const attr = await createAttribution('consignment', deductQty, batch.id, batch.unit_cost);
          attributions.push(attr);

          // Update batch quantity_sold
          const newQuantitySold = batch.quantity_sold + deductQty;
          const newStatus = newQuantitySold >= batch.initial_quantity - batch.quantity_returned 
            ? 'fully_sold' 
            : 'partially_sold';

          await supabase
            .from('consignment_batches')
            .update({
              quantity_sold: newQuantitySold,
              status: newStatus,
            })
            .eq('id', batch.id);

          qtyToDeduct -= deductQty;
          remainingQuantity -= deductQty;
        }
      };

      // Apply attribution based on priority
      if (ownedFirst) {
        // Deduct from owned first
        if (ownedStock > 0 && remainingQuantity > 0) {
          const fromOwned = Math.min(ownedStock, remainingQuantity);
          await deductFromOwned(fromOwned);
        }
        // Then from consignment
        if (remainingQuantity > 0 && consignmentStock > 0) {
          await deductFromConsignment(remainingQuantity);
        }
      } else {
        // Deduct from consignment first
        if (consignmentStock > 0 && remainingQuantity > 0) {
          await deductFromConsignment(Math.min(consignmentStock, remainingQuantity));
        }
        // Then from owned
        if (remainingQuantity > 0 && ownedStock > 0) {
          const fromOwned = Math.min(ownedStock, remainingQuantity);
          await deductFromOwned(fromOwned);
        }
      }

      // Update product stock quantities
      const totalFromOwned = attributions
        .filter(a => a.source_type === 'owned')
        .reduce((sum, a) => sum + a.quantity, 0);
      const totalFromConsignment = attributions
        .filter(a => a.source_type === 'consignment')
        .reduce((sum, a) => sum + a.quantity, 0);

      await supabase
        .from('products')
        .update({
          stock_quantity: product.stock_quantity - totalFromOwned - totalFromConsignment,
          consignment_stock: product.consignment_stock - totalFromConsignment,
        })
        .eq('id', productId);

      // Create income statement entries for consignment sales (Task 22)
      const consignmentAttributions = attributions.filter(a => a.source_type === 'consignment');
      for (const attr of consignmentAttributions) {
        if (attr.consignment_batch_id && attr.supplier_portion && attr.agritable_profit) {
          // Get batch and supplier info
          const { data: batchInfo } = await supabase
            .from('consignment_batches')
            .select(`
              *,
              supplier:users!supplier_id(id, first_name, last_name, company_name),
              product:products!product_id(id, name_fr)
            `)
            .eq('id', attr.consignment_batch_id)
            .single();

          if (batchInfo) {
            const supplierName = batchInfo.supplier
              ? `${batchInfo.supplier.first_name || ''} ${batchInfo.supplier.last_name || ''}`.trim() 
                || batchInfo.supplier.company_name 
                || 'Inconnu'
              : 'Inconnu';

            // Get order number for reference
            const { data: orderInfo } = await supabase
              .from('orders')
              .select('order_number')
              .eq('id', orderId)
              .single();

            await createConsignmentSaleEntries({
              orderId,
              orderNumber: orderInfo?.order_number,
              productId,
              productName: batchInfo.product?.name_fr || 'Produit',
              supplierId: batchInfo.supplier_id,
              supplierName,
              quantity: attr.quantity,
              unitCost: attr.unit_cost || 0,
              sellingPrice,
              agritableProfit: attr.agritable_profit,
              supplierPortion: attr.supplier_portion,
            });
          }
        }
      }

      return attributions;
    } catch (err: any) {
      console.error('Error attributing sale:', err);
      toast.error(err.message || 'Erreur lors de l\'attribution de la vente');
      throw err;
    }
  }, [getAttributionConfig]);

  // Override attribution for an order
  const overrideAttribution = useCallback(async (input: OverrideAttributionInput): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get existing attributions for this order
      const { data: existingAttributions, error: fetchError } = await supabase
        .from('consignment_attributions')
        .select('*')
        .eq('order_id', input.order_id)
        .eq('is_override', false);

      if (fetchError) throw fetchError;

      // Validate total quantity matches
      const existingTotal = existingAttributions?.reduce((sum, a) => sum + a.quantity, 0) || 0;
      const newTotal = input.attributions.reduce((sum, a) => sum + a.quantity, 0);

      if (Math.abs(existingTotal - newTotal) > 0.01) {
        throw new Error('La quantité totale doit correspondre à l\'attribution originale');
      }

      // Reverse the effects of existing attributions on batches
      for (const attr of existingAttributions || []) {
        if (attr.source_type === 'consignment' && attr.consignment_batch_id) {
          const { data: batch } = await supabase
            .from('consignment_batches')
            .select('*')
            .eq('id', attr.consignment_batch_id)
            .single();

          if (batch) {
            const newQuantitySold = Math.max(0, batch.quantity_sold - attr.quantity);
            const newStatus = newQuantitySold === 0 ? 'in_stock' : 'partially_sold';

            await supabase
              .from('consignment_batches')
              .update({
                quantity_sold: newQuantitySold,
                status: newStatus,
              })
              .eq('id', attr.consignment_batch_id);
          }
        }
      }

      // Get product for selling price
      const productId = existingAttributions?.[0]?.product_id;
      const { data: product } = await supabase
        .from('products')
        .select('price')
        .eq('id', productId)
        .single();

      const sellingPrice = product?.price || 0;

      // Create new override attributions
      for (const newAttr of input.attributions) {
        let unitCost: number | null = null;

        if (newAttr.source_type === 'consignment' && newAttr.consignment_batch_id) {
          // Get batch unit cost
          const { data: batch } = await supabase
            .from('consignment_batches')
            .select('unit_cost, quantity_sold, initial_quantity, quantity_returned')
            .eq('id', newAttr.consignment_batch_id)
            .single();

          if (batch) {
            unitCost = batch.unit_cost;

            // Update batch quantity_sold
            const newQuantitySold = batch.quantity_sold + newAttr.quantity;
            const newStatus = newQuantitySold >= batch.initial_quantity - batch.quantity_returned
              ? 'fully_sold'
              : 'partially_sold';

            await supabase
              .from('consignment_batches')
              .update({
                quantity_sold: newQuantitySold,
                status: newStatus,
              })
              .eq('id', newAttr.consignment_batch_id);
          }
        }

        const supplierPortion = newAttr.source_type === 'consignment' && unitCost
          ? unitCost * newAttr.quantity
          : null;
        const agritableProfit = newAttr.source_type === 'consignment' && unitCost
          ? (sellingPrice - unitCost) * newAttr.quantity
          : sellingPrice * newAttr.quantity;

        await supabase
          .from('consignment_attributions')
          .insert({
            order_id: input.order_id,
            product_id: productId,
            source_type: newAttr.source_type,
            consignment_batch_id: newAttr.consignment_batch_id || null,
            quantity: newAttr.quantity,
            unit_cost: unitCost,
            supplier_portion: supplierPortion,
            agritable_profit: agritableProfit,
            created_by: user.id,
            is_override: true,
            override_reason: input.reason,
            original_attribution_id: existingAttributions?.[0]?.id || null,
          });
      }

      toast.success('Attribution modifiée avec succès');
    } catch (err: any) {
      console.error('Error overriding attribution:', err);
      toast.error(err.message || 'Erreur lors de la modification de l\'attribution');
      throw err;
    }
  }, []);

  // Get attributions for an order
  const getOrderAttributions = useCallback(async (orderId: string): Promise<ConsignmentAttribution[]> => {
    try {
      const { data, error } = await supabase
        .from('consignment_attributions')
        .select(`
          *,
          batch:consignment_batches(*)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching order attributions:', err);
      return [];
    }
  }, []);

  return {
    getAttributionConfig,
    updateAttributionConfig,
    attributeSale,
    overrideAttribution,
    getOrderAttributions,
  };
}
