import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Package } from "lucide-react";
import { PricingSpreadsheetRow } from "@/types/pricingSpreadsheet";

interface CreatePODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: PricingSpreadsheetRow;
  onCreateDraftPOs: (notes: string) => Promise<void>;
}


export const CreatePODialog = ({
  open,
  onOpenChange,
  row,
  onCreateDraftPOs,
}: CreatePODialogProps) => {
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const errors = useMemo(() => {
    if (!row) return [];

    const err: string[] = [];
    if (!row.primary_supplier_id) err.push("No supplier assigned");
    if (!row.assigned_deliverer_id) err.push("No deliverer assigned");
    if (!row.pickup_date) err.push("No pickup date set");
    if (!row.commande || row.commande <= 0) err.push("Order quantity must be > 0");
    if (!row.purchase_price) err.push("No unit price available");

    return err;
  }, [row]);  // Validate selected products


  if (!row)
    return (
      <></>)



  const handleCreate = async () => {
    if (errors.length > 0) return;

    setIsCreating(true);
    try {
      await onCreateDraftPOs(notes);
      setNotes("");
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };
   const totalAmount = 0;
  //const totalAmount = row.purchase_price * row.commande;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Draft Purchase Orders
          </DialogTitle>
          <DialogDescription>
            Review selected products and create draft POs for admin approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Product:</p>
              <p className="text-2xl font-bold">{row.product_name}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{totalAmount.toFixed(2)} TND</p>
            </div>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                <ul className="text-xs text-red-700 list-disc list-inside mt-1">
                  {errors.map((error, i) => <li key={i}>{error}</li>)}
                </ul>

              </div>
            </div>
          )}

          {/* Valid Products Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              <div
                className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{row.product_name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {row.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{row.commande} {row.purchase_unit}</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {((row.purchase_price || 0) * row.commande!).toFixed(2)} TND
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="po-notes">Draft Notes (Optional)</Label>
            <Textarea
              id="po-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this batch of purchase orders..."
              className="min-h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
          >
            {isCreating ? 'Creating...' : `Create Draft PO
            `}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
