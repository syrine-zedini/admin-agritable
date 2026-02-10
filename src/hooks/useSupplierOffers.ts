import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SupplierOffer {
  id: string;
  supplier_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  availability_date: string | null;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_quantity: number | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    phone: string | null;
  };
  reviewer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface SupplierOffersFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  supplier_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

/**
 * Hook for managing supplier offers (farmers submitting produce availability)
 */
export function useSupplierOffers(filters: SupplierOffersFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch supplier offers with filters
  const {
    data: offers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['supplier_offers', filters],
    queryFn: async (): Promise<SupplierOffer[]> => {
      let query = supabase
        .from('supplier_offers')
        .select(
          `
          *,
          supplier:users!supplier_id(id, first_name, last_name, company_name, phone),
          reviewer:users!reviewed_by(id, first_name, last_name)
        `
        )
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply supplier filter
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      // Apply date range filters
      if (filters.date_from) {
        query = query.gte('availability_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('availability_date', filters.date_to);
      }

      // Apply search filter (product name)
      if (filters.search) {
        query = query.ilike('product_name', `%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data as SupplierOffer[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Approve offer mutation (with optional partial approval and product assignment)
  const approveOfferMutation = useMutation({
    mutationFn: async ({
      offerId,
      approvedQuantity,
      adminNotes,
      productId,
      productData,
    }: {
      offerId: string;
      approvedQuantity?: number;
      adminNotes?: string;
      productId?: string;
      productData?: {
        sku: string;
        name_fr: string;
        category_id?: string;
        purchase_unit: string;
        cost_price: number;
      };
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch the offer to get supplier_id
      const { data: offer, error: offerError } = await supabase
        .from('supplier_offers')
        .select('supplier_id, price_per_unit')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      // Update offer status
      const { data, error } = await supabase
        .from('supplier_offers')
        .update({
          status: 'approved',
          approved_quantity: approvedQuantity || null,
          admin_notes: adminNotes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', offerId)
        .select()
        .single();

      if (error) throw error;

      // Handle product assignment if provided
      let assignedProductId: string | undefined = productId;

      if (productData) {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            sku: productData.sku,
            name_fr: productData.name_fr,
            category_id: productData.category_id || null,
            purchase_unit: productData.purchase_unit,
            cost_price: productData.cost_price,
            unit: productData.purchase_unit, // Required field
            price: productData.cost_price, // Initial B2C price = cost price
            is_active: true,
            is_available: true,
          })
          .select('id')
          .single();

        if (productError) throw productError;
        assignedProductId = newProduct.id;
      }

      // Create or update product_suppliers link if product was assigned
      if (assignedProductId) {
        // Check if product_supplier link already exists
        const { data: existingLink } = await supabase
          .from('product_suppliers')
          .select('id, supplier_price')
          .eq('product_id', assignedProductId)
          .eq('supplier_id', offer.supplier_id)
          .maybeSingle();

        if (existingLink) {
          // Update existing link
          await supabase
            .from('product_suppliers')
            .update({
              supplier_price: offer.price_per_unit,
              is_active: true,
              is_primary: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLink.id);
        } else {
          // Create new link
          const { error: linkError } = await supabase.from('product_suppliers').insert({
            product_id: assignedProductId,
            supplier_id: offer.supplier_id,
            supplier_price: offer.price_per_unit,
            is_active: true,
            is_primary: true,
          });

          if (linkError) throw linkError;
        }
      }

      return { ...data, assignedProductId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_offers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product_suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['pricing_spreadsheet'] });
    },
  });

  // Reject offer mutation
  const rejectOfferMutation = useMutation({
    mutationFn: async ({
      offerId,
      rejectionReason,
      adminNotes,
    }: {
      offerId: string;
      rejectionReason: string;
      adminNotes?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('supplier_offers')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          admin_notes: adminNotes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', offerId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_offers'] });
    },
  });

  // Convert offer to product mutation (link to existing or create new)
  const convertToProductMutation = useMutation({
    mutationFn: async ({
      offerId,
      productLinkage,
    }: {
      offerId: string;
      productLinkage:
        | {
            type: 'existing';
            productId: string;
          }
        | {
            type: 'new';
            productData: {
              name_fr: string;
              category_id: string;
              sku?: string;
              purchase_unit: string;
              cost_price: number;
              b2c_selling_quantity: number;
              b2c_selling_unit: string;
              b2c_multiplier: number;
              b2b_selling_quantity: number;
              b2b_selling_unit: string;
              b2b_multiplier: number;
              initial_stock: number;
            };
          };
    }) => {
      // Fetch the offer
      const { data: offer, error: offerError } = await supabase
        .from('supplier_offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      let productId: string;

      if (productLinkage.type === 'existing') {
        // Link to existing product
        productId = productLinkage.productId;
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name_fr: productLinkage.productData.name_fr,
            category_id: productLinkage.productData.category_id,
            sku: productLinkage.productData.sku || `SKU-${Date.now()}`,
            purchase_unit: productLinkage.productData.purchase_unit,
            cost_price: productLinkage.productData.cost_price,
            b2c_selling_quantity: productLinkage.productData.b2c_selling_quantity,
            b2c_selling_unit: productLinkage.productData.b2c_selling_unit,
            b2c_multiplier: productLinkage.productData.b2c_multiplier,
            b2b_selling_quantity: productLinkage.productData.b2b_selling_quantity,
            b2b_selling_unit: productLinkage.productData.b2b_selling_unit,
            b2b_multiplier: productLinkage.productData.b2b_multiplier,
            stock_quantity: productLinkage.productData.initial_stock,
          })
          .select()
          .single();

        if (productError) throw productError;

        productId = newProduct.id;
      }

      // Create product_suppliers link
      const { error: linkError } = await supabase.from('product_suppliers').insert({
        product_id: productId,
        supplier_id: offer.supplier_id,
      });

      if (linkError) {
        // Check if it's a duplicate key error (link already exists)
        if (!linkError.message.includes('duplicate key')) {
          throw linkError;
        }
      }

      return { productId, offerId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_offers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product_suppliers'] });
    },
  });

  // Get offer statistics
  const getStats = () => {
    if (!offers) return { pending: 0, approved: 0, rejected: 0, total: 0 };

    return {
      pending: offers.filter((o) => o.status === 'pending').length,
      approved: offers.filter((o) => o.status === 'approved').length,
      rejected: offers.filter((o) => o.status === 'rejected').length,
      total: offers.length,
    };
  };

  // Real-time subscription for supplier_offers table
  useEffect(() => {
    const channel = supabase
      .channel('supplier_offers_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'supplier_offers',
        },
        (payload) => {
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['supplier_offers'] });
          queryClient.invalidateQueries({ queryKey: ['procurement_marketplace'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    offers: offers || [],
    isLoading,
    error,
    stats: getStats(),
    approveOffer: approveOfferMutation.mutate,
    isApproving: approveOfferMutation.isPending,
    rejectOffer: rejectOfferMutation.mutate,
    isRejecting: rejectOfferMutation.isPending,
    convertToProduct: convertToProductMutation.mutate,
    isConverting: convertToProductMutation.isPending,
  };
}
