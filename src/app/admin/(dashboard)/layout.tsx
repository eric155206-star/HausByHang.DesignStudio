import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "../login/actions";

/** 登入後的後台頂欄與內容區。 */
export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-line-strong bg-white">
        <div className="container-page flex h-14 items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold text-black">
              沆設計後台
            </Link>
            <nav className="flex gap-4 text-ink-2">
              <Link href="/admin/projects" className="hover:text-black">
                作品
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-ink-2">
            <Link href="/" target="_blank" className="hover:text-black">
              看網站 ↗
            </Link>
            <form action={signOut}>
              <button type="submit" className="hover:text-black">
                登出
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container-page flex-1 py-8">
        <Suspense fallback={<p className="text-sm text-ink-3">載入中…</p>}>{children}</Suspense>
      </main>
    </>
  );
}
