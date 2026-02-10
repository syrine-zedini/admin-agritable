import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, parseISO } from 'date-fns';

export interface ChartDataPoint {
  date: string;
  label: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

interface UseRevenueChartOptions {
  dateFrom: string;
  dateTo: string;
  granularity: 'daily' | 'weekly' | 'monthly';
  enabled?: boolean;
}

export function useRevenueChart({ dateFrom, dateTo, granularity, enabled = true }: UseRevenueChartOptions) {
  return useQuery({
    queryKey: ['revenue-chart', dateFrom, dateTo, granularity],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const { data: entries, error } = await supabase
        .from('income_statement_entries')
        .select('transaction_date, debit_amount, credit_amount, transaction_type')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      const startDate = parseISO(dateFrom);
      const endDate = parseISO(dateTo);

      // Generate date intervals based on granularity
      let intervals: Date[];
      let formatStr: string;

      switch (granularity) {
        case 'daily':
          intervals = eachDayOfInterval({ start: startDate, end: endDate });
          formatStr = 'MMM dd';
          break;
        case 'weekly':
          intervals = eachWeekOfInterval({ start: startDate, end: endDate });
          formatStr = "'W'w MMM";
          break;
        case 'monthly':
          intervals = eachMonthOfInterval({ start: startDate, end: endDate });
          formatStr = 'MMM yyyy';
          break;
        default:
          intervals = eachDayOfInterval({ start: startDate, end: endDate });
          formatStr = 'MMM dd';
      }

      // Group entries by period
      const dataMap = new Map<string, { revenue: number; expenses: number }>();

      // Initialize all periods with zero values
      intervals.forEach(date => {
        const key = format(date, 'yyyy-MM-dd');
        dataMap.set(key, { revenue: 0, expenses: 0 });
      });

      // Aggregate entries into periods
      (entries || []).forEach(entry => {
        const entryDate = parseISO(entry.transaction_date);
        let periodKey: string;

        switch (granularity) {
          case 'daily':
            periodKey = format(entryDate, 'yyyy-MM-dd');
            break;
          case 'weekly':
            // Find the week start
            const weekStart = intervals.find(d => 
              entryDate >= d && entryDate < new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000)
            );
            periodKey = weekStart ? format(weekStart, 'yyyy-MM-dd') : format(entryDate, 'yyyy-MM-dd');
            break;
          case 'monthly':
            periodKey = format(entryDate, 'yyyy-MM-01');
            break;
          default:
            periodKey = format(entryDate, 'yyyy-MM-dd');
        }

        const existing = dataMap.get(periodKey) || { revenue: 0, expenses: 0 };
        if (entry.transaction_type === 'revenue') {
          existing.revenue += Number(entry.credit_amount);
        } else {
          existing.expenses += Number(entry.debit_amount);
        }
        dataMap.set(periodKey, existing);
      });

      // Convert to chart data points
      return intervals.map(date => {
        const key = granularity === 'monthly' 
          ? format(date, 'yyyy-MM-01')
          : format(date, 'yyyy-MM-dd');
        const data = dataMap.get(key) || { revenue: 0, expenses: 0 };
        
        return {
          date: key,
          label: format(date, formatStr),
          revenue: data.revenue,
          expenses: data.expenses,
          netIncome: data.revenue - data.expenses,
        };
      });
    },
    enabled,
    staleTime: 60000, // 1 minute
  });
}
