import { Loader } from "lucide-react";
import PricingSpreadsheetTable from "../../../components/pricing-spreadsheet/pricingSpreadsheetTable";
import { useCategories } from "../../../hooks/useCategoriesTab";
import { usePricingSpreadsheetRow } from "../../../hooks/useProducts";
import { PricingSpreadsheetRow } from "../../../types/pricingSpreadsheetRow";
import { ColumFunctionType } from "../../../components/pricing-spreadsheet/colWithFunction";
import { useEffect, useState } from "react";
import { findProductById, updateProduct } from "../../../service/products";

export default function PricingManagement() {
  const isFullScreen = false;
  const { data: categories, isLoading: isCategoryLoading } = useCategories();
  const { data: initialData, isLoading: isLoadingData, refetch } = usePricingSpreadsheetRow();
  const [data, setData] = useState<PricingSpreadsheetRow[]>([])
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (initialData) {
      setData(initialData)
      setIsLoading(false)
    }
  }, [initialData])
  type UpdatingMap = Record<
    string, // product_id
    Record<string, boolean> // col_id -> isUpdating
  >;
  const [updatingCells, setUpdatingCells] = useState<UpdatingMap>({});

  const handleOpenCreatePo = (row: PricingSpreadsheetRow) => {

  }
  const loadMore = () => { }
  const updateRow = async (row: PricingSpreadsheetRow) => {
    const newRow = await findProductById(row.id);
    setData((prev) =>
      prev.map((row) =>
        row.id === newRow.id
          ? { ...row, ...newRow } // merge updates
          : row
      )
    );
  }
  const handleCellUpdate = async (row: PricingSpreadsheetRow, type: ColumFunctionType, newValue: any) => {
    let colId = "";
    let api_data: Record<string, any> = {};

    switch (type) {
      case "change-category": {
        colId = "category_name";
        api_data = { categoryId: newValue.id };

        break;
      }
    }
    setUpdatingCells(prev => ({
      ...prev,
      [row.id]: { ...(prev[row.id] || {}), [colId]: true },
    }));
    await updateProduct(row.id, api_data);
    await updateRow(row);
    setUpdatingCells(prev => ({
      ...prev,
      [row.id]: { ...(prev[row.id] || {}), [colId]: false },
    }));



  }
  if (isCategoryLoading || isLoadingData || isLoading)
    return (
      <Loader />
    )
  return (
    <>

      {categories && data && <PricingSpreadsheetTable
        isFullScreen={isFullScreen}
        categories={categories}
        data={data}
        deliverers={[]}
        handleCellUpdate={handleCellUpdate}
        suppliers={[]}
        loadMore={loadMore}
        hasMore={false}
        updatingCells={updatingCells}
        handleOpenCreatePo={handleOpenCreatePo}
      />
      }
    </>
  )
}