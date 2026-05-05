import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { monthKey, monthLabel } from "@/lib/utils";

const MOIS_COURTS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

interface MonthPickerProps {
  value: string; // "YYYY-MM"
  onChange: (value: string) => void;
  availableMonths: Set<string>; // mois ayant des données
  minMonth?: string; // "YYYY-MM"
  maxMonth?: string; // "YYYY-MM", défaut = mois courant
}

export function MonthPicker({ value, onChange, availableMonths, minMonth, maxMonth }: MonthPickerProps) {
  const currentMonth = monthKey(new Date().toISOString());
  const effectiveMax = maxMonth ?? currentMonth;
  const maxYear = parseInt(effectiveMax.split("-")[0]);
  const maxMonthNum = parseInt(effectiveMax.split("-")[1]);
  const minYear = minMonth
    ? parseInt(minMonth.split("-")[0])
    : Math.max(maxYear - 3, 2020);

  const [year, setYear] = useState(() => parseInt(value.split("-")[0]));
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-start gap-2 font-normal">
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="truncate capitalize">{monthLabel(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        {/* Navigation année */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={year <= minYear}
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={year >= maxYear}
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grille mois */}
        <div className="grid grid-cols-3 gap-1">
          {MOIS_COURTS.map((label, idx) => {
            const monthNum = idx + 1;
            const key = `${year}-${String(monthNum).padStart(2, "0")}`;
            const isFuture = year === maxYear ? monthNum > maxMonthNum : year > maxYear;
            const isSelected = key === value;
            const hasData = availableMonths.has(key);

            return (
              <button
                key={key}
                disabled={isFuture}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-md px-1 py-1.5 text-xs transition-colors text-center",
                  isFuture && "text-muted-foreground/20 cursor-not-allowed",
                  !isFuture && isSelected && "bg-primary text-primary-foreground font-semibold",
                  !isFuture && !isSelected && hasData && "hover:bg-accent cursor-pointer",
                  !isFuture && !isSelected && !hasData && "text-muted-foreground/40 hover:bg-accent/40 cursor-pointer"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
