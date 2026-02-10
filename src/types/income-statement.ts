/**
 * Income Statement Types
 * 
 * TypeScript interfaces for the income statement ledger system
 */

// ============================================================================
// Enums and Type Aliases
// ============================================================================

export type TransactionType = 'revenue' | 'expense';
export type AggregationLevel = 'individual' | 'daily' | 'weekly' | 'monthly';
export type CustomerType = 'b2c' | 'b2b';
export type AccountCategoryType = 'revenue' | 'expense' | 'general';

// Consignment-specific tags for filtering
export type ConsignmentTag = 'consignment_sale' | 'consignment_liability' | 'consignment_payment' | 'depot_vente' | 'supplier_debt' | 'liability_reduction';

// ============================================================================
// Account Categories
// ============================================================================

export interface AccountCategory {
  id: string;
  name: string;
  type: AccountCategoryType;
  color_hex: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountCategoryInput {
  name: string;
  type: AccountCategoryType;
  color_hex?: string;
  icon?: string;
  sort_order?: number;
}

export interface UpdateAccountCategoryInput {
  name?: string;
  type?: AccountCategoryType;
  color_hex?: string | null;
  icon?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

// ============================================================================
// Income Statement Entries
// ============================================================================

export interface IncomeStatementEntry {
  id: string;
  entry_number: string;
  transaction_date: string;
  debit_amount: number;
  credit_amount: number;
  account_category_id: string;
  account_category?: AccountCategory;
  transaction_type: TransactionType;
  source_table: string;
  source_id: string;
  description: string;
  notes: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  related_entity_name: string | null;
  payment_method: string | null;
  customer_type: CustomerType | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Filters
// ============================================================================

export interface IncomeStatementFilters {
  date_from?: string;
  date_to?: string;
  account_category_ids?: string[];
  transaction_type?: TransactionType | 'all';
  payment_method?: string;
  customer_type?: CustomerType | 'all';
  supplier_id?: string;
  search?: string;
  // Consignment filtering (Task 23)
  consignment_only?: boolean;
  consignment_tags?: ConsignmentTag[];
}

// ============================================================================
// Aggregated Data
// ============================================================================

export interface AggregatedEntry {
  period: string; // ISO date string for the period start
  period_label: string; // Human-readable label (e.g., "Dec 17, 2025" or "Week 51, 2025")
  account_category_id: string;
  account_category?: AccountCategory;
  total_debit: number;
  total_credit: number;
  transaction_count: number;
  entries?: IncomeStatementEntry[]; // For drill-down
}

export interface CategorySubtotal {
  category_id: string;
  category_name: string;
  category_color: string | null;
  category_type?: AccountCategoryType;
  total_debit: number;
  total_credit: number;
  net_amount: number; // credit - debit
}

export interface PeriodTotals {
  total_revenue: number; // Sum of all credits
  total_expenses: number; // Sum of all debits
  net_income: number; // total_revenue - total_expenses
  by_category: CategorySubtotal[];
}

// ============================================================================
// Running Balance
// ============================================================================

export interface RunningBalanceEntry {
  entry_id: string;
  running_balance: number;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseIncomeStatementResult {
  entries: IncomeStatementEntry[];
  aggregatedEntries: AggregatedEntry[];
  periodTotals: PeriodTotals;
  runningBalances: Map<string, number>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseAccountCategoriesResult {
  categories: AccountCategory[];
  isLoading: boolean;
  error: Error | null;
  addCategory: (input: CreateAccountCategoryInput) => Promise<AccountCategory>;
  updateCategory: (id: string, input: UpdateAccountCategoryInput) => Promise<AccountCategory>;
  deleteCategory: (id: string) => Promise<void>;
  refetch: () => void;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ExportMetadata {
  export_date: string;
  generated_by: string;
  filters: IncomeStatementFilters;
  date_range: {
    from: string | null;
    to: string | null;
  };
  aggregation_level: AggregationLevel;
  total_entries: number;
}

// ============================================================================
// Drill-Down Types
// ============================================================================

export interface DrillDownData {
  type: 'individual' | 'aggregated';
  entry?: IncomeStatementEntry;
  aggregatedEntry?: AggregatedEntry;
  sourceLink?: string;
}

// ============================================================================
// Date Range Presets
// ============================================================================

export type DateRangePreset = 
  | 'today'
  | 'yesterday'
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'this-year'
  | 'custom';

export interface DateRange {
  from: Date | null;
  to: Date | null;
  preset: DateRangePreset;
}