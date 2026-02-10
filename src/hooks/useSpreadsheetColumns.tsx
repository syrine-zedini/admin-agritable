import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { PricingSpreadsheetRow, B2BClient, ColumnGroup, Deliverer, Supplier } from '@/types/pricing-spreadsheet';
import { PricingFormulas } from '@/utils/pricing-formulas';
import { EditableCell } from '../components/pricing-spreadsheet/EditableCell';
import { UnitSelectCell } from '../components/pricing-spreadsheet/UnitSelectCell';
import { SellingUnitCell } from '../components/pricing-spreadsheet/SellingUnitCell';
import { DatePickerCell } from '../components/pricing-spreadsheet/DatePickerCell';
import { CalculatedPriceCell } from '../components/pricing-spreadsheet/CalculatedPriceCell';
import { CategorySelectCell } from '../components/pricing-spreadsheet/CategorySelectCell';
import { DelivererSelectCell } from '../components/pricing-spreadsheet/DelivererSelectCell';
import { Badge } from '@/components/ui/badge';
import { FileEdit, Package, Truck, CheckCircle, ShieldCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category } from '../types/models';

interface CellUpdate {
  productId: string;
  field: string;
  value: any;
}

interface UseSpreadsheetColumnsProps {
  selectedB2BClients: string[]; // Array of client IDs to show as columns
  b2bClients: B2BClient[]; // All available B2B clients
  onRemoveB2BColumn?: (clientId: string) => void;
  colorPreferences?: Record<string, string>; // Custom colors for groups

  // Update handlers
  updateCell: (update: CellUpdate) => Promise<boolean>;
  updateCategory: (productId: string, categoryId: string) => Promise<boolean>;
  updateDeliverer: (productId: string, delivererId: string) => Promise<boolean>;
  updatePickupDate: (productId: string, date: string | null) => Promise<boolean>;
  updateMultiplier: (productId: string, field: 'b2c_multiplier' | 'b2b_multiplier', value: number) => Promise<boolean>;
  updateSellingUnit: (productId: string, field: 'b2c' | 'b2b', quantity: number, unit: string) => Promise<boolean>;

  // Reference data
  deliverers: Deliverer[];
  suppliers: Supplier[];
  categories: Category[];
}

