import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Picker {
  id: string;
  phone: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  current_assigned?: number;
  completed_today?: number;
  total_completed?: number;
}

export interface PickerStats {
  current_assigned: number;
  in_progress: Array<{
    id: string;
    order_number: string;
    picking_started_at: string;
  }>;
  completed_today: number;
  completed_week: number;
  completed_month: number;
  total_completed: number;
  avg_prep_time: number;
  min_prep_time: number;
  max_prep_time: number;
  accuracy_rate: number;
  recent_orders: Array<{
    id: string;
    order_number: string;
    picking_started_at: string;
    picking_completed_at: string;
    users?: {
      first_name: string | null;
      last_name: string | null;
      company_name: string | null;
    };
  }>;
}

export interface PickerDetails extends Picker {
  stats: PickerStats;
}

export interface CreatePickerInput {
  phone: string;
  email?: string;
  first_name: string;
  last_name: string;
}

export interface UpdatePickerInput {
  picker_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

export function usePickersData() {
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Call admin-pickers Edge Function
  const callAdminPickersFunction = async (
    method: string,
    body?: any,
    queryParams?: Record<string, string>
  ) => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('No active session');
    }

    const url = new URL(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-pickers`
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

  // Fetch all pickers
  const fetchPickers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await callAdminPickersFunction('GET');
      setPickers(data.pickers || []);
    } catch (err) {
      console.error('Error fetching pickers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pickers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch single picker with detailed stats
  const fetchPickerDetails = async (pickerId: string): Promise<PickerDetails> => {
    const data = await callAdminPickersFunction('GET', undefined, { id: pickerId });
    return data.picker;
  };

  // Create new picker
  const createPicker = async (input: CreatePickerInput): Promise<void> => {
    await callAdminPickersFunction('POST', input);
    await fetchPickers();
  };

  // Update picker
  const updatePicker = async (input: UpdatePickerInput): Promise<void> => {
    await callAdminPickersFunction('PUT', input);
    await fetchPickers();
  };

  // Delete (deactivate) picker
  const deletePicker = async (pickerId: string): Promise<void> => {
    await callAdminPickersFunction('DELETE', undefined, { id: pickerId });
    await fetchPickers();
  };

  // Toggle picker active status
  const togglePickerStatus = async (pickerId: string, currentStatus: boolean): Promise<void> => {
    await callAdminPickersFunction('PUT', {
      picker_id: pickerId,
      is_active: !currentStatus,
    });
    await fetchPickers();
  };

  // Initial fetch
  useEffect(() => {
    fetchPickers();
  }, [fetchPickers]);

  return {
    pickers,
    isLoading,
    error,
    fetchPickers,
    fetchPickerDetails,
    createPicker,
    updatePicker,
    deletePicker,
    togglePickerStatus,
  };
}
