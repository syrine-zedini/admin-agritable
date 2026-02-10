import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CrateTransaction {
  id: string;
  customer_id: string;
  crate_id: string;
  order_id: string;
  transaction_type: 'issued' | 'returned' | 'fee_charged';
  quantity: number;
  potential_charge_amount: number; // Updated from deposit_amount
  fee_amount?: number;
  created_at: string;
  customer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    user_type: string;
  };
  crate?: {
    id: string;
    name_fr: string;
    price_per_crate: number; // Updated from deposit_amount
    fee_per_day_late: number;
  };
  order?: {
    id: string;
    status: string;
  };
}

export interface CrateInventory {
  crate_id: string;
  crate_name: string;
  total_issued: number;
  total_returned: number;
  currently_unreturned: number;
  price_per_crate: number; // Updated from deposit_amount
  fee_per_day_late: number;
  is_standard_couffin: boolean;
}

export interface UnreturnedCrate {
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  crate_id: string;
  crate_name: string;
  order_id: string;
  quantity: number;
  price_per_crate: number; // Updated from deposit_amount
  issued_date: string;
  days_unreturned: number;
  estimated_fee: number;
}

export interface CrateFilters {
  customer_search?: string;
  crate_type?: string;
  status?: 'all' | 'unreturned' | 'returned';
  date_from?: string;
  date_to?: string;
}

/**
 * useCrateManagement Hook - B2C Couffin Tracking (B2C ONLY)
 *
 * PURPOSE:
 * Manages the complete lifecycle of reusable delivery couffins for B2C customers.
 *
 * IMPORTANT BUSINESS RULES:
 * - B2C customers ONLY - B2B uses disposable packaging (NOT tracked)
 * - Single standard couffin type (not multiple types)
 * - NO deposit charged upfront when order placed
 * - NO late fees - only couffin price charged if unreturned
 * - Automatic wallet deduction (can create negative balance)
 *
 * WORKFLOW:
 * 1. B2C order delivered → Couffin "issued" automatically (via DB trigger)
 * 2. On next delivery → Check if previous couffin returned
 * 3. If NOT returned:
 *    → Admin marks as unreturned
 *    → System charges couffin price to customer wallet
 *    → Creates negative balance if insufficient funds
 *    → Adds to negative_balance_sources.crate_fees array
 * 4. If returned:
 *    → Admin marks as returned
 *    → No charge applied
 *
 * DATABASE ENFORCEMENT:
 * - Triggers at database level ensure only B2C customers can have couffin transactions
 * - Validation prevents B2B customers from being charged
 * - All queries filtered by .eq('customer.user_type', 'b2c')
 *
 * QUERY FEATURES:
 * - Fetch all couffin transactions (issued, returned, fee_charged)
 * - Get unreturned couffins list with customer details
 * - Calculate inventory stats (total issued, returned, unreturned)
 * - Filter by customer, date range, status
 *
 * MUTATION FEATURES:
 * - markReturned: Record couffin return (no financial transaction)
 * - chargeFee: Manually charge unreturned couffin to wallet (use with caution)
 */
