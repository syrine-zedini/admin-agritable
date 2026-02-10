// Loyalty Program Types

export type LoyaltyTransactionType = 'earned' | 'redeemed' | 'converted' | 'expired' | 'adjusted';

export interface LoyaltyConfiguration {
  id: string;
  enabled: boolean;
  points_per_tnd: number;
  conversion_threshold: number;
  conversion_rate_tnd: number;
  auto_conversion_enabled: boolean;
  tier_system_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyProductRule {
  id: string;
  product_id: string | null;
  category_id: string | null;
  points_per_unit: number;
  unit_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name_fr: string;
    sku: string;
  };
  category?: {
    id: string;
    name_fr: string;
  };
}

export interface LoyaltyTier {
  id: string;
  name: string;
  tier_level: number;
  lifetime_points_threshold: number;
  points_multiplier: number;
  discount_percentage: number;
  color_hex: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyAccount {
  id: string;
  user_id: string;
  points_balance: number;
  lifetime_points: number;
  auto_convert_enabled: boolean;
  auto_convert_threshold: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  };
  tier?: LoyaltyTier;
}

export interface LoyaltyTransaction {
  id: string;
  account_id: string;
  type: LoyaltyTransactionType;
  points: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  expires_at: string | null;
  description: string | null;
  created_at: string;
}

export interface LoyaltyAnalytics {
  // Current month stats
  total_points_issued: number;
  total_points_redeemed: number;
  total_points_converted: number;
  total_points_expired: number;

  // Comparisons
  points_issued_vs_last_month: number; // percentage change
  avg_points_per_customer: number;
  avg_points_vs_last_month: number; // absolute change

  // Conversion metrics
  conversion_rate: number; // percentage of eligible customers who converted
  total_wallet_credit_from_conversion: number; // in TND

  // Time series (last 30 days)
  points_issued_over_time: Array<{
    date: string;
    points_earned: number;
    points_redeemed: number;
    points_converted: number;
  }>;

  // Top earners
  top_earners: Array<{
    user_id: string;
    user_name: string;
    lifetime_points: number;
    current_balance: number;
    points_redeemed: number;
    tier_name: string | null;
    tier_color: string | null;
  }>;
}
