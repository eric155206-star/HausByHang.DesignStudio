import { cacheLife, cacheTag } from "next/cache";
import { publicImageUrl, supabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * 前台讀「網站圖片」的入口。結果快取起來，後台更換時用 updateTag("site-images") 讓快取失效。
 * 讀不到（尚未設定 Supabase、資料表還沒建立）時回傳空物件，頁面改用預設圖或佔位，不讓整頁壞掉。
 */
export const SITE_IMAGES_TAG = "site-images";

export type SiteImage = { src: string; alt: string; width: number; height: number };

export async function getSiteImages(): Promise<Record<string, SiteImage>> {
  "use cache";
  cacheTag(SITE_IMAGES_TAG);
  cacheLife("days");

  if (!supabaseConfigured) return {};
  const { data, error } = await createPublicClient()
    .from("site_images")
    .select("slot, image_path, alt_text, width, height");
  if (error) {
    console.error(`讀取網站圖片失敗：${error.message}`);
    return {};
  }
  return Object.fromEntries(
    data.map((row) => [
      row.slot,
      { src: publicImageUrl(row.image_path), alt: row.alt_text, width: row.width, height: row.height },
    ]),
  );
}
