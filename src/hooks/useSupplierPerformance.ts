import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SupplierPerformanceMetrics {
  supplier_id: string;
  supplier_name: string;
  supplier_company: string | null;
  supplier_phone: string | null;

  // Collection metrics
  total_collections: number;
  successful_collections: number;
  failed_collections: number;
  quality_rejected_collections: number;
  quality_score: number; // (successful / total) * 100

  // Financial metrics
  total_value: number; // Total amount paid to supplier
  average_collection_value: number;

  // Offer metrics
  total_offers_submitted: number;
  offers_approved: number;
  offers_rejected: number;
  offer_approval_rate: number; // (approved / total) * 100

  // Demand response metrics
  total_demand_responses: number;
  responses_accepted: number;
  responses_rejected: number;
  response_acceptance_rate: number; // (accepted / total) * 100
  average_response_time_hours: number; // Avg time from demand creation to supplier response

  // Overall rating (auto-calculated composite score)
  overall_rating: number; // 0-5 stars based on weighted metrics
}

export interface SupplierPerformanceFilters {
  supplier_id?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Hook for calculating supplier performance metrics
 *
 * Aggregates data from:
 * - route_stops (collections) - for quality and reliability metrics
 * - supplier_offers - for offer approval rates
 * - demand_responses - for responsiveness metrics
 *
 * Auto-calculates overall rating based on:
 * - Quality score (40% weight)
 * - Offer approval rate (20% weight)
 * - Response acceptance rate (20% weight)
 * - Response time (20% weight)
 */
export function useSupplierPerformance(filters: SupplierPerformanceFilters = {}) {
  const {
    data: performanceMetrics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['supplier_performance', filters],
    queryFn: async (): Promise<SupplierPerformanceMetrics[]> => {
      // Build date range filter
      const dateFrom = filters.date_from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // Default: last 90 days
      const dateTo = filters.date_to || new Date().toISOString();

      // Step 1: Fetch all suppliers (or specific supplier if filtered)
      let suppliersQuery = supabase
        .from('users')
        .select('id, first_name, last_name, company_name, phone')
        .eq('user_type', 'supplier')
        .eq('is_active', true);

      if (filters.supplier_id) {
        suppliersQuery = suppliersQuery.eq('id', filters.supplier_id);
      }

      const { data: suppliers, error: suppliersError } = await suppliersQuery;
      if (suppliersError) throw suppliersError;
      if (!suppliers || suppliers.length === 0) return [];

      const supplierIds = suppliers.map(s => s.id);

      // Step 2: Fetch collection data (route_stops with stop_type = 'collection')
      const { data: collections, error: collectionsError } = await supabase
        .from('route_stops')
        .select('supplier_id, collection_status, payment_amount_paid, created_at, admin_verification')
        .eq('stop_type', 'collection')
        .in('supplier_id', supplierIds)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo);

      if (collectionsError) throw collectionsError;

      // Step 3: Fetch supplier offers
      const { data: offers, error: offersError } = await supabase
        .from('supplier_offers')
        .select('supplier_id, status, created_at')
        .in('supplier_id', supplierIds)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo);

      if (offersError) throw offersError;

      // Step 4: Fetch demand responses with request creation time
      const { data: responses, error: responsesError } = await supabase
        .from('demand_responses')
        .select(`
          supplier_id,
          status,
          created_at,
          demand_request:demand_requests!demand_request_id(created_at)
        `)
        .in('supplier_id', supplierIds)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo);

      if (responsesError) throw responsesError;

      // Step 5: Calculate metrics for each supplier
      const metricsMap: Record<string, SupplierPerformanceMetrics> = {};

