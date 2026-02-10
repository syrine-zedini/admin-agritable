import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Deliverer } from '../../../hooks/useDeliverersData';

interface DelivererSelectCellProps {
  currentDelivererId: string | null | undefined;
  currentDelivererName: string | null | undefined;
  deliverers: Deliverer[];
  onSave: (delivererId: string) => void;
}

export const DelivererSelectCell = ({
  currentDelivererId,
  currentDelivererName,
  deliverers,
  onSave,
}: DelivererSelectCellProps) => {


  // Filter for active deliverers only

  const displayValue = currentDelivererName || 'No deliverer';

  return (
    <div className="px-2 py-1">
      <Select
        value={currentDelivererId || ''}
        onValueChange={(value:string) => onSave(value)}
      >
        <SelectTrigger className="h-8 w-full border-0 focus:ring-1 focus:ring-blue-500">
          <SelectValue placeholder="Select deliverer">{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {deliverers.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No active deliverers available
            </div>
          ) : (
            deliverers.map((deliverer) => (
              <SelectItem key={deliverer.id} value={deliverer.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{deliverer.first_name + " " + deliverer.last_name}</span>
                  {deliverer.vehicle_type && (
                    <span className="text-xs text-muted-foreground">
                      {deliverer.vehicle_type}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
