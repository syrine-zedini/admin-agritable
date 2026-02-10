import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfDay, startOfWeek, startOfMonth, format, parseISO } from 'date-fns';
import type {
  IncomeStatementEntry,
  IncomeStatementFilters,
  AggregationLevel,
  AggregatedEntry,
  PeriodTotals,
  AccountCategory,
} from '@/types/income-statement';

export interface UseIncomeStatementOptions {
  filters: IncomeStatementFilters;
  aggregationLevel: AggregationLevel;
  enabled?: boolean;
}

export function useIncomeStatementData(options: UseIncomeStatementOptions) {
  const { filters, aggregationLevel, enabled = true } = options;
  const queryClient = useQueryClient();

  // Fetch individual entries with category join
  const {
    data: entries,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['income_statement_entries', filters],
    queryFn: async (): Promise<IncomeStatementEntry[]> => {
      let query = supabase
        .from('income_statement_entries')
        .select(`
          *,
          account_category:account_categories(*)
        `)
        .order('transaction_date', { ascending: false });

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
        query = query
          .eq('source_table', 'supplier_payments')
          .eq('related_entity_id', filters.supplier_id);
      }

      if (filters.search) {
        query = query.or(
          `description.ilike.%${filters.search}%,related_entity_name.ilike.%${filters.search}%,entry_number.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Calculate aggregated entries based on aggregation level
  const aggregatedEntries = aggregateEntries(entries || [], aggregationLevel);

  // Calculate running balances for individual view
  const runningBalances = calculateRunningBalances(entries || []);

  // Calculate period totals
  const periodTotals = calculatePeriodTotals(entries || []);

  // Refresh data
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['income_statement_entries'] });
    refetch();
  };

  return {
    entries: entries || [],
    aggregatedEntries,
    runningBalances,
    periodTotals,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Aggregate entries by period and category
 */
function aggregateEntries(
  entries: IncomeStatementEntry[],
  level: AggregationLevel
): AggregatedEntry[] {
  if (level === 'individual' || entries.length === 0) {
    return [];
  }

  const grouped = new Map<string, AggregatedEntry>();

  for (const entry of entries) {
    const date = parseISO(entry.transaction_date);
    const periodStart = getPeriodStart(date, level);
    const periodKey = `${periodStart.toISOString()}_${entry.account_category_id}`;

    if (!grouped.has(periodKey)) {
      grouped.set(periodKey, {
        period: periodStart.toISOString(),
        period_label: formatPeriodLabel(periodStart, level),
        account_category_id: entry.account_category_id || '',
        account_category: entry.account_category,
        total_debit: 0,
        total_credit: 0,
        transaction_count: 0,
        entries: [],
      });
    }

    const agg = grouped.get(periodKey)!;
    agg.total_debit += Number(entry.debit_amount);
    agg.total_credit += Number(entry.credit_amount);
    agg.transaction_count += 1;
    agg.entries?.push(entry);
  }

  return Array.from(grouped.values()).sort((a, b) => 
    new Date(b.period).getTime() - new Date(a.period).getTime()
  );
}

/**
 * Get the start of the period based on aggregation level
 */
function getPeriodStart(date: Date, level: AggregationLevel): Date {
  switch (level) {
    case 'daily':
      return startOfDay(date);
    case 'weekly':
      return startOfWeek(date, { weekStartsOn: 1 }); // Monday
    case 'monthly':
      return startOfMonth(date);
    default:
      return date;
  }
}

/**
 * Format period label for display
 */
function formatPeriodLabel(date: Date, level: AggregationLevel): string {
  switch (level) {
    case 'daily':
      return format(date, 'MMM d, yyyy');
    case 'weekly':
      return `Week of ${format(date, 'MMM d, yyyy')}`;
    case 'monthly':
      return format(date, 'MMMM yyyy');
    default:
      return format(date, 'MMM d, yyyy HH:mm');
  }
}

/**
 * Calculate running balances per category
 */
function calculateRunningBalances(
  entries: IncomeStatementEntry[]
): Map<string, number> {
  const balances = new Map<string, number>();
  const categoryBalances = new Map<string, number>();

  // Sort by date ascending for running balance calculation
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  for (const entry of sortedEntries) {
    const categoryId = entry.account_category_id || 'uncategorized';
    const currentBalance = categoryBalances.get(categoryId) || 0;
    const newBalance = currentBalance + Number(entry.credit_amount) - Number(entry.debit_amount);
    
    categoryBalances.set(categoryId, newBalance);
    balances.set(entry.id, newBalance);
  }

  return balances;
}

/**
 * Calculate period totals
 */
function calculatePeriodTotals(entries: IncomeStatementEntry[]): PeriodTotals {
  const byCategory = new Map<string, {
    category_id: string;
    category_name: string;
    category_type: 'revenue' | 'expense' | 'general';
    total_debit: number;
    total_credit: number;
  }>();

  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const entry of entries) {
    const categoryId = entry.account_category_id || 'uncategorized';
    const categoryName = entry.account_category?.name || 'Uncategorized';
    const categoryType = entry.account_category?.type || 'general';

    if (!byCategory.has(categoryId)) {
      byCategory.set(categoryId, {
        category_id: categoryId,
        category_name: categoryName,
        category_type: categoryType,
        total_debit: 0,
        total_credit: 0,
      });
    }

    const cat = byCategory.get(categoryId)!;
    cat.total_debit += Number(entry.debit_amount);
    cat.total_credit += Number(entry.credit_amount);

    // Accumulate totals
    totalRevenue += Number(entry.credit_amount);
    totalExpenses += Number(entry.debit_amount);
  }

  return {
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_income: totalRevenue - totalExpenses,
    by_category: Array.from(byCategory.values()),
  };
}

/**
 * Helper hook to get entries for a specific source
 */
export function useIncomeStatementBySource(sourceTable: string, sourceId: string) {
  return useQuery({
    queryKey: ['income_statement_entry', sourceTable, sourceId],
    queryFn: async (): Promise<IncomeStatementEntry | null> => {
      const { data, error } = await supabase
        .from('income_statement_entries')
        .select(`
          *,
          account_category:account_categories(*)
        `)
        .eq('source_table', sourceTable)
        .eq('source_id', sourceId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    },
    enabled: !!sourceTable && !!sourceId,
  });
}
