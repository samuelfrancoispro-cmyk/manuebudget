// src/components/brand/Eyebrow.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const Eyebrow = React.forwardRef<HTMLSpanElement, EyebrowProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-block text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
);
Eyebrow.displayName = "Eyebrow";
