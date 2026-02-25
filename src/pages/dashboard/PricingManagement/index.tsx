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
  const { data: initialData, isLoading: isLoadingData } =
    usePricingSpreadsheetRow();

  const [data, setData] = useState<PricingSpreadsheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setIsLoading(false);
    }
  }, [initialData]);

  type UpdatingMap = Record<string, Record<string, boolean>>;
  const [updatingCells, setUpdatingCells] = useState<UpdatingMap>({});

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
    console.log("TYPE RECEIVED:", type, "VALUE:", value);

    let colId = "";
    let apiData: Record<string, any> = {};
    console.log(type);
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
          b2cSellingUnit: {
            name: value.name,
            quantity: Number(value.quantity),
          },
        };
        break;

      case "change-b2b_selling_unit":
        colId = "b2b_selling_unit";
        apiData = {
          b2bSellingUnit: {
            name: value.name,
            quantity: Number(value.quantity),
          },
        };
        break;

      
      case "change-purchase_price":
        console.log(value);
        colId = "purchase_price";
        apiData = { purchasePrice: value };
        break;

      case "change-prix_sur_site":
        colId = "prix_sur_site";
        apiData = { b2cSeelingPrice: value };
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
        apiData = { b2bBasePriceValue: value };
        break;

      case "change-b2b_base_price_calcul":
        colId = "b2b_price_calculated";
        apiData = { b2bBasePriceCalculated: value };
        break;

      case "change-discount":
        colId = "remise";
        apiData = { remise: value };
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

    setUpdatingCells((prev) => ({
      ...prev,
      [row.id]: { ...(prev[row.id] || {}), [colId]: true },
    }));

    try {
      await updateProduct(row.id, apiData);
      const newRow = await findProductById(row.id);

      setData((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, ...newRow } : r))
      );
    } catch (err) {
      console.error("Erreur updateProduct :", err);
    } finally {
      setUpdatingCells((prev) => ({
        ...prev,
        [row.id]: { ...(prev[row.id] || {}), [colId]: false },
      }));
    }
  };

  if (isCategoryLoading || isLoadingData || isLoading)
    return <Loader />;

  return (
    <>
      {categories && data && (
        <PricingSpreadsheetTable
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
      )}
    </>
  );
}