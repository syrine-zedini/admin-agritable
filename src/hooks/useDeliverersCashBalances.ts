// Deliverer Cash Balances Hook
// Fetches cash balances for multiple deliverers (used in Deliverers list and PO wizard)

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface UseDeliverersCashBalancesReturn {
  balances: Map<string, number>
  isLoading: boolean
  refetch: () => Promise<void>
}

export function useDeliverersCashBalances(
  delivererIds: string[]
): UseDeliverersCashBalancesReturn {
  const [balances, setBalances] = useState<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(false)

  const fetchBalances = useCallback(async () => {
    if (!delivererIds || delivererIds.length === 0) {
      setBalances(new Map())
      return
    }

    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('deliverer_cash_tracking')
        .select('deliverer_id, cash_balance')
        .in('deliverer_id', delivererIds)

      if (error) throw error

      // Create map with all deliverer IDs, defaulting to 0 for missing records
      const balanceMap = new Map<string, number>()
      delivererIds.forEach((id) => balanceMap.set(id, 0))

      // Update with actual balances from database
      data?.forEach((record) => {
        balanceMap.set(record.deliverer_id, Number(record.cash_balance) || 0)
      })

      setBalances(balanceMap)
    } catch (err: any) {
      console.error('Error fetching deliverer cash balances:', err)
      // Set all to 0 on error
      const balanceMap = new Map<string, number>()
      delivererIds.forEach((id) => balanceMap.set(id, 0))
      setBalances(balanceMap)
    } finally {
      setIsLoading(false)
    }
  }, [delivererIds])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  return {
    balances,
    isLoading,
    refetch: fetchBalances,
  }
}
