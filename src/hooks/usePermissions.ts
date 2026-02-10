// usePermissions Hook
// Helper hook for permission-based checks in components

import { useAuth } from './useAuth'
import { Permission, canAccessMenuItem } from '@/lib/permissions'

export function usePermissions() {
  const { permissions, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()

  /**
   * Check if user can view a specific resource
   */
  const canView = (resource: Permission): boolean => {
    return hasPermission(resource)
  }

  /**
   * Check if user can edit a specific resource
   */
  const canEdit = (resource: Permission): boolean => {
    return hasPermission(resource)
  }

  /**
   * Check if user can delete a specific resource
   */
  const canDelete = (resource: Permission): boolean => {
    return hasPermission(resource)
  }

  /**
   * Check if user can access a menu item by key
   */
  const canAccessMenu = (menuKey: string): boolean => {
    return canAccessMenuItem(permissions as string[], menuKey)
  }

  /**
   * Check if user has SuperAdmin role (all permissions)
   */
  const isSuperAdmin = (): boolean => {
    return hasPermission('platform_config') && hasPermission('manage_permissions')
  }

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView,
    canEdit,
    canDelete,
    canAccessMenu,
    isSuperAdmin
  }
}
