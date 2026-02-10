import PricingSpreadsheetTable from "../../../components/pricing-spreadsheet/PricingSpreadsheetTable";
import { useCategories } from "../../../hooks/useCategories";

export default function PricingManagement() {
  const isFullScreen = false;
  const { categories } = useCategories();

  return (
    <>  <PricingSpreadsheetTable
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
    /></>
  )
}