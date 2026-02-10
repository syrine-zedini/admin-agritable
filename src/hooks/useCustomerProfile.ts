// B2C Customer Profile Hook
// Fetches and manages B2C customer profile data from Supabase

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface CustomerProfile {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  user_type: string;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
  last_login_at: string | null;
  preferred_language: string | null;
  avatar_url: string | null;
}

export interface CustomerWallet {
  id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerLoyalty {
  id: string;
  points_balance: number;
  lifetime_points: number;
  auto_convert_enabled: boolean | null;
  auto_convert_threshold: number | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  street_address: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
  delivered_at: string | null;
  items_count: number;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  balance_after: number;
  description: string | null;
  order_id: string | null;
  order_number?: string;
  created_at: string;
}

export interface CustomerStats {
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  last_order_date: string | null;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  event: string;
  details: string;
}

export const useCustomerProfile = (customerId?: string) => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [loyalty, setLoyalty] = useState<CustomerLoyalty | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total_orders: 0,
    total_spent: 0,
    avg_order_value: 0,
    last_order_date: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCustomerProfile = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch customer profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('user_type', 'b2c')
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch customer wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

      if (walletError && walletError.code !== 'PGRST116') throw walletError;
      setWallet(walletData);

      // Fetch loyalty account
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_accounts')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

      if (loyaltyError && loyaltyError.code !== 'PGRST116') throw loyaltyError;
      setLoyalty(loyaltyData);

