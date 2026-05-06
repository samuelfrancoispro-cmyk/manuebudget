// src/components/brand/BrandLogo.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "full" | "mark";
  size?: number;
}

export const BrandLogo = React.forwardRef<HTMLImageElement, BrandLogoProps>(
  ({ className, variant = "full", size = 32, alt = "Fluxo", ...props }, ref) => {
    const src = variant === "mark" ? "/logo-mark.svg" : "/logo.svg";
    const style =
      variant === "mark"
        ? { width: size, height: size }
        : { height: size, width: "auto" };
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        style={style}
        className={cn("select-none", className)}
        draggable={false}
        {...props}
      />
    );
  }
);
BrandLogo.displayName = "BrandLogo";
