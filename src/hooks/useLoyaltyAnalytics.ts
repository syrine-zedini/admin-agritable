import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { LoyaltyAnalytics } from '@/types/loyalty';

export function useLoyaltyAnalytics(dateRange?: { from: Date; to: Date }) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['loyalty_analytics', dateRange],
    queryFn: async (): Promise<LoyaltyAnalytics> => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const from = dateRange?.from || startOfMonth;
      const to = dateRange?.to || endOfMonth;

      // Current month aggregates
      const { data: currentMonthData, error: currentError } = await supabase
        .from('loyalty_transactions')
        .select('type, points')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());

      if (currentError) throw currentError;

      // Last month aggregates (for comparison)
      const { data: lastMonthData, error: lastError } = await supabase
        .from('loyalty_transactions')
        .select('type, points')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      if (lastError) throw lastError;

      // Calculate current month totals
      const currentIssued = currentMonthData
        ?.filter((t) => t.type === 'earned')
        .reduce((sum, t) => sum + t.points, 0) || 0;

      const currentRedeemed = currentMonthData
        ?.filter((t) => t.type === 'redeemed')
        .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

      const currentConverted = currentMonthData
        ?.filter((t) => t.type === 'converted')
        .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

      const currentExpired = currentMonthData
        ?.filter((t) => t.type === 'expired')
        .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

      // Calculate last month total issued
      const lastMonthIssued = lastMonthData
        ?.filter((t) => t.type === 'earned')
        .reduce((sum, t) => sum + t.points, 0) || 0;

      // Calculate percentage change
      const pointsIssuedVsLastMonth = lastMonthIssued > 0
        ? ((currentIssued - lastMonthIssued) / lastMonthIssued) * 100
        : 0;

      // Get total active accounts for averages
      const { count: totalAccounts } = await supabase
        .from('loyalty_accounts')
        .select('*', { count: 'exact', head: true })
        .gt('lifetime_points', 0);

      const avgPointsPerCustomer = totalAccounts && totalAccounts > 0
        ? Math.round(currentIssued / totalAccounts)
        : 0;

      // For last month average - count accounts created before end of last month
      const { data: lastMonthAccountsData } = await supabase
        .from('loyalty_accounts')
        .select('lifetime_points')
        .lte('created_at', endOfLastMonth.toISOString())
        .gt('lifetime_points', 0);

      const lastMonthAccountCount = lastMonthAccountsData?.length || 0;

      const lastMonthAvgPoints = lastMonthAccountCount > 0
        ? Math.round(lastMonthIssued / lastMonthAccountCount)
        : 0;

      const avgPointsVsLastMonth = avgPointsPerCustomer - lastMonthAvgPoints;

      // Conversion rate (customers who converted / eligible customers with >= threshold)
      const { data: configData } = await supabase
        .from('loyalty_configuration')
        .select('conversion_threshold, conversion_rate_tnd')
        .single();

      const threshold = configData?.conversion_threshold || 1000;
      const conversionRateTnd = configData?.conversion_rate_tnd || 5.00;

      const { count: eligibleAccounts } = await supabase
        .from('loyalty_accounts')
        .select('*', { count: 'exact', head: true })
        .gte('points_balance', threshold);

      // Count unique accounts that converted in current period
      const { data: convertedData } = await supabase
        .from('loyalty_transactions')
        .select('account_id')
        .eq('type', 'converted')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());

      const uniqueConvertedAccounts = new Set(convertedData?.map((t) => t.account_id)).size;

      const conversionRate = eligibleAccounts && eligibleAccounts > 0
        ? (uniqueConvertedAccounts / eligibleAccounts) * 100
        : 0;

      const totalWalletCreditFromConversion = (currentConverted / threshold) * conversionRateTnd;

      // Time series (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: timeSeriesData } = await supabase
        .from('loyalty_transactions')
        .select('created_at, type, points')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group by date
      const dailyData: Record<string, { earned: number; redeemed: number; converted: number }> = {};

      timeSeriesData?.forEach((transaction) => {
        const date = new Date(transaction.created_at).toISOString().split('T')[0];

        if (!dailyData[date]) {
          dailyData[date] = { earned: 0, redeemed: 0, converted: 0 };
        }

        if (transaction.type === 'earned') {
          dailyData[date].earned += transaction.points;
        } else if (transaction.type === 'redeemed') {
          dailyData[date].redeemed += Math.abs(transaction.points);
        } else if (transaction.type === 'converted') {
          dailyData[date].converted += Math.abs(transaction.points);
        }
      });

      const pointsIssuedOverTime = Object.entries(dailyData).map(([date, data]) => ({
        date,
        points_earned: data.earned,
        points_redeemed: data.redeemed,
        points_converted: data.converted,
      }));

      // Top earners
      const { data: topEarnersData } = await supabase
        .from('loyalty_accounts')
        .select(`
          id,
          user_id,
          lifetime_points,
          points_balance,
          user:users!user_id(id, first_name, last_name)
        `)
        .order('lifetime_points', { ascending: false })
        .limit(10);

      // Get tier for each user and calculate redeemed points
      const topEarnersWithTiers = await Promise.all(
        (topEarnersData || []).map(async (account) => {
          // Get tier
          const { data: tierData } = await supabase.rpc('get_user_loyalty_tier', {
            p_user_id: account.user_id,
          });

          let tier = null;
          if (tierData) {
            const { data: tierDetails } = await supabase
              .from('loyalty_tiers')
              .select('name, color_hex')
              .eq('id', tierData)
              .single();

            tier = tierDetails;
          }

          // Calculate redeemed points
          const { data: transactions } = await supabase
            .from('loyalty_transactions')
            .select('points')
            .eq('account_id', account.id)
            .in('type', ['redeemed', 'converted']);

          const pointsRedeemed = transactions?.reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

          return {
            user_id: account.user_id,
            user_name: account.user?.first_name && account.user?.last_name
              ? `${account.user.first_name} ${account.user.last_name}`
              : 'Unknown',
            lifetime_points: account.lifetime_points,
            current_balance: account.points_balance,
            points_redeemed: pointsRedeemed,
            tier_name: tier?.name || null,
            tier_color: tier?.color_hex || null,
          };
        })
      );

      return {
        total_points_issued: currentIssued,
        total_points_redeemed: currentRedeemed,
        total_points_converted: currentConverted,
        total_points_expired: currentExpired,
        points_issued_vs_last_month: pointsIssuedVsLastMonth,
        avg_points_per_customer: avgPointsPerCustomer,
        avg_points_vs_last_month: avgPointsVsLastMonth,
        conversion_rate: conversionRate,
        total_wallet_credit_from_conversion: totalWalletCreditFromConversion,
        points_issued_over_time: pointsIssuedOverTime,
        top_earners: topEarnersWithTiers,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    analytics,
    isLoading,
  };
}
