"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { adminInput } from "./styles";

type Phase = "checking" | "ready" | "invalid" | "done";

/**
 * 邀請信、重設密碼信的連結會帶著一次性的登入憑證回到這一頁（放在網址 # 後面，不會送到伺服器）。
 * 這裡先用憑證建立登入狀態，再讓對方設定自己的密碼。做法參照樂夢系統的 LoginForm。
 */
export function SetPasswordForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token") ?? "";
    // 用完就把憑證從網址列清掉，避免被複製或重複觸發
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);

    (async () => {
      if (accessToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        setPhase(error ? "invalid" : "ready");
        return;
      }
      // 沒有憑證：可能是連結過期（Supabase 會帶 error 回來），或是設定到一半重新整理
      const { data } = await supabase.auth.getSession();
      setPhase(data.session && !params.get("error") ? "ready" : "invalid");
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("密碼至少需要 8 個字元");
    if (password !== confirm) return setError("兩次輸入的密碼不一致");

    setSaving(true);
    const { error } = await createSupabaseBrowserClient().auth.updateUser({ password, data: { password_set: true } });
    if (error) {
      setSaving(false);
      return setError(`設定失敗：${error.message}`);
    }
    setPhase("done");
    router.push("/admin");
    router.refresh();
  }

  if (phase === "checking") return <p className="text-sm text-ink-3">確認連結中…</p>;

  if (phase === "invalid") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-[4px] border border-error px-4 py-3 text-sm leading-[1.8] text-error">
        <p>這個連結已經失效或已經使用過。邀請連結請管理者重寄一次；忘記密碼請回登入頁重新申請。</p>
        <Link href="/admin/login" className="underline">
          回登入頁
        </Link>
      </div>
    );
  }

  if (phase === "done") return <p className="text-sm text-ink-2">密碼設定完成，正在進入後台…</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="text-sm text-ink-2">請設定你的登入密碼，至少 8 個字元。</p>
      <label className="flex flex-col gap-2 text-sm">
        新密碼
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          className={adminInput}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        再輸入一次
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          className={adminInput}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth disabled={saving}>
        {saving ? "設定中…" : "確認設定"}
      </Button>
    </form>
  );
}
