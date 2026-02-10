import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  product_id: string;
  status: 'draft' | 'ordered' | 'in_transit' | 'delivered' | 'verified' | 'cancelled';
  pickup_date: string | null;
  assigned_deliverer_id: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;

  // Draft workflow fields
  draft_notes?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;

  // Collection details (Phase 0 schema changes)
  collection_window_start?: string | null; // TIME
  collection_window_end?: string | null; // TIME
  advance_payment_type?: 'full' | 'partial' | 'later';
  advance_payment_percentage?: number | null;
  advance_payment_amount?: number;

  supplier?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    phone: string | null;
    latitude?: number | null;
    longitude?: number | null;
    location_source?: string | null;
  };
  product?: {
    id: string;
    sku: string;
    name_fr: string;
    category?: {
      name_fr: string;
    };
  };
  deliverer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface ApprovedPOData {
  po_id: string;
  collection_window_start: string; // time format "HH:MM"
  collection_window_end: string; // time format "HH:MM"
  advance_payment_type: 'full' | 'partial' | 'later';
  advance_payment_percentage?: number;
}

export interface DelivererCashBalance {
  id: string;
  deliverer_id: string;
  cash_balance: number;
  last_replenishment_date: string | null;
  last_replenishment_amount: number | null;
  created_at: string;
  updated_at: string;
  deliverer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface PendingCollection {
  id: string;
  route_id: string;
  stop_type: 'collection';
  supplier_id: string;
  collection_status: 'pending' | 'collected' | 'verified' | 'rejected' | 'quality_rejected' | 'failed' | 'cancelled';
  collection_products: {
    po_id?: string;
    product_id?: string;
    product_name: string;
    expected_quantity: number;
    unit: string;
    agreed_price_per_unit: number;
    linked_offer_id?: string;
    linked_demand_response_id?: string;
  }[];
  deliverer_verification?: {
    payment_confirmed: boolean;
    payment_amount?: number;
    price_per_unit_verified?: number;
    quantity_collected: number;
    quality_notes?: string;
    verification_time: string;
  };
  advance_payment_amount: number | null;
  actual_arrival_time: string | null;
  actual_departure_time: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    phone: string | null;
  };
  route?: {
    id: string;
    deliverer_id: string;
    deliverer?: {
      first_name: string | null;
      last_name: string | null;
    };
  };
}

export interface VerifiedCollection extends PendingCollection {
  admin_verification: {
    verified_quantity: number;
    quality_notes: string;
    pricing_config: {
      b2c_selling_quantity: number;
      b2c_selling_unit: string;
      b2c_multiplier: number;
      b2b_selling_quantity: number;
      b2b_selling_unit: string;
      b2b_multiplier: number;
    };
    product_id: string;
    payment_amount: number;
    verified_by: string;
    verified_at: string;
  };
}

export interface CollectionFilters {
  supplier_id?: string;
  deliverer_id?: string;
  collection_date_from?: string;
  collection_date_to?: string;
  status?: 'pending' | 'collected' | 'verified' | 'rejected' | 'quality_rejected' | 'failed' | 'cancelled' | 'all';
}

export interface PurchaseOrderFilters {
  supplier_id?: string;
  product_id?: string;
  deliverer_id?: string;
  pickup_date_from?: string;
  pickup_date_to?: string;
  status?: 'ordered' | 'in_transit' | 'delivered' | 'verified' | 'cancelled' | 'all';
}

/**
 * Hook for managing purchase orders (admin verification of collected products)
 */
