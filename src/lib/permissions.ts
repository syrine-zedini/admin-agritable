// Permission Constants and Types
// Defines all available permissions and role types for the admin system

// =====================================================
// ROLE TYPES
// =====================================================
export type AdminRole =
  | 'SuperAdmin'
  | 'Operational'
  | 'Financial'
  | 'Logistics'
  | 'Support'
  | 'Admin' // Generic admin

// =====================================================
// PERMISSION TYPES
// =====================================================
export type Permission =
  // Orders & Operations
  | 'view_orders'
  | 'manage_orders'
  | 'cancel_orders'
  | 'manage_preparation'
  | 'view_delivery_tracking'
  // Users & Accounts
  | 'view_users'
  | 'manage_users'
  | 'validate_b2b'
  | 'manage_wallets'
  | 'manage_suppliers'
  | 'manage_pickers'
  | 'manage_deliverers'
  | 'manage_admins'
  // Catalog & Inventory
  | 'view_products'
  | 'manage_products'
  | 'manage_categories'
  | 'manage_supplier_offers'
  // Logistics
  | 'view_logistics'
  | 'plan_routes'
  | 'configure_zones'
  | 'view_delivery_performance'
  // Finance
  | 'view_finances'
  | 'validate_payments'
  | 'view_financial_reports'
  | 'export_financial_data'
  | 'manage_supplier_payments'
  // Loyalty & Referrals
  | 'view_loyalty'
  | 'configure_loyalty'
  | 'manage_referral_codes'
  // Communications
  | 'send_notifications'
  | 'send_sms'
  | 'send_email'
  | 'manage_support_tickets'
  // Analytics & Reports
  | 'view_analytics'
  | 'export_data'
  // Settings
  | 'platform_config'
  | 'manage_pricing'
  | 'manage_delivery_settings'
  | 'manage_permissions'

// =====================================================
// MENU ITEM TO PERMISSION MAPPING
// =====================================================
// Maps sidebar menu items to required permissions

export interface MenuPermissions {
  [key: string]: Permission[]
}

export const MENU_PERMISSIONS: MenuPermissions = {
  // Dashboard - always visible to all admins
  dashboard: [],

  // Orders & Operations
  orders: ['view_orders'],
  'order-detail': ['view_orders'],
  'preparation-queue': ['manage_preparation'],
  'delivery-tracking': ['view_delivery_tracking'],

  // Users & Accounts
  'b2c-customers': ['view_users'],
  'b2b-clients': ['view_users'],
  'suppliers': ['manage_suppliers'],
  'preparateurs': ['manage_pickers'],
  'deliverers': ['manage_deliverers'],
  'admin-users': ['manage_admins'],

  // Catalog & Inventory
  products: ['view_products'],
  categories: ['manage_categories'],
  couffins: ['view_products'],
  'supplier-offers': ['manage_supplier_offers'],
  'supplier-demands': ['manage_supplier_offers'],

  // Logistics
  'route-planning': ['plan_routes'],
  'live-tracking': ['view_logistics'],
  'zones': ['configure_zones'],
  'delivery-performance': ['view_delivery_performance'],

  // Finances
  transactions: ['view_finances'],
  wallets: ['manage_wallets'],
  ledgers: ['view_finances'],
  'payments-reconciliation': ['validate_payments'],
  'supplier-payments': ['manage_supplier_payments'],
  'financial-reports': ['view_financial_reports'],

  // Loyalty & Referrals
  loyalty: ['view_loyalty'],
  'referral-codes': ['manage_referral_codes'],

  // Communications
  notifications: ['send_notifications'],
  sms: ['send_sms'],
  'support-tickets': ['manage_support_tickets'],

  // Analytics
  analytics: ['view_analytics'],
  'export-center': ['export_data'],

  // Settings
  settings: ['platform_config'],
  'pricing-rules': ['manage_pricing'],
  'delivery-settings': ['manage_delivery_settings'],
  permissions: ['manage_permissions']
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  userPermissions: string[],
  requiredPermission: Permission
): boolean => {
  return userPermissions.includes(requiredPermission)
}

/**
 * Check if user has ANY of the required permissions
 */
export const hasAnyPermission = (
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean => {
  if (requiredPermissions.length === 0) return true
  return requiredPermissions.some(permission =>
    userPermissions.includes(permission)
  )
}

/**
 * Check if user has ALL of the required permissions
 */
export const hasAllPermissions = (
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean => {
  if (requiredPermissions.length === 0) return true
  return requiredPermissions.every(permission =>
    userPermissions.includes(permission)
  )
}

/**
 * Check if user can access a menu item
 */
export const canAccessMenuItem = (
  userPermissions: string[],
  menuKey: string
): boolean => {
  const requiredPermissions = MENU_PERMISSIONS[menuKey] || []
  return hasAnyPermission(userPermissions, requiredPermissions)
}

/**
 * Get user-friendly permission name
 */
export const getPermissionLabel = (permission: Permission): string => {
  const labels: Record<Permission, string> = {
    // Orders & Operations
    view_orders: 'View Orders',
    manage_orders: 'Manage Orders',
    cancel_orders: 'Cancel Orders',
    manage_preparation: 'Manage Preparation',
    view_delivery_tracking: 'View Delivery Tracking',
    // Users & Accounts
    view_users: 'View Users',
    manage_users: 'Manage Users',
    validate_b2b: 'Validate B2B Accounts',
    manage_wallets: 'Manage Wallets',
    manage_suppliers: 'Manage Suppliers',
    manage_pickers: 'Manage Preparateurs',
    manage_deliverers: 'Manage Deliverers',
    manage_admins: 'Manage Admin Users',
    // Catalog & Inventory
    view_products: 'View Products',
    manage_products: 'Manage Products',
    manage_categories: 'Manage Categories',
    manage_supplier_offers: 'Manage Supplier Offers',
    // Logistics
    view_logistics: 'View Logistics',
    plan_routes: 'Plan Routes',
    configure_zones: 'Configure Zones',
    view_delivery_performance: 'View Delivery Performance',
    // Finance
    view_finances: 'View Finances',
    validate_payments: 'Validate Payments',
    view_financial_reports: 'View Financial Reports',
    export_financial_data: 'Export Financial Data',
    manage_supplier_payments: 'Manage Supplier Payments',
    // Loyalty & Referrals
    view_loyalty: 'View Loyalty Program',
    configure_loyalty: 'Configure Loyalty Program',
    manage_referral_codes: 'Manage Referral Codes',
    // Communications
    send_notifications: 'Send Notifications',
    send_sms: 'Send SMS',
    send_email: 'Send Email',
    manage_support_tickets: 'Manage Support Tickets',
    // Analytics & Reports
    view_analytics: 'View Analytics',
    export_data: 'Export Data',
    // Settings
    platform_config: 'Platform Configuration',
    manage_pricing: 'Manage Pricing Rules',
    manage_delivery_settings: 'Manage Delivery Settings',
    manage_permissions: 'Manage Permissions'
  }

  return labels[permission] || permission
}

/**
 * Get role badge color
 */
export const getRoleColor = (role: AdminRole): string => {
  const colors: Record<AdminRole, string> = {
    SuperAdmin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Operational: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Financial: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Logistics: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    Support: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    Admin: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return colors[role] || colors.Admin
}
