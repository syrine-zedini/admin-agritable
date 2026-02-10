export type TransactionDirection = 'in' | 'out';
export type CompanyCashType = 'expense' | 'revenue';

export interface CompanyCashTransaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  transaction_type: CompanyCashType;
  direction: TransactionDirection;
  amount: number;
  tags: string[];
  description: string;
  notes: string | null;
  receipt_url: string | null;
  reference_number: string | null;
  payment_method: string | null;
  paid_to: string | null;
  balance_before: number;
  balance_after: number;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyCashBalance {
  id: string;
  current_balance: number;
  last_transaction_id: string | null;
  last_updated_at: string;
}

export interface CashTag {
  id: string;
  name: string;
  category: 'expense' | 'revenue' | 'general';
  color_hex: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface UnifiedTransaction {
  id: string;
  transaction_id: string;
  date: string;
  source: 'customer' | 'company';
  type: string;
  description: string;
  amount: number;
  direction: TransactionDirection;
  tags?: string[];
  status?: string;
  method?: string;
  balance_after: number;
  related_entity?: string; // Customer name or "Company Cash"
}
