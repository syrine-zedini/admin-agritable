import { useState, useEffect } from "react";
import PricingSpreadsheetHeader from "./header";
import PricingSpreadsheetToolBar from "./toolBar";
import { usePricingStatistics } from "../../hooks/usePricingStatics";
import { useCategoriesData } from "../../hooks/useCategoriesData";
import { B2BClient, useB2BClientsData } from "../../hooks/useB2BClientsData";
import { PricingSpreadsheetRow, usePricingSpreadsheet } from "../../hooks/usePricingSpreadsheetV2";
import { useFullscreen } from "../../contexts/FullscreenContext";
import { cn } from "../../lib/utils";
import { toolBarActionParams, toolBarActionType } from "./types";
import { ColumFunctionType } from "./colWithFunction";
// import { useSuppliersData } from "../../hooks/useSuppliersData";        // ← COMMENTÉ : Fonctionnalité fournisseurs désactivée
// import { useDeliverersData } from "../../hooks/useDeliverersData";    // ← COMMENTÉ : Fonctionnalité livraison désactivée
import PricingSpreadsheetTable from "./table";
import { ExportCSVDialog } from "./exportCSVDataDialog";
import { ImportCSVDialog } from "./importCSVDataDialog";
import { canConvert, getSellingRatio } from "../../constants/units";
import { CreatePODialog } from "./CreatePODialog";
import { useAuth } from "../../hooks/useAuth";