export function usePurchaseOrders(filters: CollectionFilters = {}, poFilters: PurchaseOrderFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch pending collections awaiting admin verification
  const {
    data: pendingCollections,
    isLoading: isLoadingPending,
    error: pendingError,
  } = useQuery({
    queryKey: ['pending_collections_for_verification', filters],
    queryFn: async (): Promise<PendingCollection[]> => {
      let query = supabase
        .from('route_stops')
        .select(
          `
          *,
          supplier:users!supplier_id(id, first_name, last_name, company_name, phone, latitude, longitude),
          route:delivery_routes!route_id(
            id,
            deliverer_id,
            deliverer:users!deliverer_id(first_name, last_name)
          )
        `
        )
        .eq('stop_type', 'collection')
        .eq('collection_status', 'collected')
        .order('actual_arrival_time', { ascending: false });

      // Apply filters
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      if (filters.collection_date_from) {
        query = query.gte('actual_arrival_time', filters.collection_date_from);
      }

      if (filters.collection_date_to) {
        query = query.lte('actual_arrival_time', filters.collection_date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by deliverer if specified (need to check nested route data)
      let filteredData = data as PendingCollection[];
      if (filters.deliverer_id) {
        filteredData = filteredData.filter(
          (collection) => collection.route?.deliverer_id === filters.deliverer_id
        );
      }

      return filteredData;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch verified collections history
  const {
    data: verifiedCollections,
    isLoading: isLoadingVerified,
  } = useQuery({
    queryKey: ['verified_collections_history', filters],
    queryFn: async (): Promise<VerifiedCollection[]> => {
      let query = supabase
        .from('route_stops')
        .select(
          `
          *,
          supplier:users!supplier_id(id, first_name, last_name, company_name, phone, latitude, longitude),
          route:delivery_routes!route_id(
            id,
            deliverer_id,
            deliverer:users!deliverer_id(first_name, last_name)
          )
        `
        )
        .eq('stop_type', 'collection')
        .in('collection_status', ['verified', 'rejected'])
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('collection_status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by deliverer if specified
      let filteredData = data as VerifiedCollection[];
      if (filters.deliverer_id) {
        filteredData = filteredData.filter(
          (collection) => collection.route?.deliverer_id === filters.deliverer_id
        );
      }

      return filteredData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch purchase orders
  const {
    data: purchaseOrders,
    isLoading: isLoadingPOs,
    error: poError,
  } = useQuery({
    queryKey: ['purchase_orders', poFilters],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      let query = supabase
        .from('purchase_orders')
        .select(
          `
          *,
          supplier:users!supplier_id(id, first_name, last_name, company_name, phone, latitude, longitude),
          product:products!product_id(id, sku, name_fr, category:categories(name_fr)),
          deliverer:users!assigned_deliverer_id(id, first_name, last_name)
        `
        )
        .order('created_at', { ascending: false });

      // Apply filters
      if (poFilters.supplier_id) {
        query = query.eq('supplier_id', poFilters.supplier_id);
      }

      if (poFilters.product_id) {
        query = query.eq('product_id', poFilters.product_id);
      }

      if (poFilters.deliverer_id) {
        query = query.eq('assigned_deliverer_id', poFilters.deliverer_id);
      }

      if (poFilters.pickup_date_from) {
        query = query.gte('pickup_date', poFilters.pickup_date_from);
      }

      if (poFilters.pickup_date_to) {
        query = query.lte('pickup_date', poFilters.pickup_date_to);
      }

      if (poFilters.status && poFilters.status !== 'all') {
        query = query.eq('status', poFilters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as PurchaseOrder[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Create purchase order mutation
  const createPurchaseOrderMutation = useMutation({
    mutationFn: async ({
      supplierId,
      productId,
      pickupDate,
      assignedDelivererId,
      quantity,
      unit,
      unitPrice,
      notes,
    }: {
      supplierId: string;
      productId: string;
      pickupDate: string;
      assignedDelivererId: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      notes?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate total amount
      const totalAmount = quantity * unitPrice;

      // Generate PO number using database function
      const { data: poNumberResult, error: poNumberError } = await supabase.rpc(
        'generate_po_number'
      );

      if (poNumberError) throw poNumberError;

      const poNumber = poNumberResult as string;

      // Create purchase order
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          supplier_id: supplierId,
          product_id: productId,
          pickup_date: pickupDate,
          assigned_deliverer_id: assignedDelivererId,
          quantity,
          unit,
          unit_price: unitPrice,
          total_amount: totalAmount,
          notes: notes || null,
          created_by: user.id,
          status: 'ordered',
        })
        .select(
          `
          *,
          supplier:users!supplier_id(id, first_name, last_name, company_name, phone, latitude, longitude),
          product:products!product_id(id, sku, name_fr),
          deliverer:users!assigned_deliverer_id(id, first_name, last_name)
        `
        )
        .single();

      if (error) throw error;

      return data as PurchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['product_suppliers'] });
    },
  });

  // Update purchase order status mutation
  const updatePurchaseOrderStatusMutation = useMutation({
    mutationFn: async ({
      purchaseOrderId,
      status,
      notes,
    }: {
      purchaseOrderId: string;
      status: 'ordered' | 'in_transit' | 'delivered' | 'verified' | 'cancelled';
      notes?: string;
    }) => {
      const updateData: any = { status };
      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updateData)
        .eq('id', purchaseOrderId)
        .select()
        .single();

      if (error) throw error;

      return data as PurchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
    },
  });

  // Verify collection and add to stock mutation
  const verifyCollectionMutation = useMutation({
    mutationFn: async ({
      collectionId,
      verifiedQuantity,
      qualityNotes,
      pricingConfig,
      productLinkage,
    }: {
      collectionId: string;
      verifiedQuantity: number;
      qualityNotes: string;
      pricingConfig: {
        purchase_unit: string;
        cost_price: number;
        b2c_selling_quantity: number;
        b2c_selling_unit: string;
        b2c_multiplier: number;
        b2b_selling_quantity: number;
        b2b_selling_unit: string;
        b2b_multiplier: number;
      };
      productLinkage:
      | {
        type: 'existing';
        productId: string;
        updatePricing: boolean;
      }
      | {
        type: 'new';
        productData: {
          name_fr: string;
          category_id: string;
          sku?: string;
        };
      };
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch the collection
      const { data: collection, error: collectionError } = await supabase
        .from('route_stops')
        .select('*, supplier:users!supplier_id(*)')
        .eq('id', collectionId)
        .single();

      if (collectionError) throw collectionError;

      const collectionData = collection as PendingCollection;

      // Get the first product from collection_products
      const productInfo = collectionData.collection_products[0];
      if (!productInfo) throw new Error('No product information found in collection');

      let productId: string;
      let isNewProduct = false;

      // Handle product linkage
      if (productLinkage.type === 'existing') {
        productId = productLinkage.productId;

        if (productLinkage.updatePricing) {
          // CRITICAL FIX: Use atomic RPC function to update BOTH pricing AND stock
          // Previously, this only updated pricing fields and omitted stock_quantity entirely,
          // causing verified products to never enter inventory
          const { data: updatedProduct, error: updateError } = await supabase
            .rpc('update_product_with_stock_atomic', {
              p_product_id: productId,
              p_stock_increment: verifiedQuantity,
              p_cost_price: pricingConfig.cost_price,
              p_purchase_unit: pricingConfig.purchase_unit,
              p_b2c_selling_quantity: pricingConfig.b2c_selling_quantity,
              p_b2c_selling_unit: pricingConfig.b2c_selling_unit,
              p_b2c_multiplier: pricingConfig.b2c_multiplier,
              p_b2b_selling_quantity: pricingConfig.b2b_selling_quantity,
              p_b2b_selling_unit: pricingConfig.b2b_selling_unit,
              p_b2b_multiplier: pricingConfig.b2b_multiplier
            })
            .single();

          if (updateError) throw updateError;

          // Log the stock update for audit trail
          console.log(`[Stock Update] Product ${productId}: ${updatedProduct.previous_stock} → ${updatedProduct.stock_quantity} (+${verifiedQuantity})`);
        } else {
          // IMPROVEMENT: Use atomic RPC function instead of read-then-update pattern
          // This prevents race conditions where multiple admins verify collections simultaneously
          const { data: updatedProduct, error: stockError } = await supabase
            .rpc('increment_product_stock', {
              p_product_id: productId,
              p_quantity_increment: verifiedQuantity
            })
            .single();

          if (stockError) throw stockError;

          // Log the stock update for audit trail
          console.log(`[Stock Update] Product ${productId}: ${updatedProduct.previous_stock} → ${updatedProduct.stock_quantity} (+${verifiedQuantity})`);
        }
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name_fr: productLinkage.productData.name_fr,
            category_id: productLinkage.productData.category_id,
            sku: productLinkage.productData.sku || `SKU-${Date.now()}`,
            purchase_unit: pricingConfig.purchase_unit,
            cost_price: pricingConfig.cost_price,
            b2c_selling_quantity: pricingConfig.b2c_selling_quantity,
            b2c_selling_unit: pricingConfig.b2c_selling_unit,
            b2c_multiplier: pricingConfig.b2c_multiplier,
            b2b_selling_quantity: pricingConfig.b2b_selling_quantity,
            b2b_selling_unit: pricingConfig.b2b_selling_unit,
            b2b_multiplier: pricingConfig.b2b_multiplier,
            stock_quantity: verifiedQuantity,
          })
          .select()
          .single();

        if (productError) throw productError;

        productId = newProduct.id;
        isNewProduct = true;
      }

      // Create product_suppliers link using upsert to avoid duplicate key errors
      // Using onConflict with ignoreDuplicates to silently skip if link already exists
      const { error: linkError } = await supabase
        .from('product_suppliers')
        .upsert(
          {
            product_id: productId,
            supplier_id: collectionData.supplier_id,
          },
          {
            onConflict: 'product_id,supplier_id',
            ignoreDuplicates: true, // Don't throw error if already exists
          }
        );

      if (linkError) {
        throw linkError;
      }

      // Calculate payment amount (verified quantity × agreed price)
      const paymentAmount = verifiedQuantity * productInfo.agreed_price_per_unit;

      // Create admin verification object
      const adminVerification = {
        verified_quantity: verifiedQuantity,
        quality_notes: qualityNotes,
        pricing_config: pricingConfig,
        product_id: productId,
        payment_amount: paymentAmount,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      };

      // Update collection status to 'verified' with admin verification data
      const { error: updateError } = await supabase
        .from('route_stops')
        .update({
          collection_status: 'verified',
          admin_verification: adminVerification,
        })
        .eq('id', collectionId);

      if (updateError) throw updateError;

      // Update associated PO status to 'verified'
      // Extract PO ID from collection_products array
      const poId = productInfo.po_id;
      if (poId) {
        const { error: poUpdateError } = await supabase
          .from('purchase_orders')
          .update({ status: 'verified' })
          .eq('id', poId);

        if (poUpdateError) {
          console.error('[PO Status Update] Failed to update PO status:', poUpdateError);
          // Don't throw - verification already succeeded, this is just a status sync
        } else {

          console.log('[PO Status Update] Updated PO', poId, 'status to verified');
        }
      }
      await supabase.rpc('reset_product_supplier_after_po', {
        p_product_id: productId,
      });
      return { productId, paymentAmount, isNewProduct };
    },
    onSuccess: (result) => {
      // CRITICAL: Complete cache invalidation to ensure all views reflect updated stock and pricing
      // Previously, some views (pricing spreadsheet, catalog, demand forecast) were not invalidated,
      // causing stale data to display after verification

      // Collection-related queries
      queryClient.invalidateQueries({ queryKey: ['pending_collections_for_verification'] });
      queryClient.invalidateQueries({ queryKey: ['verified_collections_history'] });

      // Purchase order queries (to update verified POs tab)
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });

      // Product-related queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product_suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['product_catalog'] });

      // Pricing-related queries (critical when pricing is updated)
      queryClient.invalidateQueries({ queryKey: ['pricing_spreadsheet_data'] });
      queryClient.invalidateQueries({ queryKey: ['pricing_spreadsheet'] });

      // Stock-related queries
      queryClient.invalidateQueries({ queryKey: ['stock_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['demand_forecast'] });

      // Specific product query (if product was updated)
      if (result.productId) {
        queryClient.invalidateQueries({ queryKey: ['product', result.productId] });
      }

    },
  });

  // Reject collection mutation
  const rejectCollectionMutation = useMutation({
    mutationFn: async ({
      collectionId,
      rejectionReason,
      rejectionNotes,
    }: {
      collectionId: string;
      rejectionReason: string;
      rejectionNotes: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rejectionData = {
        reason: rejectionReason,
        notes: rejectionNotes,
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('route_stops')
        .update({
          collection_status: 'rejected',
          admin_verification: rejectionData,
        })
        .eq('id', collectionId);

      if (error) throw error;

      return { collectionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_collections_for_verification'] });
      queryClient.invalidateQueries({ queryKey: ['verified_collections_history'] });
    },
  });

  // ==================== DRAFT PO MUTATIONS ====================

  // Create draft purchase order mutation
  const createDraftPurchaseOrderMutation = useMutation({
    mutationFn: async (poData: {
      supplier_id: string;
      product_id: string;
      pickup_date: string;
      assigned_deliverer_id: string;
      quantity: number;
      unit: string;
      unit_price: number;
      draft_notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate PO number
      const { data: poNumber, error: poNumberError } = await supabase.rpc('generate_po_number');
      if (poNumberError) throw poNumberError;

      const totalAmount = poData.quantity * poData.unit_price;

      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({
          ...poData,
          po_number: poNumber,
          total_amount: totalAmount,
          status: 'draft',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {

    },
  });

  // Approve draft PO (transition draft → ordered)
  const approveDraftPOMutation = useMutation({
    mutationFn: async (poId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'ordered',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', poId)
        .eq('status', 'draft')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['pricing_spreadsheet_data'] });
    },
  });

  // Reject draft PO (transition draft → cancelled)
  const rejectDraftPOMutation = useMutation({
    mutationFn: async ({ poId, reason }: { poId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'cancelled',
          rejected_by: user.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', poId)
        .eq('status', 'draft')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['pricing_spreadsheet_data'] });
    },
  });

  // Bulk approve multiple draft POs
  const bulkApproveDraftPOsMutation = useMutation({
    mutationFn: async (poIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'ordered',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .in('id', poIds)
        .eq('status', 'draft')
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['pricing_spreadsheet_data'] });
    },
  });

  // ==================== PHASE 5: NEW FEATURES ====================

  // Fetch deliverer cash balances
  const {
    data: delivererCashBalances,
    isLoading: isLoadingCashBalances
  } = useQuery({
    queryKey: ['deliverer_cash_tracking'],
    queryFn: async (): Promise<DelivererCashBalance[]> => {
      const { data, error } = await supabase
        .from('deliverer_cash_tracking')
        .select(`
          *,
          deliverer:users!deliverer_id(id, first_name, last_name)
        `);

      if (error) throw error;
      return data as DelivererCashBalance[];
    },
    staleTime: 1000 * 60 * 1, // 1 minute - needs to be fresh
  });

  // Batch approve POs with collection details
  const approvePOsBatchMutation = useMutation({
    mutationFn: async (approvedData: ApprovedPOData[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // CRITICAL FIX: Use Promise.allSettled() to handle partial batch failures
      // Previously, Promise.all() would fail the entire batch if one PO failed,
      // leaving user with no visibility into which POs succeeded/failed
      const updates = approvedData.map(async (po) => {
        try {
          const { data, error } = await supabase
            .from('purchase_orders')
            .update({
              status: 'ordered',
              collection_window_start: po.collection_window_start,
              collection_window_end: po.collection_window_end,
              advance_payment_type: po.advance_payment_type,
              advance_payment_percentage: po.advance_payment_percentage,
              approved_by: user.id,
              approved_at: new Date().toISOString(),
            })
            .eq('id', po.po_id)
            .eq('status', 'draft')
            .select()
            .single();

          if (error) throw error;
          return { success: true, po_id: po.po_id, data };
        } catch (error: any) {
          return {
            success: false,
            po_id: po.po_id,
            error: error.message || 'Unknown error'
          };
        }
      });

      const results = await Promise.allSettled(updates);

      // Compile summary of succeeded and failed POs
      const settled = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      const succeeded = settled.filter(r => r.success);
      const failed = settled.filter(r => !r.success);

      return {
        total: approvedData.length,
        succeeded: succeeded.length,
        failed: failed.length,
        succeededPOs: succeeded,
        failedPOs: failed
      };
    },
    onSuccess: (result) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['pricing_spreadsheet_data'] });
      queryClient.invalidateQueries({ queryKey: ['delivery_routes'] });
      queryClient.invalidateQueries({ queryKey: ['route_stops'] });
      queryClient.invalidateQueries({ queryKey: ['deliverer_cash_tracking'] });

      // Return result to caller for notification handling
      return result;
    },
    onError: (error: any) => {
      // Let the caller handle error notifications
      throw error;
    }
  });

  // Helper function to validate PO can be approved
  const validatePOApproval = async (po: PurchaseOrder): Promise<string[]> => {
    const errors: string[] = [];

    // Check required fields
    if (!po.assigned_deliverer_id) {
      errors.push('No deliverer assigned');
    }

    if (!po.pickup_date) {
      errors.push('No pickup date set');
    }

    // Check deliverer route availability
    if (po.assigned_deliverer_id && po.pickup_date) {
      const { data: activeRoutes } = await supabase
        .from('delivery_routes')
        .select('id')
        .eq('deliverer_id', po.assigned_deliverer_id)
        .eq('date', po.pickup_date)
        .in('status', ['in_progress', 'completed']);

      if (activeRoutes && activeRoutes.length > 0) {
        errors.push('Deliverer has active or completed route on this date');
      }
    }

    // Check supplier location
    if (po.supplier_id) {
      const { data: supplier } = await supabase
        .from('users')
        .select('latitude, longitude')
        .eq('id', po.supplier_id)
        .single();

      if (!supplier?.latitude || !supplier?.longitude) {
        errors.push('Supplier location not set');
      }
    }

    return errors;
  };

  // Get statistics
  const getStats = () => {
    const pending = pendingCollections?.length || 0;
    const verified = verifiedCollections?.filter((c) => c.collection_status === 'verified').length || 0;
    const rejected = verifiedCollections?.filter((c) => c.collection_status === 'rejected').length || 0;

    return {
      pending,
      verified,
      rejected,
      total: pending + verified + rejected,
    };
  };

  // Get purchase order statistics
  const getPOStats = () => {
    if (!purchaseOrders) return { draft: 0, ordered: 0, in_transit: 0, delivered: 0, verified: 0, cancelled: 0, total: 0 };

    return {
      draft: purchaseOrders.filter((po) => po.status === 'draft').length,
      ordered: purchaseOrders.filter((po) => po.status === 'ordered').length,
      in_transit: purchaseOrders.filter((po) => po.status === 'in_transit').length,
      delivered: purchaseOrders.filter((po) => po.status === 'delivered').length,
      verified: purchaseOrders.filter((po) => po.status === 'verified').length,
      cancelled: purchaseOrders.filter((po) => po.status === 'cancelled').length,
      total: purchaseOrders.length,
    };
  };

  return {
    // Collections
    pendingCollections: pendingCollections || [],
    verifiedCollections: verifiedCollections || [],
    isLoading: isLoadingPending || isLoadingVerified,
    error: pendingError,
    stats: getStats(),
    verifyCollection: verifyCollectionMutation.mutate,
    isVerifying: verifyCollectionMutation.isPending,
    rejectCollection: rejectCollectionMutation.mutate,
    isRejecting: rejectCollectionMutation.isPending,

    // Purchase Orders
    purchaseOrders: purchaseOrders || [],
    isLoadingPOs,
    poError,
    poStats: getPOStats(),
    createPurchaseOrder: createPurchaseOrderMutation.mutate,
    isCreatingPO: createPurchaseOrderMutation.isPending,
    updatePurchaseOrderStatus: updatePurchaseOrderStatusMutation.mutate,
    isUpdatingPOStatus: updatePurchaseOrderStatusMutation.isPending,

    // Draft PO Mutations
    createDraftPurchaseOrder: createDraftPurchaseOrderMutation.mutate,
    isCreatingDraftPO: createDraftPurchaseOrderMutation.isPending,
    approveDraftPO: approveDraftPOMutation.mutate,
    isApprovingDraftPO: approveDraftPOMutation.isPending,
    rejectDraftPO: rejectDraftPOMutation.mutate,
    isRejectingDraftPO: rejectDraftPOMutation.isPending,
    bulkApproveDraftPOs: bulkApproveDraftPOsMutation.mutate,
    isBulkApprovingDraftPOs: bulkApproveDraftPOsMutation.isPending,

    // Phase 5: Route Planning Integration
    delivererCashBalances: delivererCashBalances || [],
    isLoadingCashBalances,
    approvePOsBatch: approvePOsBatchMutation.mutate,
    approvePOsBatchAsync: approvePOsBatchMutation.mutateAsync,
    isApprovingBatch: approvePOsBatchMutation.isPending,
    validatePOApproval,
  };
}
