import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Order, OrderDetails, OrderStats, OrderFilters } from './useOrdersData';

// Time in ms to keep "new" badge visible
const NEW_ORDER_HIGHLIGHT_DURATION = 10000; // 10 seconds

interface RealtimeOrderEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  order: Order;
  oldOrder?: Order;
}

interface UseRealtimeOrdersOptions {
  /** Initial filters to apply */
  filters?: OrderFilters;
  /** Enable real-time updates (default: true) */
  enableRealtime?: boolean;
  /** Callback when a new order arrives */
  onNewOrder?: (order: Order) => void;
  /** Callback when an order is updated */
  onOrderUpdate?: (order: Order, oldOrder?: Order) => void;
}

interface UseRealtimeOrdersReturn {
  orders: Order[];
  stats: OrderStats | null;
  isLoading: boolean;
  error: string | null;
  /** Set of order IDs that are "new" (just arrived via real-time) */
  newOrderIds: Set<string>;
  /** Clear the "new" status for a specific order */
  clearNewStatus: (orderId: string) => void;
  /** Clear all "new" statuses */
  clearAllNewStatus: () => void;
  /** Manually refetch orders */
  refetch: () => Promise<void>;
  /** Fetch details for a specific order */
  fetchOrderDetails: (orderId: string) => Promise<OrderDetails>;
  /** Update order status */
  updateOrderStatus: (orderId: string, status: string, notes?: string) => Promise<void>;
  /** Assign deliverer to order */
  assignDeliverer: (orderId: string, delivererId: string | null) => Promise<void>;
  /** Cancel order */
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  /** Apply new filters */
  setFilters: (filters: OrderFilters) => void;
  /** Current filters */
  currentFilters: OrderFilters;
  /** Real-time connection status */
  realtimeStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

/**
 * Hook for orders with real-time updates
 *
 * Features:
 * - Initial data fetch via Edge Function (with all filters)
 * - Real-time subscription for INSERT/UPDATE events
 * - Optimistic updates (new orders appear instantly)
 * - "New order" visual indicator with auto-expiry
 * - No full page refresh on updates
 * - Stable subscriptions (no infinite loops)
 */
export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}): UseRealtimeOrdersReturn {
  const {
    filters: initialFilters = {},
    enableRealtime = true,
    onNewOrder,
    onOrderUpdate,
  } = options;

  const queryClient = useQueryClient();

  // Stable filters state
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);

  // Track "new" order IDs for visual highlighting
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  // Real-time connection status
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Refs for cleanup timers
  const highlightTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Stable query key based on filter values
  const queryKey = useMemo(() => {
    const filterKey = JSON.stringify({
      status: filters.status,
      user_type: filters.user_type,
      user_id: filters.user_id,
      search: filters.search,
      start_date: filters.start_date,
      end_date: filters.end_date,
      deliverer_id: filters.deliverer_id,
      limit: filters.limit,
      offset: filters.offset,
    });
    return ['orders_realtime', filterKey];
  }, [
    filters.status,
    filters.user_type,
    filters.user_id,
    filters.search,
    filters.start_date,
    filters.end_date,
    filters.deliverer_id,
    filters.limit,
    filters.offset,
  ]);

  // Edge Function caller
  const callAdminOrdersFunction = useCallback(async (
    method: string,
    body?: unknown,
    queryParams?: Record<string, string>
  ) => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('No active session');
    }

    const url = new URL(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-orders`
    );

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.data.session.access_token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return await response.json();
  }, []);

  // Fetch orders query
  const {
    data: ordersData,
    isLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        limit: (filters.limit || 50).toString(),
        offset: (filters.offset || 0).toString(),
      };

      if (filters.status) queryParams.status = filters.status;
      if (filters.user_type) queryParams.user_type = filters.user_type;
      if (filters.user_id) queryParams.user_id = filters.user_id;
      if (filters.search) queryParams.search = filters.search;
      if (filters.start_date) queryParams.start_date = filters.start_date;
      if (filters.end_date) queryParams.end_date = filters.end_date;
      if (filters.deliverer_id) queryParams.deliverer_id = filters.deliverer_id;

      const data = await callAdminOrdersFunction('GET', undefined, queryParams);
      return {
        orders: (data.orders || []) as Order[],
        pagination: data.pagination || { total: 0, limit: 50, offset: 0, has_more: false },
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: false, // Rely on real-time
    refetchOnMount: true, // Fetch on first mount
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnReconnect: false, // Rely on real-time reconnect
  });

  // Fetch stats separately (less frequently)
  const { data: stats } = useQuery({
    queryKey: ['orders_stats'],
    queryFn: async () => {
      const data = await callAdminOrdersFunction('GET', undefined, { limit: '10000' });
      const allOrders = data.orders || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      return {
        total_orders: allOrders.length,
        pending_orders: allOrders.filter((o: Order) => o.status === 'placed').length,
        preparing_orders: allOrders.filter((o: Order) => o.status === 'preparing').length,
        on_route_orders: allOrders.filter((o: Order) => o.status === 'on_the_way').length,
        delivered_today: allOrders.filter(
          (o: Order) => o.status === 'delivered' && o.delivered_at && o.delivered_at >= todayStr
        ).length,
        cancelled_orders: allOrders.filter((o: Order) => o.status === 'cancelled').length,
        total_revenue: allOrders
          .filter((o: Order) => o.status === 'delivered')
          .reduce((sum: number, o: Order) => sum + parseFloat(o.total.toString()), 0),
        average_order_value:
          allOrders.length > 0
            ? allOrders.reduce((sum: number, o: Order) => sum + parseFloat(o.total.toString()), 0) /
              allOrders.length
            : 0,
      } as OrderStats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Add "new" status to an order with auto-expiry
  const addNewStatus = useCallback((orderId: string) => {
    setNewOrderIds(prev => new Set(prev).add(orderId));

    // Clear any existing timer for this order
    const existingTimer = highlightTimers.current.get(orderId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set auto-expiry timer
    const timer = setTimeout(() => {
      setNewOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      highlightTimers.current.delete(orderId);
    }, NEW_ORDER_HIGHLIGHT_DURATION);

    highlightTimers.current.set(orderId, timer);
  }, []);

  // Clear "new" status for specific order
  const clearNewStatus = useCallback((orderId: string) => {
    setNewOrderIds(prev => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });

    const timer = highlightTimers.current.get(orderId);
    if (timer) {
      clearTimeout(timer);
      highlightTimers.current.delete(orderId);
    }
  }, []);

  // Clear all "new" statuses
  const clearAllNewStatus = useCallback(() => {
    setNewOrderIds(new Set());
    highlightTimers.current.forEach(timer => clearTimeout(timer));
    highlightTimers.current.clear();
  }, []);

  // Handle real-time order event
  const handleRealtimeEvent = useCallback((event: RealtimeOrderEvent) => {
    const { type, order, oldOrder } = event;

    if (type === 'INSERT') {
      // New order - prepend to the list and add "new" status
      queryClient.setQueryData(queryKey, (old: typeof ordersData) => {
        if (!old) return old;

        // Check if order already exists (avoid duplicates)
        if (old.orders.some(o => o.id === order.id)) {
          return old;
        }

        return {
          ...old,
          orders: [order, ...old.orders],
          pagination: {
            ...old.pagination,
            total: old.pagination.total + 1,
          },
        };
      });

      addNewStatus(order.id);
      onNewOrder?.(order);

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: ['orders_stats'] });

    } else if (type === 'UPDATE') {
      // Order updated - update in place
      queryClient.setQueryData(queryKey, (old: typeof ordersData) => {
        if (!old) return old;

        return {
          ...old,
          orders: old.orders.map(o => o.id === order.id ? order : o),
        };
      });

      onOrderUpdate?.(order, oldOrder);

      // Invalidate stats if status changed
      if (oldOrder && oldOrder.status !== order.status) {
        queryClient.invalidateQueries({ queryKey: ['orders_stats'] });
      }

    } else if (type === 'DELETE') {
      // Order deleted - remove from list
      queryClient.setQueryData(queryKey, (old: typeof ordersData) => {
        if (!old) return old;

        return {
          ...old,
          orders: old.orders.filter(o => o.id !== order.id),
          pagination: {
            ...old.pagination,
            total: Math.max(0, old.pagination.total - 1),
          },
        };
      });

      queryClient.invalidateQueries({ queryKey: ['orders_stats'] });
    }
  }, [queryKey, queryClient, addNewStatus, onNewOrder, onOrderUpdate]);

  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime) {
      setRealtimeStatus('disconnected');
      return;
    }

    setRealtimeStatus('connecting');

    const channel = supabase
      .channel('orders_realtime_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          // Fetch the full order with relations from Edge Function
          // The real-time payload only has raw data without joins
          try {
            const data = await callAdminOrdersFunction('GET', undefined, { id: payload.new.id });
            if (data.order) {
              handleRealtimeEvent({ type: 'INSERT', order: data.order });
            }
          } catch (err) {
            console.error('Error fetching new order details:', err);
            // Fallback to raw payload
            handleRealtimeEvent({ type: 'INSERT', order: payload.new as Order });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          try {
            const data = await callAdminOrdersFunction('GET', undefined, { id: payload.new.id });
            if (data.order) {
              handleRealtimeEvent({
                type: 'UPDATE',
                order: data.order,
                oldOrder: payload.old as Order
              });
            }
          } catch (err) {
            console.error('Error fetching updated order details:', err);
            handleRealtimeEvent({
              type: 'UPDATE',
              order: payload.new as Order,
              oldOrder: payload.old as Order
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          handleRealtimeEvent({ type: 'DELETE', order: payload.old as Order });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CLOSED') {
          setRealtimeStatus('disconnected');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, callAdminOrdersFunction, handleRealtimeEvent]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      highlightTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Action: Fetch order details
  const fetchOrderDetails = useCallback(async (orderId: string): Promise<OrderDetails> => {
    const data = await callAdminOrdersFunction('GET', undefined, { id: orderId });
    return data.order;
  }, [callAdminOrdersFunction]);

  // Action: Update order status
  const updateOrderStatus = useCallback(async (
    orderId: string,
    status: string,
    notes?: string
  ): Promise<void> => {
    await callAdminOrdersFunction('PUT', {
      order_id: orderId,
      status,
      notes,
    });
    // Real-time will handle the update, but we can also optimistically update
    queryClient.invalidateQueries({ queryKey });
  }, [callAdminOrdersFunction, queryClient, queryKey]);

  // Action: Assign deliverer
  const assignDeliverer = useCallback(async (
    orderId: string,
    delivererId: string | null
  ): Promise<void> => {
    await callAdminOrdersFunction('PUT', {
      order_id: orderId,
      deliverer_id: delivererId,
    });
    queryClient.invalidateQueries({ queryKey });
  }, [callAdminOrdersFunction, queryClient, queryKey]);

  // Action: Cancel order
  const cancelOrder = useCallback(async (
    orderId: string,
    reason: string
  ): Promise<void> => {
    await callAdminOrdersFunction('PUT', {
      order_id: orderId,
      status: 'cancelled',
      notes: reason,
    });
    queryClient.invalidateQueries({ queryKey });
  }, [callAdminOrdersFunction, queryClient, queryKey]);

  // Refetch wrapper
  const refetch = useCallback(async () => {
    await queryRefetch();
    queryClient.invalidateQueries({ queryKey: ['orders_stats'] });
  }, [queryRefetch, queryClient]);

  return {
    orders: ordersData?.orders || [],
    stats: stats || null,
    isLoading,
    error: queryError ? (queryError as Error).message : null,
    newOrderIds,
    clearNewStatus,
    clearAllNewStatus,
    refetch,
    fetchOrderDetails,
    updateOrderStatus,
    assignDeliverer,
    cancelOrder,
    setFilters,
    currentFilters: filters,
    realtimeStatus,
  };
}