export default function PricingSpreadsheetComponentV2() {
  const PAGE_SIZE = 50;

  const [search, setSearch] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // ← NON FONCTIONNEL : Fournisseurs et livraisons désactivés (listes vides typées explicitement pour TS)
  const suppliers: any[] = [];
  const deliverers: any[] = [];

  const [openCSVDialog, setOpenCSVDialog] = useState(false);
  const [csvDialogType, setCsvDialogType] = useState<"export" | "import" | null>(null);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null);
  const [data, setData] = useState<PricingSpreadsheetRow[]>([]);
  const [selectedB2BClients, setSelectedB2BClients] = useState<B2BClient[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRowForDraftPo, setSelectedRowForDraftPO] = useState<PricingSpreadsheetRow | undefined>(undefined);
  const [openCreatePO, setOpenCreatePo] = useState(false);
  const [page, setPage] = useState(1);

  const [updatingCells, setUpdatingCells] = useState<Record<string, Record<string, boolean>>>({});

  const { isFullscreen: isFullScreen, setIsFullscreen } = useFullscreen();
  const { statistics } = usePricingStatistics();
  const { clients: b2bClients } = useB2BClientsData();
  const { categories } = useCategoriesData({ hierarchy: false });
  const {
    lowStockCount,
    data: initialData,
    refetch,
    fetchOnlyOneRow,
    inActiveStockCount,
    activeStockCount,
  } = usePricingSpreadsheet({
    categoryId: selectedCategoryId ?? undefined,
    search: search || undefined,
    lowStockFilter,
    isActiveFilter,
  });

  const hasMore = data.length < initialData.length;

  useEffect(() => {
    setPage(1);
    setData(initialData.slice(0, PAGE_SIZE));
  }, [initialData]);

  const loadMore = () => {
    const nextPage = page + 1;
    const nextSlice = initialData.slice(0, nextPage * PAGE_SIZE);
    setPage(nextPage);
    setData(nextSlice);
  };

  const updateOneRow = async (row: PricingSpreadsheetRow, isUpdatingCellName?: string) => {
    const newRow = await fetchOnlyOneRow(row.product_id);
    setData((prev) => prev.map((r) => (r.product_id === row.product_id ? newRow : r)));
  };

  /* =============================
     TODO: Replace with your API
     ============================= */

  // ← NON FONCTIONNEL : Logistique / Livraison / Pickup date
  const updatePickupDate = async (row: PricingSpreadsheetRow, newValue: any) => {
    // Désactivé - aucune mise à jour effectuée
  };

  // ← NON FONCTIONNEL : Livraison
  const updateDelivererForProduct = async (row: PricingSpreadsheetRow, newValue: any) => {
    // Désactivé - aucune mise à jour effectuée
  };

  // ← NON FONCTIONNEL : Fournisseur
  const updateSupplierForProduct = async (row: PricingSpreadsheetRow, newValue: any) => {
    // Désactivé - aucune mise à jour effectuée
  };

  const updateEditableDataAndSync = async (row: PricingSpreadsheetRow, newValue: any, colId: string) => {
    await updateOneRow(row, colId);
  };

  // ← NON FONCTIONNEL : Création de bon de commande (lié au fournisseur/logistique)
  const handleOnCreateDraftPo = async (notes?: string) => {
    // Désactivé - aucune mise à jour après création
    setOpenCreatePo(false);
    setSelectedRowForDraftPO(undefined);
  };

  const handleCellUpdate = async (row: PricingSpreadsheetRow, type: string, newValue: any) => {
    switch (type) {
      case "change-supplier":
        // ← NON FONCTIONNEL : Changement de fournisseur désactivé
        return;
      case "change-deliver":
        // ← NON FONCTIONNEL : Changement de livreur désactivé
        return;
      case "change-pickup-date":
        // ← NON FONCTIONNEL : Changement de date de pickup désactivé
        return;
      default:
        await updateEditableDataAndSync(row, newValue, type);
    }
  };

  const handleCloseCSVDialog = () => {
    setCsvDialogType(null);
    setOpenCSVDialog(false);
  };

  const handleOpenCSVDialog = (type: "export" | "import") => {
    setCsvDialogType(type);
    setOpenCSVDialog(true);
  };

  const handleAction = (action: toolBarActionType, params?: toolBarActionParams) => {
    switch (action) {
      case "lowStockFilterOn":
        setLowStockFilter(true);
        break;
      case "lowStockFilterOff":
        setLowStockFilter(false);
        break;
      case "fullScreenOn":
        setIsFullscreen(true);
        break;
      case "fullScreenOff":
        setIsFullscreen(false);
        break;
      case "refresh":
        refetch();
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 500);
        break;
      case "search":
        if (params?.search_value !== undefined) setSearch(params.search_value);
        break;
      case "selectCategory":
        if (params?.category_select_id !== undefined) setSelectedCategoryId(params.category_select_id?.toString() || null);
        break;
      case "clearCategoryFilter":
        setSelectedCategoryId(null);
        break;
      case "importCSV":
        handleOpenCSVDialog("import");
        break;
      case "exportCSV":
        handleOpenCSVDialog("export");
        break;
      case "activeFilterOn":
        if (params?.active_value !== undefined) setIsActiveFilter(params.active_value);
        break;
      case "activeFilterOff":
        setIsActiveFilter(null);
        break;
    }
  };

  return (
    <div className={cn("space-y-4", !isFullScreen && "container mx-auto py-6")}>
      <PricingSpreadsheetToolBar
        selectedCategoryId={selectedCategoryId}
        b2bClients={b2bClients}
        categories={categories}
        isFullScreen={isFullScreen}
        isRefreshing={isRefreshing}
        lowStockCount={lowStockCount}
        lowStockFilter={lowStockFilter}
        onAction={handleAction}
        selectedB2BClients={selectedB2BClients}
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
        handleOpenCreatePo={(row: PricingSpreadsheetRow) => {
          setSelectedRowForDraftPO(row);
          setOpenCreatePo(true);
        }}
      />

      


      <ImportCSVDialog
        open={openCSVDialog && csvDialogType === "import"}
        onOpenChange={(v) => (v ? handleOpenCSVDialog("import") : handleCloseCSVDialog())}
        onImportComplete={refetch}
      />

      {selectedRowForDraftPo && (
  
  <CreatePODialog
    onCreateDraftPOs={handleOnCreateDraftPo}
    onOpenChange={(v) => {
      if (!v) setOpenCreatePo(false);
      setSelectedRowForDraftPO(undefined);
    }}
    open={openCreatePO}
    row={selectedRowForDraftPo} // TS sait que ce n'est pas undefined
  />
)}


    </div>
  );
}