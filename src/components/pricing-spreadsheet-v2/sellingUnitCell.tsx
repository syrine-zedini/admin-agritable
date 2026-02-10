import { useState } from 'react';
import { Input } from '@/components/ui/input';
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
import { useUnitConversions } from '@/hooks/useUnitConversions';

interface SellingUnitCellProps {
    purchaseUnit: string | null;
    sellingQuantity: number | null;
    sellingUnit: string | null;
    onSave: (quantity: number, unit: string) => Promise<boolean>;
    type: 'b2c' | 'b2b';
    disabled?: boolean;
}

export const SellingUnitCell = ({
    purchaseUnit,
    sellingQuantity,
    sellingUnit,
    onSave,
    type,
    disabled = false,
}: SellingUnitCellProps) => {
    const { units, calculateRatio, getUnitByCode } = useUnitConversions();
    const [isEditing, setIsEditing] = useState(false);
    const [editQuantity, setEditQuantity] = useState(
        sellingQuantity?.toString() || '1'
    );
    const [editUnit, setEditUnit] = useState(
        sellingUnit || purchaseUnit || 'kg'
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter units compatible with purchase unit category
    const purchaseUnitData = purchaseUnit ? getUnitByCode(purchaseUnit) : null;
    const compatibleUnits = purchaseUnitData
        ? units.filter((u) => u.unit_category === purchaseUnitData.unit_category)
        : units;

    // Group compatible units by category for dropdown
    const unitsByCategory = compatibleUnits.reduce((acc, unit) => {
        if (!acc[unit.unit_category]) {
            acc[unit.unit_category] = [];
        }
        acc[unit.unit_category].push(unit);
        return acc;
    }, {} as Record<string, typeof units>);

    const handleSave = async () => {
        setError(null);
        const qty = parseFloat(editQuantity);

        if (isNaN(qty) || qty <= 0) {
            setError('Invalid quantity');
            return;
        }

        setIsSaving(true);
        try {
            const success = await onSave(qty, editUnit);
            if (success) {
                setIsEditing(false);
            } else {
                setError('Failed to save');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditQuantity(sellingQuantity?.toString() || '1');
        setEditUnit(sellingUnit || purchaseUnit || 'kg');
        setError(null);
    };

    // Calculate and display ratio in edit mode
    const calculatedRatio = purchaseUnit
        ? calculateRatio(purchaseUnit, parseFloat(editQuantity) || 1, editUnit)
        : 1.0;

    if (isEditing) {
        return (
            <div className="px-2 py-1 space-y-2">
                <div className="flex gap-2">
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        className="w-20 h-8 text-sm"
                        placeholder="Qty"
                        disabled={isSaving}
                        autoFocus
                    />
                    <Select
                        value={editUnit}
                        onValueChange={setEditUnit}
                        disabled={isSaving}
                    >
                        <SelectTrigger className="h-8 flex-1 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(unitsByCategory).map(([category, categoryUnits]) => (
                                <SelectGroup key={category}>
                                    <SelectLabel className="text-xs uppercase font-semibold">
                                        {category}
                                    </SelectLabel>
                                    {categoryUnits.map((unit) => (
                                        <SelectItem key={unit.unit_code} value={unit.unit_code}>
                                            {unit.unit_label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="text-xs text-muted-foreground px-1">
                    Ratio: <span className="font-mono font-medium">{calculatedRatio.toFixed(2)}</span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            'Save'
                        )}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>

                {error && <div className="text-xs text-red-600 px-1">{error}</div>}
            </div>
        );
    }

    const displayText =
        sellingQuantity && sellingUnit
            ? `${sellingQuantity} ${sellingUnit}`
            : '-';

    return (
        <div
            className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => !disabled && setIsEditing(true)}
            title="Click to edit selling unit"
        >
            <div className="text-sm">{displayText}</div>
        </div>
    );
};
