import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 頂欄「詢問單」旁邊的未處理筆數。
 * 用登入者自己的身分去數，資料庫的 RLS 只讓管理者數得到，所以不是管理者會拿到 0、不顯示。
 */
export async function InquiryBadge() {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new");
  if (!count) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-black px-1.5 py-0.5 text-[11px] leading-none text-white tabular-nums">
      {count}
      <span className="sr-only"> 筆未處理</span>
    </span>
  );
}
