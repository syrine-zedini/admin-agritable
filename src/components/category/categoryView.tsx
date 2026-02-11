import { LayoutGrid, Package, Plus } from "lucide-react";
import StatCard from "./statCard";
import CategoryCard from "./categoryCard";

export default function CategoryView({
  categories,
  onEdit,
  onDelete,
  onAdd,
}: any) {
  return (
    <>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Catégories</h1>

        <button
          onClick={onAdd}
          className="bg-green-600 text-white px-4 py-2 rounded flex gap-2"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<LayoutGrid />}
          label="Total"
          value={categories.length}
        />

        <StatCard
          icon={<Package />}
          label="Actives"
          value={
            categories.filter((c: any) => c.status === "active")
              .length
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {categories.map((cat: any) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  );
}
