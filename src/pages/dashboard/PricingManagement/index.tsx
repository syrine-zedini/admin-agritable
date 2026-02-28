"use client";

import { Loader } from "lucide-react";
import PricingSpreadsheetTable from "../../../components/pricing-spreadsheet/pricingSpreadsheetTable";
import { useCategories } from "../../../hooks/useCategoriesTab";
import { usePricingSpreadsheetRow } from "../../../hooks/useProducts";
import { PricingSpreadsheetRow } from "../../../types/pricingSpreadsheetRow";
import { ColumFunctionType } from "../../../components/pricing-spreadsheet/colWithFunction";
import { useEffect, useState } from "react";
import { findProductById, updateProduct } from "../../../service/products";
import { getSellingRatio } from "../../../constants/units";
import { usePricingStatistics } from "@/hooks/usePricingStatistics";
import PricingSpreadsheetHeader from "@/components/pricing-spreadsheet/header";
import { B2BClient } from "@/types/pricingSpreadsheet";
import { Category } from "@/types/category";
import PricingSpreadsheetToolBar from "@/components/pricing-spreadsheet/toolBar";
import ClientsTable from "@/components/clientB2B/clientTable";
import useClients from "@/hooks/useClientsB2B";
import { Client } from "@/types/clientB2B.types";
import { ImportCSVDialog } from "@/components/pricing-spreadsheet/importCSVDataDialog";




