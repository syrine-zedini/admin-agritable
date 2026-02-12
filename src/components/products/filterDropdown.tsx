"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function FilterDropdown({
  label,
  options,
  onSelect,
}: {
  label: string;
  options?: string[];
  onSelect: (option: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center justify-between gap-8 border rounded-md px-3 py-2 text-sm text-gray-600 bg-white cursor-pointer min-w-[140px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {label} <ChevronDown size={14} />
      </div>

      {isOpen && options && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px] max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option}
              className="p-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
