import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "outline" | "soft";

const variants: Record<Variant, string> = {
  outline: "border-line-strong bg-transparent text-black",
  soft: "border-transparent bg-surface-hover text-ink",
};

/** 小型標示，例如作品年份「2026」、服務項目的標籤。 */
export function Badge({
  variant = "outline",
  className,
  ...rest
}: ComponentProps<"span"> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] border px-[9px] py-[3px] text-[11.5px] font-medium leading-[1.4] tracking-[0.02em]",
        variants[variant],
        className,
      )}
      {...rest}
    />
  );
}
