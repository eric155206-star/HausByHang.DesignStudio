import "server-only";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 確認目前登入者是白名單管理者，回傳帶有登入狀態的 Supabase client。
 * 沒登入 → 導到登入頁；登入了但不在白名單 → 導到登入頁並顯示「沒有權限」。
 * 資料庫的 RLS 也會再擋一次，這裡是讓畫面提早給出清楚的訊息。
 */
export async function requireAdmin() {
  if (!supabaseConfigured) redirect("/admin/login");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!email) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/login?error=forbidden");

  return { supabase, email };
}
