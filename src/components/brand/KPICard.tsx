// src/components/brand/KPICard.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

const deltaToneClass: Record<NonNullable<KPICardProps["deltaTone"]>, string> = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-ink-muted",
};

export const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ className, label, value, delta, deltaTone = "neutral", icon, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border border-border bg-surface px-5 py-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Eyebrow>{label}</Eyebrow>
        {icon && <span className="text-ink-muted">{icon}</span>}
      </div>
      <div className="text-2xl font-semibold tracking-[-0.015em] text-foreground tabular-nums">
        {value}
      </div>
      {delta && (
        <div className={cn("text-xs tabular-nums", deltaToneClass[deltaTone])}>
          {delta}
        </div>
      )}
    </div>
  )
);
KPICard.displayName = "KPICard";
