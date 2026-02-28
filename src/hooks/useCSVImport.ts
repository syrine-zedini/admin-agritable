import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';
import { ValidationError } from 'next/dist/compiled/amphtml-validator';
import { CSVImportResult, CSVImportRow } from '@/types/pricingSpreadsheet';

interface UseCSVImportReturn {
  isImporting: boolean;
  parseCSV: (file: File) => Promise<CSVImportResult>;
  importData: (rows: CSVImportRow[]) => Promise<{ success: number; errors: ValidationError[] }>;
}

// Expected CSV columns (flexible mapping)
const COLUMN_MAPPINGS = {
  // Product identification
  sku: ['sku', 'SKU', 'product_sku', 'Product SKU'],
  product_name: ['product_name', 'Product Name', 'name', 'Name', 'Produit'],

  // Pricing
  purchase_price: ['purchase_price', 'Purchase Price', 'cost_price', 'Cost Price', 'Prix Achat'],
  b2c_price: ['b2c_price', 'B2C Price', 'price', 'Price', 'Prix B2C'],
  b2b_base_price: ['b2b_base_price', 'B2B Base Price', 'B2B Base', 'Prix B2B'],

  // Inventory
  stock: ['stock', 'Stock', 'quantity', 'Quantity', 'Stock Magasin'],
  unit: ['unit', 'Unit', 'Unité'],
  unit_size: ['unit_size', 'Unit Size', 'Taille'],

  // Supplier
  supplier_name: ['supplier_name', 'Supplier Name', 'supplier', 'Supplier', 'Fournisseur'],
};

