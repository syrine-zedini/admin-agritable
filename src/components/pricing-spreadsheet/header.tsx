import { SpreadsheetStatistics } from "@/types/pricingSpreadsheet";
import { usePricingStatistics } from "@/hooks/usePricingStatistics";
import { cn } from "../../lib/utils";

interface Props {
    isFullScreen: boolean;
    statistics: SpreadsheetStatistics
}
export default function PricingSpreadsheetHeader(props: Props) {
    const { isFullScreen, statistics } = props;
    return (
        <>
            {!isFullScreen && (
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
                    <p className="text-muted-foreground">
                        Manage product pricing, suppliers, and B2B custom prices in an Excel-like interface
                    </p>
                </div>
            )}

            {/* Statistics Bar - hide in fullscreen */}
            {!isFullScreen && statistics && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-card rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Total Products</p>
                        <p className="text-2xl font-bold">{statistics.total_products}</p>
                    </div>
                    <div className="bg-card rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold text-green-600">{statistics.active_products}</p>
                    </div>
                    <div className="bg-card rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">With Suppliers</p>
                        <p className="text-2xl font-bold">{statistics.products_with_suppliers}</p>
                    </div>
                    <div className="bg-card rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">With B2B Pricing</p>
                        <p className="text-2xl font-bold">{statistics.products_with_b2b_pricing}</p>
                    </div>
                    <div className="bg-card rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Avg B2C Margin</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {statistics.avg_b2c_margin.toFixed(1)}%
                        </p>
                    </div>
                    <div className="bg-card rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Avg B2B Margin</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {statistics.avg_b2b_margin.toFixed(1)}%
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}