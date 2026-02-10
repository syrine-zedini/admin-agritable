import { Category } from "../../types/models";

import CategorySelector from "./colWithfunctions/categorySelector";
import { UnitSelector } from "./colWithfunctions/unitSelector";
import { useState } from "react";
import { Button } from "../ui/button";
import { EditableCell } from "./colWithfunctions/editableCell";
import { Supplier } from "../../hooks/useSuppliersData";
import { SupplierSelectCell } from "./colWithfunctions/supplierSelectCell";
import { CheckCircle, FileEdit, Loader2, Package, ShieldCheck, Truck, XCircle } from "lucide-react";
import { Deliverer } from "../../hooks/useDeliverersData";
import { DatePickerCell } from "./colWithfunctions/datePickerCell";
import { DelivererSelectCell } from "./colWithfunctions/delivererSelectCell";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

// Types for colWithFunction
export type ColumFunctionType = "change-category" | "change-purchase_unit" |
    "change-b2c_selling_unit" | "change-b2b_selling_unit" | "change-purchase_price" | "change-b2c_multiplier" | "change-prix_sur_site" | "change-b2b_multiplier" | "change-b2b_base_price"
    | "change-supplier" | "change-deliver" | "change-pickup-date" | "change-stock" | "change-besoin" | "change-discount" | 'create-po'
interface ChangeSupplierProps {
    currentSupplierId?: string;
    currentSupplierName?: string;
    suppliers: Supplier[];

}
interface ChangeNumberDateProps {
    value: number
}
interface ChangeDeliverProps {
    currentDelivererId: string | null | undefined;
    currentDelivererName: string | null | undefined;
    deliverers: Deliverer[];
}
interface ChangeCategoryProps {
    categories: Category[];
    value?: string;
}

interface PurchaseUnitProps {
    value: string;
}
interface SellingUnitProps {
    selling_unit: string;
    selling_quantity: number
}
interface ChangeValueProps {
    value: string | number
    has_price_override?: boolean
    has_discount?: boolean
    discount_value?: number

}
interface ChangePickupDateProps {
    value: string | null
}
// The parent callback passes both the type and new category
type ColumnData =
    | {
        columnFunctionType: "change-category";
        columnData: ChangeCategoryProps;
        onChange: (newCategory: Category) => void;
        isUpdating: boolean
    }
    | {
        columnFunctionType: "change-purchase_unit";
        columnData: PurchaseUnitProps;
        onChange: (newUnit: string) => void;
        isUpdating: boolean

    }
    | {
        columnFunctionType: "change-b2c_selling_unit" | "change-b2b_selling_unit";
        columnData: SellingUnitProps;
        onChange: (units: {
            selling_unit: string;
            selling_quantity: number
        }) => void;
        isUpdating: boolean

    } |
    {
        columnFunctionType: "change-purchase_price" | "change-b2c_multiplier" | "change-prix_sur_site" | "change-b2b_multiplier" | "change-b2b_base_price";
        columnData: ChangeValueProps;
        onChange: (value: string | number) => void;
        isUpdating: boolean

    }
    | {
        columnFunctionType: "change-supplier";
        columnData: ChangeSupplierProps;
        onChange: (supplierId: string) => void;
        disabled?: boolean;
        isUpdating: boolean;
    } | {
        columnFunctionType: "change-deliver";
        columnData: ChangeDeliverProps;
        onChange: (deliverId: string) => void;
        isUpdating: boolean;
    } | {
        columnFunctionType: "change-pickup-date";
        columnData: ChangePickupDateProps;
        onChange: (value: string | null) => void;
        isUpdating: boolean;
    } |
    {
        columnFunctionType: "change-stock" | "change-besoin" | "change-discount";
        columnData: ChangeNumberDateProps;
        onChange: (value: number) => void;
        isUpdating: boolean;
    }
    | {
        columnFunctionType: "create-po";
        columnData: {
            besoin: number;
            commande: number;
            poNumber: number | null;
            po_status: string | null
        };
        onChange: () => void;
        isUpdating: boolean;
    }



