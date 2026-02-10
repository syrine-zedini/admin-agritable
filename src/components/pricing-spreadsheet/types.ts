export interface toolBarActionParams {
    search_value?: string
    category_select_id?: string
    active_value?: boolean

}
export type toolBarActionType = "search" | "lowStockFilterOn" | "lowStockFilterOff" | "selectCategory" | "clearCategoryFilter" | "importCSV" | "exportCSV" | "refresh" | "fullScreenOn" | "fullScreenOff" | "activeFilterOn" | "activeFilterOff"