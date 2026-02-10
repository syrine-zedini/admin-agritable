// Supplier Location Hook
// Manages updating supplier GPS coordinates

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export interface UpdateLocationParams {
  latitude: number
  longitude: number
}

export interface UseSupplierLocationReturn {
  updateSupplierLocation: (
    supplierId: string,
    coordinates: UpdateLocationParams
  ) => Promise<void>
  isUpdating: boolean
  error: Error | null
}

export function useSupplierLocation(): UseSupplierLocationReturn {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  const updateSupplierLocation = useCallback(
    async (supplierId: string, coordinates: UpdateLocationParams) => {
      try {
        setIsUpdating(true)
        setError(null)

        // Validate coordinates
        if (
          coordinates.latitude < -90 ||
          coordinates.latitude > 90 ||
          coordinates.longitude < -180 ||
          coordinates.longitude > 180
        ) {
          throw new Error('Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180')
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            location_verified_at: new Date().toISOString(),
            location_verified_by: user?.id || null,
            location_source: 'admin'
          })
          .eq('id', supplierId)
          .eq('user_type', 'supplier')

        if (updateError) {
          throw updateError
        }

        toast.success('Supplier location updated successfully')
      } catch (err: any) {
        console.error('Error updating supplier location:', err)
        setError(err)
        toast.error(err.message || 'Failed to update supplier location')
        throw err
      } finally {
        setIsUpdating(false)
      }
    },
    [user?.id]
  )

  return {
    updateSupplierLocation,
    isUpdating,
    error
  }
}