export default function ColWithFunction(props: ColumnData) {
    const { columnFunctionType, columnData, isUpdating, onChange } = props;
    const isUnits =
        columnFunctionType === "change-b2c_selling_unit" ||
        columnFunctionType === "change-b2b_selling_unit";
    const [units, setUnits] = useState({
        "selling_unit": isUnits ? columnData.selling_unit : undefined,
        "selling_quantity": isUnits ? columnData.selling_quantity : undefined
    })
    const [enableEdit, setEnableEdit] = useState(false)
    function handleSaveUnit() {
        if (isUnits) {
            setEnableEdit(false);
            onChange(units)
        }
    }
    if (isUpdating) {
        return (
            <Loader2 />
        )
    }
    switch (columnFunctionType) {
        case "change-category":
            return (
                <CategorySelector
                    isUpdating={isUpdating}
                    categories={columnData.categories}
                    value={columnData.value}
                    onChange={(cat) => onChange(cat)}
                />
            );
        case "change-purchase_unit":

            return (
                <UnitSelector
                    isUpdating={isUpdating}
                    value={columnData.value}
                    onSave={(value) => onChange(value)}
                />
            )
        case "change-b2c_selling_unit":
        case "change-b2b_selling_unit":
            if (enableEdit)
                return (
                    <div className="flex">
                        <input
                            type="number"
                            value={units.selling_quantity ?? ''}
                            placeholder="Qty"
                            onChange={(e) => {
                                const val = e.target.value;

                                setUnits((prev) => ({
                                    ...prev,
                                    selling_quantity: val === '' ? null : Number(val),
                                }));
                            }}
                            step={0.1}
                        />
                        <UnitSelector
                            isUpdating={isUpdating}
                            value={units.selling_unit}
                            onSave={(value) =>
                                setUnits((prev) => ({
                                    ...prev,
                                    selling_unit: value, // use the literal key "selling_unit"
                                }))
                            } />

                        <Button onClick={handleSaveUnit}>
                            Save
                        </Button>


                    </div>
                )
            else return (
                <div className=" cursor-pointer text-sm text-center" onClick={() => setEnableEdit(true)}>
                    {units.selling_unit != null && units.selling_quantity != null ? columnData.selling_quantity + " " + columnData.selling_unit : "-"}
                </div>
            )
        case "change-purchase_price":
        case "change-b2c_multiplier":
        case "change-b2b_multiplier":
        case "change-b2b_base_price":
        case "change-stock":
        case "change-discount":
        case "change-besoin":
            return <EditableCell
                isUpdating={isUpdating}
                onChange={onChange}
                value={columnData.value}


            />
        case "change-prix_sur_site":
            return <EditableCell
                isUpdating={isUpdating}
                onChange={onChange}
                value={columnData.value}
                has_price_override={columnData.has_price_override}
                has_discount={columnData.has_discount}
                discountValue={columnData.discount_value}

            />
        case "change-supplier":
            return <SupplierSelectCell
                isUpdating={isUpdating}
                onSave={onChange}
                suppliers={columnData.suppliers}
                currentSupplierId={columnData.currentSupplierId}
                currentSupplierName={columnData.currentSupplierName}

            />
        case "change-deliver":
            return <DelivererSelectCell
                currentDelivererId={columnData.currentDelivererId}
                currentDelivererName={columnData.currentDelivererName}
                deliverers={columnData.deliverers}
                onSave={onChange}
            />
        case "change-pickup-date":
            return <DatePickerCell
                onSave={onChange}
                value={columnData.value}
                minDate={new Date()}

            />

        case "create-po":

            const poStatus = columnData.po_status;
            const besoin = columnData.besoin
            if (besoin === 0)
                return (<>-</>)
            if (!poStatus)
                return (
                    <Button onClick={() => onChange()}>
                        Create A Purchase Order
                    </Button>
                )
            const statusConfig = {
                draft: { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: FileEdit },
                ordered: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Package },
                in_transit: { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Truck },
                delivered: { color: 'bg-purple-100 text-purple-700 border-purple-300', icon: CheckCircle },
                verified: { color: 'bg-green-100 text-green-700 border-green-300', icon: ShieldCheck },
                cancelled: { color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
            } as const;

            const config = statusConfig[poStatus];
            const Icon = config.icon;

            return (
                <div className="px-3 py-2">
                    <Badge
                        className={cn('border text-xs font-medium', config.color)}
                        title={`PO: ${columnData.poNumber || 'N/A'}`}
                    >
                        <Icon className="h-3 w-3 mr-1" />
                        {poStatus.toUpperCase()}
                    </Badge>
                </div>
            )



    }

}