export const useSpreadsheetColumns = ({
  selectedB2BClients,
  b2bClients,
  onRemoveB2BColumn,
  colorPreferences = {},
  updateCell,
  updateCategory,
  updateDeliverer,
  updatePickupDate,
  updateMultiplier,
  updateSellingUnit,
  deliverers,
  suppliers,
  categories
}: UseSpreadsheetColumnsProps) => {
  // Define column groups structure with default colors
  const columnGroups: ColumnGroup[] = useMemo(
    () => [
      {
        id: 'product_info',
        label: 'Product Info',
        columns: ['product_name', 'sku', 'category_name'],
        defaultCollapsed: false,
        description: 'Basic product information',
        defaultColor: '#E3F2FD', // Soft blue
      },
      {
        id: 'units',
        label: 'Units',
        columns: ['purchase_unit', 'b2c_ratio', 'b2c_selling_unit', 'b2b_ratio', 'b2b_selling_unit'],
        defaultCollapsed: false,
        description: 'Unit conversion system (Purchase → B2C/B2B)',
        defaultColor: '#FFF3E0', // Soft orange
      },
      {
        id: 'b2c_pricing',
        label: 'B2C Pricing',
        columns: ['purchase_price', 'b2c_multiplier', 'b2c_prix_de_vente_calculated', 'prix_sur_site'],
        defaultCollapsed: false,
        description: 'B2C pricing formulas and overrides',
        defaultColor: '#E8F5E9', // Soft green
      },
      {
        id: 'b2b_pricing',
        label: 'B2B Pricing',
        columns: ['b2b_multiplier', 'b2b_price_calculated', 'b2b_base_price', ...selectedB2BClients.map((id) => `b2b_${id}`)],
        defaultCollapsed: false,
        description: 'B2B pricing formulas and client-specific prices',
        defaultColor: '#F3E5F5', // Soft purple
      },
      {
        id: 'logistics',
        label: 'Logistics',
        columns: ['supplier_name', 'deliverer_name', 'pickup_date', 'stock', 'besoin', 'commande', 'po_status'],
        defaultCollapsed: true,
        description: 'Supplier, deliverer, and operations data',
        defaultColor: '#FFF9C4', // Soft yellow
      },
    ],
    [selectedB2BClients]
  );

  const columns = useMemo<ColumnDef<PricingSpreadsheetRow>[]>(() => {
    const allColumns: ColumnDef<PricingSpreadsheetRow>[] = [];

    // ==================== PRODUCT INFO GROUP ====================
    allColumns.push(
      {
        accessorKey: 'product_name',
        header: 'Product Name',
        size: 200,
        meta: { group: 'product_info' },
        cell: ({ row }) => (
          <div className="px-3 py-2 font-medium">{row.original.product_name}</div>
        ),
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        size: 120,
        meta: { group: 'product_info' },
        cell: ({ row }) => (
          <div className="px-3 py-2 text-muted-foreground text-sm">{row.original.sku}</div>
        ),
      },
      {
        accessorKey: 'category_name',
        header: 'Category',
        size: 150,
        meta: { group: 'product_info' },
        cell: ({ row }) => (
          <CategorySelectCell
            categories={categories}
            productId={row.original.product_id}
            currentCategoryId={row.original.category_id}
            currentCategoryName={row.original.category_name}
            onUpdate={updateCategory}
          />
        ),
      }
    );

    // ==================== UNITS GROUP ====================
    allColumns.push(
      {
        accessorKey: 'purchase_unit',
        header: 'Purchase Unit',
        size: 120,
        meta: { group: 'units' },
        cell: ({ row }) => (
          <UnitSelectCell
            value={row.original.purchase_unit}
            onSave={async (unit) =>
              updateCell({
                productId: row.original.product_id,
                field: 'purchase_unit',
                value: unit,
              })
            }
          />
        ),
      },
      {
        accessorKey: 'b2c_selling_unit',
        header: 'B2C Selling Unit',
        size: 180,
        meta: { group: 'units' },
        cell: ({ row }) => (
          <SellingUnitCell
            purchaseUnit={row.original.purchase_unit || null}
            sellingQuantity={row.original.b2c_selling_quantity || null}
            sellingUnit={row.original.b2c_selling_unit || null}
            onSave={async (quantity, unit) =>
              updateSellingUnit(row.original.product_id, 'b2c', quantity, unit)
            }
            type="b2c"
          />
        ),
      },
      {
        accessorKey: 'b2c_ratio',
        header: 'B2C Ratio',
        size: 100,
        meta: { group: 'units' },
        cell: ({ row }) => (
          <div className="px-3 py-2 text-right font-mono text-blue-600 bg-blue-50">
            {row.original.b2c_ratio?.toFixed(2) || '1.00'}
          </div>
        ),
      },
      {
        accessorKey: 'b2b_selling_unit',
        header: 'B2B Selling Unit',
        size: 180,
        meta: { group: 'units' },
        cell: ({ row }) => (
          <SellingUnitCell
            purchaseUnit={row.original.purchase_unit || null}
            sellingQuantity={row.original.b2b_selling_quantity || null}
            sellingUnit={row.original.b2b_selling_unit || null}
            onSave={async (quantity, unit) =>
              updateSellingUnit(row.original.product_id, 'b2b', quantity, unit)
            }
            type="b2b"
          />
        ),
      },
      {
        accessorKey: 'b2b_ratio',
        header: 'B2B Ratio',
        size: 100,
        meta: { group: 'units' },
        cell: ({ row }) => (
          <div className="px-3 py-2 text-right font-mono text-purple-600 bg-purple-50">
            {row.original.b2b_ratio?.toFixed(2) || '1.00'}
          </div>
        ),
      }
    );

    // ==================== B2C PRICING GROUP ====================
    allColumns.push(
      {
        accessorKey: 'purchase_price',
        header: 'Prix Achat',
        size: 120,
        meta: { group: 'b2c_pricing' },
        cell: ({ row }) => {
          const price = row.original.purchase_price;
          return price !== null && price !== undefined ? (
            <div className="px-3 py-2 text-right font-mono">{price.toFixed(2)}</div>
          ) : (
            <div className="px-3 py-2 text-right text-muted-foreground">-</div>
          );
        },
      },
      {
        accessorKey: 'b2c_multiplier',
        header: 'B2C Multiplier',
        size: 130,
        meta: { group: 'b2c_pricing' },
        cell: ({ row }) => (
          <EditableCell
            value={row.original.b2c_multiplier}
            type="number"
            onSave={async (value) =>
              updateMultiplier(
                row.original.product_id,
                'b2c_multiplier',
                Number(value)
              )
            }
            className="text-right font-mono font-medium text-blue-600"
          />
        ),
      },
      {
        accessorKey: 'b2c_prix_de_vente_calculated',
        header: 'Prix de Vente (calc)',
        size: 150,
        meta: { group: 'b2c_pricing' },
        cell: ({ row }) => (
          <CalculatedPriceCell
            calculatedValue={row.original.b2c_prix_de_vente_calculated}
            purchasePrice={row.original.purchase_price}
            ratio={row.original.b2c_ratio}
            currentMultiplier={row.original.b2c_multiplier}
            onUpdateMultiplier={async (newMultiplier) => {
              updateMultiplier(
                row.original.product_id,
                'b2c_multiplier',
                newMultiplier
              );
            }
            }
            type="b2c"
          />
        ),
      },
      {
        accessorKey: 'prix_sur_site',
        header: 'Prix sur Site',
        size: 130,
        meta: { group: 'b2c_pricing' },
        cell: ({ row }) => {
          const hasOverride = row.original.has_price_override;

          return (
            <EditableCell
              value={hasOverride ? row.original.prix_sur_site : row.original.b2c_prix_de_vente_calculated}
              type="number"
              onSave={async (value) =>
                updateCell({
                  productId: row.original.product_id,
                  field: 'prix_sur_site',
                  value: value !== null && value !== '' ? Number(value) : null,
                })
              }
              placeholder="0.00"
              className={cn(
                'text-right font-mono',
                hasOverride && 'bg-yellow-100 text-yellow-900'
              )}
              title={hasOverride ? 'Manual override (differs from calculated)' : 'Matches calculated price'}
            />
          );
        },
      }
    );

    // ==================== B2B PRICING GROUP ====================
    allColumns.push(
      {
        accessorKey: 'b2b_multiplier',
        header: 'B2B Multiplier',
        size: 130,
        meta: { group: 'b2b_pricing' },
        cell: ({ row }) => (
          <EditableCell
            value={row.original.b2b_multiplier}
            type="number"
            onSave={async (value) =>
              updateMultiplier(
                row.original.product_id,
                'b2b_multiplier',
                Number(value)
              )
            }
            className="text-right font-mono font-medium text-purple-600"
          />
        ),
      },
      {
        accessorKey: 'b2b_price_calculated',
        header: 'B2B Price (calc)',
        size: 140,
        meta: { group: 'b2b_pricing' },
        cell: ({ row }) => (
          <CalculatedPriceCell
            calculatedValue={row.original.b2b_price_calculated}
            purchasePrice={row.original.purchase_price}
            ratio={row.original.b2b_ratio}
            currentMultiplier={row.original.b2b_multiplier}
            onUpdateMultiplier={async (newMultiplier) =>
              updateMultiplier(
                row.original.product_id,
                'b2b_multiplier',
                newMultiplier
              )
            }
            type="b2b"
          />
        ),
      },
      {
        accessorKey: 'b2b_base_price',
        header: 'B2B Base Price',
        size: 130,
        meta: { group: 'b2b_pricing' },
        cell: ({ row }) => {
          const price = row.original.b2b_base_price;
          return price !== null && price !== undefined ? (
            <div className="px-3 py-2 text-right font-mono">{price.toFixed(2)}</div>
          ) : (
            <div className="px-3 py-2 text-right text-muted-foreground">-</div>
          );
        },
      }
    );

    // Dynamic B2B client columns
    selectedB2BClients.forEach((clientId) => {
      const client = b2bClients.find((c) => c.id === clientId);
      const clientName = client?.display_name || 'Unknown Client';

      allColumns.push({
        id: `b2b_${clientId}`,
        header: () => (
          <div className="flex items-center justify-between gap-2">
            <span className="truncate" title={clientName}>
              {clientName}
            </span>
            {onRemoveB2BColumn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveB2BColumn(clientId);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800"
                title="Remove column"
              >
                ×
              </button>
            )}
          </div>
        ),
        size: 150,
        meta: { group: 'b2b_pricing' },
        cell: ({ row }) => {
          const pricing = row.original.b2b_pricing?.[clientId];
          if (!pricing || pricing.is_expired) {
            return <div className="px-3 py-2 text-right text-muted-foreground">-</div>;
          }
          return (
            <div className="px-3 py-2 text-right font-mono font-semibold text-blue-700">
              {pricing.custom_price.toFixed(2)}
            </div>
          );
        },
      });
    });

    // ==================== LOGISTICS GROUP ====================
    allColumns.push(
      {
        accessorKey: 'supplier_name',
        header: 'Supplier',
        size: 150,
        meta: { group: 'logistics' },
        cell: ({ row }) => (
          <div className="px-3 py-2">{row.original.supplier_name || '-'}</div>
        ),
      },
      {
        accessorKey: 'deliverer_name',
        header: 'Deliverer',
        size: 150,
        meta: { group: 'logistics' },
        cell: ({ row }) => (
          <DelivererSelectCell
            productId={row.original.product_id}
            currentDelivererId={row.original.assigned_deliverer_id}
            currentDelivererName={row.original.deliverer_name}
            deliverers={deliverers}
            onUpdate={updateDeliverer}
          />
        ),
      },
      {
        accessorKey: 'pickup_date',
        header: 'Pickup Date',
        size: 130,
        meta: { group: 'logistics' },
        cell: ({ row }) => (
          <DatePickerCell
            value={row.original.pickup_date}
            onSave={async (date) =>
              updatePickupDate(row.original.product_id, date)
            }
            minDate={new Date()}
          />
        ),
      },
      {
        accessorKey: 'stock',
        header: 'Current Stock',
        size: 120,
        meta: { group: 'logistics' },
        cell: ({ row }) => {
          const stock = row.original.stock;
          const threshold = row.original.low_stock_threshold;
          const isLowStock = stock !== null && threshold !== null && stock <= threshold;

          return (
            <div
              className={`px-3 py-2 text-right font-mono ${isLowStock ? 'text-orange-600 font-semibold' : ''
                }`}
            >
              {stock ?? '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'besoin',
        header: 'Demand',
        size: 100,
        meta: { group: 'logistics' },
        cell: ({ row }) => (
          <EditableCell
            value={row.original.besoin}
            type="number"
            onSave={async (value) =>
              updateCell({
                productId: row.original.product_id,
                field: 'besoin',
                value: Number(value),
              })
            }
            className="text-right font-mono"
          />
        ),
      },
      {
        accessorKey: 'commande',
        header: 'To Order',
        size: 110,
        meta: { group: 'logistics' },
        cell: ({ row }) => (
          <EditableCell
            value={row.original.commande}
            type="number"
            onSave={async (value) =>
              updateCell({
                productId: row.original.product_id,
                field: 'commande',
                value: Number(value),
              })
            }
            className="text-right font-mono"
          />
        ),
      },
      {
        accessorKey: 'po_status',
        header: 'PO Status',
        size: 150,
        meta: { group: 'logistics' },
        cell: ({ row }) => {
          const poStatus = row.original.po_status;
          const poNumber = row.original.po_number;

          if (!poStatus) {
            return (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No PO
              </div>
            );
          }

          const statusConfig = {
            draft: { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: FileEdit },
            ordered: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Package },
            in_transit: { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Truck },
            delivered: { color: 'bg-purple-100 text-purple-700 border-purple-300', icon: CheckCircle },
            verified: { color: 'bg-green-100 text-green-700 border-green-300', icon: ShieldCheck },
            cancelled: { color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
          } as const;

          const config = statusConfig[poStatus];
          const Icon = config.icon;

          return (
            <div className="px-3 py-2">
              <Badge
                className={cn('border text-xs font-medium', config.color)}
                title={`PO: ${poNumber || 'N/A'}`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {poStatus.toUpperCase()}
              </Badge>
            </div>
          );
        },
      }
    );

    return allColumns;
  }, [
    selectedB2BClients,
    b2bClients,
    onRemoveB2BColumn,
    updateCell,
    updateCategory,
    updateDeliverer,
    updatePickupDate,
    updateMultiplier,
    deliverers,
  ]);

  // Helper function to get the effective color for a group
  const getGroupColor = (groupId: string): string => {
    // First check user preferences
    if (colorPreferences[groupId]) {
      return colorPreferences[groupId];
    }

    // Fall back to default color
    const group = columnGroups.find((g) => g.id === groupId);
    return group?.defaultColor || '#F5F5F5';
  };

  return { columns, columnGroups, getGroupColor };
};
