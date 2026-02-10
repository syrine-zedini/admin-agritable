// Deliverer Cash Transactions Hook
// Fetches all deliverer cash transactions with filtering support

import { useState, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface DelivererCashTransactionWithDeliverer {
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
  deliverer: {
    id: string
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
}

export interface DelivererCashTransactionsFilters {
  delivererId?: string
  transactionType?: string
  dateFrom?: string
  dateTo?: string
}

export interface UseDelivererCashTransactionsReturn {
  transactions: DelivererCashTransactionWithDeliverer[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  totalIn: number
  totalOut: number
}

export function useDelivererCashTransactions(
  filters: DelivererCashTransactionsFilters = {}
): UseDelivererCashTransactionsReturn {
  const [transactions, setTransactions] = useState<DelivererCashTransactionWithDeliverer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('deliverer_cash_transactions')
        .select(`
          *,
          deliverer:users!deliverer_id(id, first_name, last_name, phone)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.delivererId) {
        query = query.eq('deliverer_id', filters.delivererId)
      }

      if (filters.transactionType && filters.transactionType !== 'all') {
        query = query.eq('transaction_type', filters.transactionType)
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      setTransactions(data || [])
    } catch (err: any) {
      console.error('Error fetching deliverer cash transactions:', err)
      setError(err)
      toast.error('Failed to load deliverer cash transactions')
    } finally {
      setIsLoading(false)
    }
  }, [filters.delivererId, filters.transactionType, filters.dateFrom, filters.dateTo])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Calculate totals
  const { totalIn, totalOut } = useMemo(() => {
    let inAmount = 0
    let outAmount = 0

    transactions.forEach(txn => {
      if (txn.transaction_type === 'replenishment' || txn.transaction_type === 'refund') {
        inAmount += txn.amount
      } else {
        outAmount += txn.amount
      }
    })

    return { totalIn: inAmount, totalOut: outAmount }
  }, [transactions])

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    totalIn,
    totalOut,
  }
}
