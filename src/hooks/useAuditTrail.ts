import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AuditTrailEntry {
  id: string;
  order_id: string;
  status: string; // Current column name in database
  changed_by: string | null;
  created_at: string; // Actual column name (not changed_at)
  notes: string | null;
  changed_by_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_type: string;
  };
}

export interface AuditTrailFilters {
  order_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}

/**
 * Hook for accessing order status history (audit trail)
 *
 * Features:
 * - Fetch status history for specific order
 * - Fetch all status changes (admin audit log)
 * - Filter by order, user, date range, status type
 * - Real-time subscription for live updates
 */
export function useAuditTrail(filters: AuditTrailFilters = {}) {
  const queryClient = useQueryClient();

  // Memoize filters to create stable queryKey
  const filterKey = useMemo(
    () => JSON.stringify(filters),
    [filters.order_id, filters.user_id, filters.date_from, filters.date_to, filters.status]
  );

  // Fetch audit trail entries
  const {
    data: auditEntries,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['audit_trail', filterKey],
    queryFn: async (): Promise<AuditTrailEntry[]> => {
      let query = supabase
        .from('order_status_history')
        .select(`
          *,
          changed_by_user:users!changed_by(id, first_name, last_name, user_type)
        `)
        .order('created_at', { ascending: false }); // Fixed: use created_at instead of changed_at

      // Apply filters
      if (filters.order_id) {
        query = query.eq('order_id', filters.order_id);
      }

      if (filters.user_id) {
        query = query.eq('changed_by', filters.user_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from); // Fixed: use created_at
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to); // Fixed: use created_at
      }

      if (filters.status) {
        query = query.eq('status', filters.status); // Fixed: use status instead of new_status
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data as AuditTrailEntry[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: false, // DISABLED - no automatic refetching
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Real-time subscription for audit trail updates
  useEffect(() => {
    const channel = supabase
      .channel('audit_trail_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Only listen to new entries
          schema: 'public',
          table: 'order_status_history',
          filter: filters.order_id ? `order_id=eq.${filters.order_id}` : undefined,
        },
        (payload) => {
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['audit_trail'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, filters.order_id]);

  // Get statistics
  const getStats = () => {
    if (!auditEntries) return { total_changes: 0, unique_orders: 0, unique_users: 0 };

    const uniqueOrders = new Set(auditEntries.map((e) => e.order_id));
    const uniqueUsers = new Set(auditEntries.filter((e) => e.changed_by).map((e) => e.changed_by));

    return {
      total_changes: auditEntries.length,
      unique_orders: uniqueOrders.size,
      unique_users: uniqueUsers.size,
    };
  };

  return {
    auditEntries: auditEntries || [],
    isLoading,
    error,
    refetch,
    stats: getStats(),
  };
}

/**
 * Hook to get audit trail for a specific order
 * Convenience wrapper around useAuditTrail with order_id filter
 */
export function useOrderAuditTrail(orderId: string) {
  return useAuditTrail({ order_id: orderId });
}
