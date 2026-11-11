/**
 * Supabase 連線設定。兩個值都是公開的（會出現在瀏覽器），真正的權限由資料庫的 RLS 把關。
 * 尚未設定時，前台改用 src/content/ 的暫存資料，網站照常運作。
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const PROJECT_IMAGES_BUCKET = "project-images";

/** Storage 路徑 → 公開網址 */
export function publicImageUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${PROJECT_IMAGES_BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
