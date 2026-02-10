import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PreparationOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  created_at: string;
  picker_id: string | null;
  assigned_picker_at: string | null;
  picking_started_at: string | null;
  picking_completed_at: string | null;
  users?: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    user_type: string;
  };
  picker?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
  delivery_windows?: {
    start_time: string;
    end_time: string;
  };
  order_crates?: Array<{
    quantity: number;
    physical_crates: {
      id: string;
      name_fr: string;
      is_standard_couffin: boolean;
    };
  }>;
  item_count?: number;
  priority?: 'high' | 'normal';
}

export interface Picker {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  assigned_count: number;
  completed_today: number;
  avg_prep_time: number;
  current_order: {
    id: string;
    order_number: string;
  } | null;
  status: string;
}

export interface PreparationQueue {
  to_prepare: PreparationOrder[];
  assigned: PreparationOrder[];
  in_progress: PreparationOrder[];
  ready: PreparationOrder[];
}

export interface PreparationStats {
  to_prepare_count: number;
  in_progress_count: number;
  ready_count: number;
  avg_prep_time: number;
}

export function usePreparationData() {
  const [queue, setQueue] = useState<PreparationQueue>({
    to_prepare: [],
    assigned: [],
    in_progress: [],
    ready: [],
  });
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [stats, setStats] = useState<PreparationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Call admin-preparation Edge Function
  const callAdminPreparationFunction = async (
    method: string,
    body?: any,
    queryParams?: Record<string, string>
  ) => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('No active session');
    }

    const url = new URL(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-preparation`
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

  // Fetch preparation queue
  const fetchQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await callAdminPreparationFunction('GET');
      setQueue(data.queue);

      // Calculate stats
      const stats: PreparationStats = {
        to_prepare_count: data.queue.to_prepare.length,
        in_progress_count: data.queue.in_progress.length,
        ready_count: data.queue.ready.length,
        avg_prep_time: 0,
      };

      // Calculate average prep time from in_progress and ready orders
      const ordersWithTime = [
        ...data.queue.in_progress,
        ...data.queue.ready,
      ].filter(
        (o: PreparationOrder) =>
          o.picking_started_at &&
          (o.picking_completed_at || o.status === 'preparing')
      );

      if (ordersWithTime.length > 0) {
        const totalTime = ordersWithTime.reduce((sum: number, order: PreparationOrder) => {
          const start = new Date(order.picking_started_at!).getTime();
          const end = order.picking_completed_at
            ? new Date(order.picking_completed_at).getTime()
            : new Date().getTime();
          return sum + (end - start);
        }, 0);
        stats.avg_prep_time = Math.round(totalTime / ordersWithTime.length / 60000); // minutes
      }

      setStats(stats);
    } catch (err) {
      console.error('Error fetching preparation queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch queue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch pickers
  const fetchPickers = useCallback(async () => {
    try {
      const data = await callAdminPreparationFunction('GET', undefined, {
        action: 'pickers',
      });
      setPickers(data.pickers || []);
    } catch (err) {
      console.error('Error fetching pickers:', err);
    }
  }, []);

  // Assign picker to order
  const assignPicker = async (orderId: string, pickerId: string): Promise<void> => {
    await callAdminPreparationFunction('POST', {
      action: 'assign_picker',
      order_id: orderId,
      picker_id: pickerId,
    });
    await Promise.all([fetchQueue(), fetchPickers()]);
  };

  // Auto-distribute orders
  const autoDistribute = async (): Promise<{ assigned: number; message: string }> => {
    const data = await callAdminPreparationFunction('POST', {
      action: 'auto_distribute',
      order_id: 'dummy', // Required by function but not used
    });
    await Promise.all([fetchQueue(), fetchPickers()]);
    return { assigned: data.assigned, message: data.message };
  };

  // Start preparation
  const startPreparation = async (orderId: string): Promise<void> => {
    await callAdminPreparationFunction('POST', {
      action: 'start_preparation',
      order_id: orderId,
    });
    await Promise.all([fetchQueue(), fetchPickers()]);
  };

  // Complete preparation
  const completePreparation = async (orderId: string): Promise<void> => {
    await callAdminPreparationFunction('POST', {
      action: 'complete_preparation',
      order_id: orderId,
    });
    await Promise.all([fetchQueue(), fetchPickers()]);
  };

  // Update couffins for order
  const updateCouffins = async (orderId: string, quantity: number): Promise<void> => {
    await callAdminPreparationFunction('POST', {
      action: 'update_couffins',
      order_id: orderId,
      quantity,
    });
    await Promise.all([fetchQueue(), fetchPickers()]);
  };

  // Initial fetch
  useEffect(() => {
    fetchQueue();
    fetchPickers();
  }, [fetchQueue, fetchPickers]);

  return {
    queue,
    pickers,
    stats,
    isLoading,
    error,
    fetchQueue,
    fetchPickers,
    assignPicker,
    autoDistribute,
    startPreparation,
    completePreparation,
    updateCouffins,
  };
}
