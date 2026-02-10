/**
 * TypeScript type definitions for the Pricing Spreadsheet feature
 * Defines interfaces for products, suppliers, B2B pricing, and spreadsheet data
 */

// Unit conversion data from global conversion table
export interface UnitConversion {
  id: string;
  unit_code: string;           // 'kg', 'g', 'L', 'mL', etc.
  unit_label: string;          // 'Kilogramme (kg)', etc.
  unit_category: string;       // 'weight', 'volume', 'quantity', 'container'
  base_unit: string;           // Reference unit for category
  base_unit_factor: number;    // Conversion factor to base unit
  is_active: boolean;
  display_order: number;
}

// Product row data from the pricing spreadsheet view
export interface PricingSpreadsheetRow {
  // Product identifiers
  product_id: string;
  sku: string;
  product_name: string;

  // Legacy units (kept for compatibility)
  unit: string;
  unit_size?: string;

  // NEW: Dual unit system (purchase, B2C, B2B)
  purchase_unit?: string;

  // B2C Unit System (NEW FIELDS)
  b2c_selling_quantity?: number;  // NEW: e.g., 250
  b2c_selling_unit?: string;      // e.g., 'g'
  b2c_ratio?: number;              // COMPUTED (read-only)

  // B2B Unit System (NEW FIELDS)
  b2b_selling_quantity?: number;  // NEW: e.g., 1
  b2b_selling_unit?: string;      // e.g., 'kg'
  b2b_ratio?: number;              // COMPUTED (read-only)

  // Pricing (legacy fields)
  purchase_price?: number; // cost_price from products table
  b2c_price?: number; // legacy price from products table
  b2b_base_price?: number;

  // NEW: B2C Formula-based pricing
  b2c_multiplier?: number;
  b2c_prix_de_vente_calculated?: number; // Calculated: (purchase_price / b2c_ratio) × b2c_multiplier
  prix_sur_site?: number; // Manual override of calculated price
  has_price_override?: boolean; // True if prix_sur_site differs from calculated

  // NEW: B2B Formula-based pricing
  b2b_multiplier?: number;
  b2b_price_calculated?: number; // Calculated: (purchase_price / b2b_ratio) × b2b_multiplier

  // Stock and operations
  stock?: number; // stock_quantity
  low_stock_threshold?: number;
  moq?: number; // min_order_quantity
  ordering_info?: string;
  stock_warehouse?: string;

  // NEW: Operations planning
  besoin?: number; // Demand forecast
  commande?: number; // Order quantity

  // Category
  category_id?: string;
  category_name?: string;

  // Supplier
  primary_supplier_id?: string;
  supplier_name?: string;
  supplier_price?: number;
  supplier_first_name?: string;
  supplier_last_name?: string;
  supplier_company_name?: string;
  supplier_is_active?: boolean;
  last_supply_date?: string;

  // NEW: Deliverer assignment
  assigned_deliverer_id?: string;
  deliverer_name?: string;
  deliverer_first_name?: string;
  deliverer_last_name?: string;
  deliverer_vehicle_type?: string;
  pickup_date?: string; // ISO date string

  // Purchase Order fields
  po_id?: string;
  po_number?: string;
  po_status?: 'draft' | 'ordered' | 'in_transit' | 'delivered' | 'verified' | 'cancelled';
  po_created_at?: string;
  po_total_amount?: number;
  po_draft_notes?: string;

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Dynamic B2B pricing (added at runtime)
  b2b_pricing?: Record<string, B2BClientPrice>;
}

// B2B client custom price
export interface B2BClientPrice {
  id: string;
  custom_price: number;
  discount_percentage?: number;
  valid_from?: string;
  valid_until?: string;
  is_expired: boolean;
}

// B2B client information
export interface B2BClient {
  id: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  display_name: string; // Computed: company_name or full name
}

// Supplier information
export interface Supplier {
  id: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  display_name: string; // Computed: company_name or full name
  is_active: boolean;
}

// Product-Supplier relationship
export interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  supplier_price?: number;
  is_primary: boolean;
  is_active: boolean;
  last_supply_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Cell update data
export interface CellUpdate {
  productId: string;
  field: string;
  value: any;
  oldValue?: any;
}

// Validation error
export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

