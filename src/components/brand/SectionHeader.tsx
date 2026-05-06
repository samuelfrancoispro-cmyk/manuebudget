// src/components/brand/SectionHeader.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, eyebrow, title, description, align = "left", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className
      )}
      {...props}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-base text-ink-muted max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
);
SectionHeader.displayName = "SectionHeader";
