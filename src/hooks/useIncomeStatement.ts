/**
 * useIncomeStatement Hook
 * 
 * React Query hook for fetching and managing income statement entries
 * with support for filtering, aggregation, and running balance calculations
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfDay, startOfWeek, startOfMonth, format, getISOWeek, getYear } from 'date-fns';
import type {
  IncomeStatementEntry,
  IncomeStatementFilters,
  AggregationLevel,
  AggregatedEntry,
  PeriodTotals,
  CategorySubtotal,
  AccountCategory,
} from '@/types/income-statement';

const QUERY_KEY = 'income_statement_entries';

interface UseIncomeStatementOptions {
  filters: IncomeStatementFilters;
  aggregationLevel: AggregationLevel;
  enabled?: boolean;
}

export function useIncomeStatement(options: UseIncomeStatementOptions) {
  const { filters, aggregationLevel, enabled = true } = options;

  // Fetch entries with filters
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('income_statement_entries')
        .select(`
          *,
          account_category:account_categories(*)
        `)
        .order('transaction_date', { ascending: true });

      // Apply filters
      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }
      if (filters.account_category_ids && filters.account_category_ids.length > 0) {
        query = query.in('account_category_id', filters.account_category_ids);
      }
      if (filters.transaction_type && filters.transaction_type !== 'all') {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters.customer_type && filters.customer_type !== 'all') {
        query = query.eq('customer_type', filters.customer_type);
      }
      if (filters.supplier_id) {
        query = query.eq('related_entity_id', filters.supplier_id)
          .eq('related_entity_type', 'supplier');
      }
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,related_entity_name.ilike.%${filters.search}%`);
      }

      // Consignment filtering (Task 23)
      if (filters.consignment_only) {
        query = query.contains('tags', ['depot_vente']);
      }
      if (filters.consignment_tags && filters.consignment_tags.length > 0) {
        // Filter by any of the specified consignment tags
        query = query.overlaps('tags', filters.consignment_tags);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as IncomeStatementEntry[];
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
  });

  const entries = rawData || [];

  // Calculate running balances (for individual view)
  const runningBalances = new Map<string, number>();
  if (aggregationLevel === 'individual') {
    const balanceByCategory = new Map<string, number>();
    entries.forEach((entry) => {
      const currentBalance = balanceByCategory.get(entry.account_category_id) || 0;
      const newBalance = currentBalance + entry.credit_amount - entry.debit_amount;
      balanceByCategory.set(entry.account_category_id, newBalance);
      runningBalances.set(entry.id, newBalance);
    });
  }

  // Aggregate entries based on level
  const aggregatedEntries = aggregateEntries(entries, aggregationLevel);

  // Calculate period totals
  const periodTotals = calculatePeriodTotals(entries);

  return {
    entries,
    aggregatedEntries,
    periodTotals,
    runningBalances,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function aggregateEntries(
  entries: IncomeStatementEntry[],
  level: AggregationLevel
): AggregatedEntry[] {
  if (level === 'individual') {
    return [];
  }

  const grouped = new Map<string, AggregatedEntry>();

  entries.forEach((entry) => {
    const periodKey = getPeriodKey(new Date(entry.transaction_date), level);
    const key = `${periodKey}-${entry.account_category_id}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        period: periodKey,
        period_label: getPeriodLabel(new Date(entry.transaction_date), level),
        account_category_id: entry.account_category_id,
        account_category: entry.account_category,
        total_debit: 0,
        total_credit: 0,
        transaction_count: 0,
        entries: [],
      });
    }

    const agg = grouped.get(key)!;
    agg.total_debit += entry.debit_amount;
    agg.total_credit += entry.credit_amount;
    agg.transaction_count += 1;
    agg.entries?.push(entry);
  });

  return Array.from(grouped.values()).sort((a, b) => {
    // Sort by period first, then by category sort_order
    const periodCompare = a.period.localeCompare(b.period);
    if (periodCompare !== 0) return periodCompare;
    return (a.account_category?.sort_order || 0) - (b.account_category?.sort_order || 0);
  });
}

function getPeriodKey(date: Date, level: AggregationLevel): string {
  switch (level) {
    case 'daily':
      return format(startOfDay(date), 'yyyy-MM-dd');
    case 'weekly':
      return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    case 'monthly':
      return format(startOfMonth(date), 'yyyy-MM');
    default:
      return format(date, 'yyyy-MM-dd');
  }
}

function getPeriodLabel(date: Date, level: AggregationLevel): string {
  switch (level) {
    case 'daily':
      return format(date, 'MMM d, yyyy');
    case 'weekly':
      return `Week ${getISOWeek(date)}, ${getYear(date)}`;
    case 'monthly':
      return format(date, 'MMMM yyyy');
    default:
      return format(date, 'MMM d, yyyy HH:mm');
  }
}

function calculatePeriodTotals(entries: IncomeStatementEntry[]): PeriodTotals {
  const categoryTotals = new Map<string, CategorySubtotal>();

  let totalRevenue = 0;
  let totalExpenses = 0;

  entries.forEach((entry) => {
    totalRevenue += entry.credit_amount;
    totalExpenses += entry.debit_amount;

    const categoryId = entry.account_category_id;
    if (!categoryTotals.has(categoryId)) {
      categoryTotals.set(categoryId, {
        category_id: categoryId,
        category_name: entry.account_category?.name || 'Unknown',
        category_color: entry.account_category?.color_hex || null,
        category_type: entry.account_category?.type,
        total_debit: 0,
        total_credit: 0,
        net_amount: 0,
      });
    }

    const cat = categoryTotals.get(categoryId)!;
    cat.total_debit += entry.debit_amount;
    cat.total_credit += entry.credit_amount;
    cat.net_amount = cat.total_credit - cat.total_debit;
  });

  return {
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_income: totalRevenue - totalExpenses,
    by_category: Array.from(categoryTotals.values()),
  };
}
