import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Supplier } from '../../../hooks/useSuppliersData';

interface SupplierSelectCellProps {
  currentSupplierId?: string;
  currentSupplierName?: string;
  suppliers: Supplier[];
  onSave: (supplierId: string) => void;
  disabled?: boolean;
  isUpdating: boolean;
}

export const SupplierSelectCell = ({
  currentSupplierId,
  currentSupplierName,
  suppliers,
  isUpdating,
  onSave,
  disabled = false,
}: SupplierSelectCellProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (supplierId: string) => {
    if (disabled || isUpdating) return;

    setError(null);

    onSave(supplierId)
  };

  const selectValue = currentSupplierId || '__none__';

  return (
    <div className="relative">
      <Select
        value={selectValue}
        onValueChange={handleChange}
        disabled={disabled || isUpdating}
      >
        <SelectTrigger
          className={cn(
            'h-8 text-sm border-0 hover:bg-accent/50 focus:ring-0',
            isUpdating && 'opacity-50 cursor-wait',
            error && 'border border-red-500'
          )}
        >
          <SelectValue placeholder="Select supplier">
            {isUpdating ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              currentSupplierName || 'No supplier'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {suppliers.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No active suppliers
            </div>
          ) : (
            <>
              <SelectItem value="__none__">
                <span className="text-muted-foreground">No supplier</span>
              </SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {supplier.company_name?.trim()
                        ? supplier.company_name
                        : `${supplier.first_name} ${supplier.last_name}`}
                    </span>
                    {supplier.phone && (
                      <span className="text-xs text-muted-foreground">
                        {supplier.phone}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap z-10 bg-white px-2 py-1 rounded shadow">
          {error}
        </div>
      )}
    </div>
  );
};
