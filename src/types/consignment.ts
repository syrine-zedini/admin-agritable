/**
 * Consignment (Dépôt-Vente) Types
 * 
 * Types for the consignment supplier workflow where suppliers drop stock
 * at the hub without upfront payment and get paid based on sales.
 */

// ============================================================================
// ENUMS AND STATUS TYPES
// ============================================================================

export type ConsignmentBatchStatus = 
  | 'received' 
  | 'in_stock' 
  | 'partially_sold' 
  | 'fully_sold' 
  | 'partially_returned' 
  | 'returned' 
  | 'paid';

export type AttributionSourceType = 'owned' | 'consignment';

export type AttributionPriority = 'owned_first' | 'consignment_first';

export type ConsignmentPaymentMethod = 'cash' | 'bank_transfer' | 'check';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface ConsignmentBatch {
  id: string;
  supplier_id: string;
  product_id: string;
  
  // Quantities
  initial_quantity: number;
  quantity_sold: number;
  quantity_returned: number;
  unit: string;
  
  // Computed quantity (not stored in DB)
  quantity_remaining?: number;
  
  // Pricing
  unit_cost: number;
  total_value: number;
  
  // Payment tracking
  amount_paid: number;
  outstanding_balance?: number; // computed
  
  // Status
  status: ConsignmentBatchStatus;
  
  // Dates
  received_at: string;
  verified_at: string | null;
  verified_by: string | null;
  return_date: string | null;
  
  // Audit
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when fetched with joins)
  supplier?: ConsignmentSupplier;
  product?: ConsignmentProduct;
}

export interface ConsignmentSupplier {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  is_depot_vente: boolean;
}

export interface ConsignmentProduct {
  id: string;
  name_fr: string;
  sku: string | null;
  unit: string;
  price: number;
  stock_quantity: number;
  consignment_stock: number;
}

export interface ConsignmentAttribution {
  id: string;
  order_id: string;
  order_item_id: string | null;
  product_id: string;
  
  // Attribution source
  source_type: AttributionSourceType;
  consignment_batch_id: string | null;
  
  // Quantities and values
  quantity: number;
  unit_cost: number | null;
  supplier_portion: number | null;
  agritable_profit: number | null;
  
  // Audit
  created_at: string;
  created_by: string | null;
  
  // Override tracking
  is_override: boolean;
  override_reason: string | null;
  original_attribution_id: string | null;
  
  // Relations
  batch?: ConsignmentBatch;
}

export interface ConsignmentPayment {
  id: string;
  supplier_id: string;
  
  // Payment details
  payment_amount: number;
  payment_method: ConsignmentPaymentMethod;
  payment_date: string;
  
  // Related batches
  related_batch_ids: string[];
  
  // Audit
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  
  // Relations
  supplier?: ConsignmentSupplier;
}

export interface AttributionConfig {
  priority: AttributionPriority;
}

// ============================================================================
// SUMMARY AND STATS INTERFACES
// ============================================================================

export interface ConsignmentSupplierSummary {
  supplier_id: string;
  supplier_name: string;
  supplier_company: string | null;
  supplier_phone: string | null;
  total_batches: number;
  total_value: number;
  total_sold_value: number;
  total_paid: number;
  outstanding_balance: number;
}

export interface ConsignmentPaymentStats {
  total_consignment_value: number;
  total_sold_value: number;
  total_owed: number;
  total_paid: number;
  batches_count: number;
  suppliers_count: number;
}

// ============================================================================
// INPUT TYPES FOR MUTATIONS
// ============================================================================

export interface CreateBatchInput {
  supplier_id: string;
  product_id: string;
  initial_quantity: number;
  unit: string;
  unit_cost: number;
  total_value: number;
  notes?: string;
}

export interface VerifyBatchInput {
  batch_id: string;
}

export interface RecordReturnInput {
  batch_id: string;
  return_quantity: number;
  notes?: string;
}