export const useCSVImport = (): UseCSVImportReturn => {
  const [isImporting, setIsImporting] = useState(false);

  // Find column name in CSV headers (case-insensitive, flexible matching)
  const findColumn = (headers: string[], possibleNames: string[]): string | null => {
    for (const possibleName of possibleNames) {
      const found = headers.find(
        (h) => h.trim().toLowerCase() === possibleName.toLowerCase()
      );
      if (found) return found;
    }
    return null;
  };

  // Parse CSV file
  const parseCSV = useCallback(async (file: File): Promise<CSVImportResult> => {
    return new Promise((resolve) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rows: CSVImportRow[] = [];
          const errors: ValidationError[] = [];

          // Map columns
          const columnMap: Record<keyof typeof COLUMN_MAPPINGS, string | null> = {
            sku: findColumn(headers, COLUMN_MAPPINGS.sku),
            product_name: findColumn(headers, COLUMN_MAPPINGS.product_name),
            purchase_price: findColumn(headers, COLUMN_MAPPINGS.purchase_price),
            b2c_price: findColumn(headers, COLUMN_MAPPINGS.b2c_price),
            b2b_base_price: findColumn(headers, COLUMN_MAPPINGS.b2b_base_price),
            stock: findColumn(headers, COLUMN_MAPPINGS.stock),
            unit: findColumn(headers, COLUMN_MAPPINGS.unit),
            unit_size: findColumn(headers, COLUMN_MAPPINGS.unit_size),
            supplier_name: findColumn(headers, COLUMN_MAPPINGS.supplier_name),
          };

          // Check required columns
          if (!columnMap.sku && !columnMap.product_name) {
            errors.push({
              row: 0,
              field: 'sku/product_name',
              message: 'CSV must have either SKU or Product Name column',
            });
            resolve({
             rows: [],
             errors,
             columnMap,
             total_rows: 0,
             valid_rows: 0,
             invalid_rows: 0,
             detected_b2b_clients: [],
            });
             return;
             }

          // Parse each row
          results.data.forEach((row, index) => {
            const rowErrors: ValidationError[] = [];

            // Extract data
            const sku = columnMap.sku ? row[columnMap.sku]?.trim() : undefined;
            const productName = columnMap.product_name ? row[columnMap.product_name]?.trim() : undefined;

            if (!sku && !productName) {
              rowErrors.push({
                row: index + 1,
                field: 'sku/product_name',
                message: 'Row must have either SKU or Product Name',
              });
            }

            // Parse numeric fields
            const parseNumber = (value: string | undefined): number | undefined => {
              if (!value || value.trim() === '') return undefined;
              const num = parseFloat(value.replace(/[^\d.-]/g, ''));
              return isNaN(num) ? undefined : num;
            };

            const purchasePrice = parseNumber(columnMap.purchase_price ? row[columnMap.purchase_price] : undefined);
            const b2cPrice = parseNumber(columnMap.b2c_price ? row[columnMap.b2c_price] : undefined);
            const b2bBasePrice = parseNumber(columnMap.b2b_base_price ? row[columnMap.b2b_base_price] : undefined);
            const stock = parseNumber(columnMap.stock ? row[columnMap.stock] : undefined);

            // Validate prices
            if (purchasePrice !== undefined && purchasePrice < 0) {
              rowErrors.push({
                row: index + 1,
                field: 'purchase_price',
                message: 'Purchase price cannot be negative',
              });
            }

            if (b2cPrice !== undefined && b2cPrice < 0) {
              rowErrors.push({
                row: index + 1,
                field: 'b2c_price',
                message: 'B2C price cannot be negative',
              });
            }

            if (stock !== undefined && stock < 0) {
              rowErrors.push({
                row: index + 1,
                field: 'stock',
                message: 'Stock cannot be negative',
              });
            }

            // Build row object
            const csvRow: CSVImportRow = {
              row_number: index + 1,
              sku,
              product_name: productName,
              purchase_price: purchasePrice,
              b2c_price: b2cPrice,
              b2b_base_price: b2bBasePrice,
              stock,
              unit: columnMap.unit ? row[columnMap.unit]?.trim() : undefined,
              unit_size: columnMap.unit_size ? row[columnMap.unit_size]?.trim() : undefined,
              supplier_name: columnMap.supplier_name ? row[columnMap.supplier_name]?.trim() : undefined,
              errors: rowErrors,
              is_valid: rowErrors.length === 0,

            };

            rows.push(csvRow);
            errors.push(...rowErrors);
          });

        resolve({
             rows: [],
             errors,
             columnMap,
             total_rows: 0,
             valid_rows: 0,
             invalid_rows: 0,
             detected_b2b_clients: [],
            });
        },
        error: (error) => {
        const errors: ValidationError[] = [{row: 0,field: 'file',column: 'file',message: error.message,severity: 'error',}];

        resolve({
            rows: [],
            errors,
            columnMap: {},
            total_rows: 0,
            valid_rows: 0,
            invalid_rows: 0,
            detected_b2b_clients: [],
        });
       },
      });
    });
  }, []);

  // Import data to database
  const importData = useCallback(async (rows: CSVImportRow[]) => {
    setIsImporting(true);
    const errors: ValidationError[] = [];
    let successCount = 0;

    try {
      // Filter out rows with validation errors
      const validRows = rows.filter((row) => !row.errors || row.errors.length === 0);

      for (const row of validRows) {
        try {
          // Find product by SKU or name
          let productId: string | null = null;

          if (row.sku) {
            const { data } = await supabase
              .from('products')
              .select('id')
              .eq('sku', row.sku)
              .maybeSingle();

            productId = data?.id || null;
          }

          if (!productId && row.product_name) {
            const { data } = await supabase
              .from('products')
              .select('id')
              .eq('name_fr', row.product_name)
              .maybeSingle();

            productId = data?.id || null;
          }

          if (!productId) {
            errors.push({
              row: row.row_number,
              field: 'product',
              message: `Product not found: ${row.sku || row.product_name}`,
            });
            continue;
          }

          // Build update object (only update provided fields)
          const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };

          if (row.purchase_price !== undefined) updates.cost_price = row.purchase_price;
          if (row.b2c_price !== undefined) updates.price = row.b2c_price;
          if (row.b2b_base_price !== undefined) updates.b2b_base_price = row.b2b_base_price;
          if (row.stock !== undefined) updates.stock_quantity = Math.floor(row.stock); // Ensure integer
          if (row.unit !== undefined) updates.unit = row.unit;
          if (row.unit_size !== undefined) updates.unit_size = row.unit_size;

          // Update product
          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
              .from('products')
              .update(updates)
              .eq('id', productId);

            if (updateError) {
              errors.push({
                row: row.row_number,
                field: 'update',
                message: updateError.message,
              });
              continue;
            }
          }

          // Update supplier if provided
          if (row.supplier_name) {
            // Find supplier by name (user_type = 'supplier')
            const { data: supplier } = await supabase
              .from('users')
              .select('id')
              .eq('user_type', 'supplier')
              .or(`company_name.ilike.%${row.supplier_name}%,first_name.ilike.%${row.supplier_name}%`)
              .maybeSingle();

            if (supplier) {
              // Upsert product_supplier relationship
              const { error: supplierError } = await supabase
                .from('product_suppliers')
                .upsert({
                  product_id: productId,
                  supplier_id: supplier.id,
                  is_primary: true,
                  is_active: true,
                }, {
                  onConflict: 'product_id,supplier_id',
                });

              if (supplierError) {
                errors.push({
                  row: row.row_number,
                  field: 'supplier',
                  message: `Failed to link supplier: ${supplierError.message}`,
                });
              }
            } else {
              errors.push({
                row: row.row_number,
                field: 'supplier',
                message: `Supplier not found: ${row.supplier_name}`,
              });
            }
          }

          successCount++;
        } catch (err) {
          errors.push({
            row: row.row_number,
            field: 'unknown',
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    } finally {
      setIsImporting(false);
    }

    return { success: successCount, errors };
  }, []);

  return {
    isImporting,
    parseCSV,
    importData,
  };
};
