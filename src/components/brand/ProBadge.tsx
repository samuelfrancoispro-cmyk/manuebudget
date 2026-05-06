// src/components/brand/ProBadge.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tier?: "plus" | "pro";
}

export const ProBadge = React.forwardRef<HTMLSpanElement, ProBadgeProps>(
  ({ className, tier = "pro", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-paper",
        className
      )}
      {...props}
    >
      {tier === "pro" ? "Pro" : "Plus"}
    </span>
  )
);
ProBadge.displayName = "ProBadge";
