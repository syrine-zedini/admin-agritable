// Products Data Hook (without React Query)
// Manages fetching products data with categories, B2B pricing, and stats

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Product {
  id: string
  sku: string
  name_fr: string
  name_ar: string | null
  name_tn: string | null
  description_fr: string | null
  category_id: string | null
  category_name: string | null
  unit: string
  price: number
  cost_price: number | null
  stock_quantity: number
  consignment_stock: number // Consignment stock (Dépôt-Vente)
  owned_stock: number // Computed: stock_quantity - consignment_stock
  low_stock_threshold: number
  min_order_quantity: number
  max_order_quantity: number | null
  images: string[]
  is_active: boolean
  is_available: boolean
  is_bio: boolean
  is_new_in_stock: boolean
  is_featured: boolean
  is_seasonal: boolean
  origin_region: string | null
  created_at: string
  updated_at: string
  status: 'Active' | 'Low Stock' | 'Out of Stock'
  b2b_price: number // Default to regular price if no custom pricing
}

export interface ProductStats {
  total_products: number
  active_products: number
  out_of_stock: number
  low_stock_alerts: number
}

export interface Category {
  id: string
  slug: string
  name_fr: string
  name_ar: string | null
  name_tn: string | null
  is_active: boolean
}

export interface UseProductsDataParams {
  searchQuery?: string
  categoryFilter?: string
  statusFilter?: string
}

export function useProductsData(params: UseProductsDataParams = {}) {
  const { searchQuery = '', categoryFilter = 'all', statusFilter = 'all' } = params

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [productStats, setProductStats] = useState<ProductStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Determine product status based on stock
  const determineStatus = (
    stockQuantity: number,
    lowStockThreshold: number,
    isActive: boolean,
    isAvailable: boolean
  ): 'Active' | 'Low Stock' | 'Out of Stock' => {
    if (stockQuantity === 0) {
      return 'Out of Stock'
    }
    if (stockQuantity < lowStockThreshold && stockQuantity > 0) {
      return 'Low Stock'
    }
    if (isActive && isAvailable) {
      return 'Active'
    }
    return 'Out of Stock'
  }

  // Fetch categories for filter dropdown
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, slug, name_fr, name_ar, name_tn, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      setCategories(data || [])
    } catch (err: any) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  // Fetch products with related data
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build base query for products (exclude soft-deleted)
      let query = supabase
        .from('products')
        .select(`
          id,
          sku,
          name_fr,
          name_ar,
          name_tn,
          description_fr,
          category_id,
          unit,
          price,
          cost_price,
          stock_quantity,
          consignment_stock,
          low_stock_threshold,
          min_order_quantity,
          max_order_quantity,
          images,
          is_active,
          is_available,
          is_bio,
          is_new_in_stock,
          is_featured,
          is_seasonal,
          origin_region,
          created_at,
          updated_at
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Apply search filter if provided
      if (searchQuery) {
        query = query.or(
          `name_fr.ilike.%${searchQuery}%,` +
          `name_ar.ilike.%${searchQuery}%,` +
          `name_tn.ilike.%${searchQuery}%,` +
          `sku.ilike.%${searchQuery}%`
        )
      }

      // Apply category filter if not 'all'
      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter)
      }

      const { data: productsData, error: productsError } = await query

      if (productsError) throw productsError

      if (!productsData || productsData.length === 0) {
        setProducts([])
        setIsLoading(false)
        return
      }

      // Extract product IDs and category IDs for batch queries
      const productIds = productsData.map(p => p.id)
      const categoryIds = [...new Set(productsData.map(p => p.category_id).filter(Boolean))] as string[]

      // Batch fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name_fr')
        .in('id', categoryIds)

      if (categoriesError) console.error('Error fetching categories:', categoriesError)

      // Batch fetch B2B pricing (if any custom pricing exists)
      const { data: b2bPricingData, error: b2bPricingError } = await supabase
        .from('b2b_pricing')
        .select('product_id, custom_price')
        .in('product_id', productIds)

      if (b2bPricingError) console.error('Error fetching B2B pricing:', b2bPricingError)

      // Create lookup maps
      const categoryMap = new Map(categoriesData?.map(c => [c.id, c.name_fr]) || [])

      // For B2B pricing, use the first custom price found (could be enhanced to show multiple)
      const b2bPriceMap = new Map<string, number>()
      b2bPricingData?.forEach(bp => {
        if (!b2bPriceMap.has(bp.product_id)) {
          b2bPriceMap.set(bp.product_id, Number(bp.custom_price))
        }
      })

      // Combine all data
      const productsWithDetails = productsData.map(product => {
        const categoryName = product.category_id ? categoryMap.get(product.category_id) || null : null
        const b2bPrice = b2bPriceMap.get(product.id) || Number(product.price)
        const consignmentStock = product.consignment_stock || 0
        const ownedStock = product.stock_quantity - consignmentStock

        const status = determineStatus(
          product.stock_quantity,
          product.low_stock_threshold,
          product.is_active,
          product.is_available
        )

        return {
          ...product,
          price: Number(product.price),
          cost_price: product.cost_price ? Number(product.cost_price) : null,
          category_name: categoryName,
          images: Array.isArray(product.images) ? product.images : [],
          b2b_price: b2bPrice,
          consignment_stock: consignmentStock,
          owned_stock: ownedStock,
          status
        } as Product
      })

      // Apply status filter if not 'all'
      let filteredProducts = productsWithDetails
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          filteredProducts = productsWithDetails.filter(p => p.status === 'Active')
        } else if (statusFilter === 'low-stock') {
          filteredProducts = productsWithDetails.filter(p => p.status === 'Low Stock')
        } else if (statusFilter === 'out-of-stock') {
          filteredProducts = productsWithDetails.filter(p => p.status === 'Out of Stock')
        }
      }

      setProducts(filteredProducts)
    } catch (err: any) {
      console.error('Error fetching products:', err)
      setError(err)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, categoryFilter, statusFilter])

  // Fetch product statistics
  const fetchProductStats = useCallback(async () => {
    try {
      // Run all stat queries in parallel for better performance
      const [
        totalCountResult,
        allProductsResult
      ] = await Promise.all([
        // Get total products count (non-deleted)
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),

        // Get all products to calculate stats
        supabase
          .from('products')
          .select('stock_quantity, low_stock_threshold, is_active, is_available')
          .is('deleted_at', null)
      ])

      const totalCount = totalCountResult.count || 0

      // Calculate stats from all products
      const allProducts = allProductsResult.data || []

      const activeProducts = allProducts.filter(p =>
        p.is_active && p.is_available && p.stock_quantity > 0
      ).length

      const outOfStock = allProducts.filter(p =>
        p.stock_quantity === 0
      ).length

      const lowStockAlerts = allProducts.filter(p =>
        p.stock_quantity > 0 && p.stock_quantity < p.low_stock_threshold
      ).length

      setProductStats({
        total_products: totalCount,
        active_products: activeProducts,
        out_of_stock: outOfStock,
        low_stock_alerts: lowStockAlerts
      })
    } catch (err: any) {
      console.error('Error fetching product stats:', err)
      // Don't show error toast for stats, just log it
    }
  }, [])

  // Fetch data on mount or when parameters change
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Fetch stats on mount (independent of search/filter)
  useEffect(() => {
    fetchProductStats()
  }, [fetchProductStats])

  return {
    products,
    categories,
    productStats,
    isLoading,
    error,
    refetch: fetchProducts,
    refetchStats: fetchProductStats,
    refetchCategories: fetchCategories
  }
}
