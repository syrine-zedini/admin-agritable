// Admin Users Data Hook (without React Query)
// Manages fetching and mutations for admin users using plain React state

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { AdminRole } from '@/lib/permissions'

export interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  user_type: string
  role: AdminRole
  permission_count: number
  is_active: boolean
  is_suspended: boolean
  last_login_at: string | null
  created_at: string
}

export interface AdminStats {
  total_count: number
  active_count: number
  super_admin_count: number
  failed_logins_24h: number
}

export interface CreateAdminUserData {
  email: string
  password: string
  first_name: string
  last_name: string
  role: AdminRole
}

export interface UpdateAdminUserData {
  id: string
  first_name: string
  last_name: string
  email: string
  role: AdminRole
}

export function useAdminUsersData() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSuspending, setIsSuspending] = useState(false)

  // Fetch admin users
  const fetchAdminUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch admin users from the database
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, user_type, is_active, is_suspended, last_login_at, created_at')
        .eq('user_type', 'admin')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Fetch permissions count and role for each user
      const usersWithDetails = await Promise.all(
        (users || []).map(async (user) => {
          // Get permission count
          const { count } = await supabase
            .from('admin_permissions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          // Get role using RPC function
          const { data: roleData } = await supabase
            .rpc('get_user_role', { p_user_id: user.id })

          return {
            ...user,
            role: (roleData as string) || 'Admin',
            permission_count: count || 0
          } as AdminUser
        })
      )

      setAdminUsers(usersWithDetails)
    } catch (err: any) {
      console.error('Error fetching admin users:', err)
      setError(err)
      toast.error('Failed to load admin users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch admin stats
  const fetchAdminStats = useCallback(async () => {
    try {
      // Get total count
      const { count: totalCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'admin')

      // Get active count
      const { count: activeCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'admin')
        .eq('is_active', true)
        .eq('is_suspended', false)

      // Get SuperAdmin count
      const { data: superAdmins } = await supabase
        .from('admin_permissions')
        .select('user_id')
        .eq('permission', 'manage_permissions')

      const uniqueSuperAdmins = new Set(superAdmins?.map(p => p.user_id) || [])

      setAdminStats({
        total_count: totalCount || 0,
        active_count: activeCount || 0,
        super_admin_count: uniqueSuperAdmins.size,
        failed_logins_24h: 0 // Placeholder - would need auth logs
      })
    } catch (err: any) {
      console.error('Error fetching admin stats:', err)
    }
  }, [])

  // Create admin user
  const createAdminUser = useCallback(async (data: CreateAdminUserData) => {
    try {
      setIsCreating(true)

      // Call the admin-create-user Edge Function
      const { data: result, error } = await supabase.functions.invoke('admin-create-user', {
        body: data
      })

      if (error) throw error
      if (!result.success) throw new Error(result.error)

      toast.success('Admin user created successfully')

      // Refresh the list
      await fetchAdminUsers()
      await fetchAdminStats()

      return result
    } catch (err: any) {
      console.error('Error creating admin user:', err)
      toast.error(err.message || 'Failed to create admin user')
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [fetchAdminUsers, fetchAdminStats])

  // Update admin user
  const updateAdminUser = useCallback(async (data: UpdateAdminUserData) => {
    try {
      setIsUpdating(true)

      // Call the admin-update-user Edge Function
      const { data: result, error } = await supabase.functions.invoke('admin-update-user', {
        body: data
      })

      if (error) throw error
      if (!result.success) throw new Error(result.error)

      toast.success('Admin user updated successfully')

      // Refresh the list
      await fetchAdminUsers()
      await fetchAdminStats()

      return result
    } catch (err: any) {
      console.error('Error updating admin user:', err)
      toast.error(err.message || 'Failed to update admin user')
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [fetchAdminUsers, fetchAdminStats])

  // Suspend/Activate admin user
  const suspendAdminUser = useCallback(async (userId: string, suspended: boolean) => {
    try {
      setIsSuspending(true)

      // Update user suspension status
      const { error } = await supabase
        .from('users')
        .update({ is_suspended: suspended })
        .eq('id', userId)

      if (error) throw error

      toast.success(suspended ? 'User suspended successfully' : 'User activated successfully')

      // Refresh the list
      await fetchAdminUsers()
      await fetchAdminStats()
    } catch (err: any) {
      console.error('Error suspending admin user:', err)
      toast.error(err.message || 'Failed to update user status')
      throw err
    } finally {
      setIsSuspending(false)
    }
  }, [fetchAdminUsers, fetchAdminStats])

  // Fetch data on mount
  useEffect(() => {
    fetchAdminUsers()
    fetchAdminStats()
  }, [fetchAdminUsers, fetchAdminStats])

  return {
    adminUsers,
    adminStats,
    isLoading,
    error,
    isCreating,
    isUpdating,
    isSuspending,
    refetch: fetchAdminUsers,
    createAdminUser,
    updateAdminUser,
    suspendAdminUser
  }
}
