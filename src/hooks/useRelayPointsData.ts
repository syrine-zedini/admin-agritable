import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface RelayPoint {
  id: string;
  zone_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useRelayPointsData() {
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch relay points for a zone
  const fetchRelayPoints = useCallback(async (zoneId: string, status?: string) => {
    setIsLoading(true);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) throw new Error('Not authenticated');

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-zones`
      );
      url.searchParams.append('resource', 'relay_points');
      url.searchParams.append('zone_id', zoneId);
      if (status) url.searchParams.append('status', status);

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch relay points');

      setRelayPoints(data.relay_points || []);
      return data.relay_points || [];
    } catch (error: any) {
      console.error('Error fetching relay points:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create relay point
  const createRelayPoint = useCallback(
    async (pointData: {
      zone_id: string;
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      contact_phone?: string;
      is_active?: boolean;
    }) => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) throw new Error('Not authenticated');

        const url = new URL(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-zones`
        );
        url.searchParams.append('resource', 'relay_points');

        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify(pointData),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create relay point');

        await fetchRelayPoints(pointData.zone_id);
        return data.relay_point;
      } catch (error: any) {
        console.error('Error creating relay point:', error);
        throw error;
      }
    },
    [fetchRelayPoints]
  );

  // Update relay point
  const updateRelayPoint = useCallback(
    async (
      pointId: string,
      zoneId: string,
      updates: {
        name?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        contact_phone?: string;
        is_active?: boolean;
      }
    ) => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) throw new Error('Not authenticated');

        const url = new URL(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-zones`
        );
        url.searchParams.append('resource', 'relay_points');

        const response = await fetch(url.toString(), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            point_id: pointId,
            ...updates,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update relay point');

        await fetchRelayPoints(zoneId);
        return data.relay_point;
      } catch (error: any) {
        console.error('Error updating relay point:', error);
        throw error;
      }
    },
    [fetchRelayPoints]
  );

  // Delete relay point
  const deleteRelayPoint = useCallback(
    async (pointId: string, zoneId: string) => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) throw new Error('Not authenticated');

        const url = new URL(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-zones`
        );
        url.searchParams.append('resource', 'relay_points');
        url.searchParams.append('id', pointId);

        const response = await fetch(url.toString(), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete relay point');

        await fetchRelayPoints(zoneId);
      } catch (error: any) {
        console.error('Error deleting relay point:', error);
        throw error;
      }
    },
    [fetchRelayPoints]
  );

  return {
    relayPoints,
    isLoading,
    fetchRelayPoints,
    createRelayPoint,
    updateRelayPoint,
    deleteRelayPoint,
  };
}
