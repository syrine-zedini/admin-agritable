"use client";

export default function StatCard({ products }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card
        title="Total Products"
        value={products.length}
        sub="All inventory items"
        color="text-gray-900"
      />
      <Card
        title="Active Products"
        value={products.filter((p:any)=>p.status).length}
        sub="Currently active"
        color="text-green-600"
      />
      <Card
        title="Low Stock"
        value={products.filter((p:any)=>p.stockQuantity <= p.lowStockAlert).length}
        sub="Need attention"
        color="text-orange-500"
      />
      <Card
        title="Low Stock Alerts"
        value={products.filter((p:any)=>p.stockQuantity <= p.lowStockAlert).length}
        sub="Alert triggered"
        color="text-red-500"
      />
    </div>
  );
}

function Card({ title, value, sub, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
