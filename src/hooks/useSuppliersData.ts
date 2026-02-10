// Suppliers Data Hook (without React Query)
// Manages fetching supplier data using plain React state

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Supplier {
  id: string
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  company_name: string | null
  location: string | null
  specialty: string | null
  user_type: string
  validation_status: string | null
  is_active: boolean
  is_depot_vente: boolean
  created_at: string
  products_supplied: number
  active_offers: number
  rating: number | null
  status: 'active' | 'pending' | 'inactive'
  latitude: number | null
  longitude: number | null
  location_verified_at: string | null
}

export interface SupplierStats {
  active_suppliers: number
  active_offers: number
  total_products: number
  pending_approval: number
}

export interface UseSuppliersDataParams {
  searchQuery?: string
  statusFilter?: string
}

export interface CreateSupplierInput {
  phone: string
  email?: string
  first_name: string
  last_name: string
  company_name: string
  location?: string
  specialty?: string
  latitude?: number
  longitude?: number
}

export function useSuppliersData(params: UseSuppliersDataParams = {}) {
  const { searchQuery = '', statusFilter = 'all' } = params

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierStats, setSupplierStats] = useState<SupplierStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Determine supplier status based on validation_status and is_active
  const determineStatus = (
    validationStatus: string | null,
    isActive: boolean
  ): 'active' | 'pending' | 'inactive' => {
    if (validationStatus === 'pending') {
      return 'pending'
    }
    if (validationStatus === 'validated' && isActive) {
      return 'active'
    }
    return 'inactive'
  }

  // Fetch suppliers with related data
  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build base query for suppliers
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          phone,
          first_name,
          last_name,
          company_name,
          location,
          specialty,
          user_type,
          validation_status,
          is_active,
          is_depot_vente,
          created_at,
          latitude,
          longitude,
          location_verified_at
        `)
        .eq('user_type', 'supplier')
        .order('created_at', { ascending: false })

      // Apply search filter if provided
      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,` +
          `last_name.ilike.%${searchQuery}%,` +
          `company_name.ilike.%${searchQuery}%,` +
          `email.ilike.%${searchQuery}%,` +
          `phone.ilike.%${searchQuery}%,` +
          `location.ilike.%${searchQuery}%`
        )
      }

      const { data: usersData, error: usersError } = await query

      if (usersError) throw usersError

      if (!usersData || usersData.length === 0) {
        setSuppliers([])
        setIsLoading(false)
        return
      }

      // Extract supplier IDs for batch queries
      const supplierIds = usersData.map(u => u.id)

      // Batch fetch supplier offers for all suppliers
      const { data: offersData, error: offersError } = await supabase
        .from('supplier_offers')
        .select('supplier_id, product_name, status')
        .in('supplier_id', supplierIds)

      if (offersError) console.error('Error fetching supplier offers:', offersError)

      // Create maps for efficient data access
      // Count total offers per supplier (excluding rejected)
      const activeOffersMap = new Map<string, number>()
      const productsSuppliedMap = new Map<string, Set<string>>()

      offersData?.forEach(offer => {
        // Count active offers (pending or approved)
        if (offer.status === 'pending' || offer.status === 'approved') {
          const currentCount = activeOffersMap.get(offer.supplier_id) || 0
          activeOffersMap.set(offer.supplier_id, currentCount + 1)
        }

        // Track unique products from approved offers
        if (offer.status === 'approved') {
          if (!productsSuppliedMap.has(offer.supplier_id)) {
            productsSuppliedMap.set(offer.supplier_id, new Set())
          }
          productsSuppliedMap.get(offer.supplier_id)!.add(offer.product_name)
        }
      })

      // Combine all data
      const suppliersWithDetails = usersData.map(user => {
        const activeOffers = activeOffersMap.get(user.id) || 0
        const productsSupplied = productsSuppliedMap.get(user.id)?.size || 0

        const status = determineStatus(
          user.validation_status,
          user.is_active
        )

        return {
          ...user,
          is_depot_vente: user.is_depot_vente || false,
          active_offers: activeOffers,
          products_supplied: productsSupplied,
          rating: null, // Rating system to be implemented later
          status
        } as Supplier
      })

      // Apply status filter if not 'all'
      let filteredSuppliers = suppliersWithDetails
      if (statusFilter === 'depot_vente') {
        // Filter for Dépôt-Vente suppliers only
        filteredSuppliers = suppliersWithDetails.filter(s => s.is_depot_vente)
      } else if (statusFilter !== 'all') {
        filteredSuppliers = suppliersWithDetails.filter(s => s.status === statusFilter)
      }

      setSuppliers(filteredSuppliers)
    } catch (err: any) {
      console.error('Error fetching suppliers:', err)
      setError(err)
      toast.error('Failed to load suppliers')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter])

  // Fetch supplier statistics
  const fetchSupplierStats = useCallback(async () => {
    try {
      // Run all stat queries in parallel for better performance
      const [
        allSuppliersResult,
        allOffersResult
      ] = await Promise.all([
        // Get all suppliers
        supabase
          .from('users')
          .select('id, validation_status, is_active')
          .eq('user_type', 'supplier'),

        // Get all supplier offers
        supabase
          .from('supplier_offers')
          .select('id, product_name, status, supplier_id')
      ])

      const allSuppliers = allSuppliersResult.data || []
      const allOffers = allOffersResult.data || []

      // Calculate stats
      const activeSuppliers = allSuppliers.filter(
        s => s.validation_status === 'validated' && s.is_active
      ).length

      const pendingApproval = allSuppliers.filter(
        s => s.validation_status === 'pending'
      ).length

      // Count active offers (pending or approved)
      const activeOffers = allOffers.filter(
        o => o.status === 'pending' || o.status === 'approved'
      ).length

      // Count unique products from approved offers
      const uniqueProducts = new Set(
        allOffers
          .filter(o => o.status === 'approved')
          .map(o => o.product_name)
      )
      const totalProducts = uniqueProducts.size

      setSupplierStats({
        active_suppliers: activeSuppliers,
        active_offers: activeOffers,
        total_products: totalProducts,
        pending_approval: pendingApproval
      })
    } catch (err: any) {
      console.error('Error fetching supplier stats:', err)
      // Don't show error toast for stats, just log it
    }
  }, [])

  // Fetch data on mount or when parameters change
  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  // Fetch stats on mount (independent of search/filter)
  useEffect(() => {
    fetchSupplierStats()
  }, [fetchSupplierStats])

  // Create a new supplier
  const createSupplier = useCallback(async (input: CreateSupplierInput) => {
    try {
      setIsCreating(true)

      const { data, error } = await supabase.functions.invoke('admin-create-user-by-type', {
        body: {
          user_type: 'supplier',
          phone: input.phone,
          email: input.email || undefined,
          first_name: input.first_name,
          last_name: input.last_name,
          company_name: input.company_name,
          location: input.location || undefined,
          specialty: input.specialty || undefined,
          latitude: input.latitude || undefined,
          longitude: input.longitude || undefined
        }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error)

      toast.success('Supplier created successfully')

      // Refresh the list
      await fetchSuppliers()
      await fetchSupplierStats()

      return data
    } catch (err: any) {
      console.error('Error creating supplier:', err)
      toast.error(err.message || 'Failed to create supplier')
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [fetchSuppliers, fetchSupplierStats])

  return {
    suppliers,
    supplierStats,
    isLoading,
    error,
    isCreating,
    refetch: fetchSuppliers,
    refetchStats: fetchSupplierStats,
    createSupplier
  }
}