      suppliers.forEach((supplier: any) => {
        const supplierId = supplier.id;

        // Collection metrics
        const supplierCollections = collections?.filter(c => c.supplier_id === supplierId) || [];
        const totalCollections = supplierCollections.length;
        const successfulCollections = supplierCollections.filter(c => c.collection_status === 'verified' || c.collection_status === 'collected').length;
        const failedCollections = supplierCollections.filter(c => c.collection_status === 'failed').length;
        const qualityRejectedCollections = supplierCollections.filter(c => c.collection_status === 'quality_rejected').length;
        const qualityScore = totalCollections > 0 ? (successfulCollections / totalCollections) * 100 : 0;

        // Financial metrics
        const totalValue = supplierCollections.reduce((sum, c) => sum + (c.payment_amount_paid || 0), 0);
        const averageCollectionValue = totalCollections > 0 ? totalValue / totalCollections : 0;

        // Offer metrics
        const supplierOffers = offers?.filter(o => o.supplier_id === supplierId) || [];
        const totalOffers = supplierOffers.length;
        const offersApproved = supplierOffers.filter(o => o.status === 'approved').length;
        const offersRejected = supplierOffers.filter(o => o.status === 'rejected').length;
        const offerApprovalRate = totalOffers > 0 ? (offersApproved / totalOffers) * 100 : 0;

        // Demand response metrics
        const supplierResponses = responses?.filter((r: any) => r.supplier_id === supplierId) || [];
        const totalResponses = supplierResponses.length;
        const responsesAccepted = supplierResponses.filter((r: any) => r.status === 'accepted').length;
        const responsesRejected = supplierResponses.filter((r: any) => r.status === 'rejected').length;
        const responseAcceptanceRate = totalResponses > 0 ? (responsesAccepted / totalResponses) * 100 : 0;

        // Average response time (in hours)
        const responseTimes = supplierResponses
          .filter((r: any) => r.demand_request?.created_at)
          .map((r: any) => {
            const requestTime = new Date(r.demand_request.created_at).getTime();
            const responseTime = new Date(r.created_at).getTime();
            return (responseTime - requestTime) / (1000 * 60 * 60); // Convert to hours
          });
        const averageResponseTimeHours = responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

        // Overall rating calculation (weighted composite score, 0-5 stars)
        // Quality score: 40%, Offer approval: 20%, Response acceptance: 20%, Response time: 20%
        const qualityWeight = 0.4;
        const offerApprovalWeight = 0.2;
        const responseAcceptanceWeight = 0.2;
        const responseTimeWeight = 0.2;

        // Normalize metrics to 0-5 scale
        const qualityRating = (qualityScore / 100) * 5;
        const offerApprovalRating = (offerApprovalRate / 100) * 5;
        const responseAcceptanceRating = (responseAcceptanceRate / 100) * 5;

        // Response time rating: inverse (faster = better)
        // Less than 24h = 5 stars, 24-48h = 4 stars, 48-72h = 3 stars, etc.
        const responseTimeRating = averageResponseTimeHours === 0 ? 0 :
          averageResponseTimeHours < 24 ? 5 :
          averageResponseTimeHours < 48 ? 4 :
          averageResponseTimeHours < 72 ? 3 :
          averageResponseTimeHours < 96 ? 2 : 1;

        const overallRating =
          (qualityRating * qualityWeight) +
          (offerApprovalRating * offerApprovalWeight) +
          (responseAcceptanceRating * responseAcceptanceWeight) +
          (responseTimeRating * responseTimeWeight);

        metricsMap[supplierId] = {
          supplier_id: supplierId,
          supplier_name: `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim() || 'Unknown',
          supplier_company: supplier.company_name,
          supplier_phone: supplier.phone,
          total_collections: totalCollections,
          successful_collections: successfulCollections,
          failed_collections: failedCollections,
          quality_rejected_collections: qualityRejectedCollections,
          quality_score: qualityScore,
          total_value: totalValue,
          average_collection_value: averageCollectionValue,
          total_offers_submitted: totalOffers,
          offers_approved: offersApproved,
          offers_rejected: offersRejected,
          offer_approval_rate: offerApprovalRate,
          total_demand_responses: totalResponses,
          responses_accepted: responsesAccepted,
          responses_rejected: responsesRejected,
          response_acceptance_rate: responseAcceptanceRate,
          average_response_time_hours: averageResponseTimeHours,
          overall_rating: overallRating,
        };
      });

      // Sort by overall rating (highest first)
      return Object.values(metricsMap).sort((a, b) => b.overall_rating - a.overall_rating);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    performanceMetrics: performanceMetrics || [],
    isLoading,
    error,
    refetch,
  };
}
