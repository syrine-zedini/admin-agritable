import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface DelivererLocation {
  id: string;
  deliverer_id: string;
  route_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  created_at: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  order_id: string;
  address_id: string;
  stop_order: number;
  status: string;
  estimated_arrival?: string;
  actual_arrival?: string;
  completed_at?: string;
  failure_reason?: string;
  notes?: string;
  created_at?: string;
  order?: {
    id: string;
    order_number: string;
    total: number;
    user?: {
      first_name?: string;
      last_name?: string;
      phone?: string;
    };
  };
  address?: {
    id: string;
    street_address: string;
    city: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface DeliveryRoute {
  id: string;
  deliverer_id: string;
  date: string;
  status: string;
  total_stops?: number;
  completed_stops?: number;
  estimated_distance?: number;
  actual_distance?: number;
  estimated_duration?: number;
  actual_duration?: number;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  deliverer?: {
    id: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    vehicle_type?: string;
  };
  route_stops?: RouteStop[];
  latest_location?: DelivererLocation;
}

export function useLiveTracking() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationChannel, setLocationChannel] = useState<RealtimeChannel | null>(null);

  // Fetch active routes for today
  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch routes with deliverer info
      const { data: routesData, error: routesError } = await supabase
        .from('delivery_routes')
        .select(`
          *,
          deliverer:users!delivery_routes_deliverer_id_fkey (
            id,
            first_name,
            last_name,
            phone,
            vehicle_type
          )
        `)
        .gte('date', today)
        .in('status', ['pending', 'in_progress'])
        .order('date', { ascending: true });

      if (routesError) throw routesError;

      // For each route, fetch stops and latest location
      const routesWithDetails = await Promise.all(
        (routesData || []).map(async (route) => {
          // Fetch route stops with order and address details
          const { data: stopsData, error: stopsError } = await supabase
            .from('route_stops')
            .select(`
              *,
              order:orders!route_stops_order_id_fkey (
                id,
                order_number,
                total,
                user:users!orders_user_id_fkey (
                  first_name,
                  last_name,
                  phone
                )
              ),
              address:addresses!route_stops_address_id_fkey (
                id,
                street_address,
                city,
                postal_code,
                latitude,
                longitude
              )
            `)
            .eq('route_id', route.id)
            .order('stop_order', { ascending: true });

          if (stopsError) {
            console.error('Error fetching stops:', stopsError);
          }

          // Fetch latest location for deliverer
          const { data: locationData, error: locationError } = await supabase
            .from('deliverer_locations')
            .select('*')
            .eq('deliverer_id', route.deliverer_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (locationError && locationError.code !== 'PGRST116') {
            console.error('Error fetching location:', locationError);
          }

          return {
            ...route,
            route_stops: stopsData || [],
            latest_location: locationData || undefined,
          };
        })
      );

      setRoutes(routesWithDetails);
    } catch (err: any) {
      console.error('Error fetching routes:', err);
      setError(err.message || 'Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up real-time subscription for location updates
  useEffect(() => {
    fetchRoutes();

    // Subscribe to deliverer_locations table for real-time updates
    const channel = supabase
      .channel('deliverer-locations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deliverer_locations',
        },
        (payload) => {
          const newLocation = payload.new as DelivererLocation;

          // Update the routes state with new location
          setRoutes((prevRoutes) =>
            prevRoutes.map((route) =>
              route.deliverer_id === newLocation.deliverer_id
                ? { ...route, latest_location: newLocation }
                : route
            )
          );
        }
      )
      .subscribe();

    setLocationChannel(channel);

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchRoutes]);

  // Update route stop status
  const updateStopStatus = useCallback(
    async (
      stopId: string,
      status: string,
      notes?: string
    ) => {
      try {
        const updates: any = {
          status,
        };

        if (status === 'in_progress') {
          updates.actual_arrival = new Date().toISOString();
        } else if (status === 'completed') {
          updates.completed_at = new Date().toISOString();
        }

        if (notes !== undefined) {
          updates.notes = notes;
        }

        const { error } = await supabase
          .from('route_stops')
          .update(updates)
          .eq('id', stopId);

        if (error) throw error;

        await fetchRoutes();
      } catch (err: any) {
        console.error('Error updating stop status:', err);
        throw err;
      }
    },
    [fetchRoutes]
  );

  // Update route status
  const updateRouteStatus = useCallback(
    async (routeId: string, status: 'pending' | 'in_progress' | 'completed') => {
      try {
        const updates: any = {
          status,
        };

        if (status === 'in_progress') {
          updates.started_at = new Date().toISOString();
        } else if (status === 'completed') {
          updates.completed_at = new Date().toISOString();

          // Calculate actual duration
          const route = routes.find((r) => r.id === routeId);
          if (route && route.started_at) {
            const duration = Math.floor(
              (new Date().getTime() - new Date(route.started_at).getTime()) / 1000
            );
            updates.actual_duration = duration;
          }
        }

        const { error } = await supabase
          .from('delivery_routes')
          .update(updates)
          .eq('id', routeId);

        if (error) throw error;

        await fetchRoutes();
      } catch (err: any) {
        console.error('Error updating route status:', err);
        throw err;
      }
    },
    [fetchRoutes, routes]
  );

  return {
    routes,
    isLoading,
    error,
    fetchRoutes,
    updateStopStatus,
    updateRouteStatus,
  };
}
