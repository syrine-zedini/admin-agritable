/**
 * Utility functions for aggregating demand forecast data
 * Used by useDemandForecast hook
 */

export interface DemandOrder {
  id: string;
  created_at: string; // Using created_at as delivery date proxy
  total_amount: number;
  status: string;
  order_items: Array<{
    product_id: string;
    quantity: number;
    product: {
      id: string;
      name_fr: string;
      stock_quantity: number;
      category_id: string;
      categories?: {
        name_fr: string;
      };
      product_suppliers?: Array<{
        supplier: {
          id: string;
          company_name: string | null;
          first_name: string | null;
          last_name: string | null;
        };
      }>;
    };
  }>;
}

export interface ProductDemand {
  productId: string;
  productName: string;
  totalQuantityNeeded: number;
  currentStock: number;
  projectedStock: number;
  shortage: number;
  suppliers: Array<{
    id: string;
    name: string;
  }>;
  categoryId: string;
  categoryName: string;
  orders: Array<{
    orderId: string;
    quantity: number;
    deliveryDate: string;
  }>;
}

export interface DateRangeDemand {
  dateRange: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    shortage: boolean;
  }>;
}

export interface SupplierDemand {
  supplierId: string;
  supplierName: string;
  products: Array<{
    productId: string;
    productName: string;
    quantityNeeded: number;
  }>;
  lastCollectionDate: string | null;
  nextScheduledCollection: string | null;
}

export interface CategoryDemand {
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
  productCount: number;
  shortagesCount: number;
  topProducts: Array<{
    productName: string;
    quantity: number;
  }>;
}

/**
 * Aggregate orders by product
 */
export function aggregateByProduct(orders: DemandOrder[]): ProductDemand[] {
  const productMap = new Map<string, ProductDemand>();

  orders.forEach((order) => {
    order.order_items.forEach((item) => {
      const productId = item.product_id;
      const productName = item.product.name_fr;
      const currentStock = item.product.stock_quantity;

      if (!productMap.has(productId)) {
        const supplierNames = item.product.product_suppliers?.map((ps) => ({
          id: ps.supplier.id,
          name:
            ps.supplier.company_name ||
            `${ps.supplier.first_name} ${ps.supplier.last_name}`.trim() ||
            'Unknown',
        })) || [];

        productMap.set(productId, {
          productId,
          productName,
          totalQuantityNeeded: 0,
          currentStock,
          projectedStock: currentStock,
          shortage: 0,
          suppliers: supplierNames,
          categoryId: item.product.category_id,
          categoryName: item.product.categories?.name_fr || 'Uncategorized',
          orders: [],
        });
      }

      const product = productMap.get(productId)!;
      product.totalQuantityNeeded += item.quantity;
      product.projectedStock -= item.quantity;
      product.orders.push({
        orderId: order.id,
        quantity: item.quantity,
        deliveryDate: order.created_at, // Using created_at as delivery date
      });
    });
  });

  // Calculate shortages
  productMap.forEach((product) => {
    if (product.projectedStock < 0) {
      product.shortage = Math.abs(product.projectedStock);
    }
  });

  return Array.from(productMap.values()).sort(
    (a, b) => b.totalQuantityNeeded - a.totalQuantityNeeded
  );
}

/**
 * Aggregate orders by delivery date range
 * Groups by 3-day ranges (using created_at as date reference)
 */
export function aggregateByDateRange(orders: DemandOrder[]): DateRangeDemand[] {
  const dateRanges = groupOrdersByDateRange(orders);
  const result: DateRangeDemand[] = [];

  dateRanges.forEach((rangeOrders, dateRange) => {
    const productMap = new Map<string, { name: string; quantity: number; shortage: boolean }>();

    rangeOrders.forEach((order) => {
      order.order_items.forEach((item) => {
        const existing = productMap.get(item.product_id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          productMap.set(item.product_id, {
            name: item.product.name_fr,
            quantity: item.quantity,
            shortage: item.product.stock_quantity < item.quantity,
          });
        }
      });
    });

    const [startDate, endDate] = dateRange.split('→');
    result.push({
      dateRange,
      startDate,
      endDate,
      totalOrders: rangeOrders.length,
      products: Array.from(productMap.entries()).map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity,
        shortage: data.shortage,
      })),
    });
  });

  return result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

/**
 * Aggregate orders by supplier
 */
