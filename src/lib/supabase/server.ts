import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "./config";

/** 後台用：帶著管理者的登入 cookie，資料庫依 RLS 判斷能不能寫。 */
export async function createSupabaseServerClient() {
  // 登入狀態每次請求都不同：明確標成「請求當下才執行」。
  // 否則 Next.js 會在預先載入（prefetch）階段就試著執行，Supabase 讀時間（Date.now）時會被擋下，導致登入判斷失敗。
  await connection();
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // 在 Server Component 裡不能寫 cookie；proxy.ts 會負責更新登入狀態
        }
      },
    },
  });
}