export interface RecordPaymentInput {
  supplier_id: string;
  payment_amount: number;
  payment_method: ConsignmentPaymentMethod;
  related_batch_ids: string[];
  notes?: string;
}

export interface OverrideAttributionInput {
  order_id: string;
  attributions: {
    source_type: AttributionSourceType;
    consignment_batch_id?: string;
    quantity: number;
  }[];
  reason: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface ConsignmentBatchFilters {
  supplier_id?: string;
  product_id?: string;
  status?: ConsignmentBatchStatus | ConsignmentBatchStatus[];
  date_from?: string;
  date_to?: string;
}

export interface ConsignmentPaymentFilters {
  supplier_id?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseConsignmentBatchesReturn {
  batches: ConsignmentBatch[];
  isLoading: boolean;
  error: Error | null;
  createBatch: (input: CreateBatchInput) => Promise<ConsignmentBatch>;
  verifyBatch: (batchId: string) => Promise<void>;
  recordReturn: (batchId: string, quantity: number, notes?: string) => Promise<void>;
  refetch: () => void;
}

export interface UseStockAttributionReturn {
  attributeSale: (orderId: string, productId: string, quantity: number, sellingPrice: number) => Promise<ConsignmentAttribution[]>;
  overrideAttribution: (input: OverrideAttributionInput) => Promise<void>;
  getAttributionConfig: () => Promise<AttributionConfig>;
  updateAttributionConfig: (config: AttributionConfig) => Promise<void>;
}

export interface UseConsignmentPaymentsReturn {
  payments: ConsignmentPayment[];
  supplierSummaries: ConsignmentSupplierSummary[];
  stats: ConsignmentPaymentStats;
  recordPayment: (input: RecordPaymentInput) => Promise<void>;
  isLoading: boolean;
  isLoadingSummaries: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the remaining quantity in a batch
 */
export function calculateQuantityRemaining(batch: ConsignmentBatch): number {
  return batch.initial_quantity - batch.quantity_sold - batch.quantity_returned;
}

/**
 * Calculate the outstanding balance for a batch
 */
export function calculateOutstandingBalance(batch: ConsignmentBatch): number {
  const valueOwed = batch.unit_cost * batch.quantity_sold;
  return valueOwed - batch.amount_paid;
}

/**
 * Enrich a batch with computed fields
 */
export function enrichBatch(batch: ConsignmentBatch): ConsignmentBatch {
  return {
    ...batch,
    quantity_remaining: calculateQuantityRemaining(batch),
    outstanding_balance: calculateOutstandingBalance(batch),
  };
}

/**
 * Get display name for a supplier
 */
export function getSupplierDisplayName(supplier: ConsignmentSupplier | undefined): string {
  if (!supplier) return 'Unknown';
  const name = `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim();
  return name || supplier.company_name || 'Unknown';
}

/**
 * Get status badge color for batch status
 */
export function getBatchStatusColor(status: ConsignmentBatchStatus): string {
  const colors: Record<ConsignmentBatchStatus, string> = {
    received: 'bg-yellow-100 text-yellow-800',
    in_stock: 'bg-blue-100 text-blue-800',
    partially_sold: 'bg-purple-100 text-purple-800',
    fully_sold: 'bg-green-100 text-green-800',
    partially_returned: 'bg-orange-100 text-orange-800',
    returned: 'bg-gray-100 text-gray-800',
    paid: 'bg-emerald-100 text-emerald-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get human-readable status label
 */
export function getBatchStatusLabel(status: ConsignmentBatchStatus): string {
  const labels: Record<ConsignmentBatchStatus, string> = {
    received: 'Reçu',
    in_stock: 'En stock',
    partially_sold: 'Partiellement vendu',
    fully_sold: 'Entièrement vendu',
    partially_returned: 'Partiellement retourné',
    returned: 'Retourné',
    paid: 'Payé',
  };
  return labels[status] || status;
}
