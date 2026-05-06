// src/components/brand/PriceTag.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { formatTierPrice } from "@/lib/pricing";

export interface PriceTagProps extends React.HTMLAttributes<HTMLDivElement> {
  amountEUR: number;
  cadence?: "monthly" | "yearly" | "free";
  yearlyDiscountPct?: number;
}

export const PriceTag = React.forwardRef<HTMLDivElement, PriceTagProps>(
  ({ className, amountEUR, cadence = "monthly", yearlyDiscountPct, ...props }, ref) => {
    if (cadence === "free" || amountEUR === 0) {
      return (
        <div ref={ref} className={cn("flex items-baseline gap-1", className)} {...props}>
          <span className="text-4xl font-bold tracking-[-0.025em] text-foreground">0 €</span>
          <span className="text-sm text-ink-muted">/ pour toujours</span>
        </div>
      );
    }
    return (
      <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-[-0.025em] text-foreground tabular-nums">
            {formatTierPrice(amountEUR)}
          </span>
          <span className="text-sm text-ink-muted">
            / {cadence === "monthly" ? "mois" : "an"}
          </span>
        </div>
        {yearlyDiscountPct && yearlyDiscountPct > 0 && cadence === "yearly" && (
          <span className="inline-flex w-fit items-center rounded-md bg-positive/10 px-2 py-0.5 text-xs font-medium text-positive">
            −{yearlyDiscountPct}% vs mensuel
          </span>
        )}
      </div>
    );
  }
);
PriceTag.displayName = "PriceTag";
