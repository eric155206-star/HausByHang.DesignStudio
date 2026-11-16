import { createClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "./config";

/**
 * 前台讀資料用：不帶登入狀態（不讀 cookie），所以結果可以被快取、所有訪客共用。
 * 只看得到 RLS 允許的「已發佈」資料。
 */
export function createPublicClient() {
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
