"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { contactHref, mainNav } from "@/lib/site";
import { Logo } from "./Logo";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // 記錄「在哪一頁打開選單」，換頁後自動關閉
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuOpen = openedAt === pathname;
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // 捲動超過 8px 才出現陰影
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 手機選單打開時，背後頁面不能捲動
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const close = () => setOpenedAt(null);
  const toggle = () => {
    setHeaderHeight(headerRef.current?.offsetHeight ?? 0);
    setOpenedAt(menuOpen ? null : pathname);
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 border-b border-taupe bg-warm-gray transition-shadow duration-[240ms] ease-brand",
        scrolled && "shadow-header",
      )}
    >
      <div className="flex items-center justify-between gap-8 px-[clamp(20px,5vw,64px)] py-[10px]">
        <Logo />

        {/* 桌機導覽 */}
        <nav aria-label="主選單" className="hidden items-center gap-[clamp(16px,2.6vw,36px)] md:flex">
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b-[1.5px] py-1.5 text-sm tracking-[0.04em] transition-colors duration-150 hover:text-black",
                  active ? "border-black font-medium text-black" : "border-transparent text-ink-2",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <ButtonLink href={contactHref} size="sm">
            預約諮詢
          </ButtonLink>
        </nav>

        {/* 手機選單按鈕 */}
        <button
          type="button"
          className="-mr-2 flex h-11 w-11 items-center justify-center md:hidden"
          aria-label={menuOpen ? "關閉選單" : "開啟選單"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={toggle}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>

      {/* 手機全螢幕選單：白底，底部固定預約諮詢按鈕 */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-white md:hidden"
          style={{ top: headerHeight }}
        >
          <nav aria-label="主選單" className="flex flex-1 flex-col overflow-y-auto px-[clamp(20px,5vw,64px)] pt-4">
            {[{ href: "/", label: "首頁" }, ...mainNav].map((item) => {
              const active = item.href === "/" ? pathname === "/" : isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "border-b border-warm-gray py-5 text-xl tracking-[0.04em]",
                    active ? "font-medium text-black" : "text-ink-2",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-warm-gray px-[clamp(20px,5vw,64px)] py-5">
            <ButtonLink href={contactHref} size="lg" fullWidth arrow>
              預約諮詢
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
