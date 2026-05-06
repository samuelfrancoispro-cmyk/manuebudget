// src/components/brand/DataRow.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface DataRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "default" | "positive" | "negative" | "muted";
  noBorder?: boolean;
}

const toneClass: Record<NonNullable<DataRowProps["tone"]>, string> = {
  default: "text-foreground",
  positive: "text-positive",
  negative: "text-negative",
  muted: "text-ink-muted",
};

export const DataRow = React.forwardRef<HTMLDivElement, DataRowProps>(
  ({ className, label, value, tone = "default", noBorder, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-3 py-2.5 text-sm",
        !noBorder && "border-b border-border",
        className
      )}
      {...props}
    >
      <span className="text-foreground">{label}</span>
      <span className={cn("font-medium tabular-nums", toneClass[tone])}>{value}</span>
    </div>
  )
);
DataRow.displayName = "DataRow";
