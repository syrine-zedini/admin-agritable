import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PendingPayment {
  id: string;
  ledger_id: string;
  amount: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  payment_proof_url?: string;
  notes?: string;
  created_at: string;
  // Client info
  user_id: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  // Ledger info
  current_balance: number;
  credit_limit: number;
}

export interface PendingPaymentsStats {
  total_pending: number;
  total_amount: number;
  oldest_pending_days: number;
}

export const usePendingPayments = () => {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [stats, setStats] = useState<PendingPaymentsStats>({
    total_pending: 0,
    total_amount: 0,
    oldest_pending_days: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingPayments = useCallback(async (searchQuery?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get pending payment entries with client and ledger info
      let query = supabase
        .from('b2b_ledger_entries')
        .select(`
          id,
          ledger_id,
          amount,
          balance_after,
          reference_type,
          reference_id,
          payment_proof_url,
          notes,
          created_at,
          b2b_ledgers!b2b_ledger_entries_ledger_id_fkey (
            user_id,
            balance,
            credit_limit,
            users!b2b_ledgers_user_id_fkey (
              company_name,
              first_name,
              last_name,
              phone
            )
          )
        `)
        .eq('type', 'payment_credit')
        .is('validated_at', null)
        .order('created_at', { ascending: true });

      const { data: entries, error: entriesError } = await query;

      if (entriesError) throw entriesError;

      // Transform data
      const transformedPayments: PendingPayment[] = (entries || []).map((entry: any) => {
        const ledger = entry.b2b_ledgers;
        const user = ledger?.users;

        return {
          id: entry.id,
          ledger_id: entry.ledger_id,
          amount: entry.amount,
          balance_after: entry.balance_after,
          reference_type: entry.reference_type,
          reference_id: entry.reference_id,
          payment_proof_url: entry.payment_proof_url,
          notes: entry.notes,
          created_at: entry.created_at,
          user_id: ledger?.user_id || '',
          company_name: user?.company_name || null,
          first_name: user?.first_name || null,
          last_name: user?.last_name || null,
          phone: user?.phone || null,
          current_balance: ledger?.balance || 0,
          credit_limit: ledger?.credit_limit || 0,
        };
      });

      // Apply search filter
      let filteredPayments = transformedPayments;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredPayments = transformedPayments.filter((payment) => {
          const businessName = payment.company_name ||
            `${payment.first_name || ''} ${payment.last_name || ''}`.trim();
          return (
            businessName.toLowerCase().includes(query) ||
            payment.phone?.includes(query) ||
            payment.reference_type?.toLowerCase().includes(query) ||
            payment.reference_id?.toLowerCase().includes(query)
          );
        });
      }

      setPayments(filteredPayments);

      // Calculate statistics
      const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
      const oldestDate = filteredPayments.length > 0
        ? new Date(filteredPayments[0].created_at)
        : new Date();
      const daysDiff = Math.floor((new Date().getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));

      setStats({
        total_pending: filteredPayments.length,
        total_amount: totalAmount,
        oldest_pending_days: daysDiff,
      });
    } catch (err: any) {
      console.error('Error fetching pending payments:', err);
      setError(err.message || 'Failed to fetch pending payments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingPayments();
  }, [fetchPendingPayments]);

  return {
    payments,
    stats,
    isLoading,
    error,
    fetchPendingPayments,
  };
};
