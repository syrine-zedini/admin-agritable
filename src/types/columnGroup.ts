export interface ColumnGroup {
    id: string;
    label: string;
    columns: string[];
    defaultCollapsed?: boolean;
    description?: string;
    defaultColor?: string; // Default soft color for this group
}
