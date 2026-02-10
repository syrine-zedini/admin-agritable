import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ImportItem {
  row: number;
  product_sku: string;
  quantity: number;
  notes?: string;
  // Validation results
  isValid?: boolean;
  error?: string;
  // Resolved product data
  product_id?: string;
  product_name?: string;
  unit_price?: number;
  available_stock?: number;
  custom_price?: number; // For B2B clients with custom pricing
}

export interface ImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  items: ImportItem[];
}

export interface BulkOrderData {
  user_id: string;
  delivery_address_id: string;
  delivery_window_id?: string;
  payment_method: string;
  po_number?: string;
  client_reference?: string;
  notes?: string;
}

export const useBulkOrderImport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  /**
   * Parse CSV content
   */
  const parseCSV = useCallback((content: string): ImportItem[] => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Expected format: SKU,Quantity,Notes (with header)
    const items: ImportItem[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2) {
        items.push({
          row: i + 1,
          product_sku: parts[0] || '',
          quantity: 0,
          isValid: false,
          error: 'Invalid format. Expected: SKU,Quantity,Notes',
        });
        continue;
      }

      const [sku, quantityStr, ...notesParts] = parts;
      const quantity = parseInt(quantityStr);

      if (!sku) {
        items.push({
          row: i + 1,
          product_sku: '',
          quantity: 0,
          isValid: false,
          error: 'SKU is required',
        });
        continue;
      }

      if (isNaN(quantity) || quantity <= 0) {
        items.push({
          row: i + 1,
          product_sku: sku,
          quantity: 0,
          isValid: false,
          error: 'Quantity must be a positive number',
        });
        continue;
      }

      items.push({
        row: i + 1,
        product_sku: sku,
        quantity,
        notes: notesParts.join(',').trim() || undefined,
        isValid: true,
      });
    }

    return items;
  }, []);

  /**
   * Validate items against database
   */
  const validateItems = useCallback(async (
    items: ImportItem[],
    userId: string
  ): Promise<ImportResult> => {
    setIsLoading(true);
    setError(null);
    setProgress({ current: 0, total: items.length });

    try {
      const validatedItems: ImportItem[] = [];
      let validCount = 0;
      let invalidCount = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setProgress({ current: i + 1, total: items.length });

        // Skip already invalid items
        if (!item.isValid) {
          invalidCount++;
          validatedItems.push(item);
          continue;
        }

        // Fetch product by SKU
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name_fr, price, stock_quantity')
          .eq('sku', item.product_sku)
          .eq('is_active', true)
          .single();

        if (productError || !product) {
          invalidCount++;
          validatedItems.push({
            ...item,
            isValid: false,
            error: `Product not found with SKU: ${item.product_sku}`,
          });
          continue;
        }

        // Check for custom B2B pricing
        let unitPrice = product.price;
        const { data: customPrice } = await supabase
          .from('b2b_custom_prices')
          .select('custom_price')
          .eq('user_id', userId)
          .eq('product_id', product.id)
          .eq('is_active', true)
          .maybeSingle();

        if (customPrice) {
          unitPrice = customPrice.custom_price;
        }

        // Check stock availability
        if (product.stock_quantity < item.quantity) {
          invalidCount++;
          validatedItems.push({
            ...item,
            product_id: product.id,
            product_name: product.name_fr,
            unit_price: unitPrice,
            available_stock: product.stock_quantity,
            custom_price: customPrice?.custom_price,
            isValid: false,
            error: `Insufficient stock. Available: ${product.stock_quantity}, Requested: ${item.quantity}`,
          });
          continue;
        }

        // Item is valid
        validCount++;
        validatedItems.push({
          ...item,
          product_id: product.id,
          product_name: product.name_fr,
          unit_price: unitPrice,
          available_stock: product.stock_quantity,
          custom_price: customPrice?.custom_price,
          isValid: true,
          error: undefined,
        });
      }

      setProgress(null);
      return {
        totalRows: items.length,
        validRows: validCount,
        invalidRows: invalidCount,
        items: validatedItems,
      };
    } catch (err: any) {
      console.error('Error validating items:', err);
      setError(err.message || 'Failed to validate items');
      setProgress(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create order from validated items
   */
  const createBulkOrder = useCallback(async (
    orderData: BulkOrderData,
    items: ImportItem[]
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Filter only valid items
      const validItems = items.filter(item => item.isValid && item.product_id);

      if (validItems.length === 0) {
        throw new Error('No valid items to create order');
      }

      // Calculate totals
      const subtotal = validItems.reduce(
        (sum, item) => sum + (item.unit_price || 0) * item.quantity,
        0
      );

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.user_id,
          order_number: orderNumber,
          status: 'placed',
          subtotal,
          total: subtotal, // Will be updated with fees/taxes if applicable
          payment_method: orderData.payment_method,
          payment_status: 'pending',
          delivery_address_id: orderData.delivery_address_id,
          delivery_window_id: orderData.delivery_window_id,
          po_number: orderData.po_number,
          client_reference: orderData.client_reference,
          notes: orderData.notes,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Failed to create order');

      // Create order items
      const orderItems = validItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id!,
        product_sku: item.product_sku,
        product_name_fr: item.product_name!,
        quantity: item.quantity,
        unit_price: item.unit_price!,
        subtotal: (item.unit_price || 0) * item.quantity,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order.id;
    } catch (err: any) {
      console.error('Error creating bulk order:', err);
      setError(err.message || 'Failed to create order');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Read file and parse content
   */
  const readFile = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }, []);

  /**
   * Main function: Process uploaded file
   */
  const processFile = useCallback(async (
    file: File,
    userId: string
  ): Promise<ImportResult | null> => {
    try {
      setError(null);

      // Validate file type
      if (!file.name.endsWith('.csv')) {
        throw new Error('Only CSV files are supported');
      }

      // Read and parse file
      const content = await readFile(file);
      const items = parseCSV(content);

      // Validate items
      const result = await validateItems(items, userId);
      return result;
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process file');
      return null;
    }
  }, [readFile, parseCSV, validateItems]);

  return {
    isLoading,
    error,
    progress,
    processFile,
    createBulkOrder,
  };
};
