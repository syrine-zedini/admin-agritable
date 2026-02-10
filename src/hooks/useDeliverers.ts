import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Deliverer } from '@/types/pricing-spreadsheet';

/**
 * Hook to fetch active deliverers from the database
 * Used for deliverer assignment dropdowns in the pricing spreadsheet
 */
export const useDeliverers = () => {
  return useQuery({
    queryKey: ['deliverers'],
    queryFn: async (): Promise<Deliverer[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, vehicle_type, is_active')
        .eq('user_type', 'deliverer')
        .eq('is_active', true)
        .order('first_name');

      if (error) {
        console.error('Error fetching deliverers:', error);
        throw error;
      }

      return (data || []).map((deliverer) => ({
        ...deliverer,
        display_name: `${deliverer.first_name} ${deliverer.last_name}`.trim(),
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
