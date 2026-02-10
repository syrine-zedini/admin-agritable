// Deliverers Data Hook (without React Query)
// Manages fetching deliverer data using plain React state

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Deliverer {
  id: string
  employee_id: string // Truncated ID for display
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  name: string // Combined first_name + last_name
  vehicle_type: string | null
  vehicle_plate: string | null
  vehicle_info: string // Combined vehicle_type + vehicle_plate
  user_type: string
  is_active: boolean
  is_suspended: boolean
  created_at: string
  hire_date: string // Formatted created_at for display
  status: 'On Route' | 'Active' | 'On Leave' | 'Inactive'
  today_stops: number
  completed_stops: number
  avg_stop_time: number | null // In minutes
  customer_rating: number | null // Average rating (1-5)
  cash_balance: number // Cash balance from deliverer_cash_tracking (default 0)
}

export interface DelivererStats {
  total_deliverers: number
  on_route_now: number
  avg_customer_rating: number
  avg_stop_time: number // In minutes
}

export interface UseDeliverersDataParams {
  searchQuery?: string
  statusFilter?: string
}

export interface CreateDelivererInput {
  phone: string
  email?: string
  first_name: string
  last_name: string
  vehicle_type: string
  vehicle_plate: string
}

export interface UpdateDelivererInput {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  vehicle_type?: string
  vehicle_plate?: string
}

