import { CategoryExtended } from "@/types/category";
import { Edit2, Trash2 } from "lucide-react";

export default function CategoryCard({
  category,
  onEdit,
  onDelete,
  onAdd,

}: {
  category: CategoryExtended;
  onEdit: (c: CategoryExtended) => void;
  onDelete: (c: CategoryExtended) => void;
    onAdd?: () => void; // ← optionnel

}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 transition-all hover:shadow-md hover:border-gray-300 duration-200">
      {/* Header with name and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900 text-base">
            {category.name}
          </h2>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
              category.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {category.status || "inactive"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
            onClick={() => onEdit(category)}
          >
            <Edit2 size={16} />
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
            onClick={() => onDelete(category)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Total Products */}
      <div className="flex items-baseline justify-between border-b border-gray-100 pb-3">
        <span className="text-sm text-gray-500">Total Products</span>
        <span className="text-lg font-semibold text-gray-900">
          {category.totalProducts || 0}
        </span>
      </div>

      {/* Subcategories section */}
<div className="flex flex-col gap-2">
  <div className="flex items-center justify-between">
    <span className="text-sm font-bold text-gray-700">Subcategories</span>
    <button
      className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline"
      onClick={onAdd}
    >
      + Add
    </button>
  </div>

  <div className="flex flex-col gap-2.5">
    {category.children && category.children.length > 0 ? (
      category.children.map((sub) => (
        <div
          key={sub.id}
          className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-800">{sub.name}</span>
            <span className="text-sm font-medium text-gray-900">
              {sub.totalProducts || 0} items
            </span>
          </div>

          {/* Sub-subcategories */}
          {sub.children && sub.children.length > 0 && (
            <div className="flex flex-col gap-1 pl-4 border-t border-gray-100 pt-2">
              {sub.children.map((sub2) => (
                <div
                  key={sub2.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-600">{sub2.name}</span>
                  <span className="text-gray-500">
                    {sub2.totalProducts || 0} items
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))
    ) : (
      <div className="text-sm text-gray-400 italic py-1">
        Aucune sous-catégorie
      </div>
    )}
  </div>
</div>

    </div>
  );
}