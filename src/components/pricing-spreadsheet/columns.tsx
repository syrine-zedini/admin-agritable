import { ColumnDef } from "@tanstack/react-table";
import ColWithFunction, { ColumFunctionType } from "./colWithFunction";
import { PricingSpreadsheetRow } from "../../types/pricingSpreadsheetRow";
import { findProductById, updateProduct } from "@/service/products";
import { useState } from "react";

export type Params = {
  categories: any[];
  suppliers: any[];
  deliverers: any[];
  rows: PricingSpreadsheetRow[];
  setRows: (rows: PricingSpreadsheetRow[]) => void;
  updatingCells: Record<string, Record<string, boolean>>;
  setUpdatingCells: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, boolean>>>
  >;
  handleOpenCreatePo: (row: PricingSpreadsheetRow) => void;

  handleCellUpdate: (
    row: PricingSpreadsheetRow,
    type: ColumFunctionType,
    value: any
  ) => void;
};

type UpdatingMap = Record<string, Record<string, boolean>>;

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
  rows,
  setRows,
  updatingCells,
  setUpdatingCells,
  handleOpenCreatePo,
  handleCellUpdate,
}: Params): ColumnDef<PricingSpreadsheetRow>[] => {



  // ------------------ Colonnes(modifié) --------------------------------------------------------------------------------------------
  return [
    {
      id: "product_name",
      accessorKey: "product_name",
      header: "Product",
      size: 50,
      enablePinning: true,
      cell: ({ row }) => <div className="font-medium truncate">{row.original.nameFr}</div>,
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
          columnData={{ categories, value: row.original.categoryId }}
          onChange={(value) => handleCellUpdate(row.original, "change-category", value)}
          isUpdating={!!updatingCells[row.original.id]?.category_name}
        />
      ),
    },
    {
      id: "purchase_unit",
      accessorKey: "purchase_unit",
      header: "Purchase Unit",
      size: 150,
      cell: ({ row }) => (
        <ColWithFunction
          columnFunctionType="change-purchase_unit"
          columnData={{ value: row.original.purchaseUnit }}
          onChange={(value) => handleCellUpdate(row.original, "change-purchase_unit", value)}
          isUpdating={!!updatingCells[row.original.id]?.purchase_unit}
        />
      ),
    },
    {
      id: "b2c_ratio",
      accessorKey: "b2c_ratio",
      header: "b2c Ratio",
      size: 120,
      cell: ({ row }) => <div className="font-medium truncate">{decimalToFraction(row.original.b2cRatio)}</div>,
    },
    {
      id: "b2c_selling_unit",
      header: "B2C Selling Unit",
      size: 220,
      cell: ({ row }) => (
        <ColWithFunction
          columnFunctionType="change-b2c_selling_unit"
          columnData={{ selling_unit: row.original.b2cSellingUnit.name, selling_quantity: row.original.b2cSellingUnit.quantity }}
          onChange={(value) => handleCellUpdate(row.original, "change-b2c_selling_unit", value)}
          isUpdating={!!updatingCells[row.original.id]?.b2c_selling_unit}
        />
      ),
    },
    {
      id: "b2b_ratio",
      accessorKey: "b2b_ratio",
      header: "b2b Ratio",
      size: 120,
      cell: ({ row }) => <div className="font-medium truncate">{decimalToFraction(row.original.b2bRatio)}</div>,
    },
    {
      id: "b2b_selling_unit",
      header: "B2B Selling Unit",
      size: 220,
      cell: ({ row }) => (
        <ColWithFunction
          columnFunctionType="change-b2b_selling_unit"
          columnData={{ selling_unit: row.original.b2bSellingUnit.name, selling_quantity: row.original.b2bSellingUnit.quantity }}
          onChange={(value) => handleCellUpdate(row.original, "change-b2b_selling_unit", value)}
          isUpdating={!!updatingCells[row.original.id]?.b2b_selling_unit}
        />
      ),
    },
    {
      id: "purchase_price",
      accessorKey: "purchase_price",
      header: "Prix d'achat",
      size: 140,
      cell: ({ row }) => (
        <ColWithFunction
          columnFunctionType="change-purchase_price"
          columnData={{ value: row.original.purchasePrice }}
          onChange={(value) => handleCellUpdate(row.original, "change-purchase_price", value)}
          isUpdating={!!updatingCells[row.original.id]?.purchase_price} />
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
          columnData={{ value: row.original.b2cMultiplier }}
          onChange={(value) => handleCellUpdate(row.original, "change-b2c_multiplier", value)}
          isUpdating={!!updatingCells[row.original.id]?.b2cMultiplier}
        />
      ),
    },
    {
      id: "b2c_prix_de_vente_calculated",
      accessorKey: "b2c_prix_de_vente_calculated",
      header: "Prix de vente (cal)",
      size: 120,
      cell: ({ row }) => <div className="font-medium truncate">{row.original.b2cSellingPriceCalculated}</div>,
    },
    {
      id: "discount",
      accessorKey: "discount",
      header: "Remise (%)",
      size: 150,
      cell: ({ row }) => (
        <ColWithFunction
          columnFunctionType="change-discount"
          columnData={{ value: row.original.discount || 0 }}
          onChange={(value) => handleCellUpdate(row.original, "change-discount", value)}
          isUpdating={!!updatingCells[row.original.id]?.discount}
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
            value: row.original.b2cSellingPrice || 0,
            has_price_override: row.original.isB2cPriceOverride,
            has_discount: row.original.discount > 0,
            discount_value: row.original.discount
          }}
          onChange={(value) => handleCellUpdate(row.original, "change-prix_sur_site", value)}
          isUpdating={!!updatingCells[row.original.id]?.b2cSellingPrice}
        />
      ),
    },


    
  {
  id: "b2b_multiplier",
  header: "B2B Multiplier",
  accessorKey: "b2bMultiplier",
  cell: ({ row }) => (
    <ColWithFunction
      columnFunctionType="change-b2b_multiplier"
      columnData={{ value: row.original.b2bMultiplier }}
      onChange={(value) => handleCellUpdate(row.original, "change-b2b_multiplier", value)}
      isUpdating={!!updatingCells[row.original.id]?.b2bMultiplier}
    />
  ),
},

