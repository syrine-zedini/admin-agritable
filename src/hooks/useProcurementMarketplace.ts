import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SupplierOffer, useSupplierOffers } from './useSupplierOffers';
import { DemandRequest, DemandResponse, useDemandRequests } from './useDemandRequests';

export interface ProductProcurement {
  // Product info
  product_id: string;
  product_name: string;
  sku: string;
  category_id: string | null;
  category_name: string | null;
  current_stock: number;
  besoin: number | null;
  commande: number | null;
  supplier_offers: SupplierOffer[];
  pending_offers_count: number;
  demand_requests: Array<DemandRequest & { demand_responses?: DemandResponse[] }>;
  active_demand_count: number;
  total_responses_count: number;
}

export interface ProcurementMarketplaceFilters {
  search?: string;
  category_id?: string;
  view?: 'all' | 'with_offers' | 'with_demands' | 'low_stock';
}

export function useProcurementMarketplace(filters: ProcurementMarketplaceFilters = {}) {
  const queryClient = useQueryClient();
  const { offers: allOffers, isLoading: isLoadingOffers } = useSupplierOffers({ status: 'all' });
  const { requests: allRequests, isLoading: isLoadingRequests } = useDemandRequests({ status: 'all' });

  const {
    data: productProcurements,
    isLoading: isLoadingProducts,
    error,
  } = useQuery({
    queryKey: ['procurement_marketplace', filters, allOffers, allRequests],
    queryFn: async (): Promise<ProductProcurement[]> => {
      let productsQuery = supabase
        .from('products')
        .select('id, sku, name_fr, category_id, stock_quantity, besoin, commande, is_active, category:categories(name_fr)')
        .eq('is_active', true)
        .order('name_fr');

      if (filters.category_id) {
        productsQuery = productsQuery.eq('category_id', filters.category_id);
      }

      if (filters.search) {
        productsQuery = productsQuery.ilike('name_fr', `%${filters.search}%`);
      }

      const { data: products, error: productsError } = await productsQuery;
      if (productsError) throw productsError;
      if (!products) return [];

      const procurements: ProductProcurement[] = products.map((product) => {
        const productName = product.name_fr.toLowerCase().trim();
        const matchingOffers = (allOffers || []).filter((offer) => offer.product_name.toLowerCase().trim() === productName);
        const pendingOffers = matchingOffers.filter((o) => o.status === 'pending');
        const matchingRequests = (allRequests || []).filter((request) => request.product_name.toLowerCase().trim() === productName);
        const activeRequests = matchingRequests.filter((r) => r.status === 'pending' || r.status === 'partially_fulfilled');
        const totalResponses = matchingRequests.reduce((sum, req) => sum + (req.demand_responses?.length || 0), 0);

        return {
          product_id: product.id,
          product_name: product.name_fr,
          sku: product.sku,
          category_id: product.category_id,
          category_name: product.category?.name_fr || null,
          current_stock: product.stock_quantity || 0,
          besoin: product.besoin,
          commande: product.commande,
          supplier_offers: matchingOffers,
          pending_offers_count: pendingOffers.length,
          demand_requests: matchingRequests,
          active_demand_count: activeRequests.length,
          total_responses_count: totalResponses,
        };
      });

      let filteredProcurements = procurements;
      if (filters.view === 'with_offers') {
        filteredProcurements = filteredProcurements.filter((p) => p.supplier_offers.length > 0);
      } else if (filters.view === 'with_demands') {
        filteredProcurements = filteredProcurements.filter((p) => p.demand_requests.length > 0);
      } else if (filters.view === 'low_stock') {
        filteredProcurements = filteredProcurements.filter((p) => p.current_stock < (p.besoin || 0) && p.besoin && p.besoin > 0);
      }

      filteredProcurements.sort((a, b) => {
        const aHasActivity = a.pending_offers_count + a.active_demand_count;
        const bHasActivity = b.pending_offers_count + b.active_demand_count;
        if (aHasActivity > 0 && bHasActivity === 0) return -1;
        if (aHasActivity === 0 && bHasActivity > 0) return 1;
        const aBesoin = a.besoin || 0;
        const bBesoin = b.besoin || 0;
        return bBesoin - aBesoin;
      });

      return filteredProcurements;
    },
    enabled: !isLoadingOffers && !isLoadingRequests,
    staleTime: 1000 * 60 * 2,
  });

  const getStats = () => {
    if (!productProcurements) {
      return {
        total_products: 0,
        products_with_offers: 0,
        products_with_demands: 0,
        total_pending_offers: 0,
        total_active_demands: 0,
        low_stock_products: 0,
      };
    }
    return {
      total_products: productProcurements.length,
      products_with_offers: productProcurements.filter((p) => p.supplier_offers.length > 0).length,
      products_with_demands: productProcurements.filter((p) => p.demand_requests.length > 0).length,
      total_pending_offers: productProcurements.reduce((sum, p) => sum + p.pending_offers_count, 0),
      total_active_demands: productProcurements.reduce((sum, p) => sum + p.active_demand_count, 0),
      low_stock_products: productProcurements.filter((p) => p.current_stock < (p.besoin || 0) && p.besoin && p.besoin > 0).length,
    };
  };

  // Real-time subscription for products table (stock levels)
  useEffect(() => {
    const channel = supabase
      .channel('products_stock_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Only listen to updates for stock levels
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['procurement_marketplace'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    productProcurements: productProcurements || [],
    isLoading: isLoadingProducts || isLoadingOffers || isLoadingRequests,
    error,
    stats: getStats(),
  };
}
