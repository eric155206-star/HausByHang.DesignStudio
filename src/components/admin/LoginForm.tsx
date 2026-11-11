"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/Button";
import { adminInput } from "./styles";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
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
    </form>
  );
}
