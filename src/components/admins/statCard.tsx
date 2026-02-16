import React from "react";
import { StatCardProps } from "@/types/admin.types";

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  label,
  valueColor = "text-gray-900"
}) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
    <p className="text-gray-500 text-xs font-medium uppercase tracking-tight">{title}</p>
    <div>
      <h3 className={`text-3xl font-bold ${valueColor}`}>{value}</h3>
      <p className="text-gray-400 text-xs mt-1">{label}</p>
    </div>
  </div>
);

export default StatCard;
