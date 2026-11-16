"use client";

import { useActionState, useState } from "react";
import { requestPasswordReset, signIn, type LoginState, type ResetState } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/Button";
import { adminInput } from "./styles";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  const [reset, resetAction, resetting] = useActionState<ResetState, FormData>(requestPasswordReset, {});

  if (mode === "forgot") {
    return (
      <form action={resetAction} className="flex flex-col gap-5">
        <p className="text-sm leading-[1.8] text-ink-2">輸入登入用的 Email，我們會寄一封重設密碼的信給你。</p>
        {reset.message && (
          <p role="status" className={reset.error ? "text-sm text-error" : "text-sm text-ink-2"}>
            {reset.message}
          </p>
        )}
        <label className="flex flex-col gap-2 text-sm">
          Email
          <input name="email" type="email" autoComplete="email" required className={adminInput} />
        </label>
        <Button type="submit" size="lg" fullWidth disabled={resetting}>
          {resetting ? "寄送中…" : "寄出重設密碼信"}
        </Button>
        <button type="button" onClick={() => setMode("login")} className="self-start text-sm text-link hover:underline">
          ← 回登入
        </button>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && (
        <p role="alert" className="rounded-[4px] border border-error px-4 py-3 text-sm text-error">
          {state.error}
        </p>
      )}
      <label className="flex flex-col gap-2 text-sm">
        Email
        <input name="email" type="email" autoComplete="email" defaultValue={state.email} required className={adminInput} />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        密碼
        <input name="password" type="password" autoComplete="current-password" required className={adminInput} />
      </label>
      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "登入中…" : "登入"}
      </Button>
      <button type="button" onClick={() => setMode("forgot")} className="self-start text-sm text-link hover:underline">
        忘記密碼
      </button>
    </form>
  );
}
