import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface LedgerEntry {
  id: string;
  user_id: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  balance: number;
  credit_limit: number;
  total_orders: number;
  total_paid: number;
  pending_payments: number;
  last_transaction_date: string | null;
}

export interface LedgerStats {
  total_clients: number;
  total_credit_extended: number;
  total_debt_owed: number;
  pending_payment_count: number;
  pending_payment_amount: number;
}

type BalanceFilter = 'all' | 'credit' | 'debt' | 'balanced';

export const useLedgers = () => {
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [stats, setStats] = useState<LedgerStats>({
    total_clients: 0,
    total_credit_extended: 0,
    total_debt_owed: 0,
    pending_payment_count: 0,
    pending_payment_amount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedgers = useCallback(async (filters?: {
    balanceFilter?: BalanceFilter;
    searchQuery?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Query users with their ledgers and order totals
      let query = supabase
        .from('users')
        .select(`
          id,
          company_name,
          first_name,
          last_name,
          phone,
          b2b_ledgers!b2b_ledgers_user_id_fkey (
            balance,
            credit_limit
          )
        `)
        .eq('user_type', 'b2b');

      // Apply search filter
      if (filters?.searchQuery) {
        query = query.or(`company_name.ilike.%${filters.searchQuery}%,first_name.ilike.%${filters.searchQuery}%,last_name.ilike.%${filters.searchQuery}%,phone.ilike.%${filters.searchQuery}%`);
      }

      const { data: users, error: usersError } = await query;

      if (usersError) throw usersError;

      // For each user, get their order statistics and pending payments
      const ledgerData = await Promise.all(
        (users || []).map(async (user) => {
          const ledger = Array.isArray(user.b2b_ledgers) ? user.b2b_ledgers[0] : user.b2b_ledgers;

          // Get total orders count and sum
          const { data: orderStats } = await supabase
            .from('orders')
            .select('total')
            .eq('user_id', user.id);

          const total_orders = orderStats?.length || 0;
          const total_paid = orderStats?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

          // Get pending payments count
          const { data: pendingPayments } = await supabase
            .from('b2b_ledger_entries')
            .select('id')
            .eq('ledger_id', ledger?.id || '')
            .eq('type', 'payment_credit')
            .is('validated_at', null);

          // Get last transaction date
          const { data: lastTransaction } = await supabase
            .from('b2b_ledger_entries')
            .select('created_at')
            .eq('ledger_id', ledger?.id || '')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: user.id,
            company_name: user.company_name,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            balance: ledger?.balance || 0,
            credit_limit: ledger?.credit_limit || 0,
            total_orders,
            total_paid,
            pending_payments: pendingPayments?.length || 0,
            last_transaction_date: lastTransaction?.created_at || null,
          };
        })
      );

      // Apply balance filter
      let filteredLedgers = ledgerData;
      if (filters?.balanceFilter && filters.balanceFilter !== 'all') {
        filteredLedgers = ledgerData.filter(ledger => {
          switch (filters.balanceFilter) {
            case 'credit':
              return ledger.balance > 0;
            case 'debt':
              return ledger.balance < 0;
            case 'balanced':
              return ledger.balance === 0;
            default:
              return true;
          }
        });
      }

      setLedgers(filteredLedgers);
    } catch (err: any) {
      console.error('Error fetching ledgers:', err);
      setError(err.message || 'Failed to fetch ledgers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLedgerStats = useCallback(async () => {
    try {
      // Get all B2B users with ledgers
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          b2b_ledgers!b2b_ledgers_user_id_fkey (
            id,
            balance,
            credit_limit
          )
        `)
        .eq('user_type', 'b2b');

      if (usersError) throw usersError;

      const total_clients = users?.length || 0;
      let total_credit_extended = 0;
      let total_debt_owed = 0;

      // Calculate credit and debt
      users?.forEach(user => {
        const ledger = Array.isArray(user.b2b_ledgers) ? user.b2b_ledgers[0] : user.b2b_ledgers;
        if (ledger) {
          if (ledger.balance > 0) {
            total_credit_extended += ledger.balance;
          } else if (ledger.balance < 0) {
            total_debt_owed += Math.abs(ledger.balance);
          }
        }
      });

      // Get pending payments count and amount
      const ledgerIds = users
        ?.map(user => {
          const ledger = Array.isArray(user.b2b_ledgers) ? user.b2b_ledgers[0] : user.b2b_ledgers;
          return ledger?.id;
        })
        .filter(Boolean);

      if (ledgerIds && ledgerIds.length > 0) {
        const { data: pendingPayments, error: paymentsError } = await supabase
          .from('b2b_ledger_entries')
          .select('amount')
          .in('ledger_id', ledgerIds)
          .eq('type', 'payment_credit')
          .is('validated_at', null);

        if (!paymentsError && pendingPayments) {
          const pending_payment_count = pendingPayments.length;
          const pending_payment_amount = pendingPayments.reduce((sum, entry) => sum + (entry.amount || 0), 0);

          setStats({
            total_clients,
            total_credit_extended,
            total_debt_owed,
            pending_payment_count,
            pending_payment_amount,
          });
          return;
        }
      }

      setStats({
        total_clients,
        total_credit_extended,
        total_debt_owed,
        pending_payment_count: 0,
        pending_payment_amount: 0,
      });
    } catch (err: any) {
      console.error('Error fetching ledger stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchLedgers();
    fetchLedgerStats();
  }, [fetchLedgers, fetchLedgerStats]);

  return {
    ledgers,
    stats,
    isLoading,
    error,
    fetchLedgers,
    fetchLedgerStats,
  };
};
