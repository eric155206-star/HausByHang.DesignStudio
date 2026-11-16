import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/admin/auth";
import { formatPostDate } from "@/lib/data/posts";

export const metadata: Metadata = { title: "文章" };

export default async function AdminPostsPage() {
  const { supabase } = await requireAdmin();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, is_published, published_on, updated_at")
    .order("is_published")
    .order("published_on", { ascending: false, nullsFirst: true })
    .order("updated_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl">文章</h1>
        <ButtonLink href="/admin/posts/new" size="sm">
          新增文章
        </ButtonLink>
      </div>

      {error && <p className="text-sm text-error">讀取失敗：{error.message}（如果是剛更新，請確認文章的 SQL 已執行）</p>}

      {posts && posts.length === 0 && (
        <p className="bg-white px-6 py-12 text-center text-sm text-ink-3">還沒有文章，按右上角「新增文章」開始。</p>
      )}

      {posts && posts.length > 0 && (
        <ul className="divide-y divide-surface-hover border border-line-strong bg-white">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/posts/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface">
                <span className="min-w-0 flex-1 text-[15px] text-black">{p.title}</span>
                <span className="text-xs text-ink-3">/blog/{p.slug}</span>
                {p.published_on && <span className="text-xs text-ink-3 tabular-nums">{formatPostDate(p.published_on)}</span>}
                <span className={p.is_published ? "text-xs text-black" : "text-xs text-ink-4"}>
                  {p.is_published ? "已發佈" : "草稿"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
