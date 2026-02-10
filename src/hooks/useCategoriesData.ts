// Categories Data Hook (using admin-categories Edge Function)
// Manages fetching categories data with hierarchy, product counts, and stats

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Category {
  id: string
  parent_id: string | null
  slug: string
  name_fr: string
  name_ar: string | null
  name_tn: string | null
  description_fr: string | null
  description_ar: string | null
  description_tn: string | null
  image_url: string | null
  icon_url: string | null
  sort_order: number
  is_active: boolean
  product_count: number
  subcategories: Subcategory[]
  created_at: string
  updated_at: string
}

export interface Subcategory {
  id: string
  name_fr: string
  name_ar: string | null
  name_tn: string | null
  is_active: boolean
  product_count: number
}

export interface CategoryStats {
  total_categories: number
  active_categories: number
  total_products: number
}

export interface CreateCategoryInput {
  parent_id?: string | null
  slug: string
  name_fr: string
  name_ar?: string
  name_tn?: string
  description_fr?: string
  description_ar?: string
  description_tn?: string
  image_url?: string
  icon_url?: string
  sort_order?: number
  is_active?: boolean
}

export interface UpdateCategoryInput {
  category_id: string
  parent_id?: string | null
  slug?: string
  name_fr?: string
  name_ar?: string | null
  name_tn?: string | null
  description_fr?: string | null
  description_ar?: string | null
  description_tn?: string | null
  image_url?: string | null
  icon_url?: string | null
  sort_order?: number
  is_active?: boolean
}
interface useCategoryParams {
  hierarchy?: boolean;
}
export function useCategoriesData(props?: useCategoryParams) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const hierarchy = props?.hierarchy != null ? props.hierarchy : true
  // Helper function to call admin-categories Edge Function
  const callAdminCategoriesFunction = async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    action?: string,
    body?: any
  ) => {
    const session = await supabase.auth.getSession()
    if (!session.data.session) {
      throw new Error('Not authenticated')
    }

    const url = new URL(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-categories`
    )

    if (action) {
      url.searchParams.set('action', action)
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.data.session.access_token}`
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.details || 'Request failed')
    }

    return data
  }

  // Fetch categories with hierarchy
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      if (!hierarchy) {
        const { data: allCategories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true })

        if (categoriesError) throw categoriesError
        setCategories(allCategories);
      } else {
        const parentCategories = await buildCategoryHierarchy()
        setCategories(parentCategories)

      }
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      setError(err)
      toast.error('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Build category hierarchy manually (fallback if RPC doesn't work as expected)
  const buildCategoryHierarchy = async (): Promise<Category[]> => {
    // Fetch all categories
    const { data: allCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (categoriesError) throw categoriesError

    if (!allCategories || allCategories.length === 0) {
      return []
    }

    // Fetch product counts for all categories
    const categoryIds = allCategories.map(c => c.id)
    const productCountsMap = new Map<string, number>()

    // Batch query for product counts
    const { data: productCounts, error: productCountsError } = await supabase
      .from('products')
      .select('category_id')
      .in('category_id', categoryIds)
      .is('deleted_at', null)

    if (!productCountsError && productCounts) {
      productCounts.forEach(p => {
        const count = productCountsMap.get(p.category_id) || 0
        productCountsMap.set(p.category_id, count + 1)
      })
    }

    // Separate parent and child categories
    const parentCats = allCategories.filter(c => c.parent_id === null)
    const childCats = allCategories.filter(c => c.parent_id !== null)

    // Build parent categories with subcategories
    const parentCategories: Category[] = parentCats.map(parent => {
      const subcategories = childCats
        .filter(child => child.parent_id === parent.id)
        .map(child => ({
          id: child.id,
          name_fr: child.name_fr,
          name_ar: child.name_ar,
          name_tn: child.name_tn,
          is_active: child.is_active,
          product_count: productCountsMap.get(child.id) || 0
        }))

      return {
        id: parent.id,
        parent_id: parent.parent_id,
        slug: parent.slug,
        name_fr: parent.name_fr,
        name_ar: parent.name_ar,
        name_tn: parent.name_tn,
        description_fr: parent.description_fr,
        description_ar: parent.description_ar,
        description_tn: parent.description_tn,
        image_url: parent.image_url,
        icon_url: parent.icon_url,
        sort_order: parent.sort_order,
        is_active: parent.is_active,
        product_count: productCountsMap.get(parent.id) || 0,
        subcategories: subcategories,
        created_at: parent.created_at,
        updated_at: parent.updated_at
      }
    })

    return parentCategories
  }
  // Fetch category statistics
  const fetchCategoryStats = useCallback(async () => {
    try {
      // Run stat queries in parallel
      const [
        totalCategoriesResult,
        activeCategoriesResult,
        totalProductsResult
      ] = await Promise.all([
        // Total parent categories
        supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })
          .is('parent_id', null),

        // Active parent categories
        supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })
          .is('parent_id', null)
          .eq('is_active', true),

        // Total products (non-deleted)
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
      ])

      const totalCategories = totalCategoriesResult.count || 0
      const activeCategories = activeCategoriesResult.count || 0
      const totalProducts = totalProductsResult.count || 0

      setCategoryStats({
        total_categories: totalCategories,
        active_categories: activeCategories,
        total_products: totalProducts
      })
    } catch (err: any) {
      console.error('Error fetching category stats:', err)
      // Don't show error toast for stats
    }
  }, [])

  // Create new category
  const createCategory = async (input: CreateCategoryInput): Promise<void> => {
    try {
      const result = await callAdminCategoriesFunction('POST', 'create', input)

      if (result.success) {
        toast.success('Category created successfully')
        await fetchCategories()
        await fetchCategoryStats()
      }
    } catch (err: any) {
      console.error('Error creating category:', err)
      toast.error(err.message || 'Failed to create category')
      throw err
    }
  }

  // Update category
  const updateCategory = async (input: UpdateCategoryInput): Promise<void> => {
    try {
      const result = await callAdminCategoriesFunction('PUT', 'update', input)

      if (result.success) {
        toast.success('Category updated successfully')
        await fetchCategories()
        await fetchCategoryStats()
      }
    } catch (err: any) {
      console.error('Error updating category:', err)
      toast.error(err.message || 'Failed to update category')
      throw err
    }
  }

  // Delete category
  const deleteCategory = async (categoryId: string): Promise<void> => {
    try {
      const result = await callAdminCategoriesFunction('DELETE', 'delete', {
        category_id: categoryId
      })

      if (result.success) {
        toast.success('Category deleted successfully')
        await fetchCategories()
        await fetchCategoryStats()
      }
    } catch (err: any) {
      console.error('Error deleting category:', err)

      // Handle specific error messages
      if (err.message.includes('child categories')) {
        toast.error('Cannot delete category with subcategories')
      } else if (err.message.includes('products')) {
        toast.error('Cannot delete category with products')
      } else {
        toast.error(err.message || 'Failed to delete category')
      }

      throw err
    }
  }

  // Fetch data on mount
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Fetch stats on mount
  useEffect(() => {
    fetchCategoryStats()
  }, [fetchCategoryStats])

  return {
    categories,
    categoryStats,
    isLoading,
    error,
    refetch: fetchCategories,
    refetchStats: fetchCategoryStats,
    createCategory,
    updateCategory,
    deleteCategory
  }
}

// Helper function to generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
