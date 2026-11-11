import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { categoryLabel } from "@/content/projects";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "作品" };

export default async function AdminProjectsPage() {
  const { supabase } = await requireAdmin();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title, slug, category, is_old_house, completed_year, is_published, is_featured, sort_order, project_images(count)")
    .order("sort_order")
    .order("completed_year", { ascending: false, nullsFirst: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl">作品</h1>
        <ButtonLink href="/admin/projects/new" size="sm">
          新增作品
        </ButtonLink>
      </div>

      {error && <p className="text-sm text-error">讀取失敗：{error.message}</p>}

      {projects && projects.length === 0 && (
        <p className="bg-white px-6 py-12 text-center text-sm text-ink-3">還沒有作品，按右上角「新增作品」開始。</p>
      )}

      {projects && projects.length > 0 && (
        <ul className="divide-y divide-surface-hover border border-line-strong bg-white">
          {projects.map((p) => {
            const count = (p.project_images as unknown as { count: number }[])[0]?.count ?? 0;
            return (
              <li key={p.id}>
                <Link href={`/admin/projects/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface">
                  <span className="min-w-0 flex-1 text-[15px] text-black">{p.title}</span>
                  <span className="text-xs text-ink-3">
                    {[categoryLabel[p.category as "residential" | "commercial"], p.is_old_house && "老屋", p.completed_year, `${count} 張照片`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {p.is_featured && <span className="text-xs text-ink-2">首頁精選</span>}
                  <span className={p.is_published ? "text-xs text-black" : "text-xs text-ink-4"}>
                    {p.is_published ? "已發佈" : "草稿"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
