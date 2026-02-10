// New In Stock Configuration Hook
// Manages fetching and updating the global "New In Stock" configuration

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface NewInStockConfig {
  id: string
  enabled: boolean
  hours_until_expiration: number
  created_at: string
  updated_at: string
}

export function useNewInStockConfig() {
  const [config, setConfig] = useState<NewInStockConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isTriggeringUpdate, setIsTriggeringUpdate] = useState(false)

  // Fetch configuration from database
  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('new_in_stock_config')
        .select('*')
        .single()

      if (error) throw error

      setConfig(data as NewInStockConfig)
    } catch (err: any) {
      console.error('Error fetching new in stock config:', err)
      toast.error('Failed to load configuration')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update configuration
  const updateConfig = useCallback(async (updates: Partial<NewInStockConfig>) => {
    if (!config) return

    try {
      setIsUpdating(true)
      const { data, error } = await supabase
        .from('new_in_stock_config')
        .update(updates)
        .eq('id', config.id)
        .select()
        .single()

      if (error) throw error

      setConfig(data as NewInStockConfig)
      toast.success('Configuration updated successfully')
    } catch (err: any) {
      console.error('Error updating config:', err)
      toast.error('Failed to update configuration')
    } finally {
      setIsUpdating(false)
    }
  }, [config])

  // Trigger manual auto-update (calls RPC function)
  const triggerAutoUpdate = useCallback(async () => {
    try {
      setIsTriggeringUpdate(true)
      const { data, error } = await supabase
        .rpc('auto_update_new_in_stock')

      if (error) throw error

      const updatedCount = data as number
      toast.success(`Updated ${updatedCount} product(s)`)
    } catch (err: any) {
      console.error('Error triggering auto-update:', err)
      toast.error('Failed to trigger update')
    } finally {
      setIsTriggeringUpdate(false)
    }
  }, [])

  // Fetch config on mount
  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    isLoading,
    isUpdating,
    isTriggeringUpdate,
    updateConfig,
    triggerAutoUpdate,
    refetch: fetchConfig
  }
}
