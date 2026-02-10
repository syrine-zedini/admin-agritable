import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface LedgerDetails {
  id: string;
  user_id: string;
  balance: number;
  credit_limit: number;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntryDetails {
  id: string;
  ledger_id: string;
  type: 'order_debt' | 'payment_credit' | 'adjustment' | 'credit_limit_change';
  amount: number;
  balance_after: number;
  reference_type?: string | null;
  reference_id?: string | null;
  validated_by?: string | null;
  validated_at?: string | null;
  payment_proof_url?: string | null;
  notes?: string | null;
  created_at: string;
  validator?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface RecordPaymentData {
  ledger_id: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  payment_proof_url?: string;
  notes?: string;
  validate_immediately?: boolean;
}

export interface AdjustLedgerData {
  ledger_id: string;
  amount: number; // Positive for credit, negative for debt
  reason: string;
  notes?: string;
}

export const useLedgerOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async (userId: string): Promise<LedgerDetails | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('b2b_ledgers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        // If no ledger exists, create one
        if (fetchError.code === 'PGRST116') {
          const { data: newLedger, error: createError } = await supabase
            .from('b2b_ledgers')
            .insert({
              user_id: userId,
              balance: 0,
              credit_limit: 0,
            })
            .select()
            .single();

          if (createError) throw createError;
          return newLedger;
        }
        throw fetchError;
      }

      return data;
    } catch (err: any) {
      console.error('Error fetching ledger:', err);
      setError(err.message || 'Failed to fetch ledger');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLedgerEntries = useCallback(async (ledgerId: string): Promise<LedgerEntryDetails[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('b2b_ledger_entries')
        .select(`
          *,
          validator:users!b2b_ledger_entries_validated_by_fkey (
            first_name,
            last_name
          )
        `)
        .eq('ledger_id', ledgerId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err: any) {
      console.error('Error fetching ledger entries:', err);
      setError(err.message || 'Failed to fetch ledger entries');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordPayment = useCallback(async (paymentData: RecordPaymentData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current ledger balance
      const { data: ledger, error: ledgerError } = await supabase
        .from('b2b_ledgers')
        .select('balance')
        .eq('id', paymentData.ledger_id)
        .single();

      if (ledgerError) throw ledgerError;

      const currentBalance = ledger.balance;
      const newBalance = currentBalance + paymentData.amount;

      // Get current user (admin) ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create payment entry
      const entryData: any = {
        ledger_id: paymentData.ledger_id,
        type: 'payment_credit',
        amount: paymentData.amount,
        balance_after: newBalance,
        notes: paymentData.notes,
      };

      // Add validation if immediate
      if (paymentData.validate_immediately) {
        entryData.validated_by = user.id;
        entryData.validated_at = new Date().toISOString();
      }

      // Add payment details if provided
      if (paymentData.payment_proof_url) {
        entryData.payment_proof_url = paymentData.payment_proof_url;
      }
      if (paymentData.reference_number) {
        entryData.reference_type = 'manual_payment';
        entryData.notes = `${paymentData.payment_method || 'Payment'} - Ref: ${paymentData.reference_number}${paymentData.notes ? '\n' + paymentData.notes : ''}`;
      }

      const { error: insertError } = await supabase
        .from('b2b_ledger_entries')
        .insert(entryData);

      if (insertError) throw insertError;

      // Update ledger balance if validated immediately
      if (paymentData.validate_immediately) {
        const { error: updateError } = await supabase
          .from('b2b_ledgers')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentData.ledger_id);

        if (updateError) throw updateError;
      }

      return true;
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adjustLedger = useCallback(async (adjustmentData: AdjustLedgerData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current ledger balance
      const { data: ledger, error: ledgerError } = await supabase
        .from('b2b_ledgers')
        .select('balance')
        .eq('id', adjustmentData.ledger_id)
        .single();

      if (ledgerError) throw ledgerError;

      const currentBalance = ledger.balance;
      const newBalance = currentBalance + adjustmentData.amount;

      // Get current user (admin) ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create adjustment entry
      const { error: insertError } = await supabase
        .from('b2b_ledger_entries')
        .insert({
          ledger_id: adjustmentData.ledger_id,
          type: 'adjustment',
          amount: adjustmentData.amount,
          balance_after: newBalance,
          notes: `${adjustmentData.reason}${adjustmentData.notes ? '\n' + adjustmentData.notes : ''}`,
          validated_by: user.id,
          validated_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Update ledger balance
      const { error: updateError } = await supabase
        .from('b2b_ledgers')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adjustmentData.ledger_id);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error('Error adjusting ledger:', err);
      setError(err.message || 'Failed to adjust ledger');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validatePayment = useCallback(async (entryId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the payment entry
      const { data: entry, error: entryError } = await supabase
        .from('b2b_ledger_entries')
        .select('ledger_id, amount, balance_after')
        .eq('id', entryId)
        .single();

      if (entryError) throw entryError;

      // Get current user (admin) ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate the entry
      const { error: validateError } = await supabase
        .from('b2b_ledger_entries')
        .update({
          validated_by: user.id,
          validated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (validateError) throw validateError;

      // Update ledger balance
      const { error: updateError } = await supabase
        .from('b2b_ledgers')
        .update({
          balance: entry.balance_after,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.ledger_id);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error('Error validating payment:', err);
      setError(err.message || 'Failed to validate payment');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectPayment = useCallback(async (entryId: string, reason: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user (admin) ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Add rejection reason to notes and mark as rejected
      const { error: updateError } = await supabase
        .from('b2b_ledger_entries')
        .update({
          notes: `REJECTED: ${reason}`,
          validated_by: user.id,
          validated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (updateError) throw updateError;

      // Alternative: Delete the entry instead of marking as rejected
      // const { error: deleteError } = await supabase
      //   .from('b2b_ledger_entries')
      //   .delete()
      //   .eq('id', entryId);
      //
      // if (deleteError) throw deleteError;

      return true;
    } catch (err: any) {
      console.error('Error rejecting payment:', err);
      setError(err.message || 'Failed to reject payment');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    fetchLedger,
    fetchLedgerEntries,
    recordPayment,
    adjustLedger,
    validatePayment,
    rejectPayment,
  };
};
