import { ColumnDef } from "@tanstack/react-table";
import ColWithFunction, { ColumFunctionType } from "./colWithFunction";
import { PricingSpreadsheetRow } from "@/hooks/usePricingSpreadsheetV2";

type Params = {
  categories: any[];
  suppliers: any[];
  deliverers: any[];
  updatingCells: Record<string, Record<string, boolean>>;
  handleCellUpdate: (
    row: PricingSpreadsheetRow,
    type: ColumFunctionType,
    value: any
  ) => void;
  handleOpenCreatePo: (row: PricingSpreadsheetRow) => void;
};

function decimalToFraction(value: number, precision = 1e-6): string {
  if (value === 0) return "0";
  let denominator = 1;
  while (Math.abs(Math.round(value * denominator) / denominator - value) > precision) {
    denominator++;
    if (denominator > 1000000) break;
  }
  const numerator = Math.round(value * denominator);
  if (numerator === denominator) return "1";
  return `${numerator}/${denominator}`;
}

export const pricingSpreadsheetColumns = ({
  categories,
  suppliers,
  deliverers,
  updatingCells,
  handleCellUpdate,
  handleOpenCreatePo,
}: Params): ColumnDef<PricingSpreadsheetRow>[] => [
  /* ================= PRODUCT INFO ================= */

  {
    id: "product_name",
    accessorKey: "product_name",
    header: "Product",
    size: 120,
    cell: ({ row }) => (
      <div className="font-medium truncate">{row.original.product_name}</div>
    ),
  },

  {
    id: "sku",
    accessorKey: "sku",
    header: "SKU",
    size: 140,
    cell: ({ getValue }) => getValue() ?? "-",
  },

  {
    id: "category_name",
    accessorKey: "category_name",
    header: "Category",
    size: 200,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-category"
        columnData={{
          categories,
          value: row.original.category_id ?? "",
        }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-category", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.category_name}
      />
    ),
  },

  /* ================= UNITS ================= */

  {
    id: "purchase_unit",
    accessorKey: "purchase_unit",
    header: "Purchase Unit",
    size: 150,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-purchase_unit"
        columnData={{ value: row.original.purchase_unit ?? "" }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-purchase_unit", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.purchase_unit}
      />
    ),
  },

  {
    id: "b2c_ratio",
    accessorKey: "b2c_ratio",
    header: "b2c Ratio",
    size: 120,
    cell: ({ row }) => (
      <div className="font-medium truncate">
        {decimalToFraction(row.original.b2c_ratio)}
      </div>
    ),
  },

  {
    id: "b2c_selling_unit",
    header: "B2C Selling Unit",
    size: 220,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-b2c_selling_unit"
        columnData={{
          selling_unit: row.original.b2c_selling_unit ?? "",
          selling_quantity: row.original.b2c_selling_quantity ?? 0,
        }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-b2c_selling_unit", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.b2c_selling_unit}
      />
    ),
  },

  {
    id: "b2b_ratio",
    accessorKey: "b2b_ratio",
    header: "b2b Ratio",
    size: 120,
    cell: ({ row }) => (
      <div className="font-medium truncate">
        {decimalToFraction(row.original.b2b_ratio)}
      </div>
    ),
  },

  {
    id: "b2b_selling_unit",
    header: "B2B Selling Unit",
    size: 220,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-b2b_selling_unit"
        columnData={{
          selling_unit: row.original.b2b_selling_unit ?? "",
          selling_quantity: row.original.b2b_selling_quantity ?? 0,
        }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-b2b_selling_unit", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.b2b_selling_unit}
      />
    ),
  },

  /* ================= B2C PRICING ================= */

  {
    id: "purchase_price",
    accessorKey: "purchase_price",
    header: "Prix d'achat",
    size: 140,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-purchase_price"
        columnData={{ value: row.original.purchase_price ?? 0 }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-purchase_price", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.purchase_price}
      />
    ),
  },

  {
    id: "b2c_multiplier",
    accessorKey: "b2c_multiplier",
    header: "B2C Multiplier",
    size: 140,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-b2c_multiplier"
        columnData={{ value: row.original.b2c_multiplier ?? 0 }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-b2c_multiplier", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.b2c_multiplier}
      />
    ),
  },

  {
    id: "b2c_prix_de_vente_calculated",
    accessorKey: "b2c_prix_de_vente_calculated",
    header: "Prix de vente (cal)",
    size: 120,
    cell: ({ row }) => (
      <div className="font-medium truncate">
        {row.original.b2c_prix_de_vente_calculated}
      </div>
    ),
  },

  {
    id: "discount",
    accessorKey: "discount",
    header: "Remise en (%)",
    size: 150,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-discount"
        columnData={{ value: row.original.discount ?? 0 }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-discount", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.discount}
      />
    ),
  },

  {
    id: "prix_sur_site",
    accessorKey: "prix_sur_site",
    header: "Prix sur Site",
    size: 150,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-prix_sur_site"
        columnData={{
          value: row.original.prix_sur_site ?? 0,
          has_price_override: row.original.has_price_override,
          has_discount: (row.original.discount ?? 0) > 0,
          discount_value: row.original.discount ?? 0,
        }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-prix_sur_site", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.prix_sur_site}
      />
    ),
  },

  /* ================= B2B PRICING ================= */

  {
    id: "b2b_multiplier",
    accessorKey: "b2b_multiplier",
    header: "B2B Multiplier",
    size: 140,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-b2b_multiplier"
        columnData={{ value: row.original.b2b_multiplier ?? 0 }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-b2b_multiplier", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.b2b_multiplier}
      />
    ),
  },

  {
    id: "b2b_base_price",
    accessorKey: "b2b_base_price",
    header: "B2B Base Price",
    size: 160,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-b2b_base_price"
        columnData={{ value: row.original.b2b_base_price ?? 0 }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-b2b_base_price", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.b2b_base_price}
      />
    ),
  },

  {
    id: "b2b_price_calculated",
    accessorKey: "b2b_price_calculated",
    header: "B2B Base Price (calcul)",
    size: 160,
    cell: ({ row }) => (
      <div className="font-medium truncate">
        {row.original.b2b_price_calculated}
      </div>
    ),
  },

  /* ================= LOGISTICS ================= */

  {
    id: "supplier_name",
    accessorKey: "supplier_name",
    header: "Supplier",
    size: 220,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-supplier"
        columnData={{
          currentSupplierId: row.original.primary_supplier_id ?? "",
          currentSupplierName: row.original.supplier_name ?? "",
        }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-supplier", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.supplier_name}
      />
    ),
  },

  {
    id: "deliverer_name",
    accessorKey: "deliverer_name",
    header: "Deliverer",
    size: 220,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-deliver"
        columnData={{
          currentDelivererId: row.original.assigned_deliverer_id ?? "",
          currentDelivererName: row.original.deliverer_name ?? "",
        }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-deliver", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.deliver_name}
      />
    ),
  },

  {
    id: "pickup_date",
    accessorKey: "pickup_date",
    header: "Pickup Date",
    size: 180,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-pickup-date"
        columnData={{ value: row.original.pickup_date ?? "" }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-pickup-date", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.pickup_date}
      />
    ),
  },

  {
    id: "stock",
    accessorKey: "stock",
    header: "Current Stock",
    size: 120,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-stock"
        columnData={{ value: row.original.stock ?? 0 }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-stock", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.stock}
      />
    ),
  },

  {
    id: "besoin",
    accessorKey: "besoin",
    header: "Demande",
    size: 120,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="change-besoin"
        columnData={{ value: row.original.besoin ?? 0 }}
        onChange={(value) =>
          handleCellUpdate(row.original, "change-besoin", value)
        }
        isUpdating={!!updatingCells[row.original.product_id]?.besoin}
      />
    ),
  },

  {
    id: "commande",
    accessorKey: "commande",
    header: "Commande",
    size: 120,
    cell: ({ row }) => (
      <div className="font-medium truncate">{row.original.commande}</div>
    ),
  },

  {
    id: "po_status",
    accessorKey: "po_status",
    header: "Po",
    size: 120,
    cell: ({ row }) => (
      <ColWithFunction
        columnFunctionType="create-po"
        columnData={{
        commande: row.original.commande ?? 0,
        po_status: row.original.po_status ?? "",
        poNumber: row.original.po_number !== null && row.original.po_number !== undefined? Number(row.original.po_number): null,
}}

        onChange={() => handleOpenCreatePo(row.original)}
        isUpdating={!!updatingCells[row.original.product_id]?.po_status}
      />
    ),
  },
];                                      