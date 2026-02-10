import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DatePickerCellProps {
  value?: string | null; // ISO date string
  onSave: (date: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
}

export const DatePickerCell = ({
  value,
  onSave,
  placeholder = "Select date",
  minDate,
  disabled = false,
}: DatePickerCellProps) => {
  const [open, setOpen] = useState(false);

  // Convert string value to Date object if present
  const currentDate: Date | undefined = value ? new Date(value) : undefined;

  // Text to display in the button
  const displayText: string = currentDate
    ? format(currentDate, "dd/MM/yyyy", { locale: fr })
    : placeholder;

  // Handle date selection from calendar
  const handleSelect = (date: Date | undefined) => {
    setOpen(false);
    const formattedDate = date ? format(date, "yyyy-MM-dd") : null;
    onSave(formattedDate);
  };

  // Clear the selected date
  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onSave(null);
    setOpen(false);
  };

  return (
    <div className="px-2 py-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-8 justify-start text-left font-normal px-2 hover:bg-gray-100 disabled:opacity-50"
            disabled={disabled}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3 h-3" />
                <span className="text-sm">{displayText}</span>
              </div>

              {/* Clear button */}
              {currentDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-0"
                  onClick={handleClear}
                  type="button"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-red-600" />
                </Button>
              )}
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleSelect}
            disabled={
              minDate ? (date: Date) => date <= minDate : undefined
            }
            initialFocus
            locale={fr}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