export function aggregateBySupplier(orders: DemandOrder[]): SupplierDemand[] {
  const supplierMap = new Map<string, SupplierDemand>();

  orders.forEach((order) => {
    order.order_items.forEach((item) => {
      item.product.product_suppliers?.forEach((ps) => {
        const supplierId = ps.supplier.id;
        const supplierName =
          ps.supplier.company_name ||
          `${ps.supplier.first_name} ${ps.supplier.last_name}`.trim() ||
          'Unknown';

        if (!supplierMap.has(supplierId)) {
          supplierMap.set(supplierId, {
            supplierId,
            supplierName,
            products: [],
            lastCollectionDate: null,
            nextScheduledCollection: null,
          });
        }

        const supplier = supplierMap.get(supplierId)!;
        const existingProduct = supplier.products.find((p) => p.productId === item.product_id);

        if (existingProduct) {
          existingProduct.quantityNeeded += item.quantity;
        } else {
          supplier.products.push({
            productId: item.product_id,
            productName: item.product.name_fr,
            quantityNeeded: item.quantity,
          });
        }
      });
    });
  });

  return Array.from(supplierMap.values()).sort((a, b) =>
    a.supplierName.localeCompare(b.supplierName)
  );
}

/**
 * Aggregate orders by category
 * OPTIMIZED: Removed O(n²) complexity by pre-calculating product sets
 */
export function aggregateByCategory(orders: DemandOrder[]): CategoryDemand[] {
  const categoryMap = new Map<string, CategoryDemand>();

  // Pre-calculate unique products per category (ONE PASS)
  const categoryProductSets = new Map<string, Set<string>>();
  const productQuantitiesPerCategory = new Map<string, Map<string, { name: string; quantity: number }>>();

  // Single pass through all orders to collect data
  orders.forEach((order) => {
    order.order_items.forEach((item) => {
      const categoryId = item.product.category_id;
      const categoryName = item.product.categories?.name_fr || 'Uncategorized';

      // Initialize category if needed
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          totalQuantity: 0,
          productCount: 0,
          shortagesCount: 0,
          topProducts: [],
        });
        categoryProductSets.set(categoryId, new Set());
        productQuantitiesPerCategory.set(categoryId, new Map());
      }

      const category = categoryMap.get(categoryId)!;
      const productSet = categoryProductSets.get(categoryId)!;
      const productQuantities = productQuantitiesPerCategory.get(categoryId)!;

      // Add to total quantity
      category.totalQuantity += item.quantity;

      // Track unique product
      productSet.add(item.product_id);

      // Count shortages
      if (item.product.stock_quantity < item.quantity) {
        category.shortagesCount++;
      }

      // Aggregate product quantities for top products
      const existing = productQuantities.get(item.product_id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        productQuantities.set(item.product_id, {
          name: item.product.name_fr,
          quantity: item.quantity,
        });
      }
    });
  });

  // Set product counts and top products (using pre-calculated data)
  categoryMap.forEach((category, categoryId) => {
    category.productCount = categoryProductSets.get(categoryId)?.size || 0;

    const productQuantities = productQuantitiesPerCategory.get(categoryId);
    if (productQuantities) {
      category.topProducts = Array.from(productQuantities.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map((p) => ({ productName: p.name, quantity: p.quantity }));
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName)
  );
}

/**
 * Helper: Group orders by 3-day date ranges (using created_at)
 */
function groupOrdersByDateRange(orders: DemandOrder[]): Map<string, DemandOrder[]> {
  const sorted = [...orders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const ranges = new Map<string, DemandOrder[]>();
  let currentRangeStart: Date | null = null;
  let currentRangeEnd: Date | null = null;
  let currentRangeOrders: DemandOrder[] = [];

  sorted.forEach((order) => {
    const orderDate = new Date(order.created_at);

    if (!currentRangeStart) {
      currentRangeStart = orderDate;
      currentRangeEnd = new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000); // +2 days = 3-day range
      currentRangeOrders = [order];
    } else if (orderDate <= currentRangeEnd!) {
      currentRangeOrders.push(order);
    } else {
      // Save current range
      const rangeKey = `${formatDate(currentRangeStart)}→${formatDate(currentRangeEnd!)}`;
      ranges.set(rangeKey, currentRangeOrders);

      // Start new range
      currentRangeStart = orderDate;
      currentRangeEnd = new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      currentRangeOrders = [order];
    }
  });

  // Save last range
  if (currentRangeStart && currentRangeEnd) {
    const rangeKey = `${formatDate(currentRangeStart)}→${formatDate(currentRangeEnd)}`;
    ranges.set(rangeKey, currentRangeOrders);
  }

  return ranges;
}

/**
 * Helper: Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
