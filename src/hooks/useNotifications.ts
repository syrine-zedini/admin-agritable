import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'order' | 'payment' | 'system' | 'promotion' | 'delivery';
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_type: string;
    phone: string | null;
    email: string | null;
  };
}

export interface NotificationFilters {
  user_type?: 'b2c' | 'b2b' | 'supplier' | 'deliverer' | 'picker' | 'admin';
  type?: 'order' | 'payment' | 'system' | 'promotion' | 'delivery';
  is_read?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface SendNotificationParams {
  targetType: 'individual' | 'segment' | 'all';
  userId?: string;
  userSegment?: 'b2c' | 'b2b' | 'supplier' | 'deliverer' | 'picker';
  type: 'order' | 'payment' | 'system' | 'promotion' | 'delivery';
  title: string;
  message: string;
  data?: any;
}

/**
 * Hook for admin management of system notifications
 *
 * Features:
 * - Fetch all notifications (system-wide view)
 * - Send notification to user/group
 * - View notification delivery status
 * - Delete/archive notifications
 * - Real-time subscription for new notifications
 */
export function useNotifications(filters: NotificationFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch notifications with filters
  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications_admin', filters],
    queryFn: async (): Promise<Notification[]> => {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          user:users!user_id(id, first_name, last_name, user_type, phone, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to last 100 notifications

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Filter by user type (join with users table)
      if (filters.user_type) {
        const { data: userIds } = await supabase
          .from('users')
          .select('id')
          .eq('user_type', filters.user_type);

        if (userIds && userIds.length > 0) {
          query = query.in(
            'user_id',
            userIds.map((u) => u.id)
          );
        }
      }

      // Search in title or message
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data as Notification[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (params: SendNotificationParams) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let targetUserIds: string[] = [];

      // Determine target users
      if (params.targetType === 'individual' && params.userId) {
        targetUserIds = [params.userId];
      } else if (params.targetType === 'segment' && params.userSegment) {
        // Fetch all users in segment
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .eq('user_type', params.userSegment);

        if (usersError) throw usersError;
        targetUserIds = users.map((u) => u.id);
      } else if (params.targetType === 'all') {
        // Fetch all users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .in('user_type', ['b2c', 'b2b', 'supplier', 'deliverer', 'picker']);

        if (usersError) throw usersError;
        targetUserIds = users.map((u) => u.id);
      }

      // Create notifications for all target users
      const notificationsToCreate = targetUserIds.map((userId) => ({
        user_id: userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        is_read: false,
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationsToCreate)
        .select();

      if (error) throw error;

      return { created: data.length, notifications: data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_admin'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return { notificationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_admin'] });
    },
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      return { notificationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_admin'] });
    },
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['notifications_admin'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Get statistics
  const getStats = () => {
    if (!notifications) {
      return {
        total: 0,
        unread: 0,
        by_type: {} as Record<string, number>,
        read_rate: 0,
      };
    }

    const byType: Record<string, number> = {};
    let unreadCount = 0;

    notifications.forEach((n) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
      if (!n.is_read) unreadCount++;
    });

    const readRate =
      notifications.length > 0 ? ((notifications.length - unreadCount) / notifications.length) * 100 : 0;

    return {
      total: notifications.length,
      unread: unreadCount,
      by_type: byType,
      read_rate: readRate,
    };
  };

  return {
    notifications: notifications || [],
    isLoading,
    error,
    refetch,
    stats: getStats(),
    sendNotification: sendNotificationMutation.mutate,
    isSending: sendNotificationMutation.isPending,
    deleteNotification: deleteNotificationMutation.mutate,
    isDeleting: deleteNotificationMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
}
