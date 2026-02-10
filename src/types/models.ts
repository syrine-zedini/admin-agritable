/**
 * Application Domain Models
 * These types wrap the database types for easier use in the application
 */

import type { Database } from './database.types'

// Extract table types for convenience
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// ============ User Types ============
export type User = Tables['users']['Row']
export type UserInsert = Tables['users']['Insert']
export type UserUpdate = Tables['users']['Update']
export type UserType = Enums['user_type']
export type Language = Enums['language']

// ============ Address Types ============
export type Address = Tables['addresses']['Row']
export type AddressInsert = Tables['addresses']['Insert']
export type AddressUpdate = Tables['addresses']['Update']

// ============ Product Types ============
export type Product = Tables['products']['Row']
export type ProductInsert = Tables['products']['Insert']
export type ProductUpdate = Tables['products']['Update']

// ============ Category Types ============
export type Category = Tables['categories']['Row']
export type CategoryInsert = Tables['categories']['Insert']
export type CategoryUpdate = Tables['categories']['Update']

// ============ Cart Types ============
export type Cart = Tables['carts']['Row']
export type CartItem = Tables['cart_items']['Row']
export type CartItemInsert = Tables['cart_items']['Insert']
export type CartItemUpdate = Tables['cart_items']['Update']

// ============ Order Types ============
export type Order = Tables['orders']['Row']
export type OrderInsert = Tables['orders']['Insert']
export type OrderUpdate = Tables['orders']['Update']
export type OrderItem = Tables['order_items']['Row']
export type OrderStatus = Enums['order_status']
export type PaymentMethod = Enums['payment_method']
export type PaymentStatus = Enums['payment_status']

// ============ Delivery Types ============
export type DeliveryZone = Tables['delivery_zones']['Row']
export type DeliveryWindow = Tables['delivery_windows']['Row']
export type DeliveryRoute = Tables['delivery_routes']['Row']
export type RouteStop = Tables['route_stops']['Row']
export type RouteStatus = Enums['route_status']

// ============ Payment Types ============
export type Payment = Tables['payments']['Row']
export type PaymentInsert = Tables['payments']['Insert']

// ============ Wallet Types ============
export type Wallet = Tables['wallets']['Row']
export type WalletTransaction = Tables['wallet_transactions']['Row']
export type WalletTransactionType = Enums['wallet_transaction_type']

// ============ Loyalty Types ============
export type LoyaltyAccount = Tables['loyalty_accounts']['Row']
export type LoyaltyTransaction = Tables['loyalty_transactions']['Row']
export type LoyaltyTransactionType = Enums['loyalty_transaction_type']
export type LoyaltyTier = Tables['loyalty_tiers']['Row']

// ============ B2B Types ============
export type B2BLedger = Tables['b2b_ledgers']['Row']
export type B2BLedgerEntry = Tables['b2b_ledger_entries']['Row']
export type LedgerEntryType = Enums['ledger_entry_type']
export type B2BPricing = Tables['b2b_pricing']['Row']

// ============ Couffin Types ============
export type Couffin = Tables['couffins']['Row']
export type CouffinItem = Tables['couffin_items']['Row']
export type PhysicalCrate = Tables['physical_crates']['Row']

// ============ Recette Types ============
export type Recette = Tables['recettes']['Row']
export type RecetteItem = Tables['recette_items']['Row']

// ============ Notification Types ============
export type Notification = Tables['notifications']['Row']
export type NotificationChannel = Enums['notification_channel']
export type NotificationPreferences = Tables['notification_preferences']['Row']

// ============ Referral Types ============
export type ReferralProgram = Tables['referral_programs']['Row']
export type ReferralCode = Tables['referral_codes']['Row']
export type ReferralUsage = Tables['referral_usages']['Row']

// ============ Supplier Types ============
export type SupplierOffer = Tables['supplier_offers']['Row']
export type ProductSupplier = Tables['product_suppliers']['Row']
export type PurchaseOrder = Tables['purchase_orders']['Row']

// ============ Application-specific Types ============

/** Cart with items for display */
export interface CartWithItems extends Cart {
  items: (CartItem & { product: Product })[]
  subtotal: number
  itemCount: number
}

/** Order with items and address for display */
export interface OrderWithDetails extends Order {
  items: OrderItem[]
  delivery_address: Address | null
  user: Pick<User, 'id' | 'first_name' | 'last_name' | 'phone' | 'email'> | null
}

/** Product with category for display */
export interface ProductWithCategory extends Product {
  category: Category | null
}

/** User profile with addresses */
export interface UserProfile extends User {
  addresses: Address[]
  default_address: Address | null
}

/** Recette with items and calculated price */
export interface RecetteWithItems extends Recette {
  items: (RecetteItem & { product: Product })[]
  calculated_price: number
}

/** Couffin with items */
export interface CouffinWithItems extends Couffin {
  items: (CouffinItem & { product: Product })[]
}

/** Loyalty account with tier info */
export interface LoyaltyAccountWithTier extends LoyaltyAccount {
  current_tier: LoyaltyTier | null
  next_tier: LoyaltyTier | null
  points_to_next_tier: number
}
