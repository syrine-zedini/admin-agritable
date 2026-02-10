import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  PricingSpreadsheetRow,
  B2BClient,
  Supplier,
  ProductSupplier,
  CellUpdate,
  SpreadsheetStatistics,
  B2BClientPrice,
} from '@/types/pricing-spreadsheet';

export const usePricingSpreadsheet = () => {
  const [data, setData] = useState<PricingSpreadsheetRow[]>([]);
  const [b2bClients, setB2bClients] = useState<B2BClient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<SpreadsheetStatistics | null>(null);

  /**
   * Fetch all B2B clients
   */
  const fetchB2BClients = useCallback(async (): Promise<B2BClient[]> => {
    try {
      const { data: clients, error: clientsError } = await supabase
        .from('users')
        .select('id, company_name, first_name, last_name, email')
        .eq('user_type', 'b2b')
        .eq('is_active', true)
        .order('company_name');

      if (clientsError) throw clientsError;

      return (clients || []).map((client) => ({
        ...client,
        display_name:
          client.company_name ||
          `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
          'N/A',
      }));
    } catch (err: any) {
      console.error('Error fetching B2B clients:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch all active suppliers
   */
  const fetchSuppliers = useCallback(async (): Promise<Supplier[]> => {
    try {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('users')
        .select('id, company_name, first_name, last_name, phone, is_active')
        .eq('user_type', 'supplier')
        .order('company_name');

      if (suppliersError) throw suppliersError;

      return (suppliersData || []).map((supplier) => ({
        ...supplier,
        display_name:
          supplier.company_name ||
          `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim() ||
          'N/A',
      }));
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch all B2B pricing rules grouped by product
   */
  const fetchB2BPricing = useCallback(async (): Promise<Record<string, Record<string, B2BClientPrice>>> => {
    try {
      const { data: pricingData, error: pricingError } = await supabase
        .from('b2b_pricing')
        .select('*')
        .order('product_id');

      if (pricingError) throw pricingError;

      // Group by product_id, then by client_id
      const grouped: Record<string, Record<string, B2BClientPrice>> = {};

      (pricingData || []).forEach((pricing) => {
        if (!grouped[pricing.product_id]) {
          grouped[pricing.product_id] = {};
        }

        const isExpired = pricing.valid_until
          ? new Date(pricing.valid_until) < new Date()
          : false;

        grouped[pricing.product_id][pricing.client_id] = {
          id: pricing.id,
          custom_price: pricing.custom_price,
          discount_percentage: pricing.discount_percentage,
          valid_from: pricing.valid_from,
          valid_until: pricing.valid_until,
          is_expired: isExpired,
        };
      });

      return grouped;
    } catch (err: any) {
      console.error('Error fetching B2B pricing:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch all pricing spreadsheet data
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch in parallel
      const [productsData, clients, suppliersData, b2bPricing] = await Promise.all([
        supabase.from('pricing_spreadsheet_data').select('*'),
        fetchB2BClients(),
        fetchSuppliers(),
        fetchB2BPricing(),
      ]);

      if (productsData.error) throw productsData.error;

      // Merge B2B pricing into product rows
      const enrichedData: PricingSpreadsheetRow[] = (productsData.data || []).map((row) => ({
        ...row,
        b2b_pricing: b2bPricing[row.product_id] || {},
      }));

      setData(enrichedData);
      setB2bClients(clients);
      setSuppliers(suppliersData);

      // Calculate statistics
      calculateStatistics(enrichedData, clients);
    } catch (err: any) {
      console.error('Error fetching pricing spreadsheet data:', err);
      setError(err.message || 'Failed to load pricing data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchB2BClients, fetchSuppliers, fetchB2BPricing]);

  /**
   * Calculate spreadsheet statistics
   */
  const calculateStatistics = (rows: PricingSpreadsheetRow[], clients: B2BClient[]) => {
    const stats: SpreadsheetStatistics = {
      total_products: rows.length,
      active_products: rows.filter((r) => r.is_active).length,
      products_with_suppliers: rows.filter((r) => r.primary_supplier_id).length,
      products_with_b2b_pricing: rows.filter((r) => Object.keys(r.b2b_pricing || {}).length > 0).length,
      low_stock_products: rows.filter((r) => r.stock && r.low_stock_threshold && r.stock <= r.low_stock_threshold).length,
      out_of_stock_products: rows.filter((r) => r.stock === 0 || !r.stock).length,
      total_b2b_clients: clients.length,
      avg_b2c_margin: 0,
      avg_b2b_margin: 0,
    };

    // Calculate average margins
    const marginsB2C = rows
      .filter((r) => r.b2c_price && r.purchase_price)
      .map((r) => ((r.b2c_price! - r.purchase_price!) / r.purchase_price!) * 100);

    const marginsB2B = rows
      .filter((r) => r.b2b_base_price && r.purchase_price)
      .map((r) => ((r.b2b_base_price! - r.purchase_price!) / r.purchase_price!) * 100);

    if (marginsB2C.length > 0) {
      stats.avg_b2c_margin = marginsB2C.reduce((sum, m) => sum + m, 0) / marginsB2C.length;
    }

    if (marginsB2B.length > 0) {
      stats.avg_b2b_margin = marginsB2B.reduce((sum, m) => sum + m, 0) / marginsB2B.length;
    }

    setStatistics(stats);
  };

  /**
   * Update a single cell
   */
  const updateCell = useCallback(async (update: CellUpdate): Promise<boolean> => {
    try {
      const { productId, field, value } = update;

      // Determine which table to update
      if ([
        'purchase_price', 'b2c_price', 'b2b_base_price', 'stock', 'unit_size', 'ordering_info', 'stock_warehouse',
        // NEW: Unit system fields
        'purchase_unit', 'b2c_ratio', 'b2c_selling_unit', 'b2b_ratio', 'b2b_selling_unit',
        // NEW: Formula pricing fields
        'b2c_multiplier', 'prix_sur_site', 'b2b_multiplier',
        // NEW: Operations fields
        'besoin', 'commande'
      ].includes(field)) {
        // Update products table
        const updateData: any = {};

        // Map field names to database columns
        if (field === 'purchase_price') updateData.cost_price = value;
        else if (field === 'b2c_price') updateData.price = value;
        else if (field === 'b2b_base_price') updateData.b2b_base_price = value;
        else if (field === 'stock') updateData.stock_quantity = value;
        else if (field === 'unit_size') updateData.unit_size = value;
        else if (field === 'ordering_info') updateData.ordering_info = value;
        else if (field === 'stock_warehouse') updateData.stock_warehouse = value;
        // NEW: Direct mappings for new fields
        else if (field === 'purchase_unit') updateData.purchase_unit = value;
        else if (field === 'b2c_ratio') updateData.b2c_ratio = value;
        else if (field === 'b2c_selling_unit') updateData.b2c_selling_unit = value;
        else if (field === 'b2b_ratio') updateData.b2b_ratio = value;
        else if (field === 'b2b_selling_unit') updateData.b2b_selling_unit = value;
        else if (field === 'b2c_multiplier') updateData.b2c_multiplier = value;
        else if (field === 'prix_sur_site') updateData.prix_sur_site = value;
        else if (field === 'b2b_multiplier') updateData.b2b_multiplier = value;
        else if (field === 'besoin') updateData.besoin = value;
        else if (field === 'commande') updateData.commande = value;

        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', productId);

        if (error) throw error;

        setData((prev) =>
          prev.map((row) =>
            row.product_id === productId ?
              {
                ...row, [field]: value

              } : row
          )
        );


        // Update local state optimistically

        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Error updating cell:', err);
      setError(err.message || 'Failed to update cell');
      return false;
    }
  }, []);

  /**
   * Update product supplier
   */
  const updateSupplier = useCallback(async (
    productId: string,
    supplierId: string,
    supplierPrice?: number
  ): Promise<boolean> => {
    try {
      // Handle removal: if supplierId is empty, remove primary supplier
      if (!supplierId || supplierId.trim() === '') {
        const { error } = await supabase
          .from('product_suppliers')
          .update({ is_primary: false })
          .eq('product_id', productId)
          .eq('is_primary', true);

        if (error) throw error;

        // Refresh data
        await fetchData();
        return true;
      }

      // Check if relationship exists
      const { data: existing } = await supabase
        .from('product_suppliers')
        .select('id')
        .eq('product_id', productId)
        .eq('supplier_id', supplierId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('product_suppliers')
          .update({
            supplier_price: supplierPrice,
            is_primary: true,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Clear other primary suppliers for this product
        await supabase
          .from('product_suppliers')
          .update({ is_primary: false })
          .eq('product_id', productId)
          .eq('is_primary', true);

        // Insert new
        const { error } = await supabase
          .from('product_suppliers')
          .insert({
            product_id: productId,
            supplier_id: supplierId,
            supplier_price: supplierPrice,
            is_primary: true,
            is_active: true,
          });

        if (error) throw error;
      }

      // Refresh data
      await fetchData();

      return true;
    } catch (err: any) {
      console.error('Error updating supplier:', err);
      setError(err.message || 'Failed to update supplier');
      return false;
    }
  }, [fetchData]);

  /**
   * Update B2B custom price
   */
  const updateB2BPrice = useCallback(async (
    productId: string,
    clientId: string,
    customPrice: number
  ): Promise<boolean> => {
    try {
      // Upsert B2B pricing
      const { error } = await supabase
        .from('b2b_pricing')
        .upsert(
          {
            product_id: productId,
            client_id: clientId,
            custom_price: customPrice,
          },
          {
            onConflict: 'product_id,client_id',
          }
        );

      if (error) throw error;

      // Update local state optimistically
      setData((prev) =>
        prev.map((row) => {
          if (row.product_id === productId) {
            return {
              ...row,
              b2b_pricing: {
                ...row.b2b_pricing,
                [clientId]: {
                  id: '', // Will be updated on next fetch
                  custom_price: customPrice,
                  is_expired: false,
                },
              },
            };
          }
          return row;
        })
      );

      return true;
    } catch (err: any) {
      console.error('Error updating B2B price:', err);
      setError(err.message || 'Failed to update B2B price');
      return false;
    }
  }, []);

  /**
   * Update deliverer assignment for a product-supplier relationship
   * Auto-creates Purchase Order when both deliverer and pickup_date are set
   */
  const updateDelivererAssignment = useCallback(async (
    productId: string,
    delivererId: string | null,
    pickupDate: string | null
  ): Promise<{ success: boolean; poNumber?: string }> => {
    try {
      // Get the primary supplier for this product with full details
      const { data: primarySupplier, error: fetchError } = await supabase
        .from('product_suppliers')
        .select('id, supplier_id, supplier_price')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!primarySupplier) {
        throw new Error('No primary supplier found for this product');
      }

      // Update deliverer assignment
      const { error: updateError } = await supabase
        .from('product_suppliers')
        .update({
          assigned_deliverer_id: delivererId,
          pickup_date: pickupDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', primarySupplier.id);

      if (updateError) throw updateError;

      // PO Creation Note:
      // Purchase Orders are no longer auto-created when deliverer/pickup_date are set.
      // Admins must explicitly select products and click "Create Draft POs" button.
      // This provides better control and validation workflow.

      // Update local state optimistically
      setData((prev) =>
        prev.map((row) =>
          row.product_id === productId
            ? { ...row, assigned_deliverer_id: delivererId || undefined, pickup_date: pickupDate || undefined }
            : row
        )
      );

      return { success: true };
    } catch (err: any) {
      console.error('Error updating deliverer assignment:', err);
      setError(err.message || 'Failed to update deliverer assignment');
      return { success: false };
    }
  }, []);

  /**
   * Update category for a product
   */
  const updateCategory = useCallback(async (
    productId: string,
    categoryId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ category_id: categoryId })
        .eq('id', productId);

      if (error) throw error;

      // Fetch full data to get updated category name
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError(err.message || 'Failed to update category');
      return false;
    }
  }, [fetchData]);

  /**
   * Update deliverer for a product (simpler version for direct product assignment)
   * Updates the primary supplier relationship in product_suppliers table
   */
  const updateDeliverer = useCallback(async (
    productId: string,
    delivererId: string
  ): Promise<boolean> => {
    try {
      // Get the primary supplier for this product
      const { data: primarySupplier, error: fetchError } = await supabase
        .from('product_suppliers')
        .select('id')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!primarySupplier) {
        throw new Error('No primary supplier found for this product');
      }

      // Update deliverer assignment in product_suppliers table
      const { error } = await supabase
        .from('product_suppliers')
        .update({
          assigned_deliverer_id: delivererId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', primarySupplier.id);

      if (error) throw error;

      // Fetch to get deliverer name
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error updating deliverer:', err);
      setError(err.message || 'Failed to update deliverer');
      return false;
    }
  }, [fetchData]);

  /**
   * Update pickup date for a product
   * Updates the primary supplier relationship in product_suppliers table
   */
  const updatePickupDate = useCallback(async (
    productId: string,
    pickupDate: string | null
  ): Promise<boolean> => {
    try {
      // Get the primary supplier for this product
      const { data: primarySupplier, error: fetchError } = await supabase
        .from('product_suppliers')
        .select('id')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!primarySupplier) {
        throw new Error('No primary supplier found for this product');
      }

      // Update pickup date in product_suppliers table
      const { error } = await supabase
        .from('product_suppliers')
        .update({
          pickup_date: pickupDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', primarySupplier.id);

      if (error) throw error;

      // Optimistic update
      setData((prev) =>
        prev.map((row) =>
          row.product_id === productId
            ? { ...row, pickup_date: pickupDate || undefined }
            : row
        )
      );

      return true;
    } catch (err: any) {
      console.error('Error updating pickup date:', err);
      setError(err.message || 'Failed to update pickup date');
      return false;
    }
  }, []);

  /**
   * Update multiplier and recalculate dependent values
   */
  const updateMultiplier = useCallback(async (
    productId: string,
    field: 'b2c_multiplier' | 'b2b_multiplier',
    value: number
  ): Promise<boolean> => {
    try {

      const { error } = await supabase
        .from('products')
        .update({ [field]: value })
        .eq('id', productId);

      if (error) throw error;

      // Optimistic update with recalculation
      setData((prev) =>
        prev.map((row) => {
          if (row.product_id === productId) {
            const updated = { ...row, [field]: value };

            // Recalculate dependent prices
            if (field === 'b2c_multiplier' && updated.purchase_price && updated.b2c_ratio) {
              updated.b2c_prix_de_vente_calculated =
                (updated.purchase_price / updated.b2c_ratio) * value;
              updated.prix_sur_site = updated.b2c_prix_de_vente_calculated;
            } else if (field === 'b2b_multiplier' && updated.purchase_price && updated.b2b_ratio) {
              updated.b2b_price_calculated =
                (updated.purchase_price / updated.b2b_ratio) * value;
            }

            return updated;
          }
          return row;
        })
      );

      return true;
    } catch (err: any) {
      console.error('Error updating multiplier:', err);
      setError(err.message || 'Failed to update multiplier');
      return false;
    }
  }, []);

  /**
   * Update selling quantity and unit (auto-calculates ratio)
   */
  const updateSellingUnit = useCallback(async (
    productId: string,
    field: 'b2c' | 'b2b',
    quantity: number,
    unit: string
  ): Promise<boolean> => {
    try {
      const updateData = field === 'b2c'
        ? { b2c_selling_quantity: quantity, b2c_selling_unit: unit }
        : { b2b_selling_quantity: quantity, b2b_selling_unit: unit };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;

      // Refresh to get recalculated ratio
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error updating selling unit:', err);
      setError(err.message || 'Failed to update selling unit');
      return false;
    }
  }, [fetchData]);

  /**
   * Bulk update products with the same field value or percentage adjustment
   */
  const bulkUpdate = useCallback(async (
    productIds: string[],
    field: string,
    value: any,
    mode: 'absolute' | 'percentage' = 'absolute'
  ): Promise<{ success: number; failed: number }> => {
    let successCount = 0;
    let failedCount = 0;

    try {
      for (const productId of productIds) {
        let finalValue = value;

        // If percentage mode, calculate new value based on current value
        if (mode === 'percentage' && ['b2c_multiplier', 'b2b_multiplier', 'purchase_price', 'prix_sur_site'].includes(field)) {
          const currentRow = data.find((r) => r.product_id === productId);
          if (currentRow) {
            const currentValue = currentRow[field as keyof PricingSpreadsheetRow] as number;
            if (typeof currentValue === 'number') {
              finalValue = currentValue * (1 + value / 100);
              finalValue = Math.round(finalValue * 100) / 100; // Round to 2 decimals
            }
          }
        }

        const success = await updateCell({
          productId,
          field,
          value: finalValue,
        });

        if (success) successCount++;
        else failedCount++;
      }

      return { success: successCount, failed: failedCount };
    } catch (err: any) {
      console.error('Error in bulk update:', err);
      setError(err.message || 'Failed to complete bulk update');
      return { success: successCount, failed: failedCount };
    }
  }, [data, updateCell]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    b2bClients,
    suppliers,
    statistics,
    isLoading,
    error,
    fetchData,
    updateCell,
    updateSupplier,
    updateB2BPrice,
    updateDelivererAssignment,
    updateCategory,
    updateDeliverer,
    updatePickupDate,
    updateMultiplier,
    updateSellingUnit,
    bulkUpdate,
  };
};
