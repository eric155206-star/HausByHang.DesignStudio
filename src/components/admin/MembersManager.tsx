"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { inviteMember, removeMember, resendInvite, type InviteState } from "@/app/admin/(dashboard)/members/actions";
import { Button } from "@/components/ui/Button";
import { adminInput } from "./styles";

export type Member = {
  email: string;
  name: string | null;
  joinedAt: string;
  /** active：已設定密碼；invited：已寄邀請信、尚未設定；unknown：讀不到帳號狀態 */
  status: "active" | "invited" | "unknown";
  isMe: boolean;
};

const statusLabel: Record<Member["status"], string> = {
  active: "使用中",
  invited: "已邀請，尚未設定密碼",
  unknown: "—",
};

export function MembersManager({ members, canInvite }: { members: Member[]; canInvite: boolean }) {
  const router = useRouter();
  const [state, action, inviting] = useActionState<InviteState, FormData>(inviteMember, { status: "idle" });
  const [rowMessage, setRowMessage] = useState<{ error?: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "sent") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  function run(task: () => ReturnType<typeof removeMember>, success: string) {
    setRowMessage(null);
    startTransition(async () => {
      const result = await task();
      setRowMessage(result.ok ? { text: success } : { error: true, text: result.error });
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form ref={formRef} action={action} className="flex flex-col gap-4 border border-line-strong bg-white p-6">
        <h2 className="text-lg">邀請成員</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <label className="flex flex-col gap-2 text-sm">
            姓名
            <input name="name" required maxLength={40} className={adminInput} placeholder="例如 王小明" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Email
            <input name="email" type="email" required className={adminInput} placeholder="對方收信用的 Email" />
          </label>
          <Button type="submit" disabled={inviting || !canInvite}>
            {inviting ? "寄送中…" : "寄出邀請"}
          </Button>
        </div>
        <p className="text-xs leading-[1.7] text-ink-3">
          對方會收到一封邀請信，點信裡的連結設定密碼後就能登入後台。成員可以管理作品、網站圖片，也可以邀請其他人。
        </p>
        {state.message && (
          <p role="status" className={state.status === "error" ? "text-sm text-error" : "text-sm text-ink-2"}>
            {state.message}
          </p>
        )}
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">成員（{members.length}）</h2>
        {rowMessage && (
          <p role="status" className={rowMessage.error ? "text-sm text-error" : "text-sm text-ink-2"}>
            {rowMessage.text}
          </p>
        )}
        <ul className="divide-y divide-surface-hover border border-line-strong bg-white">
          {members.map((m) => (
            <li key={m.email} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] text-black">
                  {m.name || m.email}
                  {m.isMe && <span className="ml-2 text-xs text-ink-3">（你）</span>}
                </span>
                {m.name && <span className="truncate text-xs text-ink-3">{m.email}</span>}
              </div>
              <span className={m.status === "active" ? "text-xs text-black" : "text-xs text-ink-3"}>{statusLabel[m.status]}</span>
              <span className="text-xs text-ink-4 tabular-nums">{m.joinedAt}</span>
              {!m.isMe && (
                <div className="flex gap-1.5 text-xs">
                  {m.status === "invited" && (
                    <button
                      type="button"
                      disabled={pending || !canInvite}
                      onClick={() => run(() => resendInvite(m.email), `已重寄邀請信給 ${m.email}`)}
                      className="rounded-[4px] border border-line-strong px-2 py-1 text-ink transition-colors hover:border-black disabled:opacity-40"
                    >
                      重寄邀請信
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending || !canInvite}
                    onClick={() => {
                      if (confirm(`確定移除「${m.name || m.email}」？對方會立刻無法登入後台。`)) {
                        run(() => removeMember(m.email), `已移除 ${m.email}`);
                      }
                    }}
                    className="rounded-[4px] border border-error px-2 py-1 text-error transition-colors hover:bg-error hover:text-white disabled:opacity-40"
                  >
                    移除
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
