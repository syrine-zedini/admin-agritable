import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableCellProps {
    value: string | number | null | undefined;
    onChange: (value: string | number) => void;
    type?: 'text' | 'number';
    placeholder?: string;
    className?: string;
    isUpdating: boolean

    has_price_override?: boolean
    has_discount?: boolean
    discountValue?: number
}

export const EditableCell = ({
    value,
    onChange,
    type = 'text',
    placeholder = '',
    className,
    isUpdating,
    has_price_override,
    has_discount,
    discountValue
}: EditableCellProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Initialize edit value when entering edit mode
    useEffect(() => {
        if (isEditing) {
            setEditValue(value?.toString() || '');
            setError(null);
            // Focus input after render
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [isEditing, value]);


    // Save value
    const handleSave = async () => {
        if (isUpdating) return;

        // Don't save if value hasn't changed
        if (editValue === (value?.toString() || '')) {
            setIsEditing(false);
            return;
        }

        // Validate number type
        if (type === 'number' && editValue) {
            const numValue = parseFloat(editValue);
            if (isNaN(numValue) || numValue < 0) {
                setError('Invalid number');
                return;
            }
        }


        const valueToSave = type === 'number' ? parseFloat(editValue) || 0 : editValue;
        setIsEditing(false);

        onChange(valueToSave);

    };

    // Auto-save on blur with debounce
    const handleBlur = () => {
        // Clear any pending timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce save by 300ms
        saveTimeoutRef.current = setTimeout(() => {
            handleSave();
        }, 300);
    };

    // Cancel edit
    const handleCancel = () => {
        setIsEditing(false);
        setEditValue('');
        setError(null);
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        } else if (e.key === 'Tab') {
            // Let Tab work naturally but save first
            handleSave();
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);
    const priceWithDiscount = () => {
    const discount = discountValue ?? 0; // si undefined, on met 0
    if (discount > 0) {
        return (Number(value) - (Number(value) * discount / 100)).toFixed(2);
    }
    return Number(value).toFixed(2);
}

    // Display value
    const displayValue = typeof value === 'number' ? value.toFixed(2) : value?.toString() || placeholder || '-';

    if (isEditing) {
        return (
            <div className="relative">
                <Input
                    ref={inputRef}
                    type={type}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={isUpdating}
                    className={cn(
                        'h-8 px-2 py-1 text-sm',
                        error && 'border-red-500',
                        isUpdating && 'opacity-50 cursor-wait',
                        className
                    )}
                    step={type === 'number' ? '0.01' : undefined}
                />
                {error && (
                    <div className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap z-10">
                        {error}
                    </div>
                )}
                {isUpdating && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
        );
    } else if (has_discount) {
        return (<div
            onClick={() => setIsEditing(true)}
            className={cn(
                'cursor-pointer hover:bg-accent/50 rounded px-2 py-1 min-h-[32px] flex items-center transition-colors space-x-4',
                has_price_override && 'bg-accent/50',
                !value && 'text-muted-foreground',

                className
            )}
            title={'Click to edit'}
        >
            <span className='line-through'>{displayValue}</span>
            <span>{priceWithDiscount()}</span>
        </div>)
    }



    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                'cursor-pointer hover:bg-accent/50 rounded px-2 py-1 min-h-[32px] flex items-center transition-colors',
                !value && 'text-muted-foreground',
                has_price_override && 'bg-accent/50',

                className
            )}
            title={'Click to edit'}
        >
            {displayValue}
        </div>
    );
};
