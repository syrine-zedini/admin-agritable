import { useState, useEffect, } from "react";
import PricingSpreadsheetHeader from "./header";
import PricingSpreadsheetToolBar from "./toolBar";
//import { useCategoriesData } from "../../hooks/useCategoriesData";
//import { B2BClient, useB2BClientsData } from "../../hooks/useB2BClientsData";
//import { useFullscreen } from "../../contexts/FullscreenContext";
import { cn } from "../../lib/utils";
import { toolBarActionParams, toolBarActionType } from "./types";
import { ColumFunctionType } from "./colWithFunction";
//import { supabase } from "../../lib/supabase";
//import { useSuppliersData } from "../../hooks/useSuppliersData";
//import { useDeliverersData } from "../../hooks/useDeliverersData";
import { ExportCSVDialog } from "./exportCSVDataDialog";
import { ImportCSVDialog } from "./importCSVDataDialog";
import { canConvert, getSellingRatio } from "../../constants/units";
import { CreatePODialog } from "./CreatePODialog";
import { updateProduct } from "@/service/products";
import PricingSpreadsheetTable from "./pricingSpreadsheetTable";
import { PricingSpreadsheetRow } from "@/types/pricingSpreadsheetRow";
import { usePricingSpreadsheetRow } from "@/hooks/useProducts";
//import { usePurchaseOrders } from "../../hooks/usePurchaseOrders";
//import { useAuth } from "../../hooks/useAuth";
export default function PricingSpreadsheetComponentV2() {
    /*Consts  */
    const PAGE_SIZE = 50

    /*states */
    const [search, setSearch] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [lowStockFilter, setLowStockFilter] = useState(false);
    //const { suppliers } = useSuppliersData();
    const [openCSVDialog, setOpenCSVDialog] = useState(false);
    const [csvDialogType, setCsvDialogType] = useState<"export" | "import" | null>(null)
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null)
    const [data, setData] = useState<PricingSpreadsheetRow[]>([]);
    //const [selectedB2bClients, setSelectedB2BClients] = useState<B2BClient[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    type UpdatingMap = Record<
        string, // product_id
        Record<string, boolean> // col_id -> isUpdating
    >;
    const [updatingCells, setUpdatingCells] = useState<UpdatingMap>({});
    const [selectedRowForDraftPo, setSelectedRowForDraftPO] = useState<PricingSpreadsheetRow | null>(null)
    const [openCreatePO, setOpenCreatePo] = useState(false);
    const [page, setPage] = useState(1)

    /* hooks values   */
    //const { isFullscreen: isFullScreen, setIsFullscreen } = useFullscreen();
    //const { statistics } = usePricingStatistics();
    //const { clients: b2bClients } = useB2BClientsData();
    //const { categories } = useCategoriesData({ hierarchy: false });
    const { lowStockCount, data: initialData, refetch, fetchOnlyOneRow, inActiveStockCount, activeStockCount } = usePricingSpreadsheetRow({
        categoryId: selectedCategoryId ? selectedCategoryId : undefined,
        search: search ? search : undefined,
        lowStockFilter,
        isActiveFilter,

    });
    //const { deliverers } = useDeliverersData({ statusFilter: "Active" });
    //const { user } = useAuth();
    /* variables */
    const hasMore = data.length < initialData.length;

    /*useEffects */

    useEffect(() => {
        setPage(1);
        setData(initialData.slice(0, PAGE_SIZE));

        // Wait a tick to make sure the table is rendered
        setTimeout(() => {
            // Scroll to the bottom of the page
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth", // optional: smooth scroll
            });
        }, 0);
    }, [initialData]);
    /* functions  */

    const loadMore = () => {
        const nextPage = page + 1;
        const nextSlice = initialData.slice(0, nextPage * PAGE_SIZE);

        setPage(nextPage);
        setData(nextSlice);
    };
    const updateOneRow = async (row: PricingSpreadsheetRow, isUpdatingCellName?: string) => {
        // mark cell as updating (main column only)
        if (isUpdatingCellName) {
            setUpdatingCells(prev => ({
                ...prev,
                [row.id]: { ...(prev[row.id] || {}), [isUpdatingCellName]: true },
            }));
            console.log(updatingCells)
        }


        const newRow = await fetchOnlyOneRow(row.id);

        setData(prevData =>
            prevData.map(r =>
                r.id === row.id
                    ? newRow
                    : r
            )
        );
        if (isUpdatingCellName)
            setUpdatingCells(prev => ({
                ...prev,
                [row.id.toString()]: { ...(prev[row.id.toString()] || {}), [isUpdatingCellName]: false },
            }));

    }
    /*const updatePickupDate = async (row: PricingSpreadsheetRow, newValue: Date) => {
        const productId = row.id;
        const assigned_deliverer_id = row.assigned_deliverer_id
        console.log(productId, assigned_deliverer_id, newValue)
        if (!productId || !assigned_deliverer_id) {
            return;
        }
        const { data: primarySupplier, error: fetchError } = await supabase
            .from('product_suppliers')
            .select('id, supplier_id, supplier_price')
            .eq('product_id', productId)
            .eq('assigned_deliverer_id', assigned_deliverer_id)
            .eq('is_primary', true)
            .maybeSingle();
        if (!primarySupplier) {
            return;
        }
        const { error: updateError } = await supabase
            .from('product_suppliers')
            .update({
                pickup_date: newValue,
                updated_at: new Date().toISOString(),
            })
            .eq('id', primarySupplier.id);
        await updateOneRow(row, "pickup_date")
    }
    const updateDelivererForProduct = async (row: PricingSpreadsheetRow, newValue: string) => {
        const productId = row.product_id;
        const { data: primarySupplier, error: fetchError } = await supabase
            .from('product_suppliers')
            .select('id, supplier_id, supplier_price')
            .eq('product_id', productId)
            .eq('is_primary', true)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (!primarySupplier) {
            throw new Error('No primary supplier found for this product');
        }

        // Update deliverer assignment
        const { error: updateError } = await supabase
            .from('product_suppliers')
            .update({
                assigned_deliverer_id: newValue,
                updated_at: new Date().toISOString(),
            })
            .eq('id', primarySupplier.id);

        if (updateError) throw updateError;


        await updateOneRow(row, "deliver_name")
    }
    const handleOpenCreatePo = (row: PricingSpreadsheetRow) => {
        setSelectedRowForDraftPO(row);
        setOpenCreatePo(true)
    }
    const handleOnCreateDraftPo = async (notes: string) => {

        if (selectedRowForDraftPo) {
            const playload = {
                supplier_id: selectedRowForDraftPo.primary_supplier_id,
                product_id: selectedRowForDraftPo.product_id,
                pickup_date: selectedRowForDraftPo.pickup_date,
                assigned_deliverer_id: selectedRowForDraftPo.assigned_deliverer_id,
                quantity: selectedRowForDraftPo.commande,
                unit: selectedRowForDraftPo.purchase_unit,
                unit_price: selectedRowForDraftPo.purchase_price,
                draft_notes: notes
            }
            const { data: poNumber, error: poNumberError } = await supabase.rpc('generate_po_number');
            if (poNumberError) throw poNumberError;

            const totalAmount = playload.quantity * playload.unit_price;

            const { data, error } = await supabase
                .from('purchase_orders')
                .insert({
                    ...playload,
                    po_number: poNumber,
                    total_amount: totalAmount,
                    status: 'draft',
                    created_by: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            await updateOneRow(selectedRowForDraftPo);
            setOpenCreatePo(false);
            setSelectedRowForDraftPO(null)
        }
    }


    const updateSupplierForProduct = async (row: PricingSpreadsheetRow, newValue: string) => {
        const product_id = row.product_id.toString();

        await supabase
            .from('product_suppliers')
            .update({ is_primary: false })
            .eq('product_id', product_id)
            .eq('is_primary', true);
        const { data: existingSupplier } = await supabase
            .from('product_suppliers')
            .select('id')
            .eq('product_id', product_id)
            .eq('supplier_id', newValue)
            .maybeSingle();

        if (existingSupplier) {
            // Update existing
            const { error } = await supabase
                .from('product_suppliers')
                .update({
                    is_primary: true,
                    is_active: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingSupplier.id);

            if (error) throw error;
        } else {

            // Insert new
            const { error } = await supabase
                .from('product_suppliers')
                .insert({
                    product_id: product_id,
                    supplier_id: newValue,
                    is_primary: true,
                    is_active: true,
                });


        }
        await updateOneRow(row, "supplier_name")

    }*/

    const updateEditableDataAndSync = async (
    row: PricingSpreadsheetRow,
    newValue: number,
    colId: string,
    colInDatabase: string
) => {
    try {
        await updateProduct(row.id, {
            [colInDatabase]: newValue,
        });

        await updateOneRow(row, colId);

    } catch (error) {
        console.error("Error updating product:", error);
    }
};
}
    const handleCloseCSVDialog = () => {
        setCsvDialogType(null)
        setOpenCSVDialog(false);
    }
    const handleOpenCSVDialog = (type: "export" | "import") => {
        setCsvDialogType(type);
        setOpenCSVDialog(true);
    }
    // Handle toolbar actions
    const handleAction = (action: toolBarActionType, params?: toolBarActionParams) => {
        switch (action) {
            case "lowStockFilterOn": setLowStockFilter(true); break;
            case "lowStockFilterOff": setLowStockFilter(false); break;
            //case "fullScreenOn": setIsFullscreen(true); break;
            //case "fullScreenOff": setIsFullscreen(false); break;
            case "refresh": {
                setIsRefreshing(true);
                refetch();
                setIsRefreshing(false);
                break;
            }
            case "search": {
                if (params && params.search_value)
                    setSearch(params.search_value)
                break;
            }
            case "selectCategory": {
                if (params && params.category_select_id)
                    setSelectedCategoryId(params.category_select_id);

                break;

            }
            case "clearCategoryFilter": {
                setSelectedCategoryId(null);
                break;
            }
            case "importCSV": {
                handleOpenCSVDialog("import");
                break;
            }
            case "exportCSV": {
                handleOpenCSVDialog("export")
                break;
            }
            /*case "activeFilterOn": {
                setLowStockFilter(false);
                setIsActiveFilter(params.active_value)
                break;
            }*/
            case "activeFilterOff": {
                setIsActiveFilter(null)
                break;
            }

        }
    };


    /*Rendering  */





    return (
        <div className={cn('space-y-4', !isFullScreen && 'container mx-auto py-6')}>
           <PricingSpreadsheetHeader isFullScreen={isFullScreen} statistics={statistics} />
            <PricingSpreadsheetToolBar
                selectedCategoryId={selectedCategoryId}
                b2bClients={b2bClients}
                categories={categories}
                isFullScreen={isFullScreen}
                isRefreshing={isRefreshing}
                lowStockCount={lowStockCount}
                lowStockFilter={lowStockFilter}
                onAction={handleAction}
                selectedB2BClients={selectedB2bClients}
                setSelectedB2BClients={setSelectedB2BClients}
                activeStockCount={activeStockCount}
                inActiveStockCount={inActiveStockCount}
                isActiveFilter={isActiveFilter}
            /> 
            <PricingSpreadsheetTable
                isFullScreen={isFullScreen}
                categories={categories}
                data={data}
                deliverers={deliverers}
                handleCellUpdate={handleCellUpdate}
                suppliers={suppliers}
                loadMore={loadMore}
                hasMore={hasMore}
                updatingCells={updatingCells}
                handleOpenCreatePo={handleOpenCreatePo}
            />
            <ExportCSVDialog
                b2bClients={b2bClients.map((e:any) => {
                    return {
                        ...e,
                        display_name: e.company_name ? e.company_name : e.first_name + " " + e.last_name
                    }
                })}
                open={openCSVDialog && csvDialogType === "export"}
                data={data}
                selectedB2BClients={selectedB2bClients.map((e) => e.company_name ? e.company_name : e.first_name + " " + e.last_name)}
                onOpenChange={(value) => value ? handleAction("exportCSV") : handleCloseCSVDialog()}
            />
            <ImportCSVDialog
                open={openCSVDialog && csvDialogType === "import"}
                onOpenChange={(value) => value ? handleAction("importCSV") : handleCloseCSVDialog()}

                onImportComplete={refetch}
            />
            <CreatePODialog
                onCreateDraftPOs={handleOnCreateDraftPo}
                onOpenChange={(value) => {
                    if (!value) {
                        setOpenCreatePo(false);
                        setSelectedRowForDraftPO(null)
                    }
                }}
                open={openCreatePO}
                row={selectedRowForDraftPo}

            />
        </div>
    );
}
}