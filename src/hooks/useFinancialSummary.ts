import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface SalesBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  transactions: number;
}

export interface TaxSummary {
  totalSalesExclTax: number;
  vatAmount: number;
  totalInclTax: number;
  vatRate: number;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  percentageChange: number;
}

export interface FinancialSummary {
  totalRevenue: PeriodComparison;
  totalExpenses: PeriodComparison;
  netIncome: PeriodComparison;
  totalOrders: PeriodComparison;
  salesByChannel: SalesBreakdown[];
  paymentMethods: PaymentMethodBreakdown[];
  taxSummary: TaxSummary;
  revenueByCategory: { category: string; amount: number; color: string }[];
  expensesByCategory: { category: string; amount: number; color: string }[];
}

interface UseFinancialSummaryOptions {
  dateFrom: string;
  dateTo: string;
  enabled?: boolean;
}

export function useFinancialSummary({ dateFrom, dateTo, enabled = true }: UseFinancialSummaryOptions) {
  return useQuery({
    queryKey: ['financial-summary', dateFrom, dateTo],
    queryFn: async (): Promise<FinancialSummary> => {
      // Calculate previous period for comparison
      const currentStart = new Date(dateFrom);
      const currentEnd = new Date(dateTo);
      const periodLength = currentEnd.getTime() - currentStart.getTime();
      const previousStart = new Date(currentStart.getTime() - periodLength);
      const previousEnd = new Date(currentStart.getTime() - 1);

      // Fetch current period income statement data
      const { data: currentEntries, error: currentError } = await supabase
        .from('income_statement_entries')
        .select(`
          id,
          debit_amount,
          credit_amount,
          transaction_type,
          customer_type,
          payment_method,
          account_category_id,
          account_categories (
            id,
            name,
            type,
            color_hex
          )
        `)
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo);

      if (currentError) throw currentError;

      // Fetch previous period for comparison
      const { data: previousEntries, error: previousError } = await supabase
        .from('income_statement_entries')
        .select('debit_amount, credit_amount, transaction_type')
        .gte('transaction_date', format(previousStart, 'yyyy-MM-dd'))
        .lte('transaction_date', format(previousEnd, 'yyyy-MM-dd'));

      if (previousError) throw previousError;

      // Fetch orders count for current period
      const { count: currentOrdersCount, error: ordersError } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)
        .eq('status', 'delivered');

      if (ordersError) throw ordersError;

      // Fetch orders count for previous period
      const { count: previousOrdersCount, error: prevOrdersError } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', format(previousStart, 'yyyy-MM-dd'))
        .lte('created_at', format(previousEnd, 'yyyy-MM-dd'))
        .eq('status', 'delivered');

      if (prevOrdersError) throw prevOrdersError;

      // Calculate totals
      const currentRevenue = (currentEntries || [])
        .filter(e => e.transaction_type === 'revenue')
        .reduce((sum, e) => sum + Number(e.credit_amount), 0);

      const currentExpenses = (currentEntries || [])
        .filter(e => e.transaction_type === 'expense')
        .reduce((sum, e) => sum + Number(e.debit_amount), 0);

      const previousRevenue = (previousEntries || [])
        .filter(e => e.transaction_type === 'revenue')
        .reduce((sum, e) => sum + Number(e.credit_amount), 0);

      const previousExpenses = (previousEntries || [])
        .filter(e => e.transaction_type === 'expense')
        .reduce((sum, e) => sum + Number(e.debit_amount), 0);

      // Calculate percentage changes
      const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Sales by channel (B2C vs B2B)
      const b2cSales = (currentEntries || [])
        .filter(e => e.transaction_type === 'revenue' && e.customer_type === 'b2c')
        .reduce((sum, e) => sum + Number(e.credit_amount), 0);

      const b2bSales = (currentEntries || [])
        .filter(e => e.transaction_type === 'revenue' && e.customer_type === 'b2b')
        .reduce((sum, e) => sum + Number(e.credit_amount), 0);

      const otherRevenue = (currentEntries || [])
        .filter(e => e.transaction_type === 'revenue' && !e.customer_type)
        .reduce((sum, e) => sum + Number(e.credit_amount), 0);

      const totalSales = b2cSales + b2bSales + otherRevenue;

      const salesByChannel: SalesBreakdown[] = [];
      if (b2cSales > 0) {
        salesByChannel.push({
          category: 'B2C Orders',
          amount: b2cSales,
          percentage: totalSales > 0 ? (b2cSales / totalSales) * 100 : 0,
        });
      }
      if (b2bSales > 0) {
        salesByChannel.push({
          category: 'B2B Orders',
          amount: b2bSales,
          percentage: totalSales > 0 ? (b2bSales / totalSales) * 100 : 0,
        });
      }
      if (otherRevenue > 0) {
        salesByChannel.push({
          category: 'Other Revenue',
          amount: otherRevenue,
          percentage: totalSales > 0 ? (otherRevenue / totalSales) * 100 : 0,
        });
      }

      // Payment methods breakdown
      const paymentMethodMap = new Map<string, { amount: number; transactions: number }>();
      (currentEntries || [])
        .filter(e => e.transaction_type === 'revenue' && e.payment_method)
        .forEach(e => {
          const method = e.payment_method || 'Unknown';
          const existing = paymentMethodMap.get(method) || { amount: 0, transactions: 0 };
          paymentMethodMap.set(method, {
            amount: existing.amount + Number(e.credit_amount),
            transactions: existing.transactions + 1,
          });
        });

      const paymentMethods: PaymentMethodBreakdown[] = Array.from(paymentMethodMap.entries())
        .map(([method, data]) => ({
          method: method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' '),
          amount: data.amount,
          transactions: data.transactions,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Revenue by category
      const revenueByCategoryMap = new Map<string, { amount: number; color: string }>();
      (currentEntries || [])
        .filter(e => e.transaction_type === 'revenue')
        .forEach(e => {
          const category = (e.account_categories as any)?.name || 'Uncategorized';
          const color = (e.account_categories as any)?.color_hex || '#888888';
          const existing = revenueByCategoryMap.get(category) || { amount: 0, color };
          revenueByCategoryMap.set(category, {
            amount: existing.amount + Number(e.credit_amount),
            color,
          });
        });

      const revenueByCategory = Array.from(revenueByCategoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount);

      // Expenses by category
      const expensesByCategoryMap = new Map<string, { amount: number; color: string }>();
      (currentEntries || [])
        .filter(e => e.transaction_type === 'expense')
        .forEach(e => {
          const category = (e.account_categories as any)?.name || 'Uncategorized';
          const color = (e.account_categories as any)?.color_hex || '#888888';
          const existing = expensesByCategoryMap.get(category) || { amount: 0, color };
          expensesByCategoryMap.set(category, {
            amount: existing.amount + Number(e.debit_amount),
            color,
          });
        });

      const expensesByCategory = Array.from(expensesByCategoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount);

      // Tax summary (assuming 19% VAT in Tunisia)
      const vatRate = 0.19;
      const totalSalesExclTax = currentRevenue / (1 + vatRate);
      const vatAmount = currentRevenue - totalSalesExclTax;

      return {
        totalRevenue: {
          current: currentRevenue,
          previous: previousRevenue,
          percentageChange: calcChange(currentRevenue, previousRevenue),
        },
        totalExpenses: {
          current: currentExpenses,
          previous: previousExpenses,
          percentageChange: calcChange(currentExpenses, previousExpenses),
        },
        netIncome: {
          current: currentRevenue - currentExpenses,
          previous: previousRevenue - previousExpenses,
          percentageChange: calcChange(currentRevenue - currentExpenses, previousRevenue - previousExpenses),
        },
        totalOrders: {
          current: currentOrdersCount || 0,
          previous: previousOrdersCount || 0,
          percentageChange: calcChange(currentOrdersCount || 0, previousOrdersCount || 0),
        },
        salesByChannel,
        paymentMethods,
        taxSummary: {
          totalSalesExclTax,
          vatAmount,
          totalInclTax: currentRevenue,
          vatRate: vatRate * 100,
        },
        revenueByCategory,
        expensesByCategory,
      };
    },
    enabled,
    staleTime: 30000, // 30 seconds
  });
}
