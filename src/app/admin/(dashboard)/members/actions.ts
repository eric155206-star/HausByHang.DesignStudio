"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { adminKeyConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "../projects/actions";

/**
 * 後台成員：邀請、重寄邀請信、移除。
 * 每個動作都先 requireAdmin() 確認操作者是管理者，之後才用 secret key 的 client 寫入。
 * 流程參照樂夢系統：Supabase 寄邀請信 → 對方點連結 → 在 /admin/set-password 設定密碼。
 */

export type InviteState = { status: "idle" | "sent" | "error"; message?: string };

const inviteSchema = z.object({
  name: z.string().trim().min(1, "請填寫姓名").max(40),
  email: z.string().trim().toLowerCase().pipe(z.email("Email 格式不正確")),
});

const NO_KEY = "尚未設定 SUPABASE_SECRET_KEY，無法寄送邀請信。請先到 Vercel 環境變數加入後重新部署。";

/** 邀請信連結要回到「目前這個網站」，正式站與 Preview 都適用。 */
async function setPasswordUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/admin/set-password`;
}

async function findUser(admin: SupabaseClient, email: string): Promise<User | undefined> {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data?.users.find((u) => u.email?.toLowerCase() === email);
}

const hasSetPassword = (u: User) => Boolean(u.user_metadata?.password_set) || (!u.invited_at && Boolean(u.last_sign_in_at));

function mailError(message: string) {
  if (/rate limit/i.test(message)) return "寄信次數已達上限，請一小時後再試。";
  return `邀請信寄送失敗：${message}`;
}

export async function inviteMember(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const { email: me } = await requireAdmin();
  if (!adminKeyConfigured) return { status: "error", message: NO_KEY };

  const parsed = inviteSchema.safeParse({ name: formData.get("name") ?? "", email: formData.get("email") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const { name, email } = parsed.data;

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.from("admin_users").select("email").eq("email", email).maybeSingle();
  if (existing) return { status: "error", message: "這個 Email 已經是成員了。" };

  // 已經有帳號的人（例如之前被移除過白名單）不用再寄邀請信，加回白名單就能登入
  const user = await findUser(admin, email);
  let message = `邀請信已寄給 ${email}，對方點信裡的連結設定密碼後就能登入。`;
  if (user && hasSetPassword(user)) {
    message = `${email} 已經有帳號，已加入成員，可以直接登入（忘記密碼可在登入頁重設）。`;
  } else {
    if (user) await admin.auth.admin.deleteUser(user.id);
    const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: await setPasswordUrl(), data: { name } });
    if (error) return { status: "error", message: mailError(error.message) };
  }

  const { error } = await admin.from("admin_users").insert({ email, name, invited_by: me.toLowerCase() });
  if (error) return { status: "error", message: `成員資料寫入失敗：${error.message}` };
  return { status: "sent", message };
}

/** 對方還沒設定密碼時可以重寄；做法是刪掉還沒啟用的帳號再邀請一次（舊連結同時失效）。 */
export async function resendInvite(email: string): Promise<ActionResult> {
  await requireAdmin();
  if (!adminKeyConfigured) return { ok: false, error: NO_KEY };
  const target = z.string().trim().toLowerCase().pipe(z.email()).safeParse(email);
  if (!target.success) return { ok: false, error: "Email 格式不正確" };

  const admin = createSupabaseAdminClient();
  const { data: member } = await admin.from("admin_users").select("email, name").eq("email", target.data).maybeSingle();
  if (!member) return { ok: false, error: "找不到這位成員" };

  const user = await findUser(admin, target.data);
  if (user && hasSetPassword(user)) return { ok: false, error: "對方已經設定過密碼，忘記密碼請在登入頁按「忘記密碼」。" };
  if (user) await admin.auth.admin.deleteUser(user.id);

  const { error } = await admin.auth.admin.inviteUserByEmail(target.data, {
    redirectTo: await setPasswordUrl(),
    data: { name: member.name ?? "" },
  });
  if (error) return { ok: false, error: mailError(error.message) };
  return { ok: true };
}

/** 移除成員：從白名單拿掉（立刻失去後台權限），並刪除登入帳號。不能移除自己。 */
export async function removeMember(email: string): Promise<ActionResult> {
  const { email: me } = await requireAdmin();
  if (!adminKeyConfigured) return { ok: false, error: NO_KEY };
  const target = z.string().trim().toLowerCase().pipe(z.email()).safeParse(email);
  if (!target.success) return { ok: false, error: "Email 格式不正確" };
  if (target.data === me.toLowerCase()) return { ok: false, error: "不能移除自己的帳號。" };

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("admin_users").delete().eq("email", target.data);
  if (error) return { ok: false, error: `移除失敗：${error.message}` };

  const user = await findUser(admin, target.data);
  if (user) await admin.auth.admin.deleteUser(user.id);
  return { ok: true };
}
