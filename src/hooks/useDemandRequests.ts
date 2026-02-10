import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DemandRequest {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  target_price: number;
  deadline: string;
  tagged_suppliers: string[];
  status: 'pending' | 'partially_fulfilled' | 'fulfilled' | 'cancelled';
  requested_by_admin: string;
  created_at: string;
  updated_at: string;
  admin?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
  demand_responses?: DemandResponse[];
}

export interface DemandResponse {
  id: string;
  demand_request_id: string;
  supplier_id: string;
  quantity_offered: number;
  price_per_unit: number;
  availability_date: string | null;
  notes: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    phone: string | null;
  };
  demand_request?: DemandRequest;
}

export interface DemandRequestsFilters {
  status?: 'pending' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'all';
  search?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Hook for managing demand requests (admins requesting produce from suppliers)
 */
export function useDemandRequests(filters: DemandRequestsFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch demand requests with filters
  const {
    data: requests,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['demand_requests', filters],
    queryFn: async (): Promise<DemandRequest[]> => {
      let query = supabase
        .from('demand_requests')
        .select(
          `
          *,
          admin:users!requested_by_admin(id, first_name, last_name),
          demand_responses (
            id,
            supplier_id,
            quantity_offered,
            price_per_unit,
            availability_date,
            status,
            supplier:users!supplier_id(id, first_name, last_name, company_name, phone)
          )
        `
        )
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply search filter (product name)
      if (filters.search) {
        query = query.ilike('product_name', `%${filters.search}%`);
      }

      // Apply date range filters
      if (filters.date_from) {
        query = query.gte('deadline', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('deadline', filters.date_to);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data as DemandRequest[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create demand request mutation
  const createDemandRequestMutation = useMutation({
    mutationFn: async ({
      productName,
      quantity,
      unit,
      targetPrice,
      deadline,
      taggedSuppliers,
    }: {
      productName: string;
      quantity: number;
      unit: string;
      targetPrice: number;
      deadline: string;
      taggedSuppliers: string[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('demand_requests')
        .insert({
          product_name: productName,
          quantity,
          unit,
          target_price: targetPrice,
          deadline,
          tagged_suppliers: taggedSuppliers,
          requested_by_admin: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send notifications to tagged suppliers
      // This would typically trigger a notification system

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand_requests'] });
    },
  });

  // Fetch responses for a specific demand request
  const fetchDemandResponses = (requestId: string) => {
    return useQuery({
      queryKey: ['demand_responses', requestId],
      queryFn: async (): Promise<DemandResponse[]> => {
        const { data, error } = await supabase
          .from('demand_responses')
          .select(
            `
            *,
            supplier:users!supplier_id(id, first_name, last_name, company_name, phone),
            demand_request:demand_requests!demand_request_id(*)
          `
          )
          .eq('demand_request_id', requestId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return data as DemandResponse[];
      },
      enabled: !!requestId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Accept demand response mutation (enhanced with auto product-supplier linking)
  const acceptDemandResponseMutation = useMutation({
    mutationFn: async ({
      responseId,
      productId,
      productData,
    }: {
      responseId: string;
      productId?: string;
      productData?: {
        sku: string;
        name_fr: string;
        category_id?: string;
        purchase_unit: string;
        cost_price: number;
      };
    }) => {
      // Fetch the demand response
      const { data: response, error: responseError } = await supabase
        .from('demand_responses')
        .select('supplier_id, price_per_unit, demand_request_id')
        .eq('id', responseId)
        .single();

      if (responseError) throw responseError;

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
          .eq('supplier_id', response.supplier_id)
          .maybeSingle();

        if (existingLink) {
          // Update existing link
          await supabase
            .from('product_suppliers')
            .update({
              supplier_price: response.price_per_unit,
              is_active: true,
              is_primary: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLink.id);
        } else {
          // Create new link
          const { error: linkError } = await supabase.from('product_suppliers').insert({
            product_id: assignedProductId,
            supplier_id: response.supplier_id,
            supplier_price: response.price_per_unit,
            is_active: true,
            is_primary: true,
          });

          if (linkError) throw linkError;
        }
      }

      // Update demand response status
      const { error: updateResponseError } = await supabase
        .from('demand_responses')
        .update({ status: 'accepted' })
        .eq('id', responseId);

      if (updateResponseError) throw updateResponseError;

      // Check if all responses for this demand request are accepted or rejected
      const { data: allResponses, error: allResponsesError } = await supabase
        .from('demand_responses')
        .select('status')
        .eq('demand_request_id', response.demand_request_id);

      if (allResponsesError) throw allResponsesError;

      const pendingResponses = allResponses.filter((r) => r.status === 'pending');
      const acceptedResponses = allResponses.filter((r) => r.status === 'accepted');

      let newRequestStatus: DemandRequest['status'] = 'pending';

      if (pendingResponses.length === 0 && acceptedResponses.length > 0) {
        // All responses reviewed and at least one accepted
        newRequestStatus = 'fulfilled';
      } else if (acceptedResponses.length > 0) {
        // Some accepted, some still pending
        newRequestStatus = 'partially_fulfilled';
      }

      // Update demand request status if needed
      if (newRequestStatus !== 'pending') {
        await supabase
          .from('demand_requests')
          .update({ status: newRequestStatus })
          .eq('id', response.demand_request_id);
      }

      return { assignedProductId, responseId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand_requests'] });
      queryClient.invalidateQueries({ queryKey: ['demand_responses'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product_suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['pricing_spreadsheet'] });
    },
  });

  // Reject demand response mutation
  const rejectDemandResponseMutation = useMutation({
    mutationFn: async ({
      responseId,
      rejectionReason,
    }: {
      responseId: string;
      rejectionReason: string;
    }) => {
      const { error } = await supabase
        .from('demand_responses')
        .update({
          status: 'rejected',
          notes: rejectionReason,
        })
        .eq('id', responseId);

      if (error) throw error;

      return { responseId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand_requests'] });
      queryClient.invalidateQueries({ queryKey: ['demand_responses'] });
    },
  });

  // Cancel demand request mutation
  const cancelDemandRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('demand_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;

      return { requestId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand_requests'] });
    },
  });

  // Get request statistics
  const getStats = () => {
    if (!requests) return { pending: 0, partially_fulfilled: 0, fulfilled: 0, cancelled: 0, total: 0 };

    return {
      pending: requests.filter((r) => r.status === 'pending').length,
      partially_fulfilled: requests.filter((r) => r.status === 'partially_fulfilled').length,
      fulfilled: requests.filter((r) => r.status === 'fulfilled').length,
      cancelled: requests.filter((r) => r.status === 'cancelled').length,
      total: requests.length,
    };
  };

  // Real-time subscriptions for demand_requests and demand_responses tables
  useEffect(() => {
    const channel = supabase
      .channel('demand_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'demand_requests',
        },
        (payload) => {
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['demand_requests'] });
          queryClient.invalidateQueries({ queryKey: ['procurement_marketplace'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'demand_responses',
        },
        (payload) => {
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['demand_requests'] });
          queryClient.invalidateQueries({ queryKey: ['demand_responses'] });
          queryClient.invalidateQueries({ queryKey: ['procurement_marketplace'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    requests: requests || [],
    isLoading,
    error,
    stats: getStats(),
    createDemandRequest: createDemandRequestMutation.mutate,
    isCreating: createDemandRequestMutation.isPending,
    fetchDemandResponses,
    acceptDemandResponse: acceptDemandResponseMutation.mutate,
    isAccepting: acceptDemandResponseMutation.isPending,
    rejectDemandResponse: rejectDemandResponseMutation.mutate,
    isRejecting: rejectDemandResponseMutation.isPending,
    cancelDemandRequest: cancelDemandRequestMutation.mutate,
    isCancelling: cancelDemandRequestMutation.isPending,
  };
}
