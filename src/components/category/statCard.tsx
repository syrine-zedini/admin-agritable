export default function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-3xl border border-gray-200 shadow-lg flex items-center gap-5 hover:shadow-2xl transition-all transform hover:-translate-y-1">
      <div className="p-3 bg-gradient-to-tr from-green-100 to-green-50 rounded-xl border border-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-extrabold leading-none text-gray-900">{value}</div>
        <div className="text-[12px] text-gray-500 font-medium mt-1 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
