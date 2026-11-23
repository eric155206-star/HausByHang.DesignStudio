import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * 最高權限的 Supabase client（secret key，會略過 RLS）。
 * 只能在伺服器端使用：後台動作要先用 requireAdmin() 確認身分；前台只有詢問表單（存檔、問卷、參考圖上傳許可）會用到。
 * 金鑰放在 Vercel 環境變數 SUPABASE_SECRET_KEY，沒有 NEXT_PUBLIC_ 前綴，瀏覽器拿不到。
 */
export const adminKeyConfigured = Boolean(supabaseUrl && process.env.SUPABASE_SECRET_KEY);

export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !key) throw new Error("SUPABASE_SECRET_KEY 尚未設定");
  return createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
