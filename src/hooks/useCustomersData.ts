// B2C Customers Data Hook (without React Query)
// Manages fetching B2C customer data using plain React state

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Customer {
  id: string
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  user_type: string
  is_active: boolean
  is_suspended: boolean
  created_at: string
  last_login_at: string | null
  wallet_balance: number
  loyalty_points: number
  total_orders: number
  status: 'Active' | 'Negative Balance' | 'Inactive'
}

export interface CustomerStats {
  total_customers: number
  active_today: number
  negative_balances: number
  avg_order_value: number
}

export interface UseCustomersDataParams {
  searchQuery?: string
  statusFilter?: string
}

export interface CreateCustomerInput {
  phone: string
  email?: string
  first_name: string
  last_name: string
}

export function useCustomersData(params: UseCustomersDataParams = {}) {
  const { searchQuery = '', statusFilter = 'all' } = params

  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [isSendingNotification, setIsSendingNotification] = useState(false)

  // Determine customer status based on activity and wallet balance
  const determineStatus = (
    isActive: boolean,
    isSuspended: boolean,
    walletBalance: number
  ): 'Active' | 'Negative Balance' | 'Inactive' => {
    if (!isActive || isSuspended) {
      return 'Inactive'
    }
    if (walletBalance < 0) {
      return 'Negative Balance'
    }
    return 'Active'
  }

  // Fetch B2C customers with related data
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build base query for B2C users
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          phone,
          first_name,
          last_name,
          user_type,
          is_active,
          is_suspended,
          created_at,
          last_login_at
        `)
        .eq('user_type', 'b2c')
        .order('created_at', { ascending: false })

      // Apply search filter if provided
      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,` +
          `last_name.ilike.%${searchQuery}%,` +
          `email.ilike.%${searchQuery}%,` +
          `phone.ilike.%${searchQuery}%`
        )
      }

      const { data: usersData, error: usersError } = await query

      if (usersError) throw usersError

      if (!usersData || usersData.length === 0) {
        setCustomers([])
        setIsLoading(false)
        return
      }

      // Extract user IDs for batch queries
      const userIds = usersData.map(u => u.id)

      // Batch fetch wallets for all users
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('user_id, balance')
        .in('user_id', userIds)

      if (walletsError) console.error('Error fetching wallets:', walletsError)

      // Batch fetch loyalty accounts for all users
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_accounts')
        .select('user_id, points_balance')
        .in('user_id', userIds)

      if (loyaltyError) console.error('Error fetching loyalty accounts:', loyaltyError)

      // Batch fetch order counts for all users
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('user_id')
        .in('user_id', userIds)

      if (ordersError) console.error('Error fetching orders:', ordersError)

      // Create lookup maps for efficient data access
      const walletMap = new Map(walletsData?.map(w => [w.user_id, Number(w.balance)]) || [])
      const loyaltyMap = new Map(loyaltyData?.map(l => [l.user_id, l.points_balance]) || [])

      // Count orders per user
      const orderCountMap = new Map<string, number>()
      ordersData?.forEach(order => {
        const currentCount = orderCountMap.get(order.user_id) || 0
        orderCountMap.set(order.user_id, currentCount + 1)
      })

      // Combine all data
      const customersWithDetails = usersData.map(user => {
        const walletBalance = walletMap.get(user.id) || 0
        const loyaltyPoints = loyaltyMap.get(user.id) || 0
        const totalOrders = orderCountMap.get(user.id) || 0

        const status = determineStatus(
          user.is_active,
          user.is_suspended,
          walletBalance
        )

        return {
          ...user,
          wallet_balance: walletBalance,
          loyalty_points: loyaltyPoints,
          total_orders: totalOrders,
          status
        } as Customer
      })

      // Apply status filter if not 'all'
      let filteredCustomers = customersWithDetails
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          filteredCustomers = customersWithDetails.filter(c => c.status === 'Active')
        } else if (statusFilter === 'negative') {
          filteredCustomers = customersWithDetails.filter(c => c.status === 'Negative Balance')
        } else if (statusFilter === 'inactive') {
          filteredCustomers = customersWithDetails.filter(c => c.status === 'Inactive')
        }
      }

      setCustomers(filteredCustomers)
    } catch (err: any) {
      console.error('Error fetching customers:', err)
      setError(err)
      toast.error('Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter])

  // Fetch customer statistics
  const fetchCustomerStats = useCallback(async () => {
    try {
      // Run all stat queries in parallel for better performance
      const [
        totalCountResult,
        activeTodayResult,
        walletsResult,
        b2cUsersResult
      ] = await Promise.all([
        // Get total B2C customers count
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'b2c'),

        // Get active today count (users who logged in today)
        (() => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayISO = today.toISOString()
          return supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('user_type', 'b2c')
            .gte('last_login_at', todayISO)
        })(),

        // Get all wallets to find negative balances
        supabase
          .from('wallets')
          .select('user_id, balance'),

        // Get B2C user IDs for orders query
        supabase
          .from('users')
          .select('id')
          .eq('user_type', 'b2c')
      ])

      const totalCount = totalCountResult.count || 0
      const activeTodayCount = activeTodayResult.count || 0

      // Filter negative balances from B2C customers
      const b2cUserIds = new Set(b2cUsersResult.data?.map(u => u.id) || [])
      const negativeBalancesCount = walletsResult.data?.filter(w =>
        b2cUserIds.has(w.user_id) && Number(w.balance) < 0
      ).length || 0

      // Calculate average order value for B2C customers only
      if (b2cUserIds.size > 0) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('total')
          .in('user_id', Array.from(b2cUserIds))

        const totalOrderValue = ordersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0
        const orderCount = ordersData?.length || 0
        const avgOrderValue = orderCount > 0 ? totalOrderValue / orderCount : 0

        setCustomerStats({
          total_customers: totalCount,
          active_today: activeTodayCount,
          negative_balances: negativeBalancesCount,
          avg_order_value: avgOrderValue
        })
      } else {
        setCustomerStats({
          total_customers: totalCount,
          active_today: activeTodayCount,
          negative_balances: negativeBalancesCount,
          avg_order_value: 0
        })
      }
    } catch (err: any) {
      console.error('Error fetching customer stats:', err)
      // Don't show error toast for stats, just log it
    }
  }, [])

  // Fetch data on mount or when parameters change
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Fetch stats on mount (independent of search/filter)
  useEffect(() => {
    fetchCustomerStats()
  }, [fetchCustomerStats])

  // Create a new customer
  const createCustomer = useCallback(async (input: CreateCustomerInput) => {
    try {
      setIsCreating(true)

      const { data, error } = await supabase.functions.invoke('admin-create-user-by-type', {
        body: {
          user_type: 'b2c',
          phone: input.phone,
          email: input.email || undefined,
          first_name: input.first_name,
          last_name: input.last_name
        }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error)

      toast.success('Customer created successfully')

      // Refresh the list
      await fetchCustomers()
      await fetchCustomerStats()

      return data
    } catch (err: any) {
      console.error('Error creating customer:', err)
      toast.error(err.message || 'Failed to create customer')
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [fetchCustomers, fetchCustomerStats])

  // Toggle customer active status (activate/deactivate)
  const toggleCustomerStatus = useCallback(async (userId: string, isActive: boolean) => {
    try {
      setIsTogglingStatus(true)

      const { error } = await supabase
        .from('users')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error

      toast.success(isActive ? 'Customer activated successfully' : 'Customer deactivated successfully')

      // Update local state
      setCustomers(prev => prev.map(c =>
        c.id === userId
          ? { ...c, is_active: isActive, status: isActive ? (c.wallet_balance < 0 ? 'Negative Balance' : 'Active') : 'Inactive' }
          : c
      ))

      // Refresh stats
      await fetchCustomerStats()
    } catch (err: any) {
      console.error('Error toggling customer status:', err)
      toast.error(err.message || 'Failed to update customer status')
      throw err
    } finally {
      setIsTogglingStatus(false)
    }
  }, [fetchCustomerStats])

  // Send notification to a customer
  const sendNotification = useCallback(async (userId: string, title: string, message: string) => {
    try {
      setIsSendingNotification(true)

      // Insert notification into the notifications table
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: title,
          body: message,
          type: 'admin',
          channels: ['in_app'],
          read: false
        })

      if (error) throw error

      toast.success('Notification sent successfully')
    } catch (err: any) {
      console.error('Error sending notification:', err)
      toast.error(err.message || 'Failed to send notification')
      throw err
    } finally {
      setIsSendingNotification(false)
    }
  }, [])

  return {
    customers,
    customerStats,
    isLoading,
    error,
    isCreating,
    isTogglingStatus,
    isSendingNotification,
    refetch: fetchCustomers,
    refetchStats: fetchCustomerStats,
    createCustomer,
    toggleCustomerStatus,
    sendNotification
  }
}