{
  id: "b2b_base_price",
  header: "B2B Base Price",
  accessorKey: "b2bSellingPrice",
  cell: ({ row }) => (
    <ColWithFunction
      columnFunctionType="change-b2b_base_price"
      columnData={{ value: row.original.b2bSellingPrice || '' }}
      onChange={(value) => handleCellUpdate(row.original, "change-b2b_base_price", value)}
      isUpdating={!!updatingCells[row.original.id]?.b2bSellingPrice}
    />
  ),
},

{
  id: "b2b_price_calculated",
  header: "B2B Price Calculated",
  accessorKey: "b2bSellingPriceCalculated",
  cell: ({ row }) => <div className="font-medium truncate">{row.original.b2bSellingPriceCalculated}</div>,
},

    // === LOGISTICS (stock, besoin, po, etc) ===
    /* {
       id: "stock",
       accessorKey: "stock",
       header: "Current Stock",
       size: 120,
       cell: ({ row }) => (
         <ColWithFunction
           columnFunctionType="change-stock"
           columnData={{ value: row.original.stock }}
           onChange={(value) => handleCellUpdate(row.original, "change-stock", value)}
           isUpdating={!!updatingCells[row.original.id]?.stock}
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
           columnData={{ value: row.original.besoin }}
           onChange={(value) => handleCellUpdate(row.original, "change-besoin", value)}
           isUpdating={!!updatingCells[row.original.id]?.besoin}
         />
       ),
     },
     {
       id: "commande",
       accessorKey: "commande",
       header: "Commande",
       size: 120,
       cell: ({ row }) => <div className="font-medium truncate">{row.original.commande}</div>,
     },
     {
       id: "po_status",
       accessorKey: "po_status",
       header: "PO",
       size: 120,
       cell: ({ row }) => (
         <ColWithFunction
           columnFunctionType="create-po"
           columnData={{
             besoin: row.original.besoin,
             commande: row.original.commande,
             po_status: row.original.po_status,
             poNumber: row.original.po_number
           }}
           onChange={() => handleOpenCreatePo(row.original)}
           isUpdating={!!updatingCells[row.original.id]?.po_status}
         />
       ),
     },*/
  ];
};