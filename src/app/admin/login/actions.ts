"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; email?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "請輸入 Email 與密碼", email };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email 或密碼不正確", email };

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export type ResetState = { error?: boolean; message?: string };

/**
 * 忘記密碼：請 Supabase 寄重設密碼信，連結回到 /admin/set-password。
 * 不論 Email 存不存在都回同一句話，避免被拿來試探哪些 Email 有帳號。
 */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: true, message: "請輸入 Email" };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  // 用不帶登入狀態的 client 寄信，連結會直接帶一次性憑證回來，換裝置開信也能用
  const { error } = await createPublicClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${proto}://${host}/admin/set-password`,
  });
  if (error && /rate limit/i.test(error.message)) return { error: true, message: "寄信次數已達上限，請稍後再試。" };
  if (error) console.error("[requestPasswordReset]", error.message);
  return { message: "如果這個 Email 有後台帳號，重設密碼信已經寄出，請到信箱收信。" };
}
