import React from "react";
import { Clock, CheckCircle, Shield, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase();

  let bgColor = "";
  let textColor = "";
  let borderColor = "";
  let Icon: React.ElementType | null = null;

  switch (normalizedStatus) {
    case "pending":
      bgColor = "bg-yellow-50";
      textColor = "text-yellow-700";
      borderColor = "border-yellow-200";
      Icon = Clock;
      break;
    case "validated":
      bgColor = "bg-green-50";
      textColor = "text-green-700";
      borderColor = "border-green-200";
      Icon = CheckCircle;
      break;
    case "suspended":
      bgColor = "bg-red-50";
      textColor = "text-red-700";
      borderColor = "border-red-200";
      Icon = Shield;
      break;
    case "rejected":
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
      borderColor = "border-gray-300";
      Icon = XCircle;
      break;
    default:
      bgColor = "bg-gray-50";
      textColor = "text-gray-600";
      borderColor = "border-gray-200";
      Icon = null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${bgColor} ${textColor} ${borderColor} text-[11px] font-bold`}
    >
      {Icon && <Icon size={12} className={textColor} />}
      {status.toUpperCase()}
    </span>
  );
}