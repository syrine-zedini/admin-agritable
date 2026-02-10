import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface OrderApprovalData {
  order_id: string;
  approved_by: string;
  approval_notes?: string;
}

export interface OrderRejectionData {
  order_id: string;
  rejection_reason: string;
}

export interface POUpdateData {
  order_id: string;
  po_number: string;
  po_file_url?: string;
}

export const useOrderApproval = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch orders requiring approval
   */
  const fetchPendingApprovals = useCallback(async (): Promise<any[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            first_name,
            last_name,
            company_name,
            phone,
            email
          )
        `)
        .eq('requires_approval', true)
        .is('approved_at', null)
        .eq('status', 'placed')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err: any) {
      console.error('Error fetching pending approvals:', err);
      setError(err.message || 'Failed to fetch pending approvals');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Approve an order
   */
  const approveOrder = useCallback(async (
    approvalData: OrderApprovalData
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: approvalData.approved_by,
          approval_notes: approvalData.approval_notes,
          requires_approval: false, // Clear the flag after approval
        })
        .eq('id', approvalData.order_id);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error('Error approving order:', err);
      setError(err.message || 'Failed to approve order');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reject an order (cancel it)
   */
  const rejectOrder = useCallback(async (
    rejectionData: OrderRejectionData
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          notes: rejectionData.rejection_reason,
          requires_approval: false,
        })
        .eq('id', rejectionData.order_id);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error('Error rejecting order:', err);
      setError(err.message || 'Failed to reject order');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update PO number for an order
   */
  const updatePONumber = useCallback(async (
    poData: POUpdateData
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          po_number: poData.po_number,
          po_file_url: poData.po_file_url,
        })
        .eq('id', poData.order_id);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error('Error updating PO number:', err);
      setError(err.message || 'Failed to update PO number');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if an order requires approval based on threshold
   */
  const checkApprovalRequired = useCallback(async (
    userId: string,
    orderTotal: number
  ): Promise<boolean> => {
    try {
      // Fetch user's approval threshold from b2b_clients table
      const { data: client, error: clientError } = await supabase
        .from('users')
        .select('approval_threshold')
        .eq('id', userId)
        .eq('user_type', 'b2b')
        .single();

      if (clientError || !client) return false;

      const threshold = client.approval_threshold;
      if (!threshold) return false;

      return orderTotal >= threshold;
    } catch (err: any) {
      console.error('Error checking approval requirement:', err);
      return false;
    }
  }, []);

  /**
   * Set approval threshold for a B2B client
   */
  const setApprovalThreshold = useCallback(async (
    userId: string,
    threshold: number | null
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ approval_threshold: threshold })
        .eq('id', userId);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error('Error setting approval threshold:', err);
      setError(err.message || 'Failed to set approval threshold');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    fetchPendingApprovals,
    approveOrder,
    rejectOrder,
    updatePONumber,
    checkApprovalRequired,
    setApprovalThreshold,
  };
};
