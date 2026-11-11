import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowRight } from "./ArrowRight";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] border-[1.5px] font-medium leading-none tracking-[-0.01em] select-none transition-[background-color,color,border-color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "border-black bg-black text-white hover:border-ink hover:bg-ink",
  secondary: "border-black bg-transparent text-black hover:bg-surface-hover",
  ghost: "border-transparent bg-transparent text-black hover:bg-surface-hover",
};

const sizes: Record<Size, string> = {
  sm: "px-[14px] py-[7px] text-[13px]",
  md: "px-5 py-[10px] text-sm",
  lg: "px-7 py-[14px] text-[15px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** 右側加上箭頭，例如「預約諮詢 →」 */
  arrow?: boolean;
  children: ReactNode;
  className?: string;
};

function classesFor({ variant = "primary", size = "md", fullWidth, className }: CommonProps) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

function Content({ arrow, children }: Pick<CommonProps, "arrow" | "children">) {
  return (
    <>
      {children}
      {arrow && <ArrowRight />}
    </>
  );
}

/** 連結樣式的按鈕，用在換頁。 */
export function ButtonLink({
  href,
  ...props
}: CommonProps & { href: ComponentProps<typeof Link>["href"] }) {
  return (
    <Link href={href} className={classesFor(props)}>
      <Content arrow={props.arrow}>{props.children}</Content>
    </Link>
  );
}

/** 一般按鈕，用在表單送出等動作。 */
export function Button({
  variant,
  size,
  fullWidth,
  arrow,
  children,
  className,
  type = "button",
  ...rest
}: CommonProps & Omit<ComponentProps<"button">, keyof CommonProps>) {
  return (
    <button
      type={type}
      className={classesFor({ variant, size, fullWidth, className, children })}
      {...rest}
    >
      <Content arrow={arrow}>{children}</Content>
    </button>
  );
}
