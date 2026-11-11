import type { Metadata } from "next";
import Link from "next/link";
import { SiteImageCard } from "@/components/admin/SiteImageCard";
import { requireAdmin } from "@/lib/admin/auth";
import { cn } from "@/lib/cn";
import { siteImageSlots, siteImageTabs, type SiteImageTab } from "@/lib/site-images";
import { publicImageUrl } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "網站圖片" };

export default async function SiteImagesPage({ searchParams }: PageProps<"/admin/site-images">) {
  const { tab: rawTab } = await searchParams;
  const tab: SiteImageTab = siteImageTabs.some((t) => t.key === rawTab) ? (rawTab as SiteImageTab) : "home";

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("site_images").select("slot, image_path, alt_text");
  const bySlot = new Map((data ?? []).map((r) => [r.slot, { url: publicImageUrl(r.image_path), alt: r.alt_text }]));
  const slots = siteImageSlots.filter((s) => s.tab === tab);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl">網站圖片</h1>
        <p className="text-sm text-ink-3">更換網站固定位置的照片。上傳、更換、移除都會立即更新網站。</p>
      </div>

      <nav className="flex gap-1 border-b border-line-strong" aria-label="頁面">
        {siteImageTabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/site-images?tab=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm",
              t.key === tab ? "border-black text-black" : "border-transparent text-ink-3 hover:text-black",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {error && <p className="text-sm text-error">讀取失敗：{error.message}（如果是剛更新，請確認網站圖片的 SQL 已執行）</p>}

      <div className={cn("grid gap-5", tab === "home" ? "" : "md:grid-cols-2 lg:grid-cols-3")}>
        {slots.map((s) => {
          const image = bySlot.get(s.slot) ?? null;
          return <SiteImageCard key={s.slot + (image?.url ?? "") + (image?.alt ?? "")} slot={s} image={image} />;
        })}
      </div>
    </div>
  );
}
