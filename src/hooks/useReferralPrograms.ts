import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ReferralProgram {
  id: string;
  name: string;
  type: 'b2b_to_employee' | 'b2b_to_b2b';
  owner_id: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  commission_type: 'percentage' | 'fixed' | null;
  commission_value: number | null;
  start_date: string;
  end_date: string | null;
  min_order_value: number | null;
  max_uses_per_code: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    user_type: string;
  };
}

export interface ReferralCode {
  id: string;
  code: string;
  program_id: string;
  referrer_id: string;
  is_active: boolean;
  max_uses: number | null;
  uses_count: number;
  created_at: string;
  expires_at: string | null;
  referrer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    phone: string | null;
    email: string | null;
  };
  program?: ReferralProgram;
}

export interface ReferralUsage {
  id: string;
  code_id: string;
  referred_user_id: string;
  order_id: string | null;
  discount_amount: number;
  commission_amount: number | null;
  commission_status: 'pending' | 'approved' | 'paid' | 'rejected';
  commission_paid_at: string | null;
  used_at: string;
  referred_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    user_type: string;
  };
  referral_code?: ReferralCode;
}

export interface ReferralProgramFilters {
  type?: 'b2b_to_employee' | 'b2b_to_b2b';
  owner_id?: string;
  is_active?: boolean;
}

/**
 * Hook for complete referral program management (Phase 5 feature)
 *
 * Features:
 * - CRUD referral programs (employee & B2B types)
 * - Generate referral codes for clients
 * - Track referral code usage
 * - Calculate commissions
 * - Approve/reject referral payouts
 * - View referral analytics
 */
