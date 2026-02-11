import { useState, useMemo, useEffect, useRef } from "react";
import { ColumnPinningState, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { pricingSpreadsheetColumns } from "./columns"; // <- the columns we just defined
import { ColumFunctionType } from "./colWithFunction";
import { lightenColor } from "./helpers";
import { PricingSpreadsheetRow } from "../../types/pricingSpreadsheetRow";
import { ColumnGroup } from "../../types/columnGroup";
import { Category } from "../../types/category";

type Props = {
    isFullScreen: boolean;
    data: PricingSpreadsheetRow[];
    categories: Category[];
    suppliers: any[];
    deliverers: any[];
    updatingCells: Record<string, Record<string, boolean>>;
    handleCellUpdate: (
        row: PricingSpreadsheetRow,
        type: ColumFunctionType,
        value: any
    ) => void;

    loadMore: () => void;      // <-- new
    hasMore: boolean;
    handleOpenCreatePo: (row: PricingSpreadsheetRow) => void

};

export default function PricingSpreadsheetTable({
    data,
    categories,
    suppliers,
    deliverers,
    updatingCells,
    handleCellUpdate,
    loadMore,
    hasMore,
    isFullScreen,
    handleOpenCreatePo
}: Props) {
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Infinite scroll effect
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleScroll = () => {
            setIsLoadingMore(true);
            if (!hasMore) return;

            const scrollBottom = el.scrollTop + el.clientHeight;
            if (scrollBottom >= el.scrollHeight - 50) { // near bottom

                loadMore();
                setIsLoadingMore(false);
            }
        };

        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, [hasMore, loadMore]);

    const columns = useMemo(
        () =>
            pricingSpreadsheetColumns({
                categories,
                suppliers,
                deliverers,
                updatingCells,
                handleCellUpdate,
                handleOpenCreatePo,
            }),
        [categories, suppliers, deliverers, updatingCells]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });
    // Column groups
    const columnGroups: ColumnGroup[] = useMemo(() => [
        { id: 'product_info', label: 'Product Info', columns: ['product_name', 'sku', 'category_name',], defaultColor: '#E3F2FD' },
        { id: 'units', label: 'Units', columns: ['purchase_unit', 'b2c_ratio', 'b2c_selling_unit', 'b2b_ratio', 'b2b_selling_unit'], defaultColor: '#FFF3E0' },
        { id: 'b2c_pricing', label: 'B2C Pricing', columns: ['purchase_price', 'b2c_multiplier', 'b2c_prix_de_vente_calculated', 'discount', 'prix_sur_site',], defaultColor: '#E8F5E9' },
        { id: 'b2b_pricing', label: 'B2B Pricing', columns: ['b2b_multiplier', 'b2b_price_calculated', 'b2b_base_price'], defaultColor: '#F3E5F5' },
        { id: 'logistics', label: 'Logistics', columns: ['supplier_name', 'deliverer_name', 'pickup_date', 'stock', 'besoin', 'commande', 'po_status'], defaultColor: '#FFF9C4' },
    ], []);
    const getBgColorFromHeader = (header: any) => {
        // Find the first group that contains this column ID
        const group = columnGroups.find(g => g.columns.includes(header.column.id));
        return lightenColor(group?.defaultColor || "") || "transparent"; // fallback if not found
    };

    return (
        <div ref={scrollRef}
            className={`overflow-auto border rounded-lg ${isFullScreen ? '' : 'max-h-[400px]'}`}>
            <table className="min-w-max border-collapse">
                <thead className="sticky top-0 z-10">
                    {/* Column Groups Row */}
                    <tr>
                        {columnGroups.map((group) => {
                            // calculate total width for this group
                            const groupWidth = group.columns.reduce((sum, colId) => {
                                const col = table.getAllColumns().find(c => c.id === colId);
                                return sum + (col?.getSize() || 0);
                            }, 0);

                            return (
                                <th
                                    key={group.id}
                                    colSpan={group.columns.length}
                                    className="text-center font-bold border-b h-14"
                                    style={{
                                        backgroundColor: group.defaultColor, width: groupWidth
                                    }}
                                >
                                    {group.label}
                                </th>
                            );
                        })}
                    </tr>

                    {/* Regular Headers Row */}
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    colSpan={header.colSpan}
                                    className={`  border p-2 text-center font-semibold bg-gray-100 sticky top-0 z-20`}
                                    style={{ width: header.getSize(), backgroundColor: getBgColorFromHeader(header) }}

                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>


                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                            {row.getVisibleCells().map((cell) => (
                                <td
                                    key={cell.id}
                                    className="border p-2 text-left"
                                    style={{
                                        width: cell.column.getSize(),
                                        position: cell.column.columnDef.enablePinning ? "sticky" : "static",
                                        left: cell.column.columnDef.enablePinning ? 0 : undefined,
                                        background: cell.column.columnDef.enablePinning ? "#fff" : undefined,
                                        zIndex: cell.column.columnDef.enablePinning ? 5 : undefined,
                                    }}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}

                    {isLoadingMore && hasMore && <tr><td>loading ...</td></tr>}

                    {isLoadingMore && !hasMore && <tr><td>no more data</td></tr>}
                </tbody>
            </table>
        </div>
    );
}