export default function PricingManagement() {
  const { data: categories, isLoading: isCategoryLoading } = useCategories();
  const { data: initialData, isLoading: isLoadingData } = usePricingSpreadsheetRow();
  const [data, setData] = useState<PricingSpreadsheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { statistics, loading: isStatsLoading } = usePricingStatistics();
  const [selectedB2BClients, setSelectedB2BClients] = useState<B2BClient[]>([]);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingCells, setUpdatingCells] = useState<Record<string, Record<string, boolean>>>({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [b2bClients, setB2BClients] = useState<B2BClient[]>([]);
  const [filteredData, setFilteredData] = useState<PricingSpreadsheetRow[]>([]);
  const { clients, loading: clientsLoading, error } = useClients();
  const [isImportCSVOpen, setIsImportCSVOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setFilteredData(initialData); 
      setIsLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
  if (!clients || clients.length === 0) return;

  const mappedB2BClients: B2BClient[] = clients
    .filter(
      (c) =>
        c.b2b_data?.businessName ||
        c.businessName
    )
    .map((c: Client) => ({
      id: c.id,
      company_name:
        c.b2b_data?.businessName ||
        c.businessName ||
        "",
      display_name:
        c.b2b_data?.businessName ||
        c.businessName ||
        `${c.firstName} ${c.lastName}`,
      email: c.email,
    }));

  console.log("Mapped B2B:", mappedB2BClients);

  setB2BClients(mappedB2BClients);
}, [clients]);

  const handleOpenCreatePo = (row: PricingSpreadsheetRow) => {};
  const loadMore = () => {};

  const updateRow = async (row: PricingSpreadsheetRow) => {
    const newRow = await findProductById(row.id);
    setData((prev) =>
      prev.map((r) => (r.id === newRow.id ? { ...r, ...newRow } : r))
    );
  };

  const handleCellUpdate = async (
    row: PricingSpreadsheetRow,
    type: ColumFunctionType,
    value: any
  ) => {
    let colId = "";
    let apiData: Record<string, any> = {};

    switch (type) {
      case "change-category":
        colId = "category_name";
        apiData = { categoryId: value.categoryId };
        break;
      case "change-purchase_unit":
        colId = "purchase_unit";
        apiData = { purchaseUnit: value.purchaseUnit };
        break;
      case "change-b2c_selling_unit":
        colId = "b2c_selling_unit";
        apiData = {
          b2cSellingUnit: { name: value.selling_unit, quantity: Number(value.selling_quantity) },
          b2cRatio: row.purchaseUnit
            ? getSellingRatio(row.purchaseUnit, value.selling_unit, Number(value.selling_quantity)): 1,
        };
        break;
      case "change-b2b_selling_unit":
        colId = "b2b_selling_unit";
        apiData = {
          b2bSellingUnit: { name: value.selling_unit, quantity: Number(value.selling_quantity) },
          b2bRatio: row.purchaseUnit
            ? getSellingRatio(row.purchaseUnit, value.selling_unit, Number(value.selling_quantity)): 1,
        };
        break;
      case "change-purchase_price":
        colId = "purchase_price";
        apiData = { purchasePrice: value };
        break;
      case "change-prix_sur_site":
        colId = "prix_sur_site";
        apiData = { b2cSellingPrice: value };
        break;
      case "change-b2c_multiplier":
        colId = "b2c_multiplier";
        apiData = { b2cMultiplier: value };
        break;
      case "change-b2b_multiplier":
        colId = "b2b_multiplier";
        apiData = { b2bMultiplier: value };
        break;
      case "change-b2b_base_price":
        colId = "b2b_base_price";
        apiData = { b2bSellingPrice: value };
        break;
      case "change-b2b_base_price_calcul":
        colId = "b2b_price_calculated";
        apiData = { b2bSellingPriceCalculated: value };
        break;
      case "change-discount":
        colId = "discount";
        apiData = { discount: value };
        break;
      case "change-b2c_ratio":
        colId = "b2c_ratio";
        apiData = { b2cRatio: value };
        break;
      case "change-b2b_ratio":
        colId = "b2b_ratio";
        apiData = { b2bRatio: value };
        break;
      default:
        console.warn("Type non géré:", type);
        return;
    }

    setUpdatingCells((prev) => ({ ...prev, [row.id]: { ...(prev[row.id] || {}), [colId]: true } }));

    try {
      await updateProduct(row.id, apiData);
      const newRow = await findProductById(row.id);
      setData((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...newRow } : r)));
    } catch (err) {
      console.error("Erreur updateProduct :", err);
    } finally {
      setUpdatingCells((prev) => ({ ...prev, [row.id]: { ...(prev[row.id] || {}), [colId]: false } }));
    }
  };

  if (isCategoryLoading || isLoadingData || isLoading || isStatsLoading) return <Loader />;

  return (
    <>
      {categories && data && statistics && (
        <div className="space-y-6 p-6">
          
          {/* HEADER */}
          <PricingSpreadsheetHeader isFullScreen={isFullScreen} statistics={statistics} />

          {/* TOOLBAR  */}
          <PricingSpreadsheetToolBar
         isFullScreen={isFullScreen}
         lowStockFilter={lowStockFilter}
         isRefreshing={isRefreshing}   
         onAction={(action, params) => {

    switch (action) {
      case "lowStockFilterOn":
        setLowStockFilter(true);
        break;
      case "lowStockFilterOff":
        setLowStockFilter(false);
        break;
      case "activeFilterOn":
        setIsActiveFilter(params?.active_value ?? true);
        break;
      case "activeFilterOff":
        setIsActiveFilter(null);
        break;
      case "selectCategory":
      const categoryId = params?.category_select_id ?? null;
      setSelectedCategoryId(categoryId);

    if (categoryId && initialData) {
    setFilteredData(initialData.filter(p => p.categoryId === categoryId));
    } else {
    setFilteredData(initialData ?? []);
    }
    break;

  case "clearCategoryFilter":
   setSelectedCategoryId(null);
  setFilteredData(initialData ?? []);
  break;
      case "search":
       const query = params?.search_value?.toLowerCase() || "";
      setData(initialData?.filter(p => p.nameFr.toLowerCase().includes(query)) ?? []);
      break;
      case "importCSV":
      setIsImportCSVOpen(true);
      break;
      case "exportCSV":
      case "refresh":
        console.log("Action:", action);
        break;
      case "fullScreenOn":
        setIsFullScreen(true);
        break;
      case "fullScreenOff":
        setIsFullScreen(false);
        break;
      default:
        break;
    }
  }}
  lowStockCount={data.filter((p) => p.stockQuantity && p.stockQuantity < 5).length}
  categories={categories}
  selectedB2BClients={selectedB2BClients}
  setSelectedB2BClients={setSelectedB2BClients}
  b2bClients={b2bClients} 
  activeStockCount={data.filter((p) => p.isActive).length}
  inActiveStockCount={data.filter((p) => !p.isActive).length}
  isActiveFilter={isActiveFilter}
  selectedCategoryId={selectedCategoryId}
/>

          {/* TABLEAU */}
          <PricingSpreadsheetTable
            data={filteredData}  
            isFullScreen={isFullScreen}
            categories={categories}
            deliverers={[]}
            handleCellUpdate={handleCellUpdate}
            suppliers={[]}
            loadMore={loadMore}
            hasMore={false}
            updatingCells={updatingCells}
            handleOpenCreatePo={handleOpenCreatePo}
          />
          {/* MODAL CSV */}
        <ImportCSVDialog
          open={isImportCSVOpen}
          onOpenChange={setIsImportCSVOpen}
          onImportComplete={() => {
            // rafraîchir tes produits si nécessaire
            console.log("CSV importé !");
          }}
        />
        </div>
      )}
    </>
  );
}