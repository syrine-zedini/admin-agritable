import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
  route_stops?: any[];
}

export interface Deliverer {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  vehicle_type?: string;
  is_active?: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  is_active: boolean;
}

export function useRoutePlanning() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch routes
  const fetchRoutes = useCallback(async (filters?: {
    deliverer_id?: string;
    date?: string;
    status?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) throw new Error('Not authenticated');

      let query = supabase
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
        .order('date', { ascending: false });

      if (filters?.deliverer_id) {
        query = query.eq('deliverer_id', filters.deliverer_id);
      }
      if (filters?.date) {
        query = query.eq('date', filters.date);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // For each route, fetch stops with full details including collection stops
      const routesWithStops = await Promise.all(
        (data || []).map(async (route) => {
          const { data: stops } = await supabase
            .from('route_stops')
            .select(`
              *,
              order:orders(id, order_number, total),
              supplier:users!supplier_id(id, first_name, last_name, company_name, phone, latitude, longitude),
              address:addresses(street_address, city, latitude, longitude)
            `)
            .eq('route_id', route.id)
            .order('stop_order', { ascending: true });

          return {
            ...route,
            total_stops: stops?.length || 0,
            completed_stops: stops?.filter(s => s.status === 'completed').length || 0,
            route_stops: stops || [],
          };
        })
      );

      setRoutes(routesWithStops);
    } catch (err: any) {
      console.error('Error fetching routes:', err);
      setError(err.message || 'Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch available deliverers
  const fetchDeliverers = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, first_name, last_name, phone, vehicle_type, is_active')
        .eq('user_type', 'deliverer')
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (fetchError) throw fetchError;

      setDeliverers(data || []);
    } catch (err: any) {
      console.error('Error fetching deliverers:', err);
    }
  }, []);

  // Fetch zones
  const fetchZones = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('delivery_zones')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setZones(data || []);
    } catch (err: any) {
      console.error('Error fetching zones:', err);
    }
  }, []);

  // Optimize route stop order (Phase 6)
  const optimizeRouteStops = useCallback(async (routeId: string) => {
    try {
      const { error } = await supabase.rpc('optimize_route_stop_order', {
        p_route_id: routeId
      });

      if (error) throw error;
      await fetchRoutes();
    } catch (err: any) {
      console.error('Error optimizing route:', err);
      throw err;
    }
  }, [fetchRoutes]);

  // Create route
  const createRoute = useCallback(
    async (routeData: {
      deliverer_id: string;
      date: string;
      order_ids?: string[];
    }) => {
      try {
        const { data: newRoute, error: createError } = await supabase
          .from('delivery_routes')
          .insert({
            deliverer_id: routeData.deliverer_id,
            date: routeData.date,
            status: 'pending',
          })
          .select()
          .single();

        if (createError) throw createError;

        // If order_ids provided, create route stops
        if (routeData.order_ids && routeData.order_ids.length > 0) {
          const stops = routeData.order_ids.map((order_id, index) => ({
            route_id: newRoute.id,
            order_id,
            stop_order: index + 1,
            status: 'pending',
            stop_type: 'delivery', // Explicitly set stop type for deliveries
          }));

          const { error: stopsError } = await supabase
            .from('route_stops')
            .insert(stops);

          if (stopsError) {
            // Rollback route creation
            await supabase.from('delivery_routes').delete().eq('id', newRoute.id);
            throw stopsError;
          }

          // Update orders with deliverer assignment
          await supabase
            .from('orders')
            .update({
              deliverer_id: routeData.deliverer_id,
              assigned_deliverer_at: new Date().toISOString(),
            })
            .in('id', routeData.order_ids);
        }

        // Optimize route stop order after creation (Phase 6)
        if (newRoute.id) {
          await supabase.rpc('optimize_route_stop_order', {
            p_route_id: newRoute.id
          });
        }

        await fetchRoutes();
        return newRoute;
      } catch (err: any) {
        console.error('Error creating route:', err);
        throw err;
      }
    },
    [fetchRoutes]
  );

  // Update route
  const updateRoute = useCallback(
    async (
      routeId: string,
      updates: {
        deliverer_id?: string;
        date?: string;
        status?: string;
        add_order_ids?: string[];
        remove_order_ids?: string[];
      }
    ) => {
      try {
        const updateData: any = {};
        if (updates.deliverer_id) updateData.deliverer_id = updates.deliverer_id;
        if (updates.date) updateData.date = updates.date;
        if (updates.status) updateData.status = updates.status;

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('delivery_routes')
            .update(updateData)
            .eq('id', routeId);

          if (updateError) throw updateError;
        }

        // Add new orders to route
        if (updates.add_order_ids && updates.add_order_ids.length > 0) {
          // Get current max stop_order
          const { data: maxStop } = await supabase
            .from('route_stops')
            .select('stop_order')
            .eq('route_id', routeId)
            .order('stop_order', { ascending: false })
            .limit(1)
            .single();

          const startOrder = (maxStop?.stop_order || 0) + 1;

          const newStops = updates.add_order_ids.map((order_id, index) => ({
            route_id: routeId,
            order_id,
            stop_order: startOrder + index,
            status: 'pending',
          }));

          await supabase.from('route_stops').insert(newStops);

          // Update deliverer assignment if changed
          if (updates.deliverer_id) {
            await supabase
              .from('orders')
              .update({
                deliverer_id: updates.deliverer_id,
                assigned_deliverer_at: new Date().toISOString(),
              })
              .in('id', updates.add_order_ids);
          }
        }

        // Remove orders from route
        if (updates.remove_order_ids && updates.remove_order_ids.length > 0) {
          await supabase
            .from('route_stops')
            .delete()
            .in('order_id', updates.remove_order_ids);

          await supabase
            .from('orders')
            .update({
              deliverer_id: null,
              assigned_deliverer_at: null,
            })
            .in('id', updates.remove_order_ids);
        }

        await fetchRoutes();
      } catch (err: any) {
        console.error('Error updating route:', err);
        throw err;
      }
    },
    [fetchRoutes]
  );

  // Delete route
  const deleteRoute = useCallback(
    async (routeId: string) => {
      try {
        // Check if route can be deleted
        const { data: route } = await supabase
          .from('delivery_routes')
          .select('status')
          .eq('id', routeId)
          .single();

        if (route?.status === 'in_progress' || route?.status === 'completed') {
          throw new Error('Cannot delete route that is in progress or completed');
        }

        // Get order IDs to unassign deliverer
        const { data: stops } = await supabase
          .from('route_stops')
          .select('order_id')
          .eq('route_id', routeId);

        if (stops && stops.length > 0) {
          const orderIds = stops.map(s => s.order_id);
          await supabase
            .from('orders')
            .update({
              deliverer_id: null,
              assigned_deliverer_at: null,
            })
            .in('id', orderIds);
        }

        // Delete route (cascade will delete stops)
        const { error: deleteError } = await supabase
          .from('delivery_routes')
          .delete()
          .eq('id', routeId);

        if (deleteError) throw deleteError;

        await fetchRoutes();
      } catch (err: any) {
        console.error('Error deleting route:', err);
        throw err;
      }
    },
    [fetchRoutes]
  );

  // Initial load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetchRoutes({ date: today });
    fetchDeliverers();
    fetchZones();
  }, [fetchRoutes, fetchDeliverers, fetchZones]);

  return {
    routes,
    deliverers,
    zones,
    isLoading,
    error,
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    optimizeRouteStops, // Phase 6
  };
}