// CSV import row
export interface CSVImportRow {
  row_number: number;
  product_name: string;
  unit?: string;
  unit_size?: string;
  purchase_price?: number;
  supplier?: string;
  stock?: number;
  b2c_price?: number;
  b2b_base_price?: number;
  [key: string]: any; // Dynamic B2B client columns

  // Validation
  is_valid: boolean;
  errors?: ValidationError[];
}

// CSV import result
export interface CSVImportResult {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  rows: CSVImportRow[];
  detected_b2b_clients: string[]; // Client names found in columns
}

// CSV export options
export interface CSVExportOptions {
  include_b2b_columns: boolean;
  selected_client_ids?: string[];
  include_all_products: boolean;
  filter_active_only: boolean;
}

// Column preferences (stored in localStorage)
export interface ColumnPreferences {
  visible_b2b_client_ids: string[];
  column_order?: string[];
  last_updated: string;
}

// Update payload for batch updates
export interface BatchUpdatePayload {
  products?: Array<{
    id: string;
    updates: Partial<{
      purchase_price: number;
      b2c_price: number;
      b2b_base_price: number;
      stock: number;
      unit_size: string;
      ordering_info: string;
      stock_warehouse: string;
    }>;
  }>;
  product_suppliers?: Array<{
    product_id: string;
    supplier_id: string;
    supplier_price?: number;
    is_primary: boolean;
  }>;
  b2b_pricing?: Array<{
    product_id: string;
    client_id: string;
    custom_price: number;
  }>;
}

// Auto-save queue item
export interface AutoSaveItem {
  id: string;
  timestamp: number;
  update: CellUpdate;
  status: 'pending' | 'saving' | 'saved' | 'error';
  retries: number;
  error?: string;
}

// Computed fields for display
export interface ComputedFields {
  b2c_margin_percent?: number; // (b2c_price - purchase_price) / purchase_price * 100
  b2b_margin_percent?: number; // (b2b_base_price - purchase_price) / purchase_price * 100
  supplier_margin_percent?: number; // (b2c_price - supplier_price) / supplier_price * 100
  is_low_stock: boolean;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

// Statistics for dashboard
export interface SpreadsheetStatistics {
  total_products: number;
  active_products: number;
  products_with_suppliers: number;
  products_with_b2b_pricing: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_b2b_clients: number;
  avg_b2c_margin: number;
  avg_b2b_margin: number;
}

// NEW: Column group definition for collapsible sections
export interface ColumnGroup {
  id: string;
  label: string;
  columns: string[];
  defaultCollapsed?: boolean;
  description?: string;
  defaultColor?: string; // Default soft color for this group
}

// NEW: Bulk update operation
export interface BulkUpdateOperation {
  field: string; // Field to update (e.g., 'b2c_multiplier', 'b2b_multiplier', 'supplier_id')
  value: any; // New value to set
  mode: 'absolute' | 'percentage'; // Absolute: set value directly, Percentage: adjust by % (e.g., +10%, -5%)
}

// NEW: Bulk update payload with filters
export interface BulkUpdatePayload {
  operation: BulkUpdateOperation;
  product_ids: string[]; // IDs of products to update
  preview?: boolean; // If true, return preview without applying changes
}

// NEW: Bulk update preview result
export interface BulkUpdatePreview {
  product_id: string;
  product_name: string;
  field: string;
  old_value: any;
  new_value: any;
  calculated_value?: any; // For formula fields, show calculated result
}

// NEW: User spreadsheet preferences (stored in database)
export interface UserSpreadsheetPreferences {
  id: string;
  user_id: string;
  visible_columns: string[]; // Column IDs in order
  selected_b2b_clients: string[]; // B2B client IDs to show as columns
  collapsed_groups: string[]; // Group IDs that are collapsed
  color_preferences: Record<string, string>; // Maps group IDs to color codes (e.g., {"product_info": "#E3F2FD"})
  created_at: string;
  updated_at: string;
}

// NEW: Deliverer information
export interface Deliverer {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string; // Full name
  vehicle_type?: string;
  is_active: boolean;
}

// NEW: Deliverer assignment update
export interface DelivererAssignmentUpdate {
  product_id: string;
  supplier_id: string;
  assigned_deliverer_id: string | null;
  pickup_date: string | null; // ISO date string or null to clear
}
