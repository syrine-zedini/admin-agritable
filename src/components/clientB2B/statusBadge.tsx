import React from "react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isPending = status === "Pending";
  return (
    <span className={`flex items-center gap-1 w-fit px-3 py-1 rounded-full text-[11px] font-bold border ${
      isPending 
        ? "bg-amber-50 text-amber-600 border-amber-200" 
        : "bg-emerald-50 text-emerald-600 border-emerald-200"
    }`}>
      {isPending ? '🕒' : '✔'} {status.toUpperCase()}
    </span>
  );
}
