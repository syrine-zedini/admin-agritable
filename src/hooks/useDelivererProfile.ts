// Deliverer Profile Hook
// Fetches detailed profile data for a single deliverer

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface DelivererProfile {
  id: string
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  name: string
  vehicle_type: string | null
  vehicle_plate: string | null
  user_type: string
  is_active: boolean
  is_suspended: boolean
  created_at: string
  status: 'On Route' | 'Active' | 'On Leave' | 'Inactive'
}

export interface TodayActivity {
  currentRouteId: string | null
  currentRouteName: string | null
  stopsCompleted: number
  totalStops: number
  hasActiveRoute: boolean
}

export interface WeekPerformance {
  totalDeliveries: number
  totalCollections: number
  onTimeRate: number
  avgStopTime: number | null
  customerRating: number | null
}

export interface RouteHistoryItem {
  id: string
  date: string
  stopsCompleted: number
  totalStops: number
  status: string
  cashCollected: number
}

export interface UseDelivererProfileReturn {
  deliverer: DelivererProfile | null
  todayActivity: TodayActivity | null
  weekPerformance: WeekPerformance | null
  routeHistory: RouteHistoryItem[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDelivererProfile(delivererId: string): UseDelivererProfileReturn {
  const [deliverer, setDeliverer] = useState<DelivererProfile | null>(null)
  const [todayActivity, setTodayActivity] = useState<TodayActivity | null>(null)
  const [weekPerformance, setWeekPerformance] = useState<WeekPerformance | null>(null)
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!delivererId) return

    try {
      setIsLoading(true)
      setError(null)

      // Fetch deliverer basic info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', delivererId)
        .eq('user_type', 'deliverer')
        .single()

      if (userError) throw userError

      // Get today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]

      // Fetch today's route
      const { data: todayRoute, error: routeError } = await supabase
        .from('delivery_routes')
        .select('id, status, total_stops, completed_stops')
        .eq('deliverer_id', delivererId)
        .eq('date', todayStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (routeError) console.error('Error fetching today route:', routeError)

      const hasActiveRoute = todayRoute?.status === 'in_progress'

      // Determine status
      let status: DelivererProfile['status'] = 'Active'
      if (hasActiveRoute) {
        status = 'On Route'
      } else if (userData.is_suspended) {
        status = 'On Leave'
      } else if (!userData.is_active) {
        status = 'Inactive'
      }

      const name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'N/A'

      setDeliverer({
        ...userData,
        name,
        status,
      })

      // Set today's activity
      setTodayActivity({
        currentRouteId: todayRoute?.id || null,
        currentRouteName: todayRoute?.id ? `Route #${todayRoute.id.substring(0, 8)}` : null,
        stopsCompleted: todayRoute?.completed_stops || 0,
        totalStops: todayRoute?.total_stops || 0,
        hasActiveRoute,
      })

      // Fetch week performance (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoStr = weekAgo.toISOString().split('T')[0]

      const { data: weekRoutes, error: weekRoutesError } = await supabase
        .from('delivery_routes')
        .select('id, total_stops, completed_stops, status')
        .eq('deliverer_id', delivererId)
        .gte('date', weekAgoStr)
        .lte('date', todayStr)

      if (weekRoutesError) console.error('Error fetching week routes:', weekRoutesError)

      // Calculate week stats
      const totalDeliveries = weekRoutes?.reduce((sum, r) => sum + (r.completed_stops || 0), 0) || 0
      const totalCollections = weekRoutes?.filter(r => r.status === 'completed').length || 0

      // Fetch route stops for avg stop time calculation
      const weekRouteIds = weekRoutes?.map(r => r.id) || []
      let avgStopTime: number | null = null

      if (weekRouteIds.length > 0) {
        const { data: stopsData, error: stopsError } = await supabase
          .from('route_stops')
          .select('actual_arrival, completed_at')
          .in('route_id', weekRouteIds)
          .eq('status', 'completed')
          .not('actual_arrival', 'is', null)
          .not('completed_at', 'is', null)

        if (!stopsError && stopsData && stopsData.length > 0) {
          const totalMinutes = stopsData.reduce((sum, stop) => {
            const arrival = new Date(stop.actual_arrival!)
            const completed = new Date(stop.completed_at!)
            const diffMs = completed.getTime() - arrival.getTime()
            return sum + diffMs / (1000 * 60)
          }, 0)
          avgStopTime = totalMinutes / stopsData.length
        }
      }

      // Fetch customer rating
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('orders')
        .select('customer_rating')
        .eq('deliverer_id', delivererId)
        .not('customer_rating', 'is', null)

      let customerRating: number | null = null
      if (!ratingsError && ratingsData && ratingsData.length > 0) {
        const sum = ratingsData.reduce((s, o) => s + (o.customer_rating || 0), 0)
        customerRating = sum / ratingsData.length
      }

      // Calculate on-time rate (simplified - based on completed vs total)
      const totalPlanned = weekRoutes?.reduce((sum, r) => sum + (r.total_stops || 0), 0) || 0
      const onTimeRate = totalPlanned > 0 ? (totalDeliveries / totalPlanned) * 100 : 0

      setWeekPerformance({
        totalDeliveries,
        totalCollections,
        onTimeRate,
        avgStopTime,
        customerRating,
      })

      // Fetch route history (last 30 days)
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)
      const monthAgoStr = monthAgo.toISOString().split('T')[0]

      const { data: historyData, error: historyError } = await supabase
        .from('delivery_routes')
        .select('id, date, total_stops, completed_stops, status')
        .eq('deliverer_id', delivererId)
        .gte('date', monthAgoStr)
        .order('date', { ascending: false })
        .limit(20)

      if (historyError) console.error('Error fetching route history:', historyError)

      setRouteHistory(
        (historyData || []).map(route => ({
          id: route.id,
          date: route.date,
          stopsCompleted: route.completed_stops || 0,
          totalStops: route.total_stops || 0,
          status: route.status || 'unknown',
          cashCollected: 0, // Would need to join with transactions
        }))
      )
    } catch (err: any) {
      console.error('Error fetching deliverer profile:', err)
      setError(err)
      toast.error('Failed to load deliverer profile')
    } finally {
      setIsLoading(false)
    }
  }, [delivererId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    deliverer,
    todayActivity,
    weekPerformance,
    routeHistory,
    isLoading,
    error,
    refetch: fetchData,
  }
}
