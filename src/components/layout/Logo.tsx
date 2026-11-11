import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import logo from "../../../public/brand/logo-bilingual.png";

/**
 * 雙語橫式 Logo。圖檔四周有留白，用負 margin 校正；
 * mix-blend-multiply 讓白底在 Warm Gray 底色上消失。
 * TODO：拿到 SVG 去背 Logo 後替換。
 */
export function Logo({ height = 56, className }: { height?: number; className?: string }) {
  return (
    <Link href="/" aria-label="haus by hang. 沆設計 首頁" className={cn("flex shrink-0 items-center", className)}>
      <Image
        src={logo}
        alt="沆・設計 haus by hang."
        priority
        style={{ height, width: "auto", margin: `${-height * 0.11}px ${-height * 0.25}px` }}
        className="mix-blend-multiply"
        sizes={`${Math.round((height * logo.width) / logo.height)}px`}
      />
    </Link>
  );
}
