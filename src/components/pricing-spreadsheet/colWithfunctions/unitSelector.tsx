import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { UNIT_OPTIONS, UNITS_BY_CATEGORY, UNIT_CATEGORY_LABELS } from '@/constants/units';

interface UnitSelector {
    value: string | null | undefined;
    onSave: (unit: string) => void;
    placeholder?: string;
    disabled?: boolean;
    isUpdating: boolean

}

export const UnitSelector = ({
    value,
    onSave,
    placeholder = 'Select unit',
    disabled = false,
    isUpdating
}: UnitSelector) => {


    // Find current unit label
    const currentUnit = UNIT_OPTIONS.find((u) => u.value === value);
    const displayValue = currentUnit?.label || value || placeholder;

    return (
        <div className="px-2 py-1">

            <Select
                value={value || ''}
                onValueChange={(value) => onSave(value)}
                disabled={disabled || isUpdating}
            >
                <SelectTrigger className="h-8 w-full border-0 focus:ring-1 focus:ring-blue-500">
                    {isUpdating ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="text-sm">Updating...</span>
                        </div>
                    ) : (
                        <SelectValue placeholder={placeholder}>{displayValue}</SelectValue>
                    )}
                </SelectTrigger>
                <SelectContent>
                    {/* Group units by category */}
                    {Object.entries(UNITS_BY_CATEGORY).map(([category, units]) => (
                        <SelectGroup key={category}>
                            <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase">
                                {UNIT_CATEGORY_LABELS[category]}
                            </SelectLabel>
                            {units.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                    {unit.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    ))}
                </SelectContent>
            </Select>

        </div>
    );
};
