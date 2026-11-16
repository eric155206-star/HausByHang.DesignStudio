import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * 最高權限的 Supabase client（secret key，會略過 RLS）。
 * 只能在伺服器端、而且已經用 requireAdmin() 確認過身分之後使用；目前只用在成員邀請與移除。
 * 金鑰放在 Vercel 環境變數 SUPABASE_SECRET_KEY，沒有 NEXT_PUBLIC_ 前綴，瀏覽器拿不到。
 */
export const adminKeyConfigured = Boolean(supabaseUrl && process.env.SUPABASE_SECRET_KEY);

export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !key) throw new Error("SUPABASE_SECRET_KEY 尚未設定");
  return createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
