import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  color?: string;
}

export default function StatCard({ title, value, sub, color = "text-slate-900" }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wider">{title}</p>
      <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
      <p className="text-gray-400 text-xs mt-1">{sub}</p>
    </div>
  );
}
