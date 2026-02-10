import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface SalesAnalytics {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  conversion_rate: number;
  orders_by_status: Record<string, number>;
  revenue_over_time: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  top_products_by_revenue: Array<{
    product_id: string;
    product_name: string;
    sku: string;
    revenue: number;
    quantity_sold: number;
  }>;
  top_products_by_quantity: Array<{
    product_id: string;
    product_name: string;
    sku: string;
    quantity_sold: number;
    revenue: number;
  }>;
  date_range: {
    from: string;
    to: string;
  };
}

export interface UserAnalytics {
  total_customers: number;
  new_customers: number;
  customer_segments: {
    b2c: number;
    b2b: number;
    supplier: number;
  };
  retention_rate: number;
  loyalty_participation: number;
  average_wallet_balance: number;
  average_ltv: number;
  top_customers: Array<{
    customer_id: string;
    customer_name: string;
    user_type: string;
    total_spent: number;
    total_orders: number;
  }>;
  date_range: {
    from: string;
    to: string;
  };
}

export interface OperationalAnalytics {
  delivery_performance: {
    on_time_delivery_rate: number;
    average_delivery_time_hours: number;
    deliverer_efficiency_orders_per_day: number;
  };
  preparation_efficiency: {
    average_preparation_time_hours: number;
    picker_productivity_orders_per_day: number;
  };
  supplier_metrics: {
    offer_approval_rate: number;
    average_response_time_hours: number;
    top_suppliers: Array<{
      supplier_id: string;
      supplier_name: string;
      offers_submitted: number;
      offers_approved: number;
      approval_rate: number;
    }>;
  };
  date_range: {
    from: string;
    to: string;
  };
}

export interface FinancialAnalytics {
  payment_method_breakdown: Record<string, number>;
  payment_method_distribution_percent: Record<string, number>;
  outstanding_balances: {
    wallet_negative_balances: number;
    ledger_credit_owed: number;
    total_outstanding: number;
  };
  refunds_total: number;
  wallet_recharge_volume: number;
  pending_payment_validation: number;
  date_range: {
    from: string;
    to: string;
  };
}

/**
 * Hook for advanced analytics with SQL aggregations
 *
 * Features:
 * - Sales analytics (revenue, orders over time, top products, conversion)
 * - User analytics (customer segments, retention, LTV, growth)
 * - Operational analytics (delivery performance, preparation efficiency, supplier KPIs)
 * - Financial analytics (payment methods, outstanding balances)
 * - Date range filtering
 * - CSV export support
 */
export function useSalesAnalytics(dateFrom: Date, dateTo: Date) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sales_analytics', dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: async (): Promise<SalesAnalytics> => {
      const { data, error } = await supabase.rpc('get_sales_analytics', {
        p_date_from: dateFrom.toISOString(),
        p_date_to: dateTo.toISOString(),
      });

      if (error) throw error;

      return data as SalesAnalytics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return query;
}

export function useUserAnalytics(dateFrom: Date, dateTo: Date) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user_analytics', dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: async (): Promise<UserAnalytics> => {
      const { data, error } = await supabase.rpc('get_user_analytics', {
        p_date_from: dateFrom.toISOString(),
        p_date_to: dateTo.toISOString(),
      });

      if (error) throw error;

      return data as UserAnalytics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return query;
}

export function useOperationalAnalytics(dateFrom: Date, dateTo: Date) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['operational_analytics', dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: async (): Promise<OperationalAnalytics> => {
      const { data, error } = await supabase.rpc('get_operational_analytics', {
        p_date_from: dateFrom.toISOString(),
        p_date_to: dateTo.toISOString(),
      });

      if (error) throw error;

      return data as OperationalAnalytics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return query;
}

export function useFinancialAnalytics(dateFrom: Date, dateTo: Date) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['financial_analytics', dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: async (): Promise<FinancialAnalytics> => {
      const { data, error } = await supabase.rpc('get_financial_analytics', {
        p_date_from: dateFrom.toISOString(),
        p_date_to: dateTo.toISOString(),
      });

      if (error) throw error;

      return data as FinancialAnalytics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return query;
}

/**
 * Comprehensive analytics hook that fetches all 4 analytics types
 */
export function useAnalytics(dateFrom: Date, dateTo: Date) {
  const queryClient = useQueryClient();

  const salesQuery = useSalesAnalytics(dateFrom, dateTo);
  const userQuery = useUserAnalytics(dateFrom, dateTo);
  const operationalQuery = useOperationalAnalytics(dateFrom, dateTo);
  const financialQuery = useFinancialAnalytics(dateFrom, dateTo);

  // Real-time subscriptions for analytics data
  useEffect(() => {
    const channel = supabase
      .channel('analytics_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Debounce: invalidate after a short delay to avoid excessive refetches
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['sales_analytics'] });
            queryClient.invalidateQueries({ queryKey: ['operational_analytics'] });
          }, 5000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        () => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['financial_analytics'] });
          }, 5000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
        },
        () => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['financial_analytics'] });
            queryClient.invalidateQueries({ queryKey: ['user_analytics'] });
          }, 5000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'b2b_ledgers',
        },
        () => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['financial_analytics'] });
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    sales: salesQuery.data,
    users: userQuery.data,
    operational: operationalQuery.data,
    financial: financialQuery.data,
    isLoading:
      salesQuery.isLoading ||
      userQuery.isLoading ||
      operationalQuery.isLoading ||
      financialQuery.isLoading,
    error:
      salesQuery.error ||
      userQuery.error ||
      operationalQuery.error ||
      financialQuery.error,
    refetchAll: () => {
      salesQuery.refetch();
      userQuery.refetch();
      operationalQuery.refetch();
      financialQuery.refetch();
    },
  };
}

/**
 * CSV Export Utilities for Analytics
 */
export function exportSalesAnalyticsToCSV(data: SalesAnalytics) {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Revenue (TND)', data.total_revenue.toFixed(2)],
    ['Total Orders', data.total_orders.toString()],
    ['Average Order Value (TND)', data.average_order_value.toFixed(2)],
    ['Conversion Rate (%)', data.conversion_rate.toFixed(2)],
    ['', ''],
    ['Top Products by Revenue', ''],
    ['Product Name', 'Revenue (TND)', 'Quantity Sold'],
    ...data.top_products_by_revenue.map((p) => [
      p.product_name,
      p.revenue.toFixed(2),
      p.quantity_sold.toString(),
    ]),
  ];

  const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `sales_analytics_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportUserAnalyticsToCSV(data: UserAnalytics) {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Customers', data.total_customers.toString()],
    ['New Customers', data.new_customers.toString()],
    ['B2C Customers', data.customer_segments.b2c.toString()],
    ['B2B Customers', data.customer_segments.b2b.toString()],
    ['Retention Rate (%)', data.retention_rate.toFixed(2)],
    ['Average LTV (TND)', data.average_ltv.toFixed(2)],
    ['', ''],
    ['Top Customers by Spend', ''],
    ['Customer Name', 'Total Spent (TND)', 'Total Orders'],
    ...data.top_customers.map((c) => [
      c.customer_name,
      c.total_spent.toFixed(2),
      c.total_orders.toString(),
    ]),
  ];

  const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `user_analytics_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