export function useReferralPrograms(filters: ReferralProgramFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch referral programs
  const {
    data: programs,
    isLoading: isLoadingPrograms,
    error: programsError,
  } = useQuery({
    queryKey: ['referral_programs', filters],
    queryFn: async (): Promise<ReferralProgram[]> => {
      let query = supabase
        .from('referral_programs')
        .select(`
          *,
          owner:users!owner_id(id, first_name, last_name, company_name, user_type)
        `)
        .order('created_at', { ascending: false });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as ReferralProgram[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch referral codes
  const {
    data: codes,
    isLoading: isLoadingCodes,
    error: codesError,
  } = useQuery({
    queryKey: ['referral_codes', filters.owner_id],
    queryFn: async (): Promise<ReferralCode[]> => {
      let query = supabase
        .from('referral_codes')
        .select(`
          *,
          referrer:users!referrer_id(id, first_name, last_name, company_name, phone, email),
          program:referral_programs(*)
        `)
        .order('created_at', { ascending: false });

      if (filters.owner_id) {
        // Get codes where the program owner matches
        const { data: programIds } = await supabase
          .from('referral_programs')
          .select('id')
          .eq('owner_id', filters.owner_id);

        if (programIds && programIds.length > 0) {
          query = query.in(
            'program_id',
            programIds.map((p) => p.id)
          );
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as ReferralCode[];
    },
    enabled: !!filters.owner_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch referral usages
  const {
    data: usages,
    isLoading: isLoadingUsages,
    error: usagesError,
  } = useQuery({
    queryKey: ['referral_usages', filters.owner_id],
    queryFn: async (): Promise<ReferralUsage[]> => {
      if (!filters.owner_id) return [];

      // First get programs for this owner
      const { data: programs } = await supabase
        .from('referral_programs')
        .select('id')
        .eq('owner_id', filters.owner_id);

      if (!programs || programs.length === 0) return [];

      const programIds = programs.map(p => p.id);

      // Get codes for these programs
      const { data: codes } = await supabase
        .from('referral_codes')
        .select('id')
        .in('program_id', programIds);

      if (!codes || codes.length === 0) return [];

      const codeIds = codes.map(c => c.id);

      // Get usages for these codes
      const { data, error } = await supabase
        .from('referral_usages')
        .select(`
          *,
          referred_user:users!referred_user_id(id, first_name, last_name, company_name, user_type),
          referral_code:referral_codes(*, program:referral_programs(*))
        `)
        .in('code_id', codeIds)
        .order('used_at', { ascending: false });

      if (error) throw error;

      return (data || []) as ReferralUsage[];
    },
    enabled: !!filters.owner_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create referral program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (programData: Omit<ReferralProgram, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('referral_programs')
        .insert({
          name: programData.name,
          type: programData.type,
          owner_id: programData.owner_id,
          discount_type: programData.discount_type,
          discount_value: programData.discount_value,
          commission_type: programData.commission_type,
          commission_value: programData.commission_value,
          start_date: programData.start_date,
          end_date: programData.end_date,
          min_order_value: programData.min_order_value,
          max_uses_per_code: programData.max_uses_per_code,
          is_active: programData.is_active,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral_programs'] });
    },
  });

  // Update referral program mutation
  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReferralProgram> & { id: string }) => {
      const { data, error } = await supabase
        .from('referral_programs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral_programs'] });
    },
  });

  // Delete referral program mutation
  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase.from('referral_programs').delete().eq('id', programId);

      if (error) throw error;

      return { programId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral_programs'] });
      queryClient.invalidateQueries({ queryKey: ['referral_codes'] });
    },
  });

  // Generate referral code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async ({
      programId,
      referrerId,
      maxUses,
      expiresAt,
    }: {
      programId: string;
      referrerId: string;
      maxUses?: number;
      expiresAt?: string;
    }) => {
      // Generate unique code
      let code = '';
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        code = `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        // Check if code exists
        const { data: existing } = await supabase
          .from('referral_codes')
          .select('id')
          .eq('code', code)
          .single();

        if (!existing) break;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique code');
      }

      const { data, error } = await supabase
        .from('referral_codes')
        .insert({
          code,
          program_id: programId,
          referrer_id: referrerId,
          is_active: true,
          max_uses: maxUses || null,
          uses_count: 0,
          expires_at: expiresAt || null,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral_codes'] });
    },
  });

  // Approve commission mutation
  const approveCommissionMutation = useMutation({
    mutationFn: async (usageId: string) => {
      const { data, error } = await supabase
        .from('referral_usages')
        .update({
          commission_status: 'approved',
        })
        .eq('id', usageId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral_usages'] });
    },
  });

  // Reject commission mutation
  const rejectCommissionMutation = useMutation({
    mutationFn: async (usageId: string) => {
      const { data, error } = await supabase
        .from('referral_usages')
        .update({
          commission_status: 'rejected',
        })
        .eq('id', usageId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral_usages'] });
    },
  });

  // Mark commission as paid mutation
  const markCommissionPaidMutation = useMutation({
    mutationFn: async (usageId: string) => {
      const { data, error } = await supabase
        .from('referral_usages')
        .update({
          commission_status: 'paid',
          commission_paid_at: new Date().toISOString(),
        })
        .eq('id', usageId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral_usages'] });
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('referral_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referral_programs',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['referral_programs'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referral_codes',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['referral_codes'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referral_usages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['referral_usages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Get analytics
  const getAnalytics = () => {
    if (!usages) {
      return {
        total_referrals: 0,
        successful_conversions: 0,
        total_discount_given: 0,
        total_commission_owed: 0,
        total_commission_paid: 0,
        pending_commission: 0,
        conversion_rate: 0,
      };
    }

    const totalReferrals = usages.length;
    const successfulConversions = usages.filter((u) => u.order_id).length;
    const totalDiscountGiven = usages.reduce((sum, u) => sum + u.discount_amount, 0);
    const totalCommissionOwed = usages.reduce((sum, u) => sum + (u.commission_amount || 0), 0);
    const totalCommissionPaid = usages
      .filter((u) => u.commission_status === 'paid')
      .reduce((sum, u) => sum + (u.commission_amount || 0), 0);
    const pendingCommission = usages
      .filter((u) => u.commission_status === 'pending' || u.commission_status === 'approved')
      .reduce((sum, u) => sum + (u.commission_amount || 0), 0);
    const conversionRate = totalReferrals > 0 ? (successfulConversions / totalReferrals) * 100 : 0;

    return {
      total_referrals: totalReferrals,
      successful_conversions: successfulConversions,
      total_discount_given: totalDiscountGiven,
      total_commission_owed: totalCommissionOwed,
      total_commission_paid: totalCommissionPaid,
      pending_commission: pendingCommission,
      conversion_rate: conversionRate,
    };
  };

  return {
    programs: programs || [],
    codes: codes || [],
    usages: usages || [],
    isLoading: isLoadingPrograms || isLoadingCodes || isLoadingUsages,
    error: programsError || codesError || usagesError,
    analytics: getAnalytics(),
    createProgram: createProgramMutation.mutate,
    isCreatingProgram: createProgramMutation.isPending,
    updateProgram: updateProgramMutation.mutate,
    isUpdatingProgram: updateProgramMutation.isPending,
    deleteProgram: deleteProgramMutation.mutate,
    isDeletingProgram: deleteProgramMutation.isPending,
    generateCode: generateCodeMutation.mutate,
    isGeneratingCode: generateCodeMutation.isPending,
    approveCommission: approveCommissionMutation.mutate,
    isApprovingCommission: approveCommissionMutation.isPending,
    rejectCommission: rejectCommissionMutation.mutate,
    isRejectingCommission: rejectCommissionMutation.isPending,
    markCommissionPaid: markCommissionPaidMutation.mutate,
    isMarkingCommissionPaid: markCommissionPaidMutation.isPending,
  };
}
