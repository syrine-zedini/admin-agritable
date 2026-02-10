import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface B2BPricingRule {
  id: string;
  product_id: string;
  client_id: string;
  custom_price: number;
  discount_percentage: number | null;
  valid_from: string | null;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Product info
  product_name_fr?: string;
  product_sku?: string;
  product_unit?: string;
  standard_price?: number;
  // Client info
  company_name?: string;
  first_name?: string;
  last_name?: string;
}

export interface SetCustomPriceData {
  product_id: string;
  client_id: string;
  custom_price: number;
  discount_percentage?: number;
  valid_from?: string;
  valid_until?: string;
  notes?: string;
}

export interface BulkPricingData {
  client_id: string;
  discount_percentage: number;
  valid_from?: string;
  valid_until?: string;
  notes?: string;
  apply_to_all?: boolean; // Apply to all products or only specified ones
  product_ids?: string[]; // Specific products if not apply_to_all
}

export const useB2BPricing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all pricing rules for a specific client
   */
  const fetchClientPricing = useCallback(async (clientId: string): Promise<B2BPricingRule[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('b2b_pricing')
        .select(`
          *,
          products!b2b_pricing_product_id_fkey (
            name_fr,
            sku,
            unit,
            price
          ),
          users!b2b_pricing_client_id_fkey (
            company_name,
            first_name,
            last_name
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformed: B2BPricingRule[] = (data || []).map((rule: any) => ({
        id: rule.id,
        product_id: rule.product_id,
        client_id: rule.client_id,
        custom_price: rule.custom_price,
        discount_percentage: rule.discount_percentage,
        valid_from: rule.valid_from,
        valid_until: rule.valid_until,
        notes: rule.notes,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
        product_name_fr: rule.products?.name_fr,
        product_sku: rule.products?.sku,
        product_unit: rule.products?.unit,
        standard_price: rule.products?.price,
        company_name: rule.users?.company_name,
        first_name: rule.users?.first_name,
        last_name: rule.users?.last_name,
      }));

      return transformed;
    } catch (err: any) {
      console.error('Error fetching client pricing:', err);
      setError(err.message || 'Failed to fetch pricing rules');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch all pricing rules across all clients (for admin management)
   */
  const fetchAllPricingRules = useCallback(async (): Promise<B2BPricingRule[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('b2b_pricing')
        .select(`
          *,
          products!b2b_pricing_product_id_fkey (
            name_fr,
            sku,
            unit,
            price
          ),
          users!b2b_pricing_client_id_fkey (
            company_name,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformed: B2BPricingRule[] = (data || []).map((rule: any) => ({
        id: rule.id,
        product_id: rule.product_id,
        client_id: rule.client_id,
        custom_price: rule.custom_price,
        discount_percentage: rule.discount_percentage,
        valid_from: rule.valid_from,
        valid_until: rule.valid_until,
        notes: rule.notes,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
        product_name_fr: rule.products?.name_fr,
        product_sku: rule.products?.sku,
        product_unit: rule.products?.unit,
        standard_price: rule.products?.price,
        company_name: rule.users?.company_name,
        first_name: rule.users?.first_name,
        last_name: rule.users?.last_name,
      }));

      return transformed;
    } catch (err: any) {
      console.error('Error fetching all pricing rules:', err);
      setError(err.message || 'Failed to fetch pricing rules');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set or update custom price for a product-client combination
   */
  const setCustomPrice = useCallback(async (priceData: SetCustomPriceData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if pricing rule already exists
      const { data: existing, error: checkError } = await supabase
        .from('b2b_pricing')
        .select('id')
        .eq('product_id', priceData.product_id)
        .eq('client_id', priceData.client_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Update existing rule
        const { error: updateError } = await supabase
          .from('b2b_pricing')
          .update({
            custom_price: priceData.custom_price,
            discount_percentage: priceData.discount_percentage,
            valid_from: priceData.valid_from,
            valid_until: priceData.valid_until,
            notes: priceData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Create new rule
        const { error: insertError } = await supabase
          .from('b2b_pricing')
          .insert({
            product_id: priceData.product_id,
            client_id: priceData.client_id,
            custom_price: priceData.custom_price,
            discount_percentage: priceData.discount_percentage,
            valid_from: priceData.valid_from,
            valid_until: priceData.valid_until,
            notes: priceData.notes,
          });

        if (insertError) throw insertError;
      }

      return true;
    } catch (err: any) {
      console.error('Error setting custom price:', err);
      setError(err.message || 'Failed to set custom price');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Apply bulk pricing (percentage discount) to multiple products
   */
  const applyBulkPricing = useCallback(async (bulkData: BulkPricingData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get products to apply pricing to
      let productQuery = supabase
        .from('products')
        .select('id, price')
        .eq('is_active', true);

      if (!bulkData.apply_to_all && bulkData.product_ids && bulkData.product_ids.length > 0) {
        productQuery = productQuery.in('id', bulkData.product_ids);
      }

      const { data: products, error: productsError } = await productQuery;
      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        throw new Error('No products found to apply pricing');
      }

      // Calculate custom prices and prepare bulk insert/update
      const pricingRules = products.map((product: any) => {
        const discountMultiplier = (100 - bulkData.discount_percentage) / 100;
        const customPrice = product.price * discountMultiplier;

        return {
          product_id: product.id,
          client_id: bulkData.client_id,
          custom_price: customPrice,
          discount_percentage: bulkData.discount_percentage,
          valid_from: bulkData.valid_from,
          valid_until: bulkData.valid_until,
          notes: bulkData.notes || `Bulk ${bulkData.discount_percentage}% discount applied`,
        };
      });

      // Upsert all pricing rules
      const { error: upsertError } = await supabase
        .from('b2b_pricing')
        .upsert(pricingRules, {
          onConflict: 'product_id,client_id',
        });

      if (upsertError) throw upsertError;

      return true;
    } catch (err: any) {
      console.error('Error applying bulk pricing:', err);
      setError(err.message || 'Failed to apply bulk pricing');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Remove custom pricing rule
   */
  const removeCustomPrice = useCallback(async (ruleId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('b2b_pricing')
        .delete()
        .eq('id', ruleId);

      if (deleteError) throw deleteError;

      return true;
    } catch (err: any) {
      console.error('Error removing custom price:', err);
      setError(err.message || 'Failed to remove custom price');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get effective price for a client-product combination
   * (checks for custom pricing, falls back to standard price)
   */
  const getEffectivePrice = useCallback(async (
    clientId: string,
    productId: string
  ): Promise<{ price: number; isCustom: boolean; rule?: B2BPricingRule }> => {
    try {
      // Check for custom pricing
      const { data: customPricing, error: pricingError } = await supabase
        .from('b2b_pricing')
        .select(`
          *,
          products!b2b_pricing_product_id_fkey (price)
        `)
        .eq('client_id', clientId)
        .eq('product_id', productId)
        .maybeSingle();

      if (pricingError) throw pricingError;

      // Check if custom pricing is valid (date range)
      if (customPricing) {
        const now = new Date();
        const validFrom = customPricing.valid_from ? new Date(customPricing.valid_from) : null;
        const validUntil = customPricing.valid_until ? new Date(customPricing.valid_until) : null;

        const isValid =
          (!validFrom || now >= validFrom) &&
          (!validUntil || now <= validUntil);

        if (isValid) {
          return {
            price: customPricing.custom_price,
            isCustom: true,
            rule: customPricing as B2BPricingRule,
          };
        }
      }

      // Fallback to standard price
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('price')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      return {
        price: product.price,
        isCustom: false,
      };
    } catch (err: any) {
      console.error('Error getting effective price:', err);
      throw err;
    }
  }, []);

  return {
    isLoading,
    error,
    fetchClientPricing,
    fetchAllPricingRules,
    setCustomPrice,
    applyBulkPricing,
    removeCustomPrice,
    getEffectivePrice,
  };
};