export function useDeliverersData(params: UseDeliverersDataParams = {}) {
  const { searchQuery = '', statusFilter = 'all' } = params

  const [deliverers, setDeliverers] = useState<Deliverer[]>([])
  const [delivererStats, setDelivererStats] = useState<DelivererStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Determine deliverer status based on route, suspension, and activity
  const determineStatus = (
    isActive: boolean,
    isSuspended: boolean,
    hasActiveRoute: boolean
  ): 'On Route' | 'Active' | 'On Leave' | 'Inactive' => {
    if (hasActiveRoute) {
      return 'On Route'
    }
    if (isSuspended) {
      return 'On Leave'
    }
    if (!isActive) {
      return 'Inactive'
    }
    return 'Active'
  }

  // Calculate average stop time in minutes from route stops
  const calculateAvgStopTime = (stops: Array<{ actual_arrival: string | null; completed_at: string | null }>): number | null => {
    const completedStops = stops.filter(
      stop => stop.actual_arrival && stop.completed_at
    )

    if (completedStops.length === 0) return null

    const totalMinutes = completedStops.reduce((sum, stop) => {
      const arrival = new Date(stop.actual_arrival!)
      const completed = new Date(stop.completed_at!)
      const diffMs = completed.getTime() - arrival.getTime()
      const diffMinutes = diffMs / (1000 * 60)
      return sum + diffMinutes
    }, 0)

    return totalMinutes / completedStops.length
  }

  // Fetch deliverers with related data
  const fetchDeliverers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build base query for deliverer users
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          phone,
          first_name,
          last_name,
          vehicle_type,
          vehicle_plate,
          user_type,
          is_active,
          is_suspended,
          created_at
        `)
        .eq('user_type', 'deliverer')
        .order('created_at', { ascending: false })

      // Apply search filter if provided
      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,` +
          `last_name.ilike.%${searchQuery}%,` +
          `phone.ilike.%${searchQuery}%`
        )
      }

      const { data: usersData, error: usersError } = await query

      if (usersError) throw usersError

      if (!usersData || usersData.length === 0) {
        setDeliverers([])
        setIsLoading(false)
        return
      }

      // Extract deliverer IDs for batch queries
      const delivererIds = usersData.map(u => u.id)

      // Get today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowISO = tomorrow.toISOString()

      // Batch fetch today's delivery routes
      const { data: routesData, error: routesError } = await supabase
        .from('delivery_routes')
        .select('id, deliverer_id, status, total_stops, completed_stops')
        .in('deliverer_id', delivererIds)
        .gte('date', todayISO.split('T')[0])
        .lt('date', tomorrowISO.split('T')[0])

      if (routesError) console.error('Error fetching routes:', routesError)

      // Extract route IDs for today's routes
      const routeIds = routesData?.map(r => r.id) || []

      // Batch fetch route stops for today (for avg stop time calculation)
      const { data: stopsData, error: stopsError } = await supabase
        .from('route_stops')
        .select('route_id, actual_arrival, completed_at, status')
        .in('route_id', routeIds)

      if (stopsError) console.error('Error fetching route stops:', stopsError)

      // Batch fetch all route stops for each deliverer (for overall avg stop time)
      const { data: allRoutesData, error: allRoutesError } = await supabase
        .from('delivery_routes')
        .select('id, deliverer_id')
        .in('deliverer_id', delivererIds)

      if (allRoutesError) console.error('Error fetching all routes:', allRoutesError)

      const allRouteIds = allRoutesData?.map(r => r.id) || []

      const { data: allStopsData, error: allStopsError } = await supabase
        .from('route_stops')
        .select('route_id, actual_arrival, completed_at, status')
        .in('route_id', allRouteIds)
        .eq('status', 'completed')

      if (allStopsError) console.error('Error fetching all stops:', allStopsError)

      // Batch fetch customer ratings from orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('deliverer_id, customer_rating')
        .in('deliverer_id', delivererIds)
        .not('customer_rating', 'is', null)

      if (ordersError) console.error('Error fetching orders:', ordersError)

      // Batch fetch cash balances from deliverer_cash_tracking
      const { data: cashData, error: cashError } = await supabase
        .from('deliverer_cash_tracking')
        .select('deliverer_id, cash_balance')
        .in('deliverer_id', delivererIds)

      if (cashError) console.error('Error fetching cash balances:', cashError)

      // Create cash balance map
      const cashBalanceMap = new Map<string, number>()
      cashData?.forEach(record => {
        cashBalanceMap.set(record.deliverer_id, Number(record.cash_balance) || 0)
      })

      // Create lookup maps for efficient data access
      const routeMap = new Map(routesData?.map(r => [r.deliverer_id, r]) || [])

      // Map route stops by route_id
      const stopsByRouteMap = new Map<string, typeof stopsData>()
      stopsData?.forEach(stop => {
        if (!stopsByRouteMap.has(stop.route_id)) {
          stopsByRouteMap.set(stop.route_id, [])
        }
        stopsByRouteMap.get(stop.route_id)!.push(stop)
      })

      // Map all stops by deliverer (through routes)
      const allStopsByDelivererMap = new Map<string, typeof allStopsData>()
      allRoutesData?.forEach(route => {
        const stops = allStopsData?.filter(s => s.route_id === route.id) || []
        if (!allStopsByDelivererMap.has(route.deliverer_id)) {
          allStopsByDelivererMap.set(route.deliverer_id, [])
        }
        allStopsByDelivererMap.get(route.deliverer_id)!.push(...stops)
      })

      // Calculate average customer rating per deliverer
      const ratingMap = new Map<string, number>()
      const ratingCountMap = new Map<string, number>()
      ordersData?.forEach(order => {
        const currentSum = ratingMap.get(order.deliverer_id!) || 0
        const currentCount = ratingCountMap.get(order.deliverer_id!) || 0
        ratingMap.set(order.deliverer_id!, currentSum + order.customer_rating!)
        ratingCountMap.set(order.deliverer_id!, currentCount + 1)
      })

      const avgRatingMap = new Map<string, number>()
      ratingMap.forEach((sum, delivererId) => {
        const count = ratingCountMap.get(delivererId) || 1
        avgRatingMap.set(delivererId, sum / count)
      })

      // Combine all data
      const deliverersWithDetails = usersData.map(user => {
        const route = routeMap.get(user.id)
        const hasActiveRoute = route?.status === 'in_progress'
        const todayStops = route?.total_stops || 0
        const completedStops = route?.completed_stops || 0

        // Calculate avg stop time from all historical stops
        const allStops = allStopsByDelivererMap.get(user.id) || []
        const avgStopTime = calculateAvgStopTime(allStops)

        const customerRating = avgRatingMap.get(user.id) || null

        const status = determineStatus(
          user.is_active,
          user.is_suspended,
          hasActiveRoute
        )

        // Format name and vehicle info
        const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'
        const vehicleInfo = user.vehicle_type && user.vehicle_plate
          ? `${user.vehicle_type} - ${user.vehicle_plate}`
          : user.vehicle_type || user.vehicle_plate || 'N/A'

        // Get cash balance (default to 0 if no record)
        const cashBalance = cashBalanceMap.get(user.id) || 0

        return {
          ...user,
          employee_id: user.id.substring(0, 8),
          name,
          vehicle_info: vehicleInfo,
          hire_date: user.created_at,
          status,
          today_stops: todayStops,
          completed_stops: completedStops,
          avg_stop_time: avgStopTime,
          customer_rating: customerRating,
          cash_balance: cashBalance
        } as Deliverer
      })

      // Apply status filter if not 'all'
      let filteredDeliverers = deliverersWithDetails
      if (statusFilter !== 'all') {
        const statusMap: Record<string, Deliverer['status']> = {
          'on-route': 'On Route',
          'active': 'Active',
          'on-leave': 'On Leave',
          'inactive': 'Inactive'
        }
        const targetStatus = statusMap[statusFilter]
        if (targetStatus) {
          filteredDeliverers = deliverersWithDetails.filter(d => d.status === targetStatus)
        }
      }

      setDeliverers(filteredDeliverers)
    } catch (err: any) {
      console.error('Error fetching deliverers:', err)
      setError(err)
      toast.error('Failed to load deliverers')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter])

  // Fetch deliverer statistics
  const fetchDelivererStats = useCallback(async () => {
    try {
      // Get total deliverers count
      const { data: allDeliverers, error: deliverersError } = await supabase
        .from('users')
        .select('id')
        .eq('user_type', 'deliverer')

      if (deliverersError) throw deliverersError

      const totalDeliverers = allDeliverers?.length || 0
      const delivererIds = allDeliverers?.map(d => d.id) || []

      // Get today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowISO = tomorrow.toISOString()

      // Get count of deliverers on route today
      const { data: activeRoutes, error: activeRoutesError } = await supabase
        .from('delivery_routes')
        .select('deliverer_id')
        .eq('status', 'in_progress')
        .gte('date', todayISO.split('T')[0])
        .lt('date', tomorrowISO.split('T')[0])

      if (activeRoutesError) console.error('Error fetching active routes:', activeRoutesError)

      const onRouteNow = new Set(activeRoutes?.map(r => r.deliverer_id) || []).size

      // Calculate average customer rating across all deliverers
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('orders')
        .select('customer_rating')
        .in('deliverer_id', delivererIds)
        .not('customer_rating', 'is', null)

      if (ratingsError) console.error('Error fetching ratings:', ratingsError)

      const avgCustomerRating = ratingsData && ratingsData.length > 0
        ? ratingsData.reduce((sum, order) => sum + (order.customer_rating || 0), 0) / ratingsData.length
        : 0

      // Calculate average stop time across all deliverers
      const { data: allRoutesData, error: allRoutesError } = await supabase
        .from('delivery_routes')
        .select('id')
        .in('deliverer_id', delivererIds)

      if (allRoutesError) console.error('Error fetching all routes:', allRoutesError)

      const allRouteIds = allRoutesData?.map(r => r.id) || []

      const { data: allStopsData, error: allStopsError } = await supabase
        .from('route_stops')
        .select('actual_arrival, completed_at')
        .in('route_id', allRouteIds)
        .eq('status', 'completed')
        .not('actual_arrival', 'is', null)
        .not('completed_at', 'is', null)

      if (allStopsError) console.error('Error fetching all stops:', allStopsError)

      const avgStopTime = calculateAvgStopTime(allStopsData || []) || 0

      setDelivererStats({
        total_deliverers: totalDeliverers,
        on_route_now: onRouteNow,
        avg_customer_rating: avgCustomerRating,
        avg_stop_time: avgStopTime
      })
    } catch (err: any) {
      console.error('Error fetching deliverer stats:', err)
      // Don't show error toast for stats, just log it
    }
  }, [])

  // Fetch data on mount or when parameters change
  useEffect(() => {
    fetchDeliverers()
  }, [fetchDeliverers])

  // Fetch stats on mount (independent of search/filter)
  useEffect(() => {
    fetchDelivererStats()
  }, [fetchDelivererStats])

  // Create a new deliverer
  const createDeliverer = useCallback(async (input: CreateDelivererInput) => {
    try {
      setIsCreating(true)

      const { data, error } = await supabase.functions.invoke('admin-create-user-by-type', {
        body: {
          user_type: 'deliverer',
          phone: input.phone,
          email: input.email || undefined,
          first_name: input.first_name,
          last_name: input.last_name,
          vehicle_type: input.vehicle_type,
          vehicle_plate: input.vehicle_plate
        }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error)

      toast.success('Deliverer created successfully')

      // Refresh the list
      await fetchDeliverers()
      await fetchDelivererStats()

      return data
    } catch (err: any) {
      console.error('Error creating deliverer:', err)
      toast.error(err.message || 'Failed to create deliverer')
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [fetchDeliverers, fetchDelivererStats])

  // Update deliverer information
  const updateDeliverer = useCallback(async (delivererId: string, updates: UpdateDelivererInput) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', delivererId)
        .eq('user_type', 'deliverer')

      if (error) throw error

      toast.success('Deliverer updated successfully')

      // Refresh the list
      await fetchDeliverers()

      return true
    } catch (err: any) {
      console.error('Error updating deliverer:', err)
      toast.error(err.message || 'Failed to update deliverer')
      return false
    }
  }, [fetchDeliverers])

  // Toggle deliverer active status
  const toggleDelivererStatus = useCallback(async (delivererId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', delivererId)
        .eq('user_type', 'deliverer')

      if (error) throw error

      toast.success(isActive ? 'Deliverer activated' : 'Deliverer deactivated')

      // Refresh the list
      await fetchDeliverers()

      return true
    } catch (err: any) {
      console.error('Error toggling deliverer status:', err)
      toast.error(err.message || 'Failed to update deliverer status')
      return false
    }
  }, [fetchDeliverers])

  return {
    deliverers,
    delivererStats,
    isLoading,
    error,
    isCreating,
    refetch: fetchDeliverers,
    refetchStats: fetchDelivererStats,
    createDeliverer,
    updateDeliverer,
    toggleDelivererStatus
  }
}
