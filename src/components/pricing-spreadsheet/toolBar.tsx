import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Search, Download, Upload, RefreshCw, Plus, Filter, Maximize2, Minimize2, CheckSquare, AlertTriangle, PackageCheck, PackageX } from 'lucide-react';
import { toolBarActionParams, toolBarActionType } from './types';
import { useEffect, useState } from 'react';
import { B2BClient } from '../../hooks/useB2BClientsData';
import { Category } from '../../hooks/useCategoriesData';
interface Props {
    isRefreshing: boolean
    isFullScreen: boolean
    lowStockFilter: boolean
    b2bClients: B2BClient[];
    onAction: (action: toolBarActionType, params?: toolBarActionParams) => void
    lowStockCount: number
    categories: Category[]
    setSelectedB2BClients: React.Dispatch<React.SetStateAction<B2BClient[]>>
    selectedB2BClients: B2BClient[]
    activeStockCount: number
    inActiveStockCount: number
    isActiveFilter: boolean | null
    selectedCategoryId: string | null
}
export default function PricingSpreadsheetToolBar(props: Props) {
    const { isRefreshing, isFullScreen, selectedCategoryId, b2bClients, onAction, lowStockFilter, lowStockCount, categories, selectedB2BClients, setSelectedB2BClients, inActiveStockCount, activeStockCount, isActiveFilter } = props
    const [search, setSearch] = useState("")
    const handleToggleClient = (client: B2BClient, checked: boolean) => {
        if (checked) {
            setSelectedB2BClients(prev => [...prev, client]);
        } else {
            setSelectedB2BClients(prev => prev.filter(e => e.id !== client.id));
        }
    };
    const onSearchChange = (value: string) => {
        setSearch(value);
        onAction("search", {
            search_value: value
        })
    }
    const handleToggleLowStock = () => {
        if (lowStockFilter) {
            onAction("lowStockFilterOff")
        } else {
            onAction("lowStockFilterOn")
        }
    }
    const handleToggleFullscreen = () => {
        if (isFullScreen) {
            onAction("fullScreenOff")
        } else {
            onAction("fullScreenOn")
        }
    }
    const toggleActiveFilter = (value: boolean) => {
        if (isActiveFilter === value) {
            onAction("activeFilterOff")
        } else {
            onAction("activeFilterOn", {
                active_value: value
            })
        }
    }
    const [selectedCategory, setSelectedCategory] = useState(null);
    useEffect(() => {
        const index = categories.findIndex((e) => e.id === selectedCategoryId);
        if (index != -1)
            setSelectedCategory(categories[index]);
        else
            setSelectedCategory(null)
    }, [selectedCategoryId])
    return (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Left side - Search */}
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8"
                />
            </div>

            {/* Right side - Actions */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Low Stock Filter */}

                <Button
                    variant={lowStockFilter ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleLowStock}
                    className={lowStockFilter ? "bg-destructive hover:bg-destructive/90" : ""}
                >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Low Stock {lowStockCount > 0 && `(${lowStockCount})`}
                </Button>
                <Button
                    variant={isActiveFilter ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleActiveFilter(true)}
                    className={isActiveFilter ? "bg-green-400 hover:bg-green-400" : "hover:bg-green-400"}
                >
                    <PackageCheck className="w-4 h-4 mr-2" />
                    Active Stock {activeStockCount > 0 && `(${activeStockCount})`}
                </Button>
                <Button
                    variant={isActiveFilter === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleActiveFilter(false)}
                    className={isActiveFilter === false ? "bg-green-400 hover:bg-green-400" : "hover:bg-green-400"}
                >
                    <PackageX className="w-4 h-4 mr-2" />
                    In-Active Stock {inActiveStockCount > 0 && `(${inActiveStockCount})`}
                </Button>
                {/* Quick Select by Category */}
                {categories.length > 0 && (
                    <div className="flex items-center rounded-md border bg-background overflow-hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-none px-3"
                                >
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    {selectedCategory
                                        ? selectedCategory.name_fr
                                        : "Filtrer par catégorie"}
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                className="w-56 max-h-64 overflow-y-auto"
                            >
                                <DropdownMenuLabel>Catégories</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {categories.map((category) => (
                                    <DropdownMenuItem
                                        key={category.id}
                                        onSelect={() =>
                                            onAction("selectCategory", {
                                                category_select_id: category.id,
                                            })
                                        }
                                    >
                                        {category.name_fr}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Divider */}
                        <div className="h-6 w-px bg-border" />

                        {/* Clear filter */}
                        {selectedCategory && <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAction("clearCategoryFilter")}
                            className="rounded-none px-2 text-muted-foreground hover:text-foreground"
                        >
                            ✕
                        </Button>}
                    </div>

                )}


                {/* Add B2B Client Columns */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            B2B Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Show B2B Client Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {b2bClients.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No B2B clients available
                            </div>
                        ) : (
                            b2bClients.map((client) => (
                                <DropdownMenuCheckboxItem
                                    key={client.id}
                                    checked={selectedB2BClients.findIndex((e) => e.id === client.id) != -1}
                                    onCheckedChange={(checked) =>
                                        handleToggleClient(client, checked)
                                    }
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{client.company_name}</span>
                                        {client.email && (
                                            <span className="text-xs text-muted-foreground">
                                                {client.email}
                                            </span>
                                        )}
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Import CSV */}
                <Button variant="outline" size="sm" onClick={() => onAction("importCSV")}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                </Button>

                {/* Export CSV */}
                <Button variant="outline" size="sm" onClick={() => onAction("exportCSV")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>

                {/* Refresh */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction("refresh")}
                    disabled={isRefreshing}
                >
                    <RefreshCw
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                </Button>


                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleFullscreen}
                    title={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                    {isFullScreen ? (
                        <Minimize2 className="w-4 h-4 mr-2" />
                    ) : (
                        <Maximize2 className="w-4 h-4 mr-2" />
                    )}
                    {isFullScreen ? 'Exit' : 'Fullscreen'}
                </Button>
            </div>
        </div>
    );
};
