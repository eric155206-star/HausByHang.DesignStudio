import type { Metadata } from "next";
import { MembersManager, type Member } from "@/components/admin/MembersManager";
import { requireAdmin } from "@/lib/admin/auth";
import { adminKeyConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "成員" };

const dateFormat = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" });

export default async function MembersPage() {
  const { supabase, email: me } = await requireAdmin();
  const { data: rows, error } = await supabase.from("admin_users").select("*").order("created_at");

  // 帳號狀態（設定密碼了沒）存在 Supabase 的登入系統裡，要用 secret key 才讀得到
  const statusByEmail = new Map<string, Member["status"]>();
  if (adminKeyConfigured) {
    const { data } = await createSupabaseAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (!u.email) continue;
      const active = Boolean(u.user_metadata?.password_set) || (!u.invited_at && Boolean(u.last_sign_in_at));
      statusByEmail.set(u.email.toLowerCase(), active ? "active" : "invited");
    }
  }

  const members: Member[] = (rows ?? []).map((r) => ({
    email: r.email,
    name: (r.name as string | null) ?? null,
    joinedAt: dateFormat.format(new Date(r.created_at)),
    status: r.email === me.toLowerCase() ? "active" : (statusByEmail.get(r.email) ?? "unknown"),
    isMe: r.email === me.toLowerCase(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl">成員</h1>
        <p className="text-sm text-ink-3">可以登入後台的人。邀請同事加入，或移除不再需要權限的帳號。</p>
      </div>
      {error && <p className="text-sm text-error">讀取失敗：{error.message}</p>}
      {!adminKeyConfigured && (
        <p className="border border-error px-4 py-3 text-sm leading-[1.8] text-error">
          邀請功能還不能使用：請到 Vercel 的環境變數加入 SUPABASE_SECRET_KEY，再重新部署。
        </p>
      )}
      <MembersManager members={members} canInvite={adminKeyConfigured} />
    </div>
  );
}