export function useCrateManagement(filters: CrateFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch crate transactions
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = useQuery({
    queryKey: ['crate_transactions', filters],
    queryFn: async (): Promise<CrateTransaction[]> => {
      let query = supabase
        .from('crate_transactions')
        .select(
          `
          *,
          customer:users!customer_id(id, first_name, last_name, email, phone, user_type),
          crate:physical_crates!crate_id(id, name_fr, price_per_crate, fee_per_day_late),
          order:orders!order_id(id, status)
        `
        )
        .eq('customer.user_type', 'b2c')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data as CrateTransaction[];

      // Filter by customer search
      if (filters.customer_search) {
        const searchLower = filters.customer_search.toLowerCase();
        filteredData = filteredData.filter(
          (t) =>
            t.customer?.first_name?.toLowerCase().includes(searchLower) ||
            t.customer?.last_name?.toLowerCase().includes(searchLower) ||
            t.customer?.email?.toLowerCase().includes(searchLower)
        );
      }

      // Filter by status
      if (filters.status === 'unreturned') {
        filteredData = filteredData.filter((t) => t.transaction_type === 'issued');
      } else if (filters.status === 'returned') {
        filteredData = filteredData.filter((t) => t.transaction_type === 'returned');
      }

      return filteredData;
    },
    staleTime: 1000 * 60 * 2,
  });

  // Fetch crate inventory summary
  const {
    data: inventory,
    isLoading: isLoadingInventory,
    error: inventoryError,
  } = useQuery({
    queryKey: ['crate_inventory'],
    queryFn: async (): Promise<CrateInventory[]> => {
      // Fetch singleton couffin config
      const { data: couffinConfig, error: cratesError } = await supabase
        .from('couffin_config')
        .select('id, name_fr, price_per_crate, fee_per_day_late')
        .eq('is_active', true)
        .single();

      if (cratesError) throw cratesError;
      if (!couffinConfig) throw new Error('No standard couffin configured');

      // Fetch all transactions
      const { data: allTransactions, error: txError } = await supabase
        .from('crate_transactions')
        .select('crate_id, transaction_type, quantity');

      if (txError) throw txError;

      // Calculate inventory for the standard couffin
      const crateTxs = allTransactions.filter((tx) => tx.crate_id === couffinConfig.id);
      const totalIssued = crateTxs
        .filter((tx) => tx.transaction_type === 'issued')
        .reduce((sum, tx) => sum + tx.quantity, 0);
      const totalReturned = crateTxs
        .filter((tx) => tx.transaction_type === 'returned')
        .reduce((sum, tx) => sum + tx.quantity, 0);

      const inventory: CrateInventory = {
        crate_id: couffinConfig.id,
        crate_name: couffinConfig.name_fr,
        total_issued: totalIssued,
        total_returned: totalReturned,
        currently_unreturned: totalIssued - totalReturned,
        price_per_crate: couffinConfig.price_per_crate,
        fee_per_day_late: couffinConfig.fee_per_day_late,
        is_standard_couffin: true, // Always true for singleton
      };

      return [inventory]; // Return single-element array
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch unreturned crates
  const {
    data: unreturnedCrates,
    isLoading: isLoadingUnreturned,
    error: unreturnedError,
  } = useQuery({
    queryKey: ['unreturned_crates', filters],
    queryFn: async (): Promise<UnreturnedCrate[]> => {
      // Fetch all issued transactions (B2C only)
      const { data: issuedTxs, error: issuedError } = await supabase
        .from('crate_transactions')
        .select(
          `
          *,
          customer:users!customer_id(id, first_name, last_name, email, phone, user_type),
          crate:physical_crates!crate_id(id, name_fr, price_per_crate, fee_per_day_late),
          order:orders!order_id(id)
        `
        )
        .eq('transaction_type', 'issued')
        .eq('customer.user_type', 'b2c');

      if (issuedError) throw issuedError;

      // Fetch all returned transactions
      const { data: returnedTxs, error: returnedError } = await supabase
        .from('crate_transactions')
        .select('crate_id, customer_id, order_id, quantity')
        .eq('transaction_type', 'returned');

      if (returnedError) throw returnedError;

      // Calculate unreturned crates
      const unreturnedMap: Record<string, UnreturnedCrate> = {};

      issuedTxs.forEach((issued: any) => {
        const key = `${issued.customer_id}_${issued.crate_id}_${issued.order_id}`;

        // Find matching returns
        const returns = returnedTxs.filter(
          (r) =>
            r.customer_id === issued.customer_id &&
            r.crate_id === issued.crate_id &&
            r.order_id === issued.order_id
        );

        const totalReturned = returns.reduce((sum, r) => sum + r.quantity, 0);
        const unreturnedQty = issued.quantity - totalReturned;

        if (unreturnedQty > 0) {
          const daysUnreturned = Math.floor(
            (new Date().getTime() - new Date(issued.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          const estimatedFee = daysUnreturned * issued.crate.fee_per_day_late * unreturnedQty;

          unreturnedMap[key] = {
            customer_id: issued.customer_id,
            customer_name: `${issued.customer?.first_name || ''} ${issued.customer?.last_name || ''}`.trim() || 'Unknown',
            customer_email: issued.customer?.email || null,
            customer_phone: issued.customer?.phone || null,
            crate_id: issued.crate_id,
            crate_name: issued.crate.name_fr,
            order_id: issued.order_id,
            quantity: unreturnedQty,
            price_per_crate: issued.crate.price_per_crate,
            issued_date: issued.created_at,
            days_unreturned: daysUnreturned,
            estimated_fee: estimatedFee,
          };
        }
      });

      let result = Object.values(unreturnedMap);

      // Apply customer search filter
      if (filters.customer_search) {
        const searchLower = filters.customer_search.toLowerCase();
        result = result.filter(
          (c) =>
            c.customer_name.toLowerCase().includes(searchLower) ||
            c.customer_email?.toLowerCase().includes(searchLower)
        );
      }

      return result;
    },
    staleTime: 1000 * 60 * 2,
  });

  // Mark crates as returned
  const markReturnedMutation = useMutation({
    mutationFn: async ({
      customerId,
      crateId,
      orderId,
      quantity,
      notes,
    }: {
      customerId: string;
      crateId: string;
      orderId: string;
      quantity: number;
      notes?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate customer is B2C
      const { data: customer } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', customerId)
        .single();

      if (customer?.user_type !== 'b2c') {
        throw new Error('Couffin tracking is only available for B2C customers');
      }

      // Fetch couffin config details
      const { data: crate, error: crateError } = await supabase
        .from('couffin_config')
        .select('*')
        .eq('id', crateId)
        .single();

      if (crateError) throw crateError;

      // Create return transaction
      const { error: txError } = await supabase.from('crate_transactions').insert({
        customer_id: customerId,
        crate_id: crateId,
        order_id: orderId,
        transaction_type: 'returned',
        quantity,
        potential_charge_amount: crate.price_per_crate * quantity,
        notes,
      });

      if (txError) throw txError;

      return { customerId, quantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crate_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['unreturned_crates'] });
      queryClient.invalidateQueries({ queryKey: ['crate_inventory'] });
    },
  });

  // Charge late fee
  const chargeLateFee = useMutation({
    mutationFn: async ({
      customerId,
      crateId,
      orderId,
      quantity,
      daysLate,
      feeAmount,
      reason,
    }: {
      customerId: string;
      crateId: string;
      orderId: string;
      quantity: number;
      daysLate: number;
      feeAmount: number;
      reason: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate customer is B2C
      const { data: customer } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', customerId)
        .single();

      if (customer?.user_type !== 'b2c') {
        throw new Error('Couffin tracking is only available for B2C customers');
      }

      // Create fee transaction
      const { error: txError } = await supabase.from('crate_transactions').insert({
        customer_id: customerId,
        crate_id: crateId,
        order_id: orderId,
        transaction_type: 'fee_charged',
        quantity,
        potential_charge_amount: 0,
        fee_amount: feeAmount,
        days_unreturned: daysLate,
        notes: reason,
      });

      if (txError) throw txError;

      // Add fee to customer wallet as negative balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', customerId)
        .single();

      if (walletError) throw walletError;

      const negativeSources = wallet.negative_balance_sources || { unpaid_orders: [], crate_fees: [] };

      // Add to crate fees
      negativeSources.crate_fees = negativeSources.crate_fees || [];
      negativeSources.crate_fees.push({
        crate_id: crateId, // Updated from couffin_id
        amount: feeAmount,
        unreturned_date: new Date().toISOString(),
      });

      // Update wallet balance and sources
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance: wallet.balance - feeAmount,
          negative_balance_sources: negativeSources,
        })
        .eq('user_id', customerId);

      if (updateError) throw updateError;

      return { customerId, feeAmount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crate_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });

  // Get statistics
  const getStats = () => {
    if (!inventory || !unreturnedCrates)
      return {
        totalCrateTypes: 0,
        totalUnreturned: 0,
        totalUnreturnedValue: 0,
      };

    const totalUnreturned = inventory.reduce((sum, inv) => sum + inv.currently_unreturned, 0);
    const totalUnreturnedValue = unreturnedCrates.reduce((sum, c) => sum + (c.price_per_crate * c.quantity), 0);

    return {
      totalCrateTypes: inventory.length,
      totalUnreturned,
      totalUnreturnedValue,
    };
  };

  return {
    transactions: transactions || [],
    isLoadingTransactions,
    transactionsError,
    inventory: inventory || [],
    isLoadingInventory,
    inventoryError,
    unreturnedCrates: unreturnedCrates || [],
    isLoadingUnreturned,
    unreturnedError,
    stats: getStats(),
    markReturned: markReturnedMutation.mutate,
    isMarkingReturned: markReturnedMutation.isPending,
    chargeFee: chargeLateFee.mutate,
    isChargingFee: chargeLateFee.isPending,
  };
}
