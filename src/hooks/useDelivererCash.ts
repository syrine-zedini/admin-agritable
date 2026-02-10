// Deliverer Cash Management Hook
// Manages fetching and updating deliverer cash balances and transactions

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export interface DelivererCashTracking {
  id: string
  deliverer_id: string
  cash_balance: number
  last_replenishment_date: string | null
  last_replenishment_amount: number | null
  created_at: string
  updated_at: string
}

export interface DelivererCashTransaction {
  id: string
  deliverer_id: string
  transaction_type: 'replenishment' | 'collection_payment' | 'adjustment' | 'refund'
  amount: number
  balance_after: number
  route_id: string | null
  route_stop_id: string | null
  po_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface UseDelivererCashReturn {
  cashTracking: DelivererCashTracking | null
  transactions: DelivererCashTransaction[]
  isLoading: boolean
  replenishCash: (amount: number, notes?: string) => Promise<void>
  adjustCash: (newBalance: number, notes: string) => Promise<void>
  isReplenishing: boolean
  isAdjusting: boolean
  refetch: () => Promise<void>
}

export function useDelivererCash(delivererId: string): UseDelivererCashReturn {
  const [cashTracking, setCashTracking] = useState<DelivererCashTracking | null>(null)
  const [transactions, setTransactions] = useState<DelivererCashTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReplenishing, setIsReplenishing] = useState(false)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const { user } = useAuth()

  // Fetch cash tracking record and transactions
  const fetchData = useCallback(async () => {
    if (!delivererId) return

    try {
      setIsLoading(true)

      // Fetch cash tracking record - use maybeSingle() to handle missing records gracefully
      const { data: trackingData, error: trackingError } = await supabase
        .from('deliverer_cash_tracking')
        .select('*')
        .eq('deliverer_id', delivererId)
        .maybeSingle()

      if (trackingError) {
        throw trackingError
      }

      setCashTracking(trackingData || null)

      // Fetch transactions
      const { data: txnData, error: txnError } = await supabase
        .from('deliverer_cash_transactions')
        .select('*')
        .eq('deliverer_id', delivererId)
        .order('created_at', { ascending: false })

      if (txnError) throw txnError

      setTransactions(txnData || [])
    } catch (err: any) {
      console.error('Error fetching deliverer cash data:', err)
      toast.error('Failed to load cash data')
    } finally {
      setIsLoading(false)
    }
  }, [delivererId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Replenish cash using the database function
  const replenishCash = useCallback(
    async (amount: number, notes?: string) => {
      if (!delivererId || amount <= 0) {
        toast.error('Invalid replenishment amount')
        return
      }

      try {
        setIsReplenishing(true)

        // Call the database function to update balance and create transaction
        const { error } = await supabase.rpc('update_deliverer_cash_balance', {
          p_deliverer_id: delivererId,
          p_transaction_type: 'replenishment',
          p_amount: amount,
          p_notes: notes || null,
          p_created_by: user?.id || null,
        })

        if (error) throw error

        // Update last replenishment info
        const { error: updateError } = await supabase
          .from('deliverer_cash_tracking')
          .update({
            last_replenishment_date: new Date().toISOString(),
            last_replenishment_amount: amount,
          })
          .eq('deliverer_id', delivererId)

        if (updateError) {
          console.error('Error updating replenishment info:', updateError)
        }

        toast.success(`Cash replenished: ${amount.toFixed(2)} TND`)
        await fetchData()
      } catch (err: any) {
        console.error('Error replenishing cash:', err)
        toast.error(err.message || 'Failed to replenish cash')
        throw err
      } finally {
        setIsReplenishing(false)
      }
    },
    [delivererId, user?.id, fetchData]
  )

  // Adjust cash balance to a specific amount
  const adjustCash = useCallback(
    async (newBalance: number, notes: string) => {
      if (!delivererId || newBalance < 0) {
        toast.error('Invalid balance amount')
        return
      }

      if (!notes || notes.trim() === '') {
        toast.error('Notes are required for balance adjustments')
        return
      }

      try {
        setIsAdjusting(true)

        const currentBalance = cashTracking?.cash_balance || 0
        const difference = Math.abs(newBalance - currentBalance)

        if (difference === 0) {
          toast.info('Balance is already at the specified amount')
          return
        }

        // Determine transaction type based on direction
        // For adjustment, we need to handle it differently since the DB function
        // treats 'adjustment' as a deduction. We'll use replenishment for increases
        // and a direct update for decreases with proper logging
        if (newBalance > currentBalance) {
          // Increase balance - use replenishment
          const { error } = await supabase.rpc('update_deliverer_cash_balance', {
            p_deliverer_id: delivererId,
            p_transaction_type: 'replenishment',
            p_amount: difference,
            p_notes: `[ADJUSTMENT] ${notes}`,
            p_created_by: user?.id || null,
          })

          if (error) throw error
        } else {
          // Decrease balance - use adjustment (which deducts)
          const { error } = await supabase.rpc('update_deliverer_cash_balance', {
            p_deliverer_id: delivererId,
            p_transaction_type: 'adjustment',
            p_amount: difference,
            p_notes: notes,
            p_created_by: user?.id || null,
          })

          if (error) throw error
        }

        toast.success(`Balance adjusted to ${newBalance.toFixed(2)} TND`)
        await fetchData()
      } catch (err: any) {
        console.error('Error adjusting cash:', err)
        toast.error(err.message || 'Failed to adjust balance')
        throw err
      } finally {
        setIsAdjusting(false)
      }
    },
    [delivererId, cashTracking?.cash_balance, user?.id, fetchData]
  )

  return {
    cashTracking,
    transactions,
    isLoading,
    replenishCash,
    adjustCash,
    isReplenishing,
    isAdjusting,
    refetch: fetchData,
  }
}
