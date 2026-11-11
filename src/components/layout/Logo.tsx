import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import logo from "../../../public/brand/logo-bilingual.png";

/**
 * 雙語橫式 Logo（PNG 已裁掉四周透明留白）。
 * maxWidth: none 是必要的：Tailwind 預設 img { max-width: 100% }，
 * 在窄螢幕的 flex 容器裡會把寬度壓縮、高度不變，造成 Logo 變形。
 * TODO：拿到 SVG Logo 後替換。
 */
export function Logo({ height = 32, className }: { height?: number; className?: string }) {
  return (
    <Link href="/" aria-label="haus by hang. 沆設計 首頁" className={cn("flex shrink-0 items-center", className)}>
      <Image
        src={logo}
        alt="沆・設計 haus by hang."
        priority
        style={{ height, width: "auto", maxWidth: "none" }}
        sizes={`${Math.round((height * logo.width) / logo.height)}px`}
      />
    </Link>
  );
}
