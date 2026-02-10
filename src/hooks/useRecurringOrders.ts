import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface RecurringSchedule {
  id: string;
  user_id: string;
  template_order_id?: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  frequency_value: number; // e.g., every 2 weeks
  day_of_week?: number; // 0-6 for weekly
  day_of_month?: number; // 1-31 for monthly
  start_date: string;
  end_date?: string;
  next_order_date?: string;
  is_active: boolean;
  delivery_address_id?: string;
  delivery_window_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  client_name?: string;
  address_label?: string;
  template_order?: {
    order_number: string;
    total: number;
    items_count: number;
  };
}

export interface CreateRecurringScheduleData {
  user_id: string;
  template_order_id?: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  frequency_value: number;
  day_of_week?: number;
  day_of_month?: number;
  start_date: string;
  end_date?: string;
  delivery_address_id?: string;
  delivery_window_id?: string;
  notes?: string;
}

export interface UpdateRecurringScheduleData extends Partial<CreateRecurringScheduleData> {
  is_active?: boolean;
}

export const useRecurringOrders = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate next order date based on frequency
   */
  const calculateNextOrderDate = useCallback((
    startDate: Date,
    frequency: 'daily' | 'weekly' | 'monthly',
    frequencyValue: number,
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Date => {
    const next = new Date(startDate);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + frequencyValue);
        break;
      case 'weekly':
        const daysUntilTarget = dayOfWeek !== undefined
          ? (dayOfWeek - next.getDay() + 7) % 7 || 7
          : 0;
        next.setDate(next.getDate() + daysUntilTarget + (frequencyValue - 1) * 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + frequencyValue);
        if (dayOfMonth) {
          next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        }
        break;
    }

    return next;
  }, []);

  /**
   * Fetch all recurring schedules for a client
   */
  const fetchClientSchedules = useCallback(async (
    clientId: string
  ): Promise<RecurringSchedule[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('recurring_order_schedules')
        .select(`
          *,
          users!recurring_order_schedules_user_id_fkey (
            first_name,
            last_name,
            company_name
          ),
          addresses!recurring_order_schedules_delivery_address_id_fkey (
            street_address,
            city
          )
        `)
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform data
      const schedules: RecurringSchedule[] = (data || []).map((schedule: any) => ({
        ...schedule,
        client_name: schedule.users?.company_name ||
          `${schedule.users?.first_name || ''} ${schedule.users?.last_name || ''}`.trim(),
        address_label: schedule.addresses
          ? `${schedule.addresses.street_address}, ${schedule.addresses.city}`
          : undefined,
      }));

      return schedules;
    } catch (err: any) {
      console.error('Error fetching recurring schedules:', err);
      setError(err.message || 'Failed to fetch recurring schedules');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch all active recurring schedules (for admin overview)
   */
  const fetchAllActiveSchedules = useCallback(async (): Promise<RecurringSchedule[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('recurring_order_schedules')
        .select(`
          *,
          users!recurring_order_schedules_user_id_fkey (
            first_name,
            last_name,
            company_name
          ),
          addresses!recurring_order_schedules_delivery_address_id_fkey (
            street_address,
            city
          )
        `)
        .eq('is_active', true)
        .order('next_order_date', { ascending: true });

      if (fetchError) throw fetchError;

      const schedules: RecurringSchedule[] = (data || []).map((schedule: any) => ({
        ...schedule,
        client_name: schedule.users?.company_name ||
          `${schedule.users?.first_name || ''} ${schedule.users?.last_name || ''}`.trim(),
        address_label: schedule.addresses
          ? `${schedule.addresses.street_address}, ${schedule.addresses.city}`
          : undefined,
      }));

      return schedules;
    } catch (err: any) {
      console.error('Error fetching active schedules:', err);
      setError(err.message || 'Failed to fetch active schedules');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new recurring schedule
   */
  const createSchedule = useCallback(async (
    scheduleData: CreateRecurringScheduleData
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate next order date
      const startDate = new Date(scheduleData.start_date);
      const nextOrderDate = calculateNextOrderDate(
        startDate,
        scheduleData.frequency,
        scheduleData.frequency_value,
        scheduleData.day_of_week,
        scheduleData.day_of_month
      );

      const { error: insertError } = await supabase
        .from('recurring_order_schedules')
        .insert({
          ...scheduleData,
          next_order_date: nextOrderDate.toISOString().split('T')[0],
          is_active: true,
        });

      if (insertError) throw insertError;

      return true;
    } catch (err: any) {
      console.error('Error creating recurring schedule:', err);
      setError(err.message || 'Failed to create recurring schedule');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [calculateNextOrderDate]);

  /**
   * Update an existing recurring schedule
   */
  const updateSchedule = useCallback(async (
    scheduleId: string,
    updates: UpdateRecurringScheduleData
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // If frequency or start date changed, recalculate next order date
      let nextOrderDate: string | undefined;
      if (updates.start_date || updates.frequency || updates.frequency_value) {
        // Fetch current schedule to get missing values
        const { data: current } = await supabase
          .from('recurring_order_schedules')
          .select('*')
          .eq('id', scheduleId)
          .single();

        if (current) {
          const startDate = new Date(updates.start_date || current.start_date);
          const calculated = calculateNextOrderDate(
            startDate,
            updates.frequency || current.frequency,
            updates.frequency_value ?? current.frequency_value,
            updates.day_of_week ?? current.day_of_week,
            updates.day_of_month ?? current.day_of_month
          );
          nextOrderDate = calculated.toISOString().split('T')[0];
        }
      }

      const updateData = {
        ...updates,
        ...(nextOrderDate && { next_order_date: nextOrderDate }),
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('recurring_order_schedules')
        .update(updateData)
        .eq('id', scheduleId);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error('Error updating recurring schedule:', err);
      setError(err.message || 'Failed to update recurring schedule');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [calculateNextOrderDate]);

  /**
   * Delete a recurring schedule
   */
  const deleteSchedule = useCallback(async (scheduleId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('recurring_order_schedules')
        .delete()
        .eq('id', scheduleId);

      if (deleteError) throw deleteError;

      return true;
    } catch (err: any) {
      console.error('Error deleting recurring schedule:', err);
      setError(err.message || 'Failed to delete recurring schedule');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Pause/Resume a recurring schedule
   */
  const toggleSchedule = useCallback(async (
    scheduleId: string,
    isActive: boolean
  ): Promise<boolean> => {
    return updateSchedule(scheduleId, { is_active: isActive });
  }, [updateSchedule]);

  /**
   * Trigger a recurring order manually (create order from schedule)
   */
  const triggerRecurringOrder = useCallback(async (
    scheduleId: string
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch schedule details
      const { data: schedule, error: scheduleError } = await supabase
        .from('recurring_order_schedules')
        .select(`
          *,
          template_order:orders!recurring_order_schedules_template_order_id_fkey (
            id,
            subtotal,
            total,
            delivery_fee,
            discount,
            tax_rate,
            tax_amount,
            payment_method,
            notes
          )
        `)
        .eq('id', scheduleId)
        .single();

      if (scheduleError) throw scheduleError;
      if (!schedule) throw new Error('Schedule not found');

      // Fetch template order items if template exists
      let orderItems: any[] = [];
      if (schedule.template_order_id) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', schedule.template_order_id);

        if (itemsError) throw itemsError;
        orderItems = items || [];
      }

      if (orderItems.length === 0) {
        throw new Error('No items found in template order');
      }

      // Generate new order number
      const orderNumber = `REC-${Date.now()}`;

      // Create new order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: schedule.user_id,
          order_number: orderNumber,
          status: 'placed',
          subtotal: schedule.template_order?.subtotal || 0,
          total: schedule.template_order?.total || 0,
          delivery_fee: schedule.template_order?.delivery_fee || 0,
          discount: schedule.template_order?.discount || 0,
          tax_rate: schedule.template_order?.tax_rate || 0,
          tax_amount: schedule.template_order?.tax_amount || 0,
          payment_method: schedule.template_order?.payment_method || 'cash',
          payment_status: 'pending',
          delivery_address_id: schedule.delivery_address_id,
          delivery_window_id: schedule.delivery_window_id,
          is_recurring_order: true,
          recurring_schedule_id: schedule.id,
          parent_recurring_order_id: schedule.template_order_id,
          notes: schedule.notes || schedule.template_order?.notes,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      if (!newOrder) throw new Error('Failed to create order');

      // Copy order items
      const newOrderItems = orderItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        product_sku: item.product_sku,
        product_name_fr: item.product_name_fr,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        notes: item.notes,
      }));

      const { error: itemsInsertError } = await supabase
        .from('order_items')
        .insert(newOrderItems);

      if (itemsInsertError) throw itemsInsertError;

      // Update schedule with next order date
      const nextDate = calculateNextOrderDate(
        new Date(schedule.next_order_date || schedule.start_date),
        schedule.frequency,
        schedule.frequency_value,
        schedule.day_of_week,
        schedule.day_of_month
      );

      await supabase
        .from('recurring_order_schedules')
        .update({
          next_order_date: nextDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId);

      return newOrder.id;
    } catch (err: any) {
      console.error('Error triggering recurring order:', err);
      setError(err.message || 'Failed to trigger recurring order');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [calculateNextOrderDate]);

  return {
    isLoading,
    error,
    fetchClientSchedules,
    fetchAllActiveSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    triggerRecurringOrder,
  };
};
