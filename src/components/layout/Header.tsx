"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { contactHref, mainNav } from "@/lib/site";
import { Logo } from "./Logo";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

const pill =
  "inline-flex h-10 items-center justify-center rounded-full border border-black px-5 text-[15px] font-medium leading-none tracking-[0.02em] transition-colors duration-150";

/**
 * 沒有橫條的導覽：右上角固定兩顆膠囊按鈕（首頁、Menu），Menu 打開後是選單面板。
 */
export function Header() {
  const pathname = usePathname();
  // 記錄「在哪一頁打開選單」，換頁後自動關閉
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuOpen = openedAt === pathname;
  // 手機選單打開時，背後頁面不能捲動
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedAt(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const close = () => setOpenedAt(null);
  const gutter = "px-[clamp(16px,2.5vw,36px)]";

  return (
    <header>
      {/* 頁面最上方：LOGO 在左上角，跟著頁面捲走 */}
      <div className={cn("flex h-[84px] items-center md:h-[96px]", gutter)}>
        <Logo height={44} />
      </div>

      {/* 右上角固定按鈕 */}
      <div className={cn("pointer-events-none fixed right-0 top-0 z-[60] flex h-[84px] items-center gap-2 md:h-[96px]", gutter)}>
        <Link href="/" onClick={close} className={cn(pill, "pointer-events-auto bg-surface text-black hover:bg-surface-hover")}>
          首頁
        </Link>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setOpenedAt(menuOpen ? null : pathname)}
          className={cn(pill, "pointer-events-auto bg-black text-white hover:bg-ink")}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {/* 選單面板：手機全螢幕，電腦版靠右一欄 */}
      {menuOpen && (
        <>
          <button type="button" aria-label="關閉選單" onClick={close} className="fixed inset-0 z-40 hidden cursor-default bg-black/20 md:block" />
          <div
            id="site-menu"
            className="fixed inset-0 z-50 flex flex-col bg-surface md:inset-y-0 md:left-auto md:right-0 md:w-[400px] md:border-l md:border-black"
          >
            <div className={cn("flex h-[84px] shrink-0 items-center md:h-[96px]", gutter)}>
              <Logo height={40} />
            </div>
            <nav aria-label="主選單" className={cn("flex flex-1 flex-col overflow-y-auto pt-2", gutter)}>
              {[{ href: "/", label: "首頁" }, ...mainNav].map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className="flex items-center justify-between border-b border-black py-4 text-[22px] font-semibold tracking-[0.02em] text-black"
                  >
                    {item.label}
                    {active && <span aria-hidden className="size-2 rounded-full bg-black" />}
                  </Link>
                );
              })}
            </nav>
            <div className={cn("py-6", gutter)}>
              <Link href={contactHref} onClick={close} className={cn(pill, "h-12 w-full bg-black text-[15px] text-white hover:bg-ink")}>
                預約諮詢 →
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
