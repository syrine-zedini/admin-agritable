import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  delivery_address_id: string | null;
  delivery_window_id: string | null;
  delivery_notes: string | null;
  status: 'placed' | 'preparing' | 'ready_for_pickup' | 'on_the_way' | 'delivered' | 'cancelled';
  cancellation_reason: string | null;
  cancelled_at: string | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: 'clicktopay' | 'cash' | 'check' | 'bank_transfer' | 'wallet';
  payment_status: string;
  paid_at: string | null;
  picker_id: string | null;
  deliverer_id: string | null;
  assigned_picker_at: string | null;
  assigned_deliverer_at: string | null;
  picking_started_at: string | null;
  picking_completed_at: string | null;
  ready_for_pickup_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  customer_rating: number | null;
  customer_feedback: string | null;
  notes: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    user_type: string;
    company_name: string | null;
  };
  addresses?: {
    city: string;
  };
  deliverer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
  item_count?: number;
}

export interface OrderDetails extends Order {
  items: OrderItem[];
  status_history: OrderStatusHistory[];
  delivery_windows?: {
    id: string;
    start_time: string;
    end_time: string;
    day_of_week: number;
  };
  picker?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
  order_crates?: any
  priority: any
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_fr: string;
  product_name_ar: string | null;
  product_name_tn: string | null;
  product_sku: string | null;
  product_image_url: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  picked_quantity: number | null;
  replacement_product_id: string | null;
  replacement_notes: string | null;
  created_at: string;
  products?: {
    id: string;
    name_fr: string;
    name_ar: string | null;
    name_tn: string | null;
    sku: string;
    unit: string;
    images: string[];
  };
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  changed_by: string;
  notes: string | null;
  created_at: string;
  changed_by_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  preparing_orders: number;
  on_route_orders: number;
  delivered_today: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
}

export interface OrderFilters {
  status?: string;
  user_type?: string;
  user_id?: string; // Filter by specific customer
  search?: string;
  start_date?: string;
  end_date?: string;
  deliverer_id?: string;
  limit?: number;
  offset?: number;
}

export function useOrdersData() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false
  });

  // Call admin-orders Edge Function
  const callAdminOrdersFunction = async (
    method: string,
    body?: any,
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
  };

  // Fetch orders with filters
  const fetchOrders = useCallback(async (filters?: OrderFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams: Record<string, string> = {
        limit: (filters?.limit || 50).toString(),
        offset: (filters?.offset || 0).toString(),
      };

      if (filters?.status) queryParams.status = filters.status;
      if (filters?.user_type) queryParams.user_type = filters.user_type;
      if (filters?.user_id) queryParams.user_id = filters.user_id;
      if (filters?.search) queryParams.search = filters.search;
      if (filters?.start_date) queryParams.start_date = filters.start_date;
      if (filters?.end_date) queryParams.end_date = filters.end_date;
      if (filters?.deliverer_id) queryParams.deliverer_id = filters.deliverer_id;

      const data = await callAdminOrdersFunction('GET', undefined, queryParams);

      setOrders(data.orders || []);
      setPagination(data.pagination || { total: 0, limit: 50, offset: 0, has_more: false });
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch single order details
  const fetchOrderDetails = async (orderId: string): Promise<OrderDetails> => {
    const data = await callAdminOrdersFunction('GET', undefined, { id: orderId });
    return data.order;
  };

  // Calculate statistics
  const fetchStats = useCallback(async () => {
    try {
      // Fetch all orders for stats (we could optimize this with a dedicated endpoint)
      const data = await callAdminOrdersFunction('GET', undefined, { limit: '10000' });
      const allOrders = data.orders || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const stats: OrderStats = {
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
      };

      setStats(stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Update order status
  const updateOrderStatus = async (
    orderId: string,
    status: string,
    notes?: string
  ): Promise<void> => {
    await callAdminOrdersFunction('PUT', {
      order_id: orderId,
      status,
      notes,
    });
    await fetchOrders(); // Refresh list
  };

  // Assign deliverer to order
  const assignDeliverer = async (orderId: string, delivererId: string | null): Promise<void> => {
    await callAdminOrdersFunction('PUT', {
      order_id: orderId,
      deliverer_id: delivererId,
    });
    await fetchOrders(); // Refresh list
  };

  // Cancel order
  const cancelOrder = async (orderId: string, reason: string): Promise<void> => {
    await callAdminOrdersFunction('PUT', {
      order_id: orderId,
      status: 'cancelled',
      notes: reason,
    });
    await fetchOrders(); // Refresh list
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  return {
    orders,
    stats,
    isLoading,
    error,
    pagination,
    fetchOrders,
    fetchOrderDetails,
    fetchStats,
    updateOrderStatus,
    assignDeliverer,
    cancelOrder,
  };
}
