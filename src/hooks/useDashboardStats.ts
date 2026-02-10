import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  users: {
    total: number;
    b2c: number;
    b2b: number;
    suppliers: number;
    deliverers: number;
    new_this_week: number;
  };
  orders: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
    by_status: Record<string, number>;
  };
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
    total: number;
  };
  products: {
    total_active: number;
    low_stock_count: number;
    low_stock_products: Array<{
      id: string;
      name_fr: string;
      stock: number;
      low_stock_threshold: number;
    }>;
    top_products: Array<{
      product_id: string;
      name: string;
      quantity: number;
      image: string | null;
    }>;
  };
  delivery: {
    active_routes: number;
    completed_today: number;
  };
  financial: {
    pending_payments: number;
    b2b_debt: number;
    negative_wallets: number;
  };
  supplier: {
    pending_offers: number;
    open_demands: number;
  };
}

export interface DashboardStatsResponse {
  success: boolean;
  stats: DashboardStats;
  generated_at: string;
}

/**
 * Hook for comprehensive dashboard statistics
 *
 * Features:
 * - User statistics (total, by type, new users)
 * - Order statistics (total, today, this week/month, by status)
 * - Revenue metrics (daily, weekly, monthly, total)
 * - Product metrics (active products, low stock, top products)
 * - Delivery metrics (active routes, completed today)
 * - Financial metrics (pending payments, B2B debt, negative wallets)
 * - Supplier metrics (pending offers, open demands)
 * - Real-time subscriptions for live updates
 */
export function useDashboardStats() {
  const queryClient = useQueryClient();

  // Fetch dashboard stats from edge function
  const query = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/get-dashboard-stats`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch dashboard stats' }));
        throw new Error(error.error || 'Failed to fetch dashboard stats');
      }

      const result: DashboardStatsResponse = await response.json();
      return result.stats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: false, // DISABLED - rely on manual refresh or real-time updates
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // DISABLED: Real-time subscriptions - they were causing excessive invalidations
  // Dashboard stats will update on manual refresh or when navigating back to dashboard
  // If you need real-time updates, consider:
  // 1. Using a longer debounce (30+ seconds)
  // 2. Batching multiple table changes into one invalidation
  // 3. Only subscribing to critical tables (orders, delivery_routes)

  // Uncomment below ONLY if real-time updates are absolutely necessary
  /*
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const channel = supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
          }, 30000); // 30 second debounce
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  */

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}
