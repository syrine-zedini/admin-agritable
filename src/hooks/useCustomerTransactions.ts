import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CustomerTransaction {
  id: string;
  date: string;
  customer: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  balanceAfter: number;
  reference_id?: string;
}

export function useCustomerTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['customer_transactions'],
    queryFn: async (): Promise<CustomerTransaction[]> => {
      const combined: CustomerTransaction[] = [];

      // Fetch wallet transactions (B2C)
      const { data: walletTxns, error: walletError } = await supabase
        .from('wallet_transactions')
        .select(`
          id,
          type,
          amount,
          balance_after,
          description,
          created_at,
          wallet:wallets!inner(
            user:users!inner(
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (walletError) throw walletError;

      // Transform wallet transactions
      if (walletTxns) {
        walletTxns.forEach((txn: any) => {
          const userName = txn.wallet?.user
            ? `${txn.wallet.user.first_name || ''} ${txn.wallet.user.last_name || ''}`.trim() || 'Unknown'
            : 'Unknown';

          const typeMap: Record<string, string> = {
            recharge: 'Wallet Recharge',
            payment: 'Order Payment',
            refund: 'Refund',
            loyalty_conversion: 'Loyalty Conversion',
            crate_charge: 'Crate Deposit',
            adjustment: 'Adjustment',
            referral_bonus: 'Referral Bonus',
          };

          combined.push({
            id: txn.id,
            date: txn.created_at,
            customer: userName,
            type: typeMap[txn.type] || txn.type,
            method: txn.type === 'recharge' ? 'Card' : 'Wallet',
            amount: Math.abs(txn.amount),
            status: 'completed',
            balanceAfter: txn.balance_after,
            reference_id: txn.id,
          });
        });
      }

      // Fetch B2B ledger entries
      const { data: ledgerEntries, error: ledgerError } = await supabase
        .from('b2b_ledger_entries')
        .select(`
          id,
          type,
          amount,
          balance_after,
          notes,
          created_at,
          ledger:b2b_ledgers!inner(
            user:users!inner(
              company_name,
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (ledgerError) throw ledgerError;

      // Transform ledger entries
      if (ledgerEntries) {
        ledgerEntries.forEach((entry: any) => {
          const companyName = entry.ledger?.user?.company_name ||
            `${entry.ledger?.user?.first_name || ''} ${entry.ledger?.user?.last_name || ''}`.trim() ||
            'Unknown B2B Client';

          const typeMap: Record<string, string> = {
            order_debt: 'Order Payment',
            payment_credit: 'Payment Received',
            adjustment: 'Adjustment',
            credit_limit_change: 'Credit Limit Change',
          };

          combined.push({
            id: entry.id,
            date: entry.created_at,
            customer: companyName,
            type: typeMap[entry.type] || entry.type,
            method: entry.type === 'payment_credit' ? 'Bank Transfer' : 'Credit',
            amount: Math.abs(entry.amount),
            status: 'completed',
            balanceAfter: entry.balance_after,
            reference_id: entry.id,
          });
        });
      }

      // Sort all transactions by date descending
      return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    transactions: transactions || [],
    isLoading,
  };
}
