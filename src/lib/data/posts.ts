import { cacheLife, cacheTag } from "next/cache";
import { sanitizeDoc, type PostDoc } from "@/lib/posts/content";
import { publicImageUrl, supabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * 前台讀文章的唯一入口。只讀「已發佈」的文章，結果快取起來，
 * 後台存檔時用 updateTag("posts") 讓快取失效。
 * 讀不到（尚未設定 Supabase、資料表還沒建立）時回傳空陣列，頁面顯示「尚無文章」。
 */
export const POSTS_TAG = "posts";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  /** 發佈日期，YYYY-MM-DD */
  date: string;
  cover: { src: string; width: number; height: number } | null;
  content: PostDoc;
};

export async function getPublishedPosts(): Promise<Post[]> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("days");

  if (!supabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("posts")
    .select("slug, title, excerpt, published_on, cover_image_path, cover_width, cover_height, content")
    .eq("is_published", true)
    .order("published_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error(`讀取文章失敗：${error.message}`);
    return [];
  }
  return data.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    date: row.published_on ?? "",
    cover:
      row.cover_image_path && row.cover_width && row.cover_height
        ? { src: publicImageUrl(row.cover_image_path), width: row.cover_width, height: row.cover_height }
        : null,
    content: sanitizeDoc(row.content),
  }));
}

export async function getPublishedPost(slug: string): Promise<Post | undefined> {
  const all = await getPublishedPosts();
  return all.find((p) => p.slug === slug);
}

/** 2026-11-16 → 2026.11.16 */
export function formatPostDate(date: string) {
  return date.replaceAll("-", ".");
}
