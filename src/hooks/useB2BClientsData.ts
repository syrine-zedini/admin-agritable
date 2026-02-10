import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface B2BClient {
  id: string
  company_name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
  institution_type: string | null
  created_at: string
  validation_status: string | null
  is_active: boolean | null
  total_orders: number
  credit_balance: number
}

export interface B2BStats {
  total_clients: number
  pending_validation: number
  active_clients: number
  total_credit_extended: number
}

export interface CreateB2BClientInput {
  phone: string
  email: string
  first_name: string
  last_name: string
  company_name: string
  institution_type: string
  tax_id?: string
}

export interface UpdateB2BClientInput {
  id: string
  company_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  email?: string
  institution_type?: string
  tax_id?: string
}

export interface UpdateCreditLimitInput {
  client_id: string
  credit_limit: number
}

export function useB2BClientsData(
  searchQuery: string = '',
  statusFilter: string = 'all',
  typeFilter: string = 'all'
) {
  const [clients, setClients] = useState<B2BClient[]>([])
  const [stats, setStats] = useState<B2BStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build the query for B2B clients
      let query = supabase
        .from('users')
        .select('id, email, phone, first_name, last_name, company_name, validation_status, is_active, created_at, institution_type')
        .eq('user_type', 'b2b')
        .order('created_at', { ascending: false })

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('validation_status', statusFilter)
      }

      const { data: usersData, error: usersError } = await query

      if (usersError) throw usersError

      if (!usersData || usersData.length === 0) {
        setClients([])
        return
      }

      // Extract user IDs for batch queries
      const userIds = usersData.map(user => user.id)

      // Fetch B2B ledgers for all users in parallel
      const [ledgersResult, ordersResult] = await Promise.all([
        supabase
          .from('b2b_ledgers')
          .select('user_id, balance')
          .in('user_id', userIds),
        supabase
          .from('orders')
          .select('user_id, id')
          .in('user_id', userIds)
      ])

      if (ledgersResult.error) {
        console.error('Error fetching ledgers:', ledgersResult.error)
      }
      if (ordersResult.error) {
        console.error('Error fetching orders:', ordersResult.error)
      }

      // Create maps for efficient lookup
      const ledgerMap = new Map(
        (ledgersResult.data || []).map(ledger => [ledger.user_id, ledger.balance])
      )

      // Count orders per user
      const orderCountMap = new Map<string, number>()
      ;(ordersResult.data || []).forEach(order => {
        orderCountMap.set(order.user_id, (orderCountMap.get(order.user_id) || 0) + 1)
      })

      // Combine all data
      let clientsWithDetails: B2BClient[] = usersData.map(user => {
        return {
          id: user.id,
          company_name: user.company_name,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          email: user.email,
          institution_type: user.institution_type || null,
          created_at: user.created_at,
          validation_status: user.validation_status,
          is_active: user.is_active,
          total_orders: orderCountMap.get(user.id) || 0,
          credit_balance: ledgerMap.get(user.id) || 0
        }
      })

      // Apply search filter
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase()
        clientsWithDetails = clientsWithDetails.filter(client => {
          const companyName = client.company_name?.toLowerCase() || ''
          const firstName = client.first_name?.toLowerCase() || ''
          const lastName = client.last_name?.toLowerCase() || ''
          const phone = client.phone?.toLowerCase() || ''

          return (
            companyName.includes(lowerQuery) ||
            firstName.includes(lowerQuery) ||
            lastName.includes(lowerQuery) ||
            phone.includes(lowerQuery)
          )
        })
      }

      // Apply institution type filter
      if (typeFilter !== 'all') {
        clientsWithDetails = clientsWithDetails.filter(client =>
          client.institution_type?.toLowerCase() === typeFilter.toLowerCase()
        )
      }

      setClients(clientsWithDetails)
    } catch (err: any) {
      console.error('Error fetching B2B clients:', err)
      setError(err)
      toast.error('Failed to load B2B clients')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter, typeFilter])

  const fetchStats = useCallback(async () => {
    try {
      // Fetch all B2B users for stats
      const { data: allB2BUsers, error: usersError } = await supabase
        .from('users')
        .select('id, validation_status, is_active')
        .eq('user_type', 'b2b')

      if (usersError) throw usersError

      const totalClients = allB2BUsers?.length || 0
      const pendingValidation = allB2BUsers?.filter(u => u.validation_status === 'pending').length || 0
      const activeClients = allB2BUsers?.filter(u => u.validation_status === 'validated' && u.is_active).length || 0

      // Fetch all B2B ledgers to calculate total credit extended
      const { data: ledgers, error: ledgersError } = await supabase
        .from('b2b_ledgers')
        .select('balance')

      if (ledgersError) {
        console.error('Error fetching ledgers for stats:', ledgersError)
      }

      // Sum up all positive balances (credit extended to clients)
      const totalCreditExtended = (ledgers || [])
        .filter(ledger => ledger.balance > 0)
        .reduce((sum, ledger) => sum + Number(ledger.balance), 0)

      setStats({
        total_clients: totalClients,
        pending_validation: pendingValidation,
        active_clients: activeClients,
        total_credit_extended: totalCreditExtended
      })
    } catch (err: any) {
      console.error('Error fetching B2B stats:', err)
      // Don't show error toast for stats, just log it
    }
  }, [])

  useEffect(() => {
    fetchClients()
    fetchStats()
  }, [fetchClients, fetchStats])

  // Create a new B2B client
  const createB2BClient = useCallback(async (input: CreateB2BClientInput) => {
    try {
      setIsCreating(true)

      const { data, error } = await supabase.functions.invoke('admin-create-user-by-type', {
        body: {
          user_type: 'b2b',
          phone: input.phone,
          email: input.email,
          first_name: input.first_name,
          last_name: input.last_name,
          company_name: input.company_name,
          institution_type: input.institution_type,
          tax_id: input.tax_id || undefined
        }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error)

      toast.success('B2B client created successfully')

      // Refresh the list
      await fetchClients()
      await fetchStats()

      return data
    } catch (err: any) {
      console.error('Error creating B2B client:', err)
      toast.error(err.message || 'Failed to create B2B client')
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [fetchClients, fetchStats])

  // Validate a B2B client account
  const validateClient = useCallback(async (clientId: string, creditLimit?: number) => {
    try {
      setIsValidating(true)

      // Use the validate-b2b-profile edge function which also creates the ledger
      const { data, error } = await supabase.functions.invoke('validate-b2b-profile', {
        body: {
          user_id: clientId,
          validation_status: 'validated',
          credit_limit: creditLimit || 5000 // Default 5000 TND
        }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error || 'Validation failed')

      toast.success('Client validated successfully')
      await fetchClients()
      await fetchStats()
    } catch (err: any) {
      console.error('Error validating client:', err)
      toast.error(err.message || 'Failed to validate client')
      throw err
    } finally {
      setIsValidating(false)
    }
  }, [fetchClients, fetchStats])

  // Reject a B2B client account
  const rejectClient = useCallback(async (clientId: string, reason: string) => {
    try {
      setIsValidating(true)

      // Use the validate-b2b-profile edge function
      const { data, error } = await supabase.functions.invoke('validate-b2b-profile', {
        body: {
          user_id: clientId,
          validation_status: 'rejected',
          validation_notes: reason
        }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error || 'Rejection failed')

      toast.success('Client rejected')
      await fetchClients()
      await fetchStats()
    } catch (err: any) {
      console.error('Error rejecting client:', err)
      toast.error(err.message || 'Failed to reject client')
      throw err
    } finally {
      setIsValidating(false)
    }
  }, [fetchClients, fetchStats])

  // Update B2B client details
  const updateClient = useCallback(async (input: UpdateB2BClientInput) => {
    try {
      setIsUpdating(true)

      const updateData: any = { updated_at: new Date().toISOString() }
      if (input.company_name !== undefined) updateData.company_name = input.company_name
      if (input.first_name !== undefined) updateData.first_name = input.first_name
      if (input.last_name !== undefined) updateData.last_name = input.last_name
      if (input.phone !== undefined) updateData.phone = input.phone
      if (input.email !== undefined) updateData.email = input.email
      if (input.institution_type !== undefined) updateData.institution_type = input.institution_type
      if (input.tax_id !== undefined) updateData.tax_id = input.tax_id

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', input.id)

      if (error) throw error

      toast.success('Client updated successfully')
      await fetchClients()
    } catch (err: any) {
      console.error('Error updating client:', err)
      toast.error(err.message || 'Failed to update client')
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [fetchClients])

  // Update credit limit for a B2B client
  const updateCreditLimit = useCallback(async (input: UpdateCreditLimitInput) => {
    try {
      setIsUpdating(true)

      // Check if ledger exists
      const { data: existingLedger } = await supabase
        .from('b2b_ledgers')
        .select('id')
        .eq('user_id', input.client_id)
        .single()

      if (existingLedger) {
        // Update existing ledger
        const { error } = await supabase
          .from('b2b_ledgers')
          .update({ credit_limit: input.credit_limit, updated_at: new Date().toISOString() })
          .eq('user_id', input.client_id)

        if (error) throw error
      } else {
        // Create new ledger
        const { error } = await supabase
          .from('b2b_ledgers')
          .insert({ user_id: input.client_id, balance: 0, credit_limit: input.credit_limit })

        if (error) throw error
      }

      toast.success('Credit limit updated successfully')
      await fetchClients()
      await fetchStats()
    } catch (err: any) {
      console.error('Error updating credit limit:', err)
      toast.error(err.message || 'Failed to update credit limit')
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [fetchClients, fetchStats])

  // Suspend/Activate a B2B client
  const toggleClientStatus = useCallback(async (clientId: string, suspend: boolean) => {
    try {
      setIsUpdating(true)

      const { error } = await supabase
        .from('users')
        .update({
          is_active: !suspend,
          is_suspended: suspend,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) throw error

      toast.success(suspend ? 'Client suspended' : 'Client activated')
      await fetchClients()
      await fetchStats()
    } catch (err: any) {
      console.error('Error toggling client status:', err)
      toast.error(err.message || 'Failed to update client status')
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [fetchClients, fetchStats])

  return {
    clients,
    stats,
    isLoading,
    error,
    isCreating,
    isUpdating,
    isValidating,
    refetch: fetchClients,
    createB2BClient,
    validateClient,
    rejectClient,
    updateClient,
    updateCreditLimit,
    toggleClientStatus
  }
}
