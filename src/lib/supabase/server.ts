import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./config";

/** 後台用：帶著管理者的登入 cookie，資料庫依 RLS 判斷能不能寫。 */
export async function createSupabaseServerClient() {
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
