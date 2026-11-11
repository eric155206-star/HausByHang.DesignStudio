import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * 只在 /admin 底下執行：
 * 1. 更新 Supabase 登入 cookie（登入憑證會過期，這裡負責換新）
 * 2. 沒登入就導到 /admin/login
 * 是否為白名單管理者，在頁面與資料庫（RLS）再檢查一次，這裡只是第一道門。
 */
export async function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/admin/login";
  if (!supabaseConfigured) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  if (!signedIn && !isLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  // 登入了但沒有權限（?error=forbidden）時留在登入頁，讓使用者看到原因並登出，避免來回導向
  if (signedIn && isLogin && !request.nextUrl.searchParams.has("error")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
