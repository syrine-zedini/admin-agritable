import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download } from 'lucide-react';
import { PricingSpreadsheetRow } from '@/types/pricingSpreadsheetRow';
import { B2BClient } from '@/types/pricingSpreadsheet';
import { useCSVExport } from '@/hooks/useCSVExport';

interface ExportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PricingSpreadsheetRow[];
  selectedB2BClients: string[];
  b2bClients: B2BClient[];
}

export const ExportCSVDialog = ({
  open,
  onOpenChange,
  data,
  selectedB2BClients,
  b2bClients,
}: ExportCSVDialogProps) => {
  const [filename, setFilename] = useState('pricing-data.csv');
  const [includeB2BColumns, setIncludeB2BColumns] = useState(true);

  const { exportToCSV } = useCSVExport();

  const handleExport = () => {
    const clientsToInclude = includeB2BColumns ? selectedB2BClients : [];

    exportToCSV(data, clientsToInclude, b2bClients, filename);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export to CSV</DialogTitle>
          <DialogDescription>
            Export the current pricing data to a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="pricing-data.csv"
            />
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label>Export Options</Label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-b2b"
                checked={includeB2BColumns}
                onCheckedChange={(checked) => setIncludeB2BColumns(checked as boolean)}
              />
              <label
                htmlFor="include-b2b"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include B2B client columns ({selectedB2BClients.length})
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Export Summary</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {data.length} products</li>
              <li>
                • {includeB2BColumns && selectedB2BClients.length > 0
                  ? `${selectedB2BClients.length} B2B client columns`
                  : 'Base columns only'}
              </li>
              <li>• CSV format (.csv)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
