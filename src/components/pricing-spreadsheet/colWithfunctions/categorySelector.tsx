import { useState } from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectItem,
} from "@/components/ui/select"; // adjust your import
import { Loader2 } from "lucide-react";
import { Category } from "../../../types/category";
// Reusable CategorySelector
interface CategorySelectorProps {
    categories: Category[];
    value?: string;
    isUpdating?: boolean;
    error?: string;
    onChange: (category: Category) => void;
}

export default function CategorySelector({
    categories,
    value,
    isUpdating = false,
    error,
    onChange,
}: CategorySelectorProps) {
    const [selectedId, setSelectedId] = useState(value ?? "");

    const handleChange = (id: string) => {
        setSelectedId(id);
        const category = categories.find((c) => c.id === id);
        if (category) onChange(category);
    };

    const categoryName = categories.find((c) => c.id === selectedId)?.name;

    return (
        <div className="px-2 py-1">
            <Select value={selectedId} onValueChange={handleChange} disabled={isUpdating}>
                <SelectTrigger className="h-8 w-full border-0 focus:ring-1 focus:ring-blue-500">
                    {isUpdating ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="text-sm">Updating...</span>
                        </div>
                    ) : (
                        <SelectValue placeholder="Select category">{categoryName || "No category"}</SelectValue>
                    )}
                </SelectTrigger>

                <SelectContent side="top">
                    {categories.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No categories available
                        </div>
                    ) : (
                        <SelectGroup>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    )}
                </SelectContent>
            </Select>

            {error && <div className="text-xs text-red-600 mt-1 px-1">{error}</div>}
        </div>
    );
}