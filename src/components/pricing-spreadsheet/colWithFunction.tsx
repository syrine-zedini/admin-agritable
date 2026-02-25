import CategorySelector from "./colWithfunctions/categorySelector";
import { UnitSelector } from "./colWithfunctions/unitSelector";
import { useState } from "react";
import { EditableCell } from "./colWithfunctions/editableCell";
import { Category } from "../../types/category";

export type ColumFunctionType = 
    | "change-category"
    | "change-purchase_unit"
    | "change-b2c_selling_unit"
    | "change-b2b_selling_unit"
    | "change-purchase_price"
    | "change-b2c_multiplier"
    | "change-prix_vente_cal"
    | "change-discount"
    | "change-prix_sur_site"
    | "change-b2b_multiplier"
    | "change-b2b_base_price"
    | "change-b2b_base_price_calcul"
    | "change-b2c_ratio"
    | "change-b2b_ratio"
    | "change-pickup-date"
    | "change-stock"
    | "change-besoin"
    | "change-discount"
    | "create-po";

interface SellingUnitProps {
    selling_unit: string;
    selling_quantity: number;
}

interface ChangeValueProps {
    value: string | number;
    has_price_override?: boolean;
    has_discount?: boolean;
    discount_value?: number;
}

interface ChangeCategoryProps {
    categories: Category[];
    value?: string;
}

interface ChangePickupDateProps {
    value: string | null;
}

type ColumnData =
    | { columnFunctionType: "change-category"; columnData: ChangeCategoryProps; onChange: (payload: { categoryId: string }) => void; isUpdating: boolean }
        | { columnFunctionType: "change-purchase_price"; columnData: ChangeValueProps; onChange: (value:Number) => void; isUpdating: boolean }

    | { columnFunctionType: "change-purchase_unit"; columnData: { value: string }; onChange: (payload: { purchaseUnit: string }) => void; isUpdating: boolean }
    | { columnFunctionType: "change-b2c_selling_unit" | "change-b2b_selling_unit"; columnData: SellingUnitProps; onChange: (payload: { b2cSellingUnit?: SellingUnitProps; b2bSellingUnit?: SellingUnitProps }) => void; isUpdating: boolean }
    | { columnFunctionType:  "change-b2c_multiplier" | "change-prix_vente_cal" | "change-remise_pourcentage" | "change-prix_sur_site" | "change-b2b_multiplier" | "change-b2b_base_price" | "change-b2b_base_price_calcul" | "change-b2c_ratio" | "change-b2b_ratio" | "change-stock" | "change-besoin" | "change-discount"; columnData: ChangeValueProps; onChange: (payload: Record<string, number>) => void; isUpdating: boolean }
    | { columnFunctionType: "change-pickup-date"; columnData: ChangePickupDateProps; onChange: (payload: { pickupDate: string | null }) => void; isUpdating: boolean }
    | { columnFunctionType: "create-po"; columnData: { besoin: number; commande: number; poNumber: number | null; po_status: string | null }; onChange: () => void; isUpdating: boolean };

export default function ColWithFunction(props: ColumnData) {
    const { columnFunctionType, columnData, isUpdating, onChange } = props;
    const isUnits = columnFunctionType === "change-b2c_selling_unit" || columnFunctionType === "change-b2b_selling_unit";

    const [units, setUnits] = useState({
        selling_unit: isUnits ? columnData.selling_unit ?? "" : "",
        selling_quantity: isUnits ? columnData.selling_quantity ?? 0 : 0
    });

    if (isUpdating) return <div>Loading...</div>;

    switch (columnFunctionType) {
        case "change-category":
            return (
                <CategorySelector
                    isUpdating={isUpdating}
                    categories={columnData.categories}
                    value={columnData.value}
                    onChange={(cat) => onChange({ categoryId: cat.id })}
                />
            );

        case "change-purchase_unit":
            return (
                <UnitSelector
                    isUpdating={isUpdating}
                    value={columnData.value}
                    onSave={(value) => onChange({ purchaseUnit: value })}    
                />
            );

        case "change-b2c_selling_unit":
            return (
                <div className="flex items-center space-x-2">
                    <input
                        type="number"
                        min={0}
                        value={units.selling_quantity}
                        className="border rounded px-2 py-1 w-20"
                        onChange={(e) => {
                            const newUnits = { ...units, selling_quantity: Number(e.target.value) };
                            setUnits(newUnits);
                            onChange({ b2cSellingUnit: newUnits });
                        }}
                    />
                    <UnitSelector
                        isUpdating={isUpdating}
                        value={units.selling_unit}
                        onSave={(value) => {
                            const newUnits = { ...units, selling_unit: value };
                            setUnits(newUnits);
                            onChange({ b2cSellingUnit: newUnits });
                        }}
                    />
                </div>
            );

        case "change-b2b_selling_unit":
            return (
                <div className="flex items-center space-x-2">
                    <input
                        type="number"
                        min={0}
                        value={units.selling_quantity}
                        className="border rounded px-2 py-1 w-20"
                        onChange={(e) => {
                            const newUnits = { ...units, selling_quantity: Number(e.target.value) };
                            setUnits(newUnits);
                            onChange({ b2bSellingUnit: newUnits });
                        }}
                    />
                    <UnitSelector
                        isUpdating={isUpdating}
                        value={units.selling_unit}
                        onSave={(value) => {
                            const newUnits = { ...units, selling_unit: value };
                            setUnits(newUnits);
                            onChange({ b2bSellingUnit: newUnits });
                        }}
                    />
                </div>
            );

        // Champs numériques standard
        case "change-purchase_price":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange( Number(value) )} />;
        case "change-b2c_multiplier":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ b2cMultiplier: Number(value) })} />;
        case "change-prix_vente_cal":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ b2cSeelingPrice: Number(value) })} />;
        case "change-remise_pourcentage":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ remise: Number(value) })} />;
        case "change-prix_sur_site":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ sellingPrice: Number(value) })} />;
        case "change-b2b_multiplier":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ value: Number(value) })} />;
        case "change-b2b_base_price":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ b2bBasePriceValue: Number(value) })} />;
        case "change-b2b_base_price_calcul":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ b2bBasePriceCalculated: Number(value) })} />;
        case "change-b2c_ratio":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ b2cRatio: Number(value) })} />;
        case "change-b2b_ratio":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ b2bRatio: Number(value) })} />;
        case "change-stock":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ stockQuantity: Number(value) })} />;
        case "change-besoin":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ besoin: Number(value) })} />;
        case "change-discount":
            return <EditableCell value={columnData.value} isUpdating={isUpdating} onChange={(value) => onChange({ discount: Number(value) })} />;

        default:
            return null;
    }
}