import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** 篩選與單選用的膠囊標籤，選取時為實心黑底。 */
export function Tag({
  active = false,
  className,
  type = "button",
  ...rest
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-[5px] text-[12.5px] leading-normal transition-colors duration-150",
        active
          ? "border-black bg-black text-white"
          : "border-line-strong bg-transparent text-ink hover:border-ink-3",
        className,
      )}
      {...rest}
    />
  );
}
