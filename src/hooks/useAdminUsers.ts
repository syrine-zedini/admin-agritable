// useAdminUsers Hook
// Custom hook for managing admin users with React Query integration

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'
import type { AdminRole } from '@/lib/permissions'

// =====================================================
// TYPES
// =====================================================

export interface AdminUserData {
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
  role: AdminRole
  permission_count: number
  permissions: string[]
}

export interface AdminUserStats {
  total_count: number
  active_count: number
  super_admin_count: number
  failed_logins_24h: number
}

export interface CreateAdminUserInput {
  email: string
  password: string
  first_name: string
  last_name: string
  role: AdminRole
}

export interface UpdateAdminUserInput {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  role?: AdminRole
  is_active?: boolean
  is_suspended?: boolean
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Fetch all admin users with their roles and permissions
 */
async function fetchAdminUsers(): Promise<AdminUserData[]> {
  // Query users table for all admins
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, phone, first_name, last_name, user_type, is_active, is_suspended, created_at, last_login_at')
    .eq('user_type', 'admin')
    .order('created_at', { ascending: false })

  if (usersError) {
    console.error('Error fetching admin users:', usersError)
    throw new Error(`Failed to fetch admin users: ${usersError.message}`)
  }

  if (!users || users.length === 0) {
    return []
  }

  // Fetch permissions for each user
  const usersWithPermissions = await Promise.all(
    users.map(async (user) => {
      // Get role using RPC function
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { p_user_id: user.id })

      if (roleError) {
        console.error(`Error fetching role for user ${user.id}:`, roleError)
      }

      // Get permissions using RPC function
      const { data: permissionsData, error: permissionsError } = await supabase
        .rpc('get_user_permissions', { p_user_id: user.id })

      if (permissionsError) {
        console.error(`Error fetching permissions for user ${user.id}:`, permissionsError)
      }

      const permissions = permissionsData || []
      const role = roleData || 'Admin'

      return {
        ...user,
        role: role as AdminRole,
        permission_count: permissions.length,
        permissions
      }
    })
  )

  return usersWithPermissions
}

/**
 * Fetch admin user statistics
 */
async function fetchAdminStats(): Promise<AdminUserStats> {
  // Get total admin count
  const { count: totalCount, error: totalError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'admin')

  if (totalError) {
    console.error('Error fetching total admin count:', totalError)
    throw new Error(`Failed to fetch admin statistics: ${totalError.message}`)
  }

  // Get active admin count
  const { count: activeCount, error: activeError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'admin')
    .eq('is_active', true)
    .eq('is_suspended', false)

  if (activeError) {
    console.error('Error fetching active admin count:', activeError)
  }

  // Get SuperAdmin count (users with platform_config permission)
  const { data: superAdmins, error: superAdminError } = await supabase
    .from('admin_permissions')
    .select('user_id')
    .eq('permission', 'platform_config')

  if (superAdminError) {
    console.error('Error fetching SuperAdmin count:', superAdminError)
  }

  const superAdminCount = superAdmins ? new Set(superAdmins.map(p => p.user_id)).size : 0

  // Failed logins would require a login_attempts table (not yet implemented)
  // For now, return 0
  const failedLogins24h = 0

  return {
    total_count: totalCount || 0,
    active_count: activeCount || 0,
    super_admin_count: superAdminCount,
    failed_logins_24h: failedLogins24h
  }
}

/**
 * Create a new admin user
 */
async function createAdminUser(input: CreateAdminUserInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: input
  })

  if (error) {
    console.error('Error creating admin user:', error)
    throw new Error(`Failed to create admin user: ${error.message}`)
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to create admin user')
  }
}

/**
 * Update an existing admin user
 */
async function updateAdminUser(input: UpdateAdminUserInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-update-user', {
    body: input
  })

  if (error) {
    console.error('Error updating admin user:', error)
    throw new Error(`Failed to update admin user: ${error.message}`)
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to update admin user')
  }
}

/**
 * Update user permissions (grant or revoke individual permissions)
 */
async function updateUserPermissions(userId: string, permissions: string[], grantedBy: string): Promise<void> {
  // First revoke all permissions
  const { error: revokeError } = await supabase.rpc('revoke_all_permissions', {
    p_user_id: userId
  })

  if (revokeError) {
    console.error('Error revoking permissions:', revokeError)
    throw new Error(`Failed to revoke permissions: ${revokeError.message}`)
  }

  // Then grant new permissions
  if (permissions.length > 0) {
    const { error: grantError } = await supabase
      .from('admin_permissions')
      .insert(
        permissions.map(permission => ({
          user_id: userId,
          permission,
          granted_by: grantedBy
        }))
      )

    if (grantError) {
      console.error('Error granting permissions:', grantError)
      throw new Error(`Failed to grant permissions: ${grantError.message}`)
    }
  }
}

/**
 * Delete/suspend an admin user
 */
async function suspendAdminUser(userId: string, suspended: boolean): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_suspended: suspended })
    .eq('id', userId)

  if (error) {
    console.error('Error suspending admin user:', error)
    throw new Error(`Failed to suspend admin user: ${error.message}`)
  }
}

// =====================================================
// REACT QUERY HOOKS
// =====================================================

/**
 * Hook to fetch all admin users
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
  })
}

/**
 * Hook to fetch admin user statistics
 */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true
  })
}

/**
 * Hook to create a new admin user
 */
export function useCreateAdminUser() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Admin user created successfully')
    },
    onError: (error: Error) => {
      console.error('Create admin user error:', error)
      toast.error(error.message || 'Failed to create admin user')
    }
  })
}

/**
 * Hook to update an admin user
 */
export function useUpdateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Admin user updated successfully')
    },
    onError: (error: Error) => {
      console.error('Update admin user error:', error)
      toast.error(error.message || 'Failed to update admin user')
    }
  })
}

/**
 * Hook to update user permissions
 */
export function useUpdateUserPermissions() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      updateUserPermissions(userId, permissions, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Permissions updated successfully')
    },
    onError: (error: Error) => {
      console.error('Update permissions error:', error)
      toast.error(error.message || 'Failed to update permissions')
    }
  })
}

/**
 * Hook to suspend/activate an admin user
 */
export function useSuspendAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, suspended }: { userId: string; suspended: boolean }) =>
      suspendAdminUser(userId, suspended),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success(variables.suspended ? 'Admin user suspended' : 'Admin user activated')
    },
    onError: (error: Error) => {
      console.error('Suspend admin user error:', error)
      toast.error(error.message || 'Failed to update admin user status')
    }
  })
}