      // Fetch customer addresses
      const { data: addressesData, error: addressesError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', id)
        .order('is_default', { ascending: false });

      if (addressesError) throw addressesError;
      setAddresses(addressesData || []);

      // Fetch customer orders with item count
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          subtotal,
          delivery_fee,
          payment_method,
          payment_status,
          created_at,
          delivered_at,
          order_items(id)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (ordersError) throw ordersError;

      const ordersWithCount = (ordersData || []).map(order => ({
        ...order,
        items_count: order.order_items?.length || 0,
        order_items: undefined
      }));
      setOrders(ordersWithCount);

      // Calculate statistics
      const totalOrders = ordersData?.length || 0;
      const totalSpent = ordersData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = ordersData && ordersData.length > 0 ? ordersData[0].created_at : null;

      setStats({
        total_orders: totalOrders,
        total_spent: totalSpent,
        avg_order_value: avgOrderValue,
        last_order_date: lastOrderDate,
      });

      // Fetch wallet transactions if wallet exists
      let walletTxData: any[] = [];
      if (walletData) {
        const { data, error: walletTxError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (walletTxError) throw walletTxError;
        walletTxData = data || [];
        setWalletTransactions(walletTxData);
      }

      // Fetch loyalty transactions if loyalty account exists
      if (loyaltyData) {
        const { data: loyaltyTxData, error: loyaltyTxError } = await supabase
          .from('loyalty_transactions')
          .select('*')
          .eq('account_id', loyaltyData.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (loyaltyTxError) throw loyaltyTxError;

        // Fetch order numbers for transactions that reference orders
        const orderRefIds = (loyaltyTxData || [])
          .filter(tx => tx.reference_type === 'order' && tx.reference_id)
          .map(tx => tx.reference_id);

        let orderNumberMap: Record<string, string> = {};
        if (orderRefIds.length > 0) {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, order_number')
            .in('id', orderRefIds);

          orderNumberMap = (ordersData || []).reduce((acc, order) => {
            acc[order.id] = order.order_number;
            return acc;
          }, {} as Record<string, string>);
        }

        const loyaltyTxWithOrderNumber = (loyaltyTxData || []).map(tx => ({
          ...tx,
          order_id: tx.reference_type === 'order' ? tx.reference_id : null,
          order_number: tx.reference_type === 'order' ? orderNumberMap[tx.reference_id] || null : null,
        }));
        setLoyaltyTransactions(loyaltyTxWithOrderNumber);
      }

      // Build activity log from various sources
      const activities: ActivityLogEntry[] = [];

      // Add login activity
      if (profileData.last_login_at) {
        activities.push({
          id: `login-${profileData.last_login_at}`,
          timestamp: profileData.last_login_at,
          event: 'Login',
          details: 'User logged in'
        });
      }

      // Add recent orders as activity
      (ordersData || []).slice(0, 5).forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          timestamp: order.created_at,
          event: 'Order Placed',
          details: `Order ${order.order_number} - ${order.items_count || 0} items - ${Number(order.total).toFixed(2)} TND`
        });

        if (order.delivered_at) {
          activities.push({
            id: `delivered-${order.id}`,
            timestamp: order.delivered_at,
            event: 'Order Delivered',
            details: `Order ${order.order_number}`
          });
        }
      });

      // Add recent wallet transactions as activity
      (walletTxData || []).slice(0, 5).forEach(tx => {
        activities.push({
          id: `wallet-${tx.id}`,
          timestamp: tx.created_at,
          event: tx.type === 'recharge' ? 'Wallet Recharged' : 'Wallet Transaction',
          details: `${tx.amount > 0 ? '+' : ''}${Number(tx.amount).toFixed(2)} TND - ${tx.description || tx.type}`
        });
      });

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityLog(activities.slice(0, 20));

    } catch (err: any) {
      console.error('Error fetching customer profile:', err);
      setError(err.message || 'Failed to fetch customer profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<CustomerProfile>): Promise<boolean> => {
    if (!customerId) return false;

    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', customerId);

      if (updateError) throw updateError;

      toast.success('Profile updated successfully');
      await fetchCustomerProfile(customerId);
      return true;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'Failed to update profile');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [customerId, fetchCustomerProfile]);

  const adjustWallet = useCallback(async (amount: number, reason: string): Promise<boolean> => {
    if (!customerId) return false;

    setIsUpdating(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return false;
      }

      // Call admin-adjust-wallet edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-adjust-wallet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: customerId,
            amount: amount,
            reason: reason,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to adjust wallet');
      }

      toast.success(`Wallet ${amount > 0 ? 'credited' : 'debited'} successfully`);
      await fetchCustomerProfile(customerId);
      return true;
    } catch (err: any) {
      console.error('Error adjusting wallet:', err);
      toast.error(err.message || 'Failed to adjust wallet');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [customerId, fetchCustomerProfile]);

  const adjustLoyaltyPoints = useCallback(async (points: number, reason: string): Promise<boolean> => {
    if (!customerId) return false;

    setIsUpdating(true);
    try {
      // Get or create loyalty account
      let loyaltyAccount = loyalty;

      if (!loyaltyAccount) {
        // Create loyalty account if it doesn't exist
        const { data: newLoyalty, error: createError } = await supabase
          .from('loyalty_accounts')
          .insert({
            user_id: customerId,
            points_balance: 0,
            lifetime_points: 0,
            auto_convert_enabled: true,
            auto_convert_threshold: 1000
          })
          .select()
          .single();

        if (createError) throw createError;
        loyaltyAccount = newLoyalty;
      }

      const currentBalance = loyaltyAccount.points_balance || 0;
      const newBalance = currentBalance + points;

      // Update loyalty account
      const { error: loyaltyError } = await supabase
        .from('loyalty_accounts')
        .update({
          points_balance: newBalance,
          lifetime_points: points > 0 ? (loyaltyAccount.lifetime_points || 0) + points : (loyaltyAccount.lifetime_points || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', loyaltyAccount.id);

      if (loyaltyError) throw loyaltyError;

      // Create loyalty transaction record
      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert({
          account_id: loyaltyAccount.id,
          type: 'adjusted',
          points: points,
          balance_after: newBalance,
          description: reason,
          reference_type: 'admin_adjustment'
        });

      if (txError) throw txError;

      toast.success(`Loyalty points ${points > 0 ? 'added' : 'deducted'} successfully`);
      await fetchCustomerProfile(customerId);
      return true;
    } catch (err: any) {
      console.error('Error adjusting loyalty points:', err);
      toast.error(err.message || 'Failed to adjust loyalty points');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [customerId, loyalty, fetchCustomerProfile]);

  const toggleStatus = useCallback(async (isActive: boolean): Promise<boolean> => {
    if (!customerId) return false;

    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', customerId);

      if (updateError) throw updateError;

      toast.success(isActive ? 'Customer activated' : 'Customer deactivated');
      await fetchCustomerProfile(customerId);
      return true;
    } catch (err: any) {
      console.error('Error toggling status:', err);
      toast.error(err.message || 'Failed to update status');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [customerId, fetchCustomerProfile]);

  const sendNotification = useCallback(async (title: string, message: string): Promise<boolean> => {
    if (!customerId) return false;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: customerId,
          title: title,
          body: message,
          type: 'admin',
          channels: ['in_app'],
          read: false
        });

      if (error) throw error;

      toast.success('Notification sent successfully');
      return true;
    } catch (err: any) {
      console.error('Error sending notification:', err);
      toast.error(err.message || 'Failed to send notification');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchCustomerProfile(customerId);
    }
  }, [customerId, fetchCustomerProfile]);

  return {
    profile,
    wallet,
    loyalty,
    addresses,
    orders,
    walletTransactions,
    loyaltyTransactions,
    activityLog,
    stats,
    isLoading,
    error,
    isUpdating,
    fetchCustomerProfile,
    updateProfile,
    adjustWallet,
    adjustLoyaltyPoints,
    toggleStatus,
    sendNotification,
  };
};
