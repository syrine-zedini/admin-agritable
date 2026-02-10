import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface B2BClientProfile {
  id: string;
  email: string | null;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  tax_id: string | null;
  business_registration_number: string | null;
  institution_type: string | null;
  validation_status: string | null;
  validated_at: string | null;
  validated_by: string | null;
  is_active: boolean;
  created_at: string;
  business_documents: any;
}

export interface ClientLedger {
  id: string;
  balance: number;
  credit_limit: number;
  created_at: string;
  updated_at: string;
}

export interface ClientOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
  delivered_at: string | null;
  delivery_address: {
    street_address?: string;
    city?: string;
  } | null;
}

export interface ClientStats {
  total_orders: number;
  total_paid: number;
  avg_order_value: number;
  pending_quotes: number;
  pending_payments: number;
  last_order_date: string | null;
}

export const useB2BClientProfile = (clientId?: string) => {
  const [profile, setProfile] = useState<B2BClientProfile | null>(null);
  const [ledger, setLedger] = useState<ClientLedger | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    total_orders: 0,
    total_paid: 0,
    avg_order_value: 0,
    pending_quotes: 0,
    pending_payments: 0,
    last_order_date: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientProfile = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch client profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('user_type', 'b2b')
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch client ledger
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('b2b_ledgers')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

      if (ledgerError && ledgerError.code !== 'PGRST116') throw ledgerError;

      // If no ledger exists, create one
      if (!ledgerData) {
        const { data: newLedger, error: createError } = await supabase
          .from('b2b_ledgers')
          .insert({
            user_id: id,
            balance: 0,
            credit_limit: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        setLedger(newLedger);
      } else {
        setLedger(ledgerData);
      }

      // Fetch client orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          payment_method,
          payment_status,
          created_at,
          delivered_at,
          delivery_address:addresses!orders_delivery_address_id_fkey (
            street_address,
            city
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Calculate statistics
      const totalOrders = ordersData?.length || 0;
      const totalPaid = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const avgOrderValue = totalOrders > 0 ? totalPaid / totalOrders : 0;

      // Get pending quotes count (orders with status 'quote_pending')
      const { count: quotesCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id)
        .eq('status', 'quote_pending');

      // Get pending payments count from ledger entries
      let pendingPaymentsCount = 0;
      if (ledgerData || newLedger) {
        const ledgerId = ledgerData?.id || newLedger?.id;
        const { count: paymentsCount } = await supabase
          .from('b2b_ledger_entries')
          .select('*', { count: 'exact', head: true })
          .eq('ledger_id', ledgerId)
          .eq('type', 'payment_credit')
          .is('validated_at', null);

        pendingPaymentsCount = paymentsCount || 0;
      }

      const lastOrderDate = ordersData && ordersData.length > 0
        ? ordersData[0].created_at
        : null;

      setStats({
        total_orders: totalOrders,
        total_paid: totalPaid,
        avg_order_value: avgOrderValue,
        pending_quotes: quotesCount || 0,
        pending_payments: pendingPaymentsCount,
        last_order_date: lastOrderDate,
      });

    } catch (err: any) {
      console.error('Error fetching client profile:', err);
      setError(err.message || 'Failed to fetch client profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchClientOrders = useCallback(async (id: string, filters?: {
    status?: string;
    limit?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          payment_method,
          payment_status,
          created_at,
          delivered_at,
          delivery_address:addresses!orders_delivery_address_id_fkey (
            street_address,
            city
          )
        `)
        .eq('user_id', id);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: ordersError } = await query;

      if (ordersError) throw ordersError;
      setOrders(data || []);

    } catch (err: any) {
      console.error('Error fetching client orders:', err);
      setError(err.message || 'Failed to fetch client orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (
    id: string,
    updates: Partial<B2BClientProfile>
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      // Refresh profile data
      await fetchClientProfile(id);

      return true;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchClientProfile]);

  const updateCreditLimit = useCallback(async (
    ledgerId: string,
    creditLimit: number
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('b2b_ledgers')
        .update({ credit_limit: creditLimit })
        .eq('id', ledgerId);

      if (updateError) throw updateError;

      // Refresh ledger data
      if (clientId) {
        await fetchClientProfile(clientId);
      }

      return true;
    } catch (err: any) {
      console.error('Error updating credit limit:', err);
      setError(err.message || 'Failed to update credit limit');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clientId, fetchClientProfile]);

  useEffect(() => {
    if (clientId) {
      fetchClientProfile(clientId);
    }
  }, [clientId, fetchClientProfile]);

  return {
    profile,
    ledger,
    orders,
    stats,
    isLoading,
    error,
    fetchClientProfile,
    fetchClientOrders,
    updateProfile,
    updateCreditLimit,
  };
};
